import { Controller, Get, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogListResponseDto } from './dto/audit-log-response.dto';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get(':userId')
  async getLogsByUserId(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Req() req: AuthenticatedRequest,
  ): Promise<AuditLogListResponseDto> {
    // Verificar se o usuário pode acessar esses logs
    const requesterId = req.user.userId;
    
    // Permitir acesso apenas se for o próprio usuário ou se for admin
    if (requesterId !== userId && req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Não autorizado a acessar estes logs');
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.auditService.findByUserId(userId, pageNum, limitNum);
  }
}

