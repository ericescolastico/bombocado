import { Controller, Get, Post, UseGuards, Request, Query, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionTimeService } from './session-time.service';

@Controller('session-time')
@UseGuards(JwtAuthGuard)
export class SessionTimeController {
  private readonly logger = new Logger(SessionTimeController.name);

  constructor(private sessionTimeService: SessionTimeService) {}

  // Helper para extrair userId do req.user
  // O validateUser retorna o objeto user completo do Prisma, que tem userId
  private getUserId(req: any): string {
    // Prioridade: userId (do objeto user do Prisma) > sub (do JWT payload) > id (fallback)
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    
    if (!userId) {
      this.logger.error('Usuário não identificado no request', {
        userKeys: req.user ? Object.keys(req.user) : 'req.user is undefined',
        user: req.user,
      });
      throw new UnauthorizedException('Usuário não identificado');
    }
    
    // Log para debug (pode ser removido depois)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Extraindo userId: ${userId}`, {
        hasUserId: !!req.user?.userId,
        hasSub: !!req.user?.sub,
        hasId: !!req.user?.id,
      });
    }
    
    return userId;
  }

  @Post('start')
  async startSession(@Request() req: any) {
    const userId = this.getUserId(req);
    const sessionId = await this.sessionTimeService.startSession(userId);
    return { sessionId, message: 'Sessão iniciada' };
  }

  @Post('end')
  async endSession(@Request() req: any) {
    const userId = this.getUserId(req);
    await this.sessionTimeService.endSession(userId);
    return { message: 'Sessão finalizada' };
  }

  @Post('update')
  async updateSession(@Request() req: any) {
    const userId = this.getUserId(req);
    await this.sessionTimeService.updateActiveSession(userId);
    return { message: 'Sessão atualizada' };
  }

  @Get('current')
  async getCurrentSessionTime(@Request() req: any) {
    const userId = this.getUserId(req);
    const seconds = await this.sessionTimeService.getCurrentSessionTime(userId);
    return { seconds };
  }

  @Get('daily')
  async getDailyTime(@Request() req: any, @Query('date') date?: string) {
    const userId = this.getUserId(req);
    const targetDate = date ? new Date(date) : new Date();
    const seconds = await this.sessionTimeService.getDailyTime(userId, targetDate);
    return { date: targetDate.toISOString().split('T')[0], seconds };
  }

  @Get('total')
  async getTotalTime(@Request() req: any) {
    const userId = this.getUserId(req);
    const seconds = await this.sessionTimeService.getTotalTime(userId);
    return { seconds };
  }

  @Get('stats')
  async getStats(@Request() req: any, @Query('days') days?: string) {
    const userId = this.getUserId(req);
    const daysCount = days ? parseInt(days, 10) : 30;
    const stats = await this.sessionTimeService.getDailyStats(userId, daysCount);
    return { stats };
  }
}

