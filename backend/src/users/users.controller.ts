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
  Ip,
  Headers 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserResponseDto, UserWithPresenceDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private auditService: AuditService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get('with-presence')
  async findAllWithPresence(): Promise<UserWithPresenceDto[]> {
    return this.usersService.findAllWithPresence();
  }

  @Get('roles')
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Patch(':id/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<UserResponseDto> {
    const result = await this.usersService.update(req.user.userId, updateUserDto);
    
    // Registrar log de atualização de perfil
    await this.auditService.log({
      userId: req.user.userId,
      event: 'user.profile.update',
      entity: 'user',
      entityId: req.user.userId,
      ip,
      userAgent,
      meta: { updatedFields: Object.keys(updateUserDto) },
    });

    return result;
  }

  @Patch('profile/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeProfilePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    return this.usersService.changePassword(req.user.userId, changePasswordDto);
  }
}
