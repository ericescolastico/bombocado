import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageDirection } from '@prisma/client';

// DTO para criar mensagem
export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  body: string;
}

// DTOs para listar mensagens
export class GetMessagesQueryDto {
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
  pageSize?: number = 50;
}

// DTO de resposta de mensagem
export class MessageResponseDto {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

// DTO de resposta paginada
export class PaginatedMessagesResponseDto {
  data: MessageResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
