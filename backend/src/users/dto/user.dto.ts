import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RoleName, UserStatus, AccountStatus } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(RoleName)
  roleName: RoleName;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(RoleName)
  roleName?: RoleName;

  @IsOptional()
  @IsEnum(UserStatus)
  statusUser?: UserStatus;

  @IsOptional()
  @IsEnum(AccountStatus)
  statusAccount?: AccountStatus;

  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UserResponseDto {
  userId: string;
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: {
    roleId: string;
    roleName: RoleName;
  };
  statusUser: UserStatus;
  statusAccount: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  failsLogin: number;
}

export class UserWithPresenceDto {
  userId: string;
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: {
    roleId: string;
    roleName: RoleName;
  };
  statusUser: UserStatus;
  statusAccount: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  failsLogin: number;
  online: boolean;
  lastSeen: string | null;
  currentSessionSeconds?: number; // Tempo da sessão atual em segundos
}