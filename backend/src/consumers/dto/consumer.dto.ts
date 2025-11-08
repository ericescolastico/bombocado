import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { DocumentType, Gender } from '@prisma/client';

export class CreateConsumerDto {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  docNumber?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  docType?: DocumentType;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  consumerNotes?: string;
}

export class UpdateConsumerDto {
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
  profileImage?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  docNumber?: string;

  @IsOptional()
  @IsEnum(DocumentType)
  docType?: DocumentType;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  consumerNotes?: string;
}

export class ConsumerResponseDto {
  consumerId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  address?: string;
  zipcode?: string;
  phone?: string;
  docNumber?: string;
  docType?: DocumentType;
  gender?: Gender;
  state?: string;
  city?: string;
  consumerNotes?: string;
  createdById: string;
  createdBy: {
    userId: string;
    firstName: string;
    lastName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

