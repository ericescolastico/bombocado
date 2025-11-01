import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
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
}

export class AuthResponseDto {
  access_token: string;
  user: {
    userId: string;
    username: string;
    firstName: string;
    lastName?: string;
    email: string;
    role: string;
    statusUser: string;
    statusAccount: string;
  };
}
