import { Module } from '@nestjs/common';
import { SessionTimeService } from './session-time.service';
import { SessionTimeController } from './session-time.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SessionTimeController],
  providers: [SessionTimeService],
  exports: [SessionTimeService],
})
export class SessionTimeModule {}

