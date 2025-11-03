import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Ip, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuditService } from '../audit/audit.service';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);
    
    // Registrar log de login
    await this.auditService.log({
      userId: result.user.userId,
      event: 'user.login',
      ip,
      userAgent,
    });

    return result;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(registerDto);
    
    // Registrar log de registro
    await this.auditService.log({
      userId: result.user.userId,
      event: 'user.register',
      ip,
      userAgent,
    });

    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: AuthenticatedRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(req.user.userId);
    
    // Registrar log de logout
    await this.auditService.log({
      userId: req.user.userId,
      event: 'user.logout',
      ip,
      userAgent,
    });

    return { message: 'Logout realizado com sucesso' };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validate(@Request() req: AuthenticatedRequest): Promise<{ valid: boolean; user: any }> {
    return {
      valid: true,
      user: {
        userId: req.user.userId,
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role.roleName,
        statusUser: req.user.statusUser,
        statusAccount: req.user.statusAccount,
      },
    };
  }
}
