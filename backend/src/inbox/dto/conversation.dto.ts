import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ConversationStatus } from '@prisma/client';
import { Type } from 'class-transformer';

// DTOs para criar conversa
export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  contactName?: string;
}

// DTOs para filtrar/listar conversas
export class GetConversationsQueryDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

// DTO de resposta de conversa
export class ConversationResponseDto {
  id: string;
  status: ConversationStatus;
  lastMessageAt: Date | null;
  title: string | null;
  contactName: string | null;
  channel: string;
  createdAt: Date;
  updatedAt: Date;
  messagesCount?: number;
}

// DTO de resposta paginada
export class PaginatedConversationsResponseDto {
  data: ConversationResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
