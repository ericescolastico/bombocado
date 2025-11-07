import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConversationDto,
  ConversationResponseDto,
  GetConversationsQueryDto,
  PaginatedConversationsResponseDto,
  MoveConversationDto,
} from './dto/conversation.dto';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.create({
      data: {
        title: createConversationDto.title,
        contactName: createConversationDto.contactName,
        status: ConversationStatus.AGUARDANDO,
        channel: 'local',
      },
    });

    return this.mapToResponse(conversation, 0);
  }

  async findAll(
    query: GetConversationsQueryDto,
  ): Promise<PaginatedConversationsResponseDto> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Construir filtros
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { contactName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    // Buscar conversas com contagem de mensagens e ordenação
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { lastMessageAt: 'desc' },
          { updatedAt: 'desc' },
        ],
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const data = conversations.map((conv) =>
      this.mapToResponse(conv, conv._count.messages),
    );

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${id} não encontrada`);
    }

    return this.mapToResponse(conversation, conversation._count.messages);
  }

  async findAllForKanban(): Promise<ConversationResponseDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      orderBy: [
        { status: 'asc' },
        { lastMessageAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return conversations.map((conv) =>
      this.mapToResponse(conv, conv._count.messages),
    );
  }

  async move(id: string, moveConversationDto: MoveConversationDto): Promise<ConversationResponseDto> {
    const conversation = await this.findOne(id);
    const { toStatus } = moveConversationDto;

    const updatedConversation = await this.prisma.conversation.update({
      where: { id },
      data: {
        status: toStatus,
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return this.mapToResponse(updatedConversation, updatedConversation._count.messages);
  }

  private mapToResponse(
    conversation: any,
    messagesCount: number,
  ): ConversationResponseDto {
    return {
      id: conversation.id,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      title: conversation.title,
      contactName: conversation.contactName,
      channel: conversation.channel,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messagesCount,
    };
  }
}
