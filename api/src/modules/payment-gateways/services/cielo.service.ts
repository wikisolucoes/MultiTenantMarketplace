import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PaymentGateway, PaymentRequest, PaymentResponse } from '../interfaces/payment-gateway.interface';
import * as crypto from 'crypto';

@Injectable()
export class CieloService {
  createInstance(config: any): PaymentGateway {
    return new CieloGateway(config);
  }
}

class CieloGateway implements PaymentGateway {
  private api: AxiosInstance;
  private config: any;

  constructor(config: any) {
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://api.cieloecommerce.cielo.com.br'
      : 'https://apisandbox.cieloecommerce.cielo.com.br';

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'MerchantId': config.credentials.merchantId,
        'MerchantKey': config.credentials.merchantKey,
      },
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData = this.buildPaymentData(request);
      const response = await this.api.post('/1/sales/', paymentData);
      
      return this.mapPaymentResponse(response.data);
    } catch (error: any) {
      throw new Error(`Cielo payment creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await this.api.get(`/1/sales/${transactionId}`);
      return this.mapPaymentResponse(response.data);
    } catch (error: any) {
      throw new Error(`Cielo payment retrieval failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<any> {
    try {
      const refundData = amount ? { Amount: amount * 100 } : {}; // Cielo works with cents
      const response = await this.api.put(`/1/sales/${transactionId}/void`, refundData);
      return response.data;
    } catch (error: any) {
      throw new Error(`Cielo refund failed: ${error.response?.data?.message || error.message}`);
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.credentials.webhookSecret || '')
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

  mapStatus(cieloStatus: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'pending',     // NotFinished
      1: 'processing',  // Authorized
      2: 'completed',   // PaymentConfirmed
      3: 'failed',      // Denied
      10: 'cancelled',  // Voided
      11: 'cancelled',  // Refunded
      12: 'pending',    // Pending
      13: 'cancelled',  // Aborted
      20: 'processing', // Scheduled
    };

    return statusMap[cieloStatus] || 'pending';
  }

  calculateFees(amount: number, paymentMethod: string): number {
    const feeRates = this.config.fees || {
      'credit_card': 0.0299, // 2.99%
      'debit_card': 0.0199,  // 1.99%
    };

    const rate = feeRates[paymentMethod] || 0.0299;
    return amount * rate;
  }

  private buildPaymentData(request: PaymentRequest): any {
    const merchantOrderId = request.order.id;
    const customer = {
      Name: request.customer.name || 'Cliente',
      Email: request.customer.email,
    };

    if (request.customer.document) {
      customer['Identity'] = request.customer.document;
      customer['IdentityType'] = request.customer.document.length === 11 ? 'CPF' : 'CNPJ';
    }

    const baseData = {
      MerchantOrderId: merchantOrderId,
      Customer: customer,
      Payment: {
        Type: this.mapPaymentType(request.paymentMethod),
        Amount: Math.round(request.amount * 100), // Cielo works with cents
        Currency: 'BRL',
        Country: 'BRA',
        Installments: request.metadata?.installments || 1,
        SoftDescriptor: `Pedido ${merchantOrderId}`,
      },
    };

    if (request.paymentMethod === 'credit_card' || request.paymentMethod === 'debit_card') {
      baseData.Payment['CreditCard'] = {
        CardToken: request.metadata?.cardToken,
        SecurityCode: request.metadata?.securityCode,
        Brand: request.metadata?.cardBrand,
      };

      if (request.metadata?.saveCard) {
        baseData.Payment['SaveCard'] = true;
      }
    }

    return baseData;
  }

  private mapPaymentType(method: string): string {
    const typeMap: { [key: string]: string } = {
      'credit_card': 'CreditCard',
      'debit_card': 'DebitCard',
    };

    return typeMap[method] || 'CreditCard';
  }

  private mapPaymentResponse(data: any): PaymentResponse {
    const payment = data.Payment;
    const fees = this.calculateFees(payment.Amount / 100, payment.Type);
    
    return {
      id: data.MerchantOrderId,
      status: this.mapStatus(payment.Status),
      amount: payment.Amount / 100, // Convert back from cents
      currency: 'BRL',
      paymentMethod: payment.Type.toLowerCase(),
      gatewayTransactionId: payment.PaymentId,
      paymentData: {
        authorizationCode: payment.AuthorizationCode,
        tid: payment.Tid,
        nsu: payment.ProofOfSale,
        cardBrand: payment.CreditCard?.Brand,
        lastFourDigits: payment.CreditCard?.CardNumber?.slice(-4),
        installments: payment.Installments,
      },
      fees,
      netAmount: (payment.Amount / 100) - fees,
      createdAt: new Date(),
      expiresAt: undefined, // Cielo doesn't provide expiration for card payments
    };
  }
}