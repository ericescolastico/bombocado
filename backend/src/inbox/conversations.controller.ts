import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  GetConversationsQueryDto,
  ConversationResponseDto,
  PaginatedConversationsResponseDto,
  MoveConversationDto,
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

  @Get('kanban/all')
  async findAllForKanban(): Promise<ConversationResponseDto[]> {
    return this.conversationsService.findAllForKanban();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ConversationResponseDto> {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id/move')
  async move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moveConversationDto: MoveConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.move(id, moveConversationDto);
  }
}
