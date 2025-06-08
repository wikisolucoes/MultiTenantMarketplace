import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PaymentGateway, PaymentRequest, PaymentResponse } from '../interfaces/payment-gateway.interface';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  createInstance(config: any): PaymentGateway {
    return new MercadoPagoGateway(config);
  }
}

class MercadoPagoGateway implements PaymentGateway {
  private api: AxiosInstance;
  private config: any;

  constructor(config: any) {
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://api.mercadopago.com'
      : 'https://api.mercadopago.com';

    this.api = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': this.generateIdempotencyKey(),
      },
    });
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData = this.buildPaymentData(request);
      const response = await this.api.post('/v1/payments', paymentData);
      
      return this.mapPaymentResponse(response.data);
    } catch (error: any) {
      throw new Error(`MercadoPago payment creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await this.api.get(`/v1/payments/${transactionId}`);
      return this.mapPaymentResponse(response.data);
    } catch (error: any) {
      throw new Error(`MercadoPago payment retrieval failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<any> {
    try {
      const refundData = amount ? { amount } : {};
      const response = await this.api.post(`/v1/payments/${transactionId}/refunds`, refundData);
      return response.data;
    } catch (error: any) {
      throw new Error(`MercadoPago refund failed: ${error.response?.data?.message || error.message}`);
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.credentials.webhookSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  mapStatus(mercadoPagoStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'pending',
      'approved': 'completed',
      'authorized': 'processing',
      'in_process': 'processing',
      'in_mediation': 'processing',
      'rejected': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'cancelled',
      'charged_back': 'failed',
    };

    return statusMap[mercadoPagoStatus] || 'pending';
  }

  calculateFees(amount: number, paymentMethod: string): number {
    const feeRates = this.config.fees || {
      'pix': 0.0099,
      'credit_card': 0.0499,
      'debit_card': 0.0299,
      'boleto': 3.49,
    };

    const rate = feeRates[paymentMethod] || 0.0499;
    
    if (paymentMethod === 'boleto') {
      return rate; // Fixed fee
    }
    
    return amount * rate;
  }

  private buildPaymentData(request: PaymentRequest): any {
    const baseData = {
      transaction_amount: request.amount,
      description: `Pedido ${request.order.id}`,
      external_reference: request.order.id,
      payer: {
        email: request.customer.email,
        first_name: request.customer.name?.split(' ')[0],
        last_name: request.customer.name?.split(' ').slice(1).join(' '),
      },
      metadata: request.metadata,
    };

    switch (request.paymentMethod) {
      case 'pix':
        return {
          ...baseData,
          payment_method_id: 'pix',
        };
      
      case 'credit_card':
      case 'debit_card':
        return {
          ...baseData,
          payment_method_id: request.paymentMethod,
          token: request.metadata?.cardToken,
          installments: request.metadata?.installments || 1,
        };
      
      case 'boleto':
        return {
          ...baseData,
          payment_method_id: 'bolbradesco',
        };
      
      default:
        return baseData;
    }
  }

  private mapPaymentResponse(data: any): PaymentResponse {
    const fees = this.calculateFees(data.transaction_amount, data.payment_method_id);
    
    return {
      id: data.id.toString(),
      status: this.mapStatus(data.status),
      amount: data.transaction_amount,
      currency: data.currency_id,
      paymentMethod: data.payment_method_id,
      gatewayTransactionId: data.id.toString(),
      paymentData: {
        qrCode: data.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        ticketUrl: data.point_of_interaction?.transaction_data?.ticket_url,
      },
      fees,
      netAmount: data.transaction_amount - fees,
      createdAt: new Date(data.date_created),
      expiresAt: data.date_of_expiration ? new Date(data.date_of_expiration) : undefined,
    };
  }
}