import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, Prisma } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { MoveTicketDto } from './dto/move-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: TicketStatus) {
    const where: Prisma.TicketWhereInput = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { position: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket com ID ${id} não encontrado`);
    }

    return ticket;
  }

  async create(createTicketDto: CreateTicketDto) {
    const nextPosition = await this.getNextPosition(TicketStatus.AGUARDANDO);

    return this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        status: TicketStatus.AGUARDANDO,
        position: nextPosition,
      },
    });
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    await this.findOne(id); // Verifica se existe

    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
    });
  }

  async move(id: string, moveTicketDto: MoveTicketDto) {
    const ticket = await this.findOne(id);
    const { toStatus, toIndex } = moveTicketDto;

    // Se está mudando de status
    if (ticket.status !== toStatus) {
      // 1. Remover da coluna atual (decrementar positions após)
      await this.prisma.ticket.updateMany({
        where: {
          status: ticket.status,
          position: { gt: ticket.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // 2. Criar espaço na nova coluna (incrementar positions >= toIndex)
      await this.prisma.ticket.updateMany({
        where: {
          status: toStatus,
          position: { gte: toIndex },
        },
        data: {
          position: { increment: 1 },
        },
      });

      // 3. Atualizar o ticket
      return this.prisma.ticket.update({
        where: { id },
        data: {
          status: toStatus,
          position: toIndex,
        },
      });
    } else {
      // Mesma coluna, apenas reordenar
      const fromIndex = ticket.position;
      
      if (fromIndex === toIndex) {
        return ticket; // Não há mudança
      }

      // Atualizar positions dos outros tickets
      if (fromIndex < toIndex) {
        // Movendo para baixo
        await this.prisma.ticket.updateMany({
          where: {
            status: ticket.status,
            position: { gt: fromIndex, lte: toIndex },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else {
        // Movendo para cima
        await this.prisma.ticket.updateMany({
          where: {
            status: ticket.status,
            position: { gte: toIndex, lt: fromIndex },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      // Atualizar o ticket
      return this.prisma.ticket.update({
        where: { id },
        data: {
          position: toIndex,
        },
      });
    }
  }

  async remove(id: string) {
    const ticket = await this.findOne(id);

    // Remover da posição (decrementar positions após)
    await this.prisma.ticket.updateMany({
      where: {
        status: ticket.status,
        position: { gt: ticket.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    return this.prisma.ticket.delete({
      where: { id },
    });
  }

  // Funções utilitárias para position management

  async getNextPosition(status: TicketStatus): Promise<number> {
    const maxTicket = await this.prisma.ticket.findFirst({
      where: { status },
      orderBy: { position: 'desc' },
    });

    return maxTicket ? maxTicket.position + 1 : 0;
  }

  async normalizePositions(status: TicketStatus): Promise<void> {
    const tickets = await this.prisma.ticket.findMany({
      where: { status },
      orderBy: { position: 'asc' },
    });

    // Atualizar positions sequencialmente (0, 1, 2, ...)
    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i].position !== i) {
        await this.prisma.ticket.update({
          where: { id: tickets[i].id },
          data: { position: i },
        });
      }
    }
  }


}
