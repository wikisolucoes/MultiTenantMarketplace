import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CelcoinService } from '../celcoin/celcoin.service';
import { EmailService } from '../email/email.service';
import { CreateCheckoutDto, ProcessPaymentDto, PaymentCallbackDto } from './dto/checkout.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private celcoinService: CelcoinService,
    private emailService: EmailService,
  ) {}

  async createCheckout(checkoutDto: CreateCheckoutDto) {
    const { items, customerData, paymentMethod, tenantId, shippingAddress, shippingCost = 0, discount = 0, notes } = checkoutDto;

    // Validate products and calculate totals
    const productIds = items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        status: 'active'
      }
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Alguns produtos não estão disponíveis');
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Produto ${item.productId} não encontrado`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para ${product.name}`);
      }

      const itemTotal = item.quantity * Number(product.price);
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        totalPrice: itemTotal,
        product
      };
    });

    const total = subtotal + shippingCost - discount;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerDocument: customerData.cpf,
        customerPhone: customerData.phone,
        total: new Decimal(total),
        status: 'pending',
        paymentMethod,
        paymentStatus: 'pending',
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : JSON.stringify(customerData.address),
        items: JSON.stringify(orderItems.map(item => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))),
        notes,
        customerAddress: customerData.address?.street,
        customerCity: customerData.address?.city,
        customerState: customerData.address?.state,
        customerZipCode: customerData.address?.postalCode,
        taxTotal: new Decimal(0) // Will be calculated for NFe
      }
    });

    // Reserve stock
    for (const item of orderItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity }
        }
      });
    }

    // Create ledger entry for financial tracking
    await this.prisma.ledgerEntry.create({
      data: {
        tenantId,
        entryType: 'order',
        transactionType: 'pending',
        amount: new Decimal(total),
        runningBalance: new Decimal(0), // Will be updated when payment is confirmed
        orderId: order.id,
        description: `Pedido criado: ${orderNumber}`,
        status: 'pending'
      }
    });

    this.logger.log(`Order created: ${orderNumber} for tenant ${tenantId}`);

    return {
      orderId: order.id,
      orderNumber,
      total,
      subtotal,
      shippingCost,
      discount,
      paymentMethod,
      status: 'pending',
      items: orderItems.map(item => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    };
  }

  async processPayment(paymentDto: ProcessPaymentDto) {
    const { orderId, paymentMethod } = paymentDto;

    // Get order details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tenant: true }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.paymentStatus !== 'pending') {
      throw new BadRequestException('Pagamento já foi processado');
    }

    const correlationId = `PAY_${orderId}_${Date.now()}`;

    try {
      let paymentResult;

      switch (paymentMethod) {
        case 'pix':
          paymentResult = await this.processPixPayment(order, correlationId);
          break;
        case 'boleto':
          paymentResult = await this.processBoletoPayment(order, correlationId);
          break;
        case 'credit_card':
          throw new BadRequestException('Pagamento por cartão de crédito não implementado');
        default:
          throw new BadRequestException('Método de pagamento inválido');
      }

      // Update order with payment information
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          celcoinTransactionId: paymentResult.transactionId,
          paymentStatus: 'processing'
        }
      });

      // Log transaction in Celcoin transaction log
      await this.prisma.celcoinTransactionLog.create({
        data: {
          tenantId: order.tenantId,
          externalTransactionId: paymentResult.transactionId,
          operationType: paymentMethod,
          requestPayload: JSON.stringify({ orderId, correlationId }),
          responsePayload: JSON.stringify(paymentResult),
          amount: order.total,
          isSuccessful: true,
          celcoinStatus: paymentResult.status
        }
      });

      this.logger.log(`Payment processed for order ${orderId}: ${paymentResult.transactionId}`);

      return paymentResult;
    } catch (error) {
      this.logger.error(`Payment processing failed for order ${orderId}:`, error);

      // Log failed transaction
      await this.prisma.celcoinTransactionLog.create({
        data: {
          tenantId: order.tenantId,
          externalTransactionId: correlationId,
          operationType: paymentMethod,
          requestPayload: JSON.stringify({ orderId, correlationId }),
          errorMessage: error.message,
          amount: order.total,
          isSuccessful: false
        }
      });

      throw error;
    }
  }

  private async processPixPayment(order: any, correlationId: string) {
    const merchantData = {
      postalCode: order.customerZipCode || '01000000',
      city: order.customerCity || 'São Paulo',
      merchantCategoryCode: '5999',
      name: order.tenant.name
    };

    const pixPayment = await this.celcoinService.createPixPayment({
      merchant: merchantData,
      amount: Number(order.total),
      correlationID: correlationId,
      expiresDate: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes
      payer: {
        name: order.customerName,
        email: order.customerEmail,
        cpf: order.customerDocument
      }
    });

    return {
      transactionId: pixPayment.transactionId,
      pixKey: pixPayment.pixCopiaECola,
      qrCode: pixPayment.emvqrcps,
      expirationDate: pixPayment.expirationDate,
      status: pixPayment.status,
      paymentMethod: 'pix'
    };
  }

  private async processBoletoPayment(order: any, correlationId: string) {
    const merchantData = {
      postalCode: order.customerZipCode || '01000000',
      city: order.customerCity || 'São Paulo',
      merchantCategoryCode: '5999',
      name: order.tenant.name
    };

    const boleto = await this.celcoinService.createBoleto({
      merchant: merchantData,
      amount: Number(order.total),
      correlationID: correlationId,
      expiresDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      payer: {
        name: order.customerName,
        email: order.customerEmail,
        cpf: order.customerDocument,
        address: JSON.parse(order.shippingAddress || '{}')
      }
    });

    return {
      transactionId: boleto.transactionId,
      digitableLine: boleto.digitableLine,
      barCode: boleto.barCode,
      pdfUrl: boleto.pdf,
      expirationDate: boleto.expirationDate,
      status: boleto.status,
      paymentMethod: 'boleto'
    };
  }

  async handlePaymentCallback(callbackDto: PaymentCallbackDto) {
    const { transactionId, status, correlationId } = callbackDto;

    // Find order by transaction ID
    const order = await this.prisma.order.findFirst({
      where: { celcoinTransactionId: transactionId }
    });

    if (!order) {
      this.logger.warn(`Order not found for transaction ${transactionId}`);
      return { success: false, message: 'Order not found' };
    }

    // Update order status based on payment status
    let newPaymentStatus = 'pending';
    let newOrderStatus = order.status;

    switch (status.toLowerCase()) {
      case 'paid':
      case 'approved':
      case 'confirmed':
        newPaymentStatus = 'succeeded';
        newOrderStatus = 'confirmed';
        break;
      case 'cancelled':
      case 'failed':
        newPaymentStatus = 'failed';
        newOrderStatus = 'cancelled';
        break;
      case 'pending':
      case 'processing':
        newPaymentStatus = 'processing';
        break;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newPaymentStatus,
        status: newOrderStatus
      }
    });

    // Update ledger entry
    if (newPaymentStatus === 'succeeded') {
      await this.prisma.ledgerEntry.updateMany({
        where: { orderId: order.id },
        data: {
          transactionType: 'credit',
          status: 'confirmed',
          confirmedAt: new Date(),
          celcoinTransactionId: transactionId
        }
      });

      // Send confirmation email
      await this.sendOrderConfirmationEmail(order);

      this.logger.log(`Payment confirmed for order ${order.id}`);
    } else if (newPaymentStatus === 'failed') {
      // Restore stock if payment failed
      const orderItems = JSON.parse(order.items || '[]');
      for (const item of orderItems) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity }
          }
        });
      }

      await this.prisma.ledgerEntry.updateMany({
        where: { orderId: order.id },
        data: {
          status: 'failed',
          reversedAt: new Date()
        }
      });

      this.logger.log(`Payment failed for order ${order.id}, stock restored`);
    }

    // Update Celcoin transaction log
    await this.prisma.celcoinTransactionLog.updateMany({
      where: { externalTransactionId: transactionId },
      data: {
        celcoinStatus: status,
        isSuccessful: newPaymentStatus === 'succeeded',
        webhookReceived: true,
        webhookTimestamp: new Date()
      }
    });

    return { success: true, orderId: order.id, status: newPaymentStatus };
  }

  private async sendOrderConfirmationEmail(order: any) {
    try {
      const emailContent = this.generateOrderConfirmationEmail(order);
      
      await this.emailService.sendEmail({
        to: order.customerEmail,
        subject: `Pedido Confirmado - ${order.id}`,
        htmlContent: emailContent,
        from: 'noreply@ecommerce.com'
      });
    } catch (error) {
      this.logger.error(`Failed to send confirmation email for order ${order.id}:`, error);
    }
  }

  private generateOrderConfirmationEmail(order: any): string {
    const items = JSON.parse(order.items || '[]');
    const itemsHtml = items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>R$ ${item.unitPrice.toFixed(2)}</td>
        <td>R$ ${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <h2>Pedido Confirmado!</h2>
      <p>Olá ${order.customerName},</p>
      <p>Seu pedido foi confirmado e está sendo processado.</p>
      
      <h3>Detalhes do Pedido #${order.id}</h3>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço Unitário</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <p><strong>Total: R$ ${Number(order.total).toFixed(2)}</strong></p>
      <p>Obrigado pela sua compra!</p>
    `;
  }

  async getOrder(orderId: number, tenantId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        transactions: true,
        ledgerEntries: true
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return {
      ...order,
      items: JSON.parse(order.items || '[]'),
      shippingAddress: JSON.parse(order.shippingAddress || '{}')
    };
  }

  async getOrderStatus(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        celcoinTransactionId: true,
        total: true
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }
}