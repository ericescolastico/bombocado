import { IsEnum, IsInt, Min, IsNotEmpty } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class MoveTicketDto {
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  toStatus: TicketStatus;

  @IsInt()
  @Min(0)
  toIndex: number;
}
