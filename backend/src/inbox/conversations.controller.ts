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
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  GetConversationsQueryDto,
  ConversationResponseDto,
  PaginatedConversationsResponseDto,
} from './dto/conversation.dto';

@Controller('inbox/conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.create(createConversationDto);
  }

  @Get()
  async findAll(
    @Query() query: GetConversationsQueryDto,
  ): Promise<PaginatedConversationsResponseDto> {
    return this.conversationsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ConversationResponseDto> {
    return this.conversationsService.findOne(id);
  }
}
