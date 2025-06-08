import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfigureGatewayDto } from './dto/configure-gateway.dto';
import { SubscribePluginDto } from './dto/subscribe-plugin.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('payment-gateways')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-gateways')
export class PaymentGatewaysController {
  constructor(private readonly paymentGatewaysService: PaymentGatewaysService) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available payment gateways for tenant' })
  @ApiResponse({ status: 200, description: 'List of available payment gateways' })
  async getAvailableGateways(@Request() req: any) {
    return this.paymentGatewaysService.getAvailableGateways(req.user.tenantId);
  }

  @Post('configure')
  @ApiOperation({ summary: 'Configure payment gateway credentials' })
  @ApiResponse({ status: 201, description: 'Gateway configured successfully' })
  async configureGateway(@Request() req: any, @Body() configureDto: ConfigureGatewayDto) {
    return this.paymentGatewaysService.configureGateway(
      req.user.tenantId,
      configureDto
    );
  }

  @Post('process-payment')
  @ApiOperation({ summary: 'Process payment through configured gateway' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  async processPayment(@Request() req: any, @Body() paymentDto: CreatePaymentDto) {
    return this.paymentGatewaysService.processPayment(
      req.user.tenantId,
      paymentDto
    );
  }

  @Get('payment/:transactionId')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async getPaymentStatus(
    @Request() req: any,
    @Param('transactionId') transactionId: string
  ) {
    return this.paymentGatewaysService.getPaymentStatus(
      req.user.tenantId,
      transactionId
    );
  }

  @Post('refund/:transactionId')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  async refundPayment(
    @Request() req: any,
    @Param('transactionId') transactionId: string,
    @Body() refundData: { amount?: number; reason?: string }
  ) {
    return this.paymentGatewaysService.refundPayment(
      req.user.tenantId,
      transactionId,
      refundData.amount,
      refundData.reason
    );
  }

  @Post('test-gateway/:gatewayType')
  @ApiOperation({ summary: 'Test gateway configuration' })
  @ApiResponse({ status: 200, description: 'Gateway test completed' })
  async testGateway(
    @Request() req: any,
    @Param('gatewayType') gatewayType: string
  ) {
    return this.paymentGatewaysService.testGatewayConfiguration(
      req.user.tenantId,
      gatewayType
    );
  }
}

@ApiTags('plugin-subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plugin-subscriptions')
export class PluginSubscriptionsController {
  constructor(private readonly paymentGatewaysService: PaymentGatewaysService) {}

  @Post()
  @ApiOperation({ summary: 'Subscribe to payment gateway plugin' })
  @ApiResponse({ status: 201, description: 'Plugin subscription created' })
  async subscribeToPlugin(@Request() req: any, @Body() subscribeDto: SubscribePluginDto) {
    return this.paymentGatewaysService.subscribeToPlugin(
      req.user.tenantId,
      subscribeDto.pluginName
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get tenant plugin subscriptions' })
  @ApiResponse({ status: 200, description: 'List of plugin subscriptions' })
  async getSubscriptions(@Request() req: any) {
    return this.paymentGatewaysService.getTenantSubscriptions(req.user.tenantId);
  }

  @Post(':subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel plugin subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(
    @Request() req: any,
    @Param('subscriptionId') subscriptionId: string,
    @Body() cancelData: { reason?: string }
  ) {
    return this.paymentGatewaysService.cancelSubscription(
      req.user.tenantId,
      parseInt(subscriptionId),
      cancelData.reason
    );
  }
}