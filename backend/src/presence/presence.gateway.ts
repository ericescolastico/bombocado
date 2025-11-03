import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { JwtService } from '@nestjs/jwt';
import { PresenceService } from './presence.service';
import type { AuthenticatedSocket } from './presence.guard';
import { PRESENCE_EVENTS } from './presence.events';
import { RedisService } from '../infra/redis/redis.service';
import { PresenceUpdatePayload } from './presence.types';
import { SessionTimeService } from '../session-time/session-time.service';

@WebSocketGateway({
  namespace: '/presence',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
export class PresenceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PresenceGateway.name);
  private readonly rateLimitMap = new Map<string, number>();
  private readonly RATE_LIMIT_MS = 10000; // 10 segundos

  constructor(
    private presenceService: PresenceService,
    private redisService: RedisService,
    private jwtService: JwtService,
    private sessionTimeService: SessionTimeService,
  ) {}

  afterInit(server: Server) {
    // Configurar adapter Redis para escala horizontal
    // Usar setImmediate para garantir que o servidor está totalmente inicializado
    setImmediate(() => {
      this.setupRedisAdapter(server);
    });
  }

  private setupRedisAdapter(server: Server) {
    try {
      const { pubClient, subClient } = this.redisService.getPubSubClients();
      
      // No NestJS, o server já está configurado para o namespace /presence
      // Tentar configurar o adapter diretamente no servidor
      const adapter = createAdapter(pubClient, subClient);
      
      // Configurar no servidor principal (isso configura para todos os namespaces)
      if (server && typeof (server as any).adapter === 'function') {
        (server as any).adapter(adapter);
        this.logger.log('Redis adapter configured for Socket.IO');
      } else {
        // Tentar usar o this.server que é decorado com @WebSocketServer()
        if (this.server && typeof (this.server as any).adapter === 'function') {
          (this.server as any).adapter(adapter);
          this.logger.log('Redis adapter configured for Socket.IO (via @WebSocketServer)');
        } else {
          // Modo degradado: apenas logar warning
          this.logger.warn('Could not configure Redis adapter: adapter method not available');
          this.logger.warn('Running in single-instance mode (no horizontal scaling via Redis)');
        }
      }
    } catch (error) {
      this.logger.error(`Failed to setup Redis adapter: ${error}`);
      // Não falhar se Redis não estiver disponível (modo degradado)
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND'))) {
        this.logger.warn('Redis not available, running in single-instance mode (no horizontal scaling)');
      }
    }
  }

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client connecting: ${client.id}`);
    
    // Validar token manualmente
    try {
      const token = 
        client.handshake.auth?.token || 
        client.handshake.query?.token as string ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection rejected: no token (socket: ${client.id})`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'default-secret',
      });
      
      client.userId = payload.sub || payload.id;
      client.user = payload;

      this.logger.log(`Client authenticated: ${client.id} (userId: ${client.userId})`);

      // Join room do usuário
      if (client.userId) {
        await client.join(`user:${client.userId}`);
        
        // Registrar presença imediatamente ao conectar
        // Isso garante que o usuário apareça como online logo após a conexão
        try {
          const beatResult = await this.presenceService.beat(client.userId);
          
          // Se é um novo "online", iniciar sessão de tempo e emitir update
          if (beatResult.isNewOnline) {
            try {
              await this.sessionTimeService.startSession(client.userId);
            } catch (error) {
              this.logger.warn(`Erro ao iniciar sessão de tempo para ${client.userId}: ${error}`);
            }

            const update: PresenceUpdatePayload = {
              userId: client.userId,
              online: true,
              lastSeen: beatResult.lastSeen,
            };
            this.server.emit(PRESENCE_EVENTS.UPDATE, update);
            this.logger.log(`User ${client.userId} came online (connection)`);
          }
        } catch (error) {
          this.logger.error(`Error registering presence for ${client.userId} on connection: ${error}`);
        }
      }

      // Enviar snapshot inicial (agora o usuário já deve estar registrado no Redis)
      await this.sendSnapshot(client);
    } catch (error) {
      this.logger.warn(`Connection rejected: invalid token (socket: ${client.id})`);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id} (userId: ${client.userId || 'unknown'})`);
    // Não marca offline imediatamente; TTL do Redis cuida disso
    this.rateLimitMap.delete(client.id);
  }

  @SubscribeMessage(PRESENCE_EVENTS.HEARTBEAT)
  async handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      this.logger.warn(`Heartbeat rejected: no userId (socket: ${client.id})`);
      return;
    }

    // Rate limiting
    const now = Date.now();
    const lastBeat = this.rateLimitMap.get(client.id);
    if (lastBeat && now - lastBeat < this.RATE_LIMIT_MS) {
      this.logger.warn(`Heartbeat rate limited: ${client.id} (userId: ${client.userId})`);
      return;
    }
    this.rateLimitMap.set(client.id, now);

    try {
      const result = await this.presenceService.beat(client.userId);
      
      // Se é um novo "online", iniciar sessão de tempo e emitir update
      if (result.isNewOnline) {
        // Iniciar sessão de tempo online
        try {
          await this.sessionTimeService.startSession(client.userId);
        } catch (error) {
          this.logger.warn(`Erro ao iniciar sessão de tempo para ${client.userId}: ${error}`);
        }

        const update: PresenceUpdatePayload = {
          userId: client.userId,
          online: true,
          lastSeen: result.lastSeen,
        };
        this.server.emit(PRESENCE_EVENTS.UPDATE, update);
        this.logger.log(`User ${client.userId} came online (heartbeat)`);
      } else {
        // Atualizar sessão ativa periodicamente
        try {
          await this.sessionTimeService.updateActiveSession(client.userId);
        } catch (error) {
          this.logger.warn(`Erro ao atualizar sessão de tempo para ${client.userId}: ${error}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing heartbeat for ${client.userId}: ${error}`);
    }
  }

  private async sendSnapshot(client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        return;
      }

      // Por ora, enviar apenas o próprio usuário
      // Em produção, pode enviar lista de contatos relevantes
      const snapshot = await this.presenceService.getSnapshot([client.userId]);
      
      client.emit(PRESENCE_EVENTS.SNAPSHOT, { entries: snapshot });
    } catch (error) {
      this.logger.error(`Error sending snapshot: ${error}`);
    }
  }
}

