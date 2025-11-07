import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConsumersService } from './consumers.service';
import { CreateConsumerDto, UpdateConsumerDto, ConsumerResponseDto } from './dto/consumer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('consumers')
@UseGuards(JwtAuthGuard)
export class ConsumersController {
  constructor(private readonly consumersService: ConsumersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createConsumerDto: CreateConsumerDto
  ): Promise<ConsumerResponseDto> {
    return this.consumersService.create(createConsumerDto, req.user.userId);
  }

  @Get()
  async findAll(): Promise<ConsumerResponseDto[]> {
    return this.consumersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ConsumerResponseDto> {
    return this.consumersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateConsumerDto: UpdateConsumerDto
  ): Promise<ConsumerResponseDto> {
    return this.consumersService.update(id, updateConsumerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.consumersService.remove(id);
  }
}

