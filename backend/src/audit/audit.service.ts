import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEvent } from './interfaces/audit-event.interface';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Optional() @InjectQueue('audit-log-queue') private auditQueue: Queue | null,
    private prisma: PrismaService,
  ) {}

  async log(auditEvent: AuditEvent): Promise<void> {
    // Executar de forma assíncrona para não bloquear o fluxo principal
    this.logAsync(auditEvent).catch((error) => {
      this.logger.error(`Erro ao registrar audit log: ${error.message}`);
    });
  }

  private async logAsync(auditEvent: AuditEvent): Promise<void> {
    // Se Redis não estiver disponível, salvar diretamente
    if (!this.auditQueue) {
      await this.saveDirectly(auditEvent);
      return;
    }

    try {
      // Tentar enfileirar no Redis com timeout curto
      await Promise.race([
        this.auditQueue.add(auditEvent, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout ao enfileirar')), 1000),
        ),
      ]);
      this.logger.debug(`Evento de audit enfileirado: ${auditEvent.event}`);
    } catch (error: any) {
      // Se falhar ao enfileirar, gravar direto no PostgreSQL
      this.logger.warn(
        `Redis indisponível, gravando direto no PostgreSQL: ${error.message}`,
      );
      await this.saveDirectly(auditEvent);
    }
  }

  private async saveDirectly(auditEvent: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: auditEvent.userId,
          event: auditEvent.event,
          entity: auditEvent.entity,
          entityId: auditEvent.entityId,
          ip: auditEvent.ip,
          userAgent: auditEvent.userAgent,
          meta: auditEvent.meta || {},
        },
      });
      this.logger.debug(`Audit log salvo diretamente no PostgreSQL`);
    } catch (error: any) {
      this.logger.error(
        `Erro ao salvar audit log diretamente: ${error.message}`,
        error.stack,
      );
      // Não propagar o erro para não quebrar o fluxo principal
    }
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          event: true,
          entity: true,
          entityId: true,
          ip: true,
          userAgent: true,
          meta: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({
        where: { userId },
      }),
    ]);

    // Converter null para undefined para compatibilidade com DTO
    const mappedLogs = logs.map(log => ({
      ...log,
      entity: log.entity ?? undefined,
      entityId: log.entityId ?? undefined,
      ip: log.ip ?? undefined,
      userAgent: log.userAgent ?? undefined,
      meta: (log.meta as Record<string, any>) || undefined,
    }));

    return {
      data: mappedLogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

