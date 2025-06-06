import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { 
  CreateSupportTicketDto, 
  UpdateSupportTicketDto, 
  CreateTicketMessageDto, 
  SupportTicketResponseDto,
  TicketStatus 
} from './dto/support.dto';

@ApiTags('support')
@ApiBearerAuth()
@Controller('api/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets/:tenantId')
  @ApiOperation({ summary: 'Listar tickets de suporte do tenant' })
  @ApiResponse({ status: 200, description: 'Lista de tickets', type: [SupportTicketResponseDto] })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  async getTicketsByTenant(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: TicketStatus
  ) {
    return this.supportService.getSupportTicketsByTenant(parseInt(tenantId), status);
  }

  @Get('tickets/detail/:id')
  @ApiOperation({ summary: 'Obter detalhes do ticket' })
  @ApiResponse({ status: 200, description: 'Detalhes do ticket', type: SupportTicketResponseDto })
  async getTicket(@Param('id') id: string) {
    return this.supportService.getSupportTicket(parseInt(id));
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Criar novo ticket de suporte' })
  @ApiResponse({ status: 201, description: 'Ticket criado', type: SupportTicketResponseDto })
  async createTicket(@Body() createTicketDto: CreateSupportTicketDto) {
    return this.supportService.createSupportTicket(createTicketDto);
  }

  @Put('tickets/:id')
  @ApiOperation({ summary: 'Atualizar ticket de suporte' })
  @ApiResponse({ status: 200, description: 'Ticket atualizado', type: SupportTicketResponseDto })
  async updateTicket(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateSupportTicketDto
  ) {
    return this.supportService.updateSupportTicket(parseInt(id), updateTicketDto);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Adicionar mensagem ao ticket' })
  @ApiResponse({ status: 201, description: 'Mensagem adicionada' })
  async addMessage(@Body() createMessageDto: CreateTicketMessageDto) {
    return this.supportService.addTicketMessage(createMessageDto);
  }

  @Get('messages/:ticketId')
  @ApiOperation({ summary: 'Obter mensagens do ticket' })
  @ApiResponse({ status: 200, description: 'Lista de mensagens' })
  async getMessages(@Param('ticketId') ticketId: string) {
    return this.supportService.getTicketMessages(parseInt(ticketId));
  }
}