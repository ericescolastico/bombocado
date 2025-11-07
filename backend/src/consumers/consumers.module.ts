import { Module } from '@nestjs/common';
import { ConsumersService } from './consumers.service';
import { ConsumersController } from './consumers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsumersController],
  providers: [ConsumersService],
  exports: [ConsumersService],
})
export class ConsumersModule {}

