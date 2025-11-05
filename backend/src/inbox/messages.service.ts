import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMessageDto,
  MessageResponseDto,
  GetMessagesQueryDto,
  PaginatedMessagesResponseDto,
} from './dto/message.dto';
import { MessageDirection } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(
    conversationId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    // Verificar se a conversa existe
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversa com ID ${conversationId} não encontrada`,
      );
    }

    // Criar mensagem em transação junto com atualização do lastMessageAt
    const result = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          direction: MessageDirection.OUT,
          body: createMessageDto.body,
        },
      });

      // Atualizar lastMessageAt da conversa
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    });

    return this.mapToResponse(result);
  }

  async findAllByConversation(
    conversationId: string,
    query: GetMessagesQueryDto,
  ): Promise<PaginatedMessagesResponseDto> {
    // Verificar se a conversa existe
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversa com ID ${conversationId} não encontrada`,
      );
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { 
          conversationId,
          // Não filtrar por direção - retornar todas as mensagens (IN e OUT)
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'asc' }, // Ordem cronológica
      }),
      this.prisma.message.count({
        where: { conversationId },
      }),
    ]);

    const data = messages.map((msg) => this.mapToResponse(msg));

    // Log para debug - verificar se todas as mensagens estão sendo retornadas
    console.log(`[MessagesService] Retornando ${data.length} mensagens para conversa ${conversationId}`);
    console.log(`[MessagesService] Direções: ${data.map(m => m.direction).join(', ')}`);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private mapToResponse(message: any): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      direction: message.direction,
      body: message.body,
      readAt: message.readAt,
      createdAt: message.createdAt,
    };
  }
}
