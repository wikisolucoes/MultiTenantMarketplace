import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateSupportTicketDto, UpdateSupportTicketDto, CreateTicketMessageDto, TicketStatus } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getSupportTicketsByTenant(tenantId: number, status?: TicketStatus) {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async getSupportTicket(id: number) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket de suporte não encontrado');
    }

    return ticket;
  }

  async createSupportTicket(createTicketDto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        title: createTicketDto.subject,
        description: createTicketDto.description,
        priority: createTicketDto.priority,
        userId: createTicketDto.userId,
        status: TicketStatus.OPEN,
        tenantId: createTicketDto.tenantId
      }
    });
  }

  async updateSupportTicket(id: number, updateTicketDto: UpdateSupportTicketDto) {
    await this.getSupportTicket(id);
    
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...updateTicketDto,
        updatedAt: new Date()
      }
    });
  }

  async addTicketMessage(createMessageDto: CreateTicketMessageDto) {
    return this.prisma.supportTicketMessage.create({
      data: createMessageDto
    });
  }

  async getTicketMessages(ticketId: number) {
    return this.prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' }
    });
  }
}