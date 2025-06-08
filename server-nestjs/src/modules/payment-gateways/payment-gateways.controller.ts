import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentGatewaysService } from './payment-gateways.service';
import { CreatePaymentDto, ConfigureGatewayDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payment-gateways')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-gateways')
export class PaymentGatewaysController {
  constructor(private readonly paymentGatewaysService: PaymentGatewaysService) {}

  @Post('payments')
  @ApiOperation({ summary: 'Criar um novo pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou erro no processamento' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async createPayment(@Request() req: any, @Body() createPaymentDto: CreatePaymentDto) {
    const tenantId = req.user.tenantId;
    return this.paymentGatewaysService.createPayment(tenantId, createPaymentDto);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Consultar status de um pagamento' })
  @ApiResponse({ status: 200, description: 'Dados do pagamento' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  async getPayment(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.paymentGatewaysService.getPayment(tenantId, id);
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Processar estorno de um pagamento' })
  @ApiResponse({ status: 200, description: 'Estorno processado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro no processamento do estorno' })
  async refundPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { amount?: number }
  ) {
    const tenantId = req.user.tenantId;
    return this.paymentGatewaysService.refundPayment(tenantId, id, body.amount);
  }

  @Post('configure')
  @ApiOperation({ summary: 'Configurar um gateway de pagamento' })
  @ApiResponse({ status: 200, description: 'Gateway configurado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou assinatura necessária' })
  async configureGateway(@Request() req: any, @Body() configureGatewayDto: ConfigureGatewayDto) {
    const tenantId = req.user.tenantId;
    return this.paymentGatewaysService.configureGateway(tenantId, configureGatewayDto);
  }

  @Get('available')
  @ApiOperation({ summary: 'Listar gateways de pagamento disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de gateways disponíveis' })
  async getAvailableGateways(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.paymentGatewaysService.getAvailableGateways(tenantId);
  }
}