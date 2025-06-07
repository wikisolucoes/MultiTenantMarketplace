import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto, ProcessPaymentDto, PaymentCallbackDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar novo checkout' })
  @ApiResponse({ status: 201, description: 'Checkout criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createCheckout(@Body() createCheckoutDto: CreateCheckoutDto, @GetUser() user: any) {
    return this.checkoutService.createCheckout({
      ...createCheckoutDto,
      tenantId: user.tenantId
    });
  }

  @Post('payment/process')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Processar pagamento do pedido' })
  @ApiResponse({ status: 200, description: 'Pagamento processado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro no processamento do pagamento' })
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto) {
    return this.checkoutService.processPayment(processPaymentDto);
  }

  @Post('payment/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Callback de pagamento do Celcoin' })
  @ApiResponse({ status: 200, description: 'Callback processado com sucesso' })
  async handlePaymentCallback(@Body() callbackDto: PaymentCallbackDto) {
    return this.checkoutService.handlePaymentCallback(callbackDto);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter detalhes do pedido' })
  @ApiResponse({ status: 200, description: 'Detalhes do pedido' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async getOrder(@Param('orderId') orderId: string, @GetUser() user: any) {
    return this.checkoutService.getOrder(+orderId, user.tenantId);
  }

  @Get('order/:orderId/status')
  @ApiOperation({ summary: 'Verificar status do pedido' })
  @ApiResponse({ status: 200, description: 'Status do pedido' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async getOrderStatus(@Param('orderId') orderId: string) {
    return this.checkoutService.getOrderStatus(+orderId);
  }
}