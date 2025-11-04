import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';
import { SessionTimeService } from '../session-time/session-time.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponseDto, UserWithPresenceDto } from './dto/user.dto';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private presenceService: PresenceService,
    private sessionTimeService: SessionTimeService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, firstName, lastName, email, password, phone, roleName } = createUserDto;

    // Bloquear criação de usuários ADMIN
    if (roleName === RoleName.ADMIN) {
      throw new ForbiddenException('Não é permitido criar usuários com role ADMIN');
    }

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

    // Buscar role
    const role = await this.prisma.role.findFirst({
      where: { roleName },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrada');
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        roleId: role.roleId,
        statusUser: 'OFFLINE',
        statusAccount: 'ATIVO',
      },
      include: {
        role: true,
      },
    });

    return this.mapUserToResponse(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => this.mapUserToResponse(user));
  }

  async findOne(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        role: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.mapUserToResponse(user);
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const { roleName, ...userData } = updateUserDto;

    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!existingUser || existingUser.deletedAt) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se email já existe em outro usuário
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: userData.email,
          userId: { not: userId },
        },
      });

      if (emailExists) {
        throw new ConflictException('Email já está em uso por outro usuário');
      }
    }

    // Buscar role se especificada
    let roleId = existingUser.roleId;
    if (roleName) {
      const role = await this.prisma.role.findFirst({
        where: { roleName },
      });

      if (!role) {
        throw new NotFoundException('Role não encontrada');
      }
      roleId = role.roleId;
    }

    // Atualizar usuário
    const user = await this.prisma.user.update({
      where: { userId },
      data: {
        ...userData,
        roleId,
      },
      include: {
        role: true,
      },
    });

    return this.mapUserToResponse(user);
  }

  async remove(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { userId },
      data: {
        deletedAt: new Date(),
        statusAccount: 'BLOQUEADO',
      },
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Hash da nova senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await this.prisma.user.update({
      where: { userId },
      data: {
        passwordHash: newPasswordHash,
        failsLogin: 0, // Resetar tentativas falhadas
      },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      orderBy: {
        roleName: 'asc',
      },
    });
  }

  async findAllWithPresence(): Promise<UserWithPresenceDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Buscar presença de todos os usuários
    const userIds = users.map(u => u.userId);
    const presenceEntries = await this.presenceService.getSnapshot(userIds);
    
    // Log para debug
    console.log('[UsersService] Presence entries from Redis:', JSON.stringify(presenceEntries, null, 2));
    
    // Criar mapa de presença para lookup rápido
    const presenceMap = new Map<string, { online: boolean; lastSeen: string | null }>();
    presenceEntries.forEach(entry => {
      // Garantir que online seja um booleano
      const online = Boolean(entry.online);
      
      // Normalizar lastSeen: strings vazias devem ser null
      let lastSeen: string | null = null;
      if (entry.lastSeen && typeof entry.lastSeen === 'string' && entry.lastSeen.trim() !== '') {
        lastSeen = entry.lastSeen.trim();
      } else if (online) {
        // Se está online mas não temos lastSeen válido, usar timestamp atual
        // Isso garante que sempre teremos um valor quando online
        lastSeen = new Date().toISOString();
      }
      
      console.log(`[UsersService] User ${entry.userId}: online=${online}, lastSeen=${lastSeen}, entry.lastSeen=${entry.lastSeen}`);
      
      presenceMap.set(entry.userId, {
        online,
        lastSeen,
      });
    });

    // Combinar dados de usuário com presença e tempo da sessão atual
    const result = await Promise.all(
      users.map(async (user) => {
        const presence = presenceMap.get(user.userId);
        const userResponse = this.mapUserToResponse(user);
        
        // Se não encontrou presença no mapa, usar valores padrão
        const online = presence?.online ?? false;
        const lastSeen = presence?.lastSeen ?? null;
        
        // Buscar tempo da sessão atual apenas se o usuário estiver online
        let currentSessionSeconds: number | undefined = undefined;
        if (online) {
          try {
            currentSessionSeconds = await this.sessionTimeService.getCurrentSessionTime(user.userId);
          } catch (error) {
            console.error(`[UsersService] Erro ao buscar tempo da sessão para ${user.userId}:`, error);
            currentSessionSeconds = 0;
          }
        }
        
        const finalResult = {
          ...userResponse,
          online,
          lastSeen,
          currentSessionSeconds,
        };
        
        console.log(`[UsersService] Final result for ${user.username}: online=${finalResult.online}, lastSeen=${finalResult.lastSeen}, currentSessionSeconds=${finalResult.currentSessionSeconds}`);
        
        return finalResult;
      })
    );
    
    console.log('[UsersService] Returning users with presence:', JSON.stringify(result.map(u => ({ userId: u.userId, username: u.username, online: u.online, lastSeen: u.lastSeen, currentSessionSeconds: u.currentSessionSeconds })), null, 2));
    
    return result;
  }

  private mapUserToResponse(user: any): UserResponseDto {
    return {
      userId: user.userId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      role: {
        roleId: user.role.roleId,
        roleName: user.role.roleName,
      },
      statusUser: user.statusUser,
      statusAccount: user.statusAccount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      failsLogin: user.failsLogin,
    };
  }
}
