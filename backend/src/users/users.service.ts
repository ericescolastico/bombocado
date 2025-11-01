import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponseDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, firstName, lastName, email, password, phone, roleName } = createUserDto;

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
