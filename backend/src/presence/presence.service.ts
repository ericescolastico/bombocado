import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../infra/redis/redis.service';
import { PresenceBeatResult, PresenceEntry } from './presence.types';

const PRESENCE_KEY_PREFIX = 'presence:user:';
const REDIS_TTL_SECONDS = 90;

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private redisService: RedisService) {}

  /**
   * Registra ou atualiza heartbeat do usuário
   */
  async beat(userId: string): Promise<PresenceBeatResult> {
    const key = `${PRESENCE_KEY_PREFIX}${userId}`;
    const client = this.redisService.getClient();
    const now = new Date().toISOString();
    
    // Verificar se a key já existe
    const exists = await client.exists(key);
    
    // Definir key com TTL
    await client.setex(key, REDIS_TTL_SECONDS, now);
    
    const isNewOnline = exists === 0;
    
    if (isNewOnline) {
      this.logger.log(`User ${userId} came online (socket heartbeat)`);
    }
    
    return {
      online: true,
      lastSeen: now,
      isNewOnline,
    };
  }

  /**
   * Verifica se usuário está online
   */
  async isOnline(userId: string): Promise<boolean> {
    const key = `${PRESENCE_KEY_PREFIX}${userId}`;
    const client = this.redisService.getClient();
    const exists = await client.exists(key);
    return exists === 1;
  }

  /**
   * Obtém lastSeen do usuário
   */
  async getLastSeen(userId: string): Promise<string | null> {
    const key = `${PRESENCE_KEY_PREFIX}${userId}`;
    const client = this.redisService.getClient();
    return await client.get(key);
  }

  /**
   * Obtém snapshot de múltiplos usuários
   */
  async getSnapshot(userIds: string[]): Promise<PresenceEntry[]> {
    if (userIds.length === 0) {
      return [];
    }

    const client = this.redisService.getClient();
    const keys = userIds.map(id => `${PRESENCE_KEY_PREFIX}${id}`);
    
    // Usar pipeline para melhor performance
    const pipeline = client.pipeline();
    keys.forEach(key => pipeline.exists(key));
    keys.forEach(key => pipeline.get(key));
    
    const results = await pipeline.exec();
    
    if (!results) {
      return userIds.map(userId => ({
        userId,
        online: false,
        lastSeen: '',
      }));
    }

    const entries: PresenceEntry[] = [];
    for (let i = 0; i < userIds.length; i++) {
      const existsResult = results[i * 2];
      const getResult = results[i * 2 + 1];
      
      const online = existsResult[1] === 1;
      const lastSeen = online && getResult[1] ? String(getResult[1]) : '';
      
      entries.push({
        userId: userIds[i],
        online,
        lastSeen,
      });
    }

    return entries;
  }

  /**
   * Remove presença do usuário (opcional, pois TTL cuida disso)
   */
  async removePresence(userId: string): Promise<void> {
    const key = `${PRESENCE_KEY_PREFIX}${userId}`;
    const client = this.redisService.getClient();
    await client.del(key);
  }
}

