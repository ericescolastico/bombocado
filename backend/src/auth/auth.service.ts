import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SessionTimeService } from '../session-time/session-time.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionTimeService: SessionTimeService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { username, password } = loginDto;

    // Buscar usuário por username ou email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        statusAccount: 'ATIVO',
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Incrementar tentativas de login falhadas
      await this.prisma.user.update({
        where: { userId: user.userId },
        data: { failsLogin: user.failsLogin + 1 },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Resetar tentativas de login falhadas e atualizar último login
    const updatedUser = await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        failsLogin: 0,
        lastLogin: new Date(),
        statusUser: 'ONLINE',
      },
      include: {
        role: true,
      },
    });

    // Gerar token JWT
    const payload = {
      sub: updatedUser.userId,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role.roleName,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        userId: updatedUser.userId,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName || undefined,
        email: updatedUser.email,
        role: updatedUser.role.roleName,
        statusUser: updatedUser.statusUser,
        statusAccount: updatedUser.statusAccount,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, firstName, lastName, email, password, phone } = registerDto;

    // Verificar se usuário já existe
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Usuário ou email já existe');
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Buscar role padrão (ATENDENTE)
    const defaultRole = await this.prisma.role.findFirst({
      where: { roleName: 'ATENDENTE' },
    });

    if (!defaultRole) {
      throw new Error('Role padrão não encontrada');
    }

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        roleId: defaultRole.roleId,
        statusUser: 'OFFLINE',
        statusAccount: 'ATIVO',
      },
      include: {
        role: true,
      },
    });

    // Gerar token JWT
    const payload = {
      sub: user.userId,
      username: user.username,
      email: user.email,
      role: user.role.roleName,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName || undefined,
        email: user.email,
        role: user.role.roleName,
        statusUser: user.statusUser,
        statusAccount: user.statusAccount,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    // Finalizar sessão de tempo online
    try {
      await this.sessionTimeService.endSession(userId);
    } catch (error) {
      // Log mas não falhar o logout se houver erro ao finalizar sessão
      console.error(`Erro ao finalizar sessão de tempo para ${userId}:`, error);
    }

    await this.prisma.user.update({
      where: { userId },
      data: { statusUser: 'OFFLINE' },
    });
  }

  async validateUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { userId: payload.sub },
      include: { role: true },
    });

    if (!user || user.statusAccount !== 'ATIVO') {
      return null;
    }

    return user;
  }
}
