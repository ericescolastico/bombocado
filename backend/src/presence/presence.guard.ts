import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@Injectable()
export class PresenceGuard implements CanActivate {
  private readonly logger = new Logger(PresenceGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    
    try {
      // Tentar extrair token do query ou do header auth
      const token = 
        client.handshake.auth?.token || 
        client.handshake.query?.token as string ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection rejected: no token provided (socket: ${client.id})`);
        client.disconnect();
        return false;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'default-secret',
      });

      client.userId = payload.sub || payload.id;
      client.user = payload;

      return true;
    } catch (error) {
      this.logger.warn(`Connection rejected: invalid token (socket: ${client.id})`);
      client.disconnect();
      return false;
    }
  }
}

