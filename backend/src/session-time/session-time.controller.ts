import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionTimeService } from './session-time.service';

@Controller('session-time')
@UseGuards(JwtAuthGuard)
export class SessionTimeController {
  constructor(private sessionTimeService: SessionTimeService) {}

  @Post('start')
  async startSession(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    const sessionId = await this.sessionTimeService.startSession(userId);
    return { sessionId, message: 'Sessão iniciada' };
  }

  @Post('end')
  async endSession(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    await this.sessionTimeService.endSession(userId);
    return { message: 'Sessão finalizada' };
  }

  @Post('update')
  async updateSession(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    await this.sessionTimeService.updateActiveSession(userId);
    return { message: 'Sessão atualizada' };
  }

  @Get('current')
  async getCurrentSessionTime(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    const seconds = await this.sessionTimeService.getCurrentSessionTime(userId);
    return { seconds };
  }

  @Get('daily')
  async getDailyTime(@Request() req: any, @Query('date') date?: string) {
    const userId = req.user.sub || req.user.id;
    const targetDate = date ? new Date(date) : new Date();
    const seconds = await this.sessionTimeService.getDailyTime(userId, targetDate);
    return { date: targetDate.toISOString().split('T')[0], seconds };
  }

  @Get('total')
  async getTotalTime(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    const seconds = await this.sessionTimeService.getTotalTime(userId);
    return { seconds };
  }

  @Get('stats')
  async getStats(@Request() req: any, @Query('days') days?: string) {
    const userId = req.user.sub || req.user.id;
    const daysCount = days ? parseInt(days, 10) : 30;
    const stats = await this.sessionTimeService.getDailyStats(userId, daysCount);
    return { stats };
  }
}

