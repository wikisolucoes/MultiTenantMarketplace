import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../storage/prisma.service';
import { PaymentGatewayFactory } from './services/payment-gateway.factory';
import { CreatePaymentDto, ConfigureGatewayDto } from './dto/create-payment.dto';
import { PaymentResponse } from './interfaces/payment-gateway.interface';

@Injectable()
export class PaymentGatewaysService {
  constructor(
    private prisma: PrismaService,
    private gatewayFactory: PaymentGatewayFactory,
  ) {}

  async createPayment(tenantId: number, dto: CreatePaymentDto): Promise<PaymentResponse> {
    // Verificar se o tenant tem verificação de identidade aprovada
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { identityVerification: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    if (!tenant.identityVerification || tenant.identityVerification.status !== 'approved') {
      throw new BadRequestException('Verificação de identidade obrigatória para processar pagamentos');
    }

    // Buscar gateways ativos do tenant
    const activeGateways = await this.prisma.paymentGatewayConfig.findMany({
      where: {
        tenantId,
        isActive: true,
        supportedMethods: {
          has: dto.paymentMethod,
        },
      },
      orderBy: { priority: 'asc' },
    });

    if (activeGateways.length === 0) {
      throw new BadRequestException(`Método de pagamento ${dto.paymentMethod} não disponível`);
    }

    // Usar o gateway com maior prioridade
    const gatewayConfig = activeGateways[0];
    const gateway = this.gatewayFactory.createGateway(gatewayConfig);

    try {
      const paymentRequest = {
        amount: dto.amount,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        customer: dto.customer,
        order: dto.order,
        metadata: {
          ...dto.metadata,
          tenantId,
          gatewayId: gatewayConfig.id,
        },
      };

      const paymentResponse = await gateway.createPayment(paymentRequest);

      // Salvar transação no banco
      await this.prisma.transaction.create({
        data: {
          id: paymentResponse.id,
          tenantId,
          orderId: dto.order.id,
          amount: dto.amount,
          currency: dto.currency,
          paymentMethod: dto.paymentMethod,
          status: paymentResponse.status,
          gatewayType: gatewayConfig.gatewayType,
          gatewayTransactionId: paymentResponse.gatewayTransactionId,
          paymentData: paymentResponse.paymentData as any,
          fees: paymentResponse.fees,
          netAmount: paymentResponse.netAmount,
          expiresAt: paymentResponse.expiresAt,
        },
      });

      return paymentResponse;
    } catch (error) {
      throw new BadRequestException(`Erro ao processar pagamento: ${error.message}`);
    }
  }

  async getPayment(tenantId: number, transactionId: string): Promise<PaymentResponse> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    const gatewayConfig = await this.prisma.paymentGatewayConfig.findFirst({
      where: {
        tenantId,
        gatewayType: transaction.gatewayType,
        isActive: true,
      },
    });

    if (!gatewayConfig) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    const gateway = this.gatewayFactory.createGateway(gatewayConfig);
    
    try {
      const paymentResponse = await gateway.getPayment(transaction.gatewayTransactionId);

      // Atualizar status se mudou
      if (paymentResponse.status !== transaction.status) {
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: { status: paymentResponse.status },
        });
      }

      return paymentResponse;
    } catch (error) {
      throw new BadRequestException(`Erro ao consultar pagamento: ${error.message}`);
    }
  }

  async configureGateway(tenantId: number, dto: ConfigureGatewayDto) {
    // Verificar se o tenant tem uma assinatura ativa para o gateway
    const subscription = await this.prisma.pluginSubscription.findFirst({
      where: {
        tenantId,
        pluginName: dto.gatewayType,
        status: 'active',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!subscription) {
      throw new BadRequestException(`Assinatura necessária para o gateway ${dto.gatewayType}`);
    }

    // Criar ou atualizar configuração do gateway
    const existingConfig = await this.prisma.paymentGatewayConfig.findFirst({
      where: {
        tenantId,
        gatewayType: dto.gatewayType,
      },
    });

    if (existingConfig) {
      return this.prisma.paymentGatewayConfig.update({
        where: { id: existingConfig.id },
        data: {
          environment: dto.environment,
          credentials: dto.credentials as any,
          supportedMethods: dto.supportedMethods,
          fees: dto.fees as any,
          priority: dto.priority,
          isActive: true,
        },
      });
    } else {
      return this.prisma.paymentGatewayConfig.create({
        data: {
          tenantId,
          gatewayType: dto.gatewayType,
          environment: dto.environment,
          credentials: dto.credentials as any,
          supportedMethods: dto.supportedMethods,
          fees: dto.fees as any,
          priority: dto.priority || 1,
          isActive: true,
        },
      });
    }
  }

  async getAvailableGateways(tenantId: number) {
    const activeSubscriptions = await this.prisma.pluginSubscription.findMany({
      where: {
        tenantId,
        status: 'active',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    const configuredGateways = await this.prisma.paymentGatewayConfig.findMany({
      where: { tenantId },
    });

    const gateways = [
      {
        name: 'mercadopago',
        displayName: 'MercadoPago',
        price: 29.90,
        supportedMethods: ['pix', 'credit_card', 'debit_card', 'boleto'],
        subscribed: activeSubscriptions.some(s => s.pluginName === 'mercadopago'),
        configured: configuredGateways.some(g => g.gatewayType === 'mercadopago'),
      },
      {
        name: 'pagseguro',
        displayName: 'PagSeguro',
        price: 24.90,
        supportedMethods: ['pix', 'credit_card', 'debit_card', 'boleto'],
        subscribed: activeSubscriptions.some(s => s.pluginName === 'pagseguro'),
        configured: configuredGateways.some(g => g.gatewayType === 'pagseguro'),
      },
      {
        name: 'cielo',
        displayName: 'Cielo',
        price: 34.90,
        supportedMethods: ['credit_card', 'debit_card'],
        subscribed: activeSubscriptions.some(s => s.pluginName === 'cielo'),
        configured: configuredGateways.some(g => g.gatewayType === 'cielo'),
      },
    ];

    return gateways;
  }

  async refundPayment(tenantId: number, transactionId: string, amount?: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        tenantId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    if (transaction.status !== 'completed') {
      throw new BadRequestException('Apenas transações completadas podem ser estornadas');
    }

    const gatewayConfig = await this.prisma.paymentGatewayConfig.findFirst({
      where: {
        tenantId,
        gatewayType: transaction.gatewayType,
        isActive: true,
      },
    });

    if (!gatewayConfig) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    const gateway = this.gatewayFactory.createGateway(gatewayConfig);
    
    try {
      const refundResponse = await gateway.refundPayment(transaction.gatewayTransactionId, amount);

      // Atualizar status da transação
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'refunded' },
      });

      return refundResponse;
    } catch (error) {
      throw new BadRequestException(`Erro ao processar estorno: ${error.message}`);
    }
  }
}