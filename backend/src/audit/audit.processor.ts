import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEvent } from './interfaces/audit-event.interface';

@Processor('audit-log-queue')
@Injectable()
export class AuditProcessor {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process()
  async handleAuditLog(job: Job<AuditEvent>) {
    const { userId, event, entity, entityId, ip, userAgent, meta } = job.data;

    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          event,
          entity,
          entityId,
          ip,
          userAgent,
          meta: meta || {},
        },
      });

      this.logger.log(`Audit log criado: ${event} para usuário ${userId}`);
    } catch (error) {
      this.logger.error(`Erro ao criar audit log: ${error.message}`, error.stack);
      throw error;
    }
  }
}

