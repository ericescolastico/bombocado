import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionTimeService {
  private readonly logger = new Logger(SessionTimeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Inicia uma nova sessão de tempo online
   */
  async startSession(userId: string): Promise<string> {
    const now = new Date();
    const sessionDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Verificar se já existe uma sessão ativa (sem endTime)
    const activeSession = await this.prisma.userSessionTime.findFirst({
      where: {
        userId,
        sessionDate,
        endTime: null,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (activeSession) {
      this.logger.log(`Sessão ativa já existe para usuário ${userId}, reutilizando`);
      return activeSession.id;
    }

    // Criar nova sessão
    const session = await this.prisma.userSessionTime.create({
      data: {
        userId,
        sessionDate,
        startTime: now,
        endTime: null,
        durationSeconds: 0,
      },
    });

    this.logger.log(`Nova sessão iniciada para usuário ${userId} (sessionId: ${session.id})`);
    return session.id;
  }

  /**
   * Finaliza uma sessão ativa e calcula a duração
   */
  async endSession(userId: string, sessionId?: string): Promise<void> {
    const now = new Date();

    // Se sessionId não foi fornecido, buscar a sessão ativa mais recente
    const where = sessionId
      ? { id: sessionId, userId }
      : {
          userId,
          endTime: null,
        };

    const session = await this.prisma.userSessionTime.findFirst({
      where,
      orderBy: {
        startTime: 'desc',
      },
    });

    if (!session) {
      this.logger.warn(`Nenhuma sessão ativa encontrada para usuário ${userId}`);
      return;
    }

    if (session.endTime) {
      this.logger.warn(`Sessão ${session.id} já foi finalizada`);
      return;
    }

    // Calcular duração em segundos
    const durationSeconds = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    await this.prisma.userSessionTime.update({
      where: { id: session.id },
      data: {
        endTime: now,
        durationSeconds,
      },
    });

    this.logger.log(
      `Sessão ${session.id} finalizada para usuário ${userId}. Duração: ${durationSeconds}s`,
    );
  }

  /**
   * Atualiza a duração de uma sessão ativa (usado para atualizações periódicas)
   */
  async updateActiveSession(userId: string): Promise<void> {
    const now = new Date();
    const sessionDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const session = await this.prisma.userSessionTime.findFirst({
      where: {
        userId,
        sessionDate,
        endTime: null,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (!session) {
      // Se não existe sessão ativa, criar uma nova
      await this.startSession(userId);
      return;
    }

    // Atualizar duração calculada (sem finalizar)
    const durationSeconds = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    await this.prisma.userSessionTime.update({
      where: { id: session.id },
      data: {
        durationSeconds,
      },
    });
  }

  /**
   * Obtém o tempo total online de um usuário em um dia específico
   */
  async getDailyTime(userId: string, date: Date): Promise<number> {
    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const sessions = await this.prisma.userSessionTime.findMany({
      where: {
        userId,
        sessionDate,
      },
    });

    // Calcular tempo total do dia
    let totalSeconds = 0;

    for (const session of sessions) {
      if (session.endTime) {
        // Sessão finalizada: usar durationSeconds
        totalSeconds += session.durationSeconds;
      } else {
        // Sessão ativa: calcular tempo até agora
        const now = new Date();
        const durationSeconds = Math.floor(
          (now.getTime() - session.startTime.getTime()) / 1000,
        );
        totalSeconds += durationSeconds;
      }
    }

    return totalSeconds;
  }

  /**
   * Obtém o tempo total online de um usuário (todos os dias)
   */
  async getTotalTime(userId: string): Promise<number> {
    // Validar que userId foi fornecido
    if (!userId) {
      this.logger.error('getTotalTime chamado sem userId');
      throw new Error('userId é obrigatório');
    }

    // Log para debug (pode ser removido depois)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Buscando tempo total para userId: ${userId}`);
    }

    const sessions = await this.prisma.userSessionTime.findMany({
      where: {
        userId,
      },
    });

    // Log para debug (pode ser removido depois)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Encontradas ${sessions.length} sessões para userId: ${userId}`);
      // Verificar se há sessões de outros usuários (não deveria acontecer)
      const wrongSessions = sessions.filter(s => s.userId !== userId);
      if (wrongSessions.length > 0) {
        this.logger.error(`ERRO: Encontradas ${wrongSessions.length} sessões com userId diferente!`, {
          expectedUserId: userId,
          wrongSessionIds: wrongSessions.map(s => s.id),
        });
      }
    }

    // Calcular tempo total
    let totalSeconds = 0;
    const now = new Date();

    for (const session of sessions) {
      if (session.endTime) {
        // Sessão finalizada: usar durationSeconds
        totalSeconds += session.durationSeconds;
      } else {
        // Sessão ativa: calcular tempo até agora
        const durationSeconds = Math.floor(
          (now.getTime() - session.startTime.getTime()) / 1000,
        );
        totalSeconds += durationSeconds;
      }
    }

    // Log para debug (pode ser removido depois)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Tempo total calculado para userId ${userId}: ${totalSeconds} segundos (${Math.floor(totalSeconds / 3600)}h)`);
    }

    return totalSeconds;
  }

  /**
   * Obtém estatísticas de tempo online por dia (últimos N dias)
   */
  async getDailyStats(userId: string, days: number = 30): Promise<Array<{ date: Date; seconds: number }>> {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.userSessionTime.findMany({
      where: {
        userId,
        sessionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        sessionDate: 'asc',
      },
    });

    // Agrupar por dia
    const dailyMap = new Map<string, number>();
    const now = new Date();

    for (const session of sessions) {
      const dateKey = session.sessionDate.toISOString().split('T')[0];
      const currentSeconds = dailyMap.get(dateKey) || 0;

      if (session.endTime) {
        dailyMap.set(dateKey, currentSeconds + session.durationSeconds);
      } else {
        const durationSeconds = Math.floor(
          (now.getTime() - session.startTime.getTime()) / 1000,
        );
        dailyMap.set(dateKey, currentSeconds + durationSeconds);
      }
    }

    // Converter para array
    const result: Array<{ date: Date; seconds: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      result.push({
        date,
        seconds: dailyMap.get(dateKey) || 0,
      });
    }

    return result;
  }

  /**
   * Obtém o tempo da sessão atual (se existir)
   */
  async getCurrentSessionTime(userId: string): Promise<number> {
    const now = new Date();
    const sessionDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const session = await this.prisma.userSessionTime.findFirst({
      where: {
        userId,
        sessionDate,
        endTime: null,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (!session) {
      return 0;
    }

    return Math.floor((now.getTime() - session.startTime.getTime()) / 1000);
  }
}

