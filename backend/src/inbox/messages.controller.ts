import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
  CreateMessageDto,
  GetMessagesQueryDto,
  MessageResponseDto,
  PaginatedMessagesResponseDto,
} from './dto/message.dto';

@Controller('inbox/conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.create(conversationId, createMessageDto);
  }

  @Get()
  async findAll(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedMessagesResponseDto> {
    return this.messagesService.findAllByConversation(conversationId, query);
  }
}
