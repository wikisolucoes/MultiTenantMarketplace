import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class CreateSupportTicketDto {
  @ApiProperty({ description: 'ID do tenant' })
  @IsNumber()
  tenantId: number;

  @ApiProperty({ description: 'ID do usuário' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Assunto do ticket' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Descrição do problema' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Categoria do ticket', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ enum: TicketPriority, description: 'Prioridade do ticket' })
  @IsEnum(TicketPriority)
  priority: TicketPriority;
}

export class UpdateSupportTicketDto {
  @ApiProperty({ enum: TicketStatus, description: 'Status do ticket', required: false })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({ enum: TicketPriority, description: 'Prioridade do ticket', required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({ description: 'ID do agente responsável', required: false })
  @IsOptional()
  @IsNumber()
  assignedToUserId?: number;
}

export class CreateTicketMessageDto {
  @ApiProperty({ description: 'ID do ticket' })
  @IsNumber()
  ticketId: number;

  @ApiProperty({ description: 'ID do usuário que enviou a mensagem' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  message: string;
}

export class SupportTicketResponseDto {
  @ApiProperty({ description: 'ID do ticket' })
  id: number;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: number;

  @ApiProperty({ description: 'ID do usuário' })
  userId: number;

  @ApiProperty({ description: 'Assunto do ticket' })
  subject: string;

  @ApiProperty({ description: 'Descrição do problema' })
  description: string;

  @ApiProperty({ description: 'Categoria do ticket' })
  category?: string;

  @ApiProperty({ enum: TicketStatus, description: 'Status do ticket' })
  status: TicketStatus;

  @ApiProperty({ enum: TicketPriority, description: 'Prioridade do ticket' })
  priority: TicketPriority;

  @ApiProperty({ description: 'ID do agente responsável' })
  assignedToUserId?: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}