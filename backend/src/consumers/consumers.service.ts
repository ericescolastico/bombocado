import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsumerDto, UpdateConsumerDto, ConsumerResponseDto } from './dto/consumer.dto';

@Injectable()
export class ConsumersService {
  constructor(private prisma: PrismaService) {}

  async create(createConsumerDto: CreateConsumerDto, createdById: string): Promise<ConsumerResponseDto> {
    // Verificar se email já existe (se fornecido)
    if (createConsumerDto.email) {
      const existingConsumer = await this.prisma.consumer.findFirst({
        where: {
          email: createConsumerDto.email,
          deletedAt: null,
        },
      });

      if (existingConsumer) {
        throw new ConflictException('Email já está em uso por outro cliente');
      }
    }

    // Criar cliente
    const consumer = await this.prisma.consumer.create({
      data: {
        ...createConsumerDto,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapConsumerToResponse(consumer);
  }

  async findAll(): Promise<ConsumerResponseDto[]> {
    const consumers = await this.prisma.consumer.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return consumers.map(consumer => this.mapConsumerToResponse(consumer));
  }

  async findOne(consumerId: string): Promise<ConsumerResponseDto> {
    const consumer = await this.prisma.consumer.findUnique({
      where: { consumerId },
      include: {
        createdBy: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!consumer || consumer.deletedAt) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.mapConsumerToResponse(consumer);
  }

  async update(consumerId: string, updateConsumerDto: UpdateConsumerDto): Promise<ConsumerResponseDto> {
    // Verificar se cliente existe
    const existingConsumer = await this.prisma.consumer.findUnique({
      where: { consumerId },
    });

    if (!existingConsumer || existingConsumer.deletedAt) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se email já existe em outro cliente (se fornecido e diferente do atual)
    if (updateConsumerDto.email && updateConsumerDto.email !== existingConsumer.email) {
      const emailExists = await this.prisma.consumer.findFirst({
        where: {
          email: updateConsumerDto.email,
          consumerId: { not: consumerId },
          deletedAt: null,
        },
      });

      if (emailExists) {
        throw new ConflictException('Email já está em uso por outro cliente');
      }
    }

    // Atualizar cliente
    const consumer = await this.prisma.consumer.update({
      where: { consumerId },
      data: updateConsumerDto,
      include: {
        createdBy: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapConsumerToResponse(consumer);
  }

  async remove(consumerId: string): Promise<void> {
    const consumer = await this.prisma.consumer.findUnique({
      where: { consumerId },
    });

    if (!consumer || consumer.deletedAt) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Soft delete
    await this.prisma.consumer.update({
      where: { consumerId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private mapConsumerToResponse(consumer: any): ConsumerResponseDto {
    return {
      consumerId: consumer.consumerId,
      firstName: consumer.firstName,
      lastName: consumer.lastName,
      email: consumer.email,
      profileImage: consumer.profileImage,
      address: consumer.address,
      zipcode: consumer.zipcode,
      phone: consumer.phone,
      docNumber: consumer.docNumber,
      docType: consumer.docType,
      gender: consumer.gender,
      state: consumer.state,
      city: consumer.city,
      consumerNotes: consumer.consumerNotes,
      createdById: consumer.createdById,
      createdBy: {
        userId: consumer.createdBy.userId,
        firstName: consumer.createdBy.firstName,
        lastName: consumer.createdBy.lastName,
      },
      createdAt: consumer.createdAt,
      updatedAt: consumer.updatedAt,
      deletedAt: consumer.deletedAt,
    };
  }
}

