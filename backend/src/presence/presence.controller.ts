import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PresenceService } from './presence.service';
import { Req } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private presenceService: PresenceService) {}

  /**
   * GET /presence?ids=1,2,3
   * Retorna status de presença de múltiplos usuários
   */
  @Get()
  async getPresence(
    @Query('ids') ids: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!ids) {
      return { entries: [] };
    }

    const userIds = ids.split(',').map(id => id.trim()).filter(Boolean);
    const entries = await this.presenceService.getSnapshot(userIds);
    
    return { entries };
  }

  /**
   * GET /presence/health/redis
   * Healthcheck do Redis
   */
  @Get('health/redis')
  async healthRedis() {
    try {
      const testUserId = 'health-check';
      await this.presenceService.beat(testUserId);
      const online = await this.presenceService.isOnline(testUserId);
      await this.presenceService.removePresence(testUserId);
      
      return {
        status: 'ok',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        redis: 'disconnected',
        error: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

