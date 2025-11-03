import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';
import { PresenceGuard } from './presence.guard';
import { PresenceController } from './presence.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
    }),
  ],
  providers: [PresenceGateway, PresenceService, PresenceGuard],
  controllers: [PresenceController],
  exports: [PresenceService],
})
export class PresenceModule {}

