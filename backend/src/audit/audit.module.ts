import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit-log-queue',
    }),
    PrismaModule,
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

