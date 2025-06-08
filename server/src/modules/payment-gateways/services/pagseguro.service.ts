import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PaymentGateway, PaymentRequest, PaymentResponse } from '../interfaces/payment-gateway.interface';

@Injectable()
export class PagSeguroService {
  createInstance(config: any): PaymentGateway {
    return new PagSeguroGateway(config);
  }
}

class PagSeguroGateway implements PaymentGateway {
  private api: AxiosInstance;
  private config: any;

  constructor(config: any) {
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://ws.pagseguro.uol.com.br'
      : 'https://ws.sandbox.pagseguro.uol.com.br';

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData = this.buildPaymentData(request);
      const formData = this.buildFormData(paymentData);
      const response = await this.api.post('/v2/transactions', formData);
      
      return this.mapPaymentResponse(this.parseXMLResponse(response.data));
    } catch (error: any) {
      throw new Error(`PagSeguro payment creation failed: ${error.response?.data || error.message}`);
    }
  }

  async getPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const params = new URLSearchParams({
        email: this.config.credentials.email,
        token: this.config.credentials.token,
      });

      const response = await this.api.get(`/v3/transactions/${transactionId}?${params}`);
      
      return this.mapPaymentResponse(this.parseXMLResponse(response.data));
    } catch (error: any) {
      throw new Error(`PagSeguro payment retrieval failed: ${error.response?.data || error.message}`);
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<any> {
    try {
      const params = new URLSearchParams({
        email: this.config.credentials.email,
        token: this.config.credentials.token,
      });

      if (amount) {
        params.append('refundValue', amount.toString());
      }

      const response = await this.api.post(`/v2/transactions/refunds`, params.toString());
      
      return this.parseXMLResponse(response.data);
    } catch (error: any) {
      throw new Error(`PagSeguro refund failed: ${error.response?.data || error.message}`);
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    // PagSeguro usa notification codes para verificar autenticidade
    return Boolean(payload && signature);
  }

  mapStatus(pagSeguroStatus: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'pending',     // Aguardando pagamento
      2: 'processing',  // Em análise
      3: 'completed',   // Paga
      4: 'completed',   // Disponível
      5: 'processing',  // Em disputa
      6: 'cancelled',   // Devolvida
      7: 'cancelled',   // Cancelada
      8: 'failed',      // Chargeback debitado
      9: 'processing',  // Em contestação
    };

    return statusMap[pagSeguroStatus] || 'pending';
  }

  calculateFees(amount: number, paymentMethod: string, installments: number = 1): number {
    const feeRates = this.config.fees || {
      'pix': 0.0099,
      'credit_card': 0.0399,
      'debit_card': 0.0299,
      'boleto': 3.49,
    };

    let rate = feeRates[paymentMethod] || 0.0399;
    
    if (paymentMethod === 'boleto') {
      return rate; // Fixed fee
    }
    
    // Add installment fees for credit card
    if (paymentMethod === 'credit_card' && installments > 1) {
      rate += (installments - 1) * 0.0099;
    }
    
    return amount * rate;
  }

  private buildPaymentData(request: PaymentRequest): any {
    const baseData = {
      paymentMode: 'default',
      paymentMethod: this.mapPaymentMethod(request.paymentMethod),
      receiverEmail: this.config.credentials.email,
      currency: 'BRL',
      reference: request.order.id,
      senderName: request.customer.name || 'Cliente',
      senderEmail: request.customer.email,
      items: request.order.items.map((item, index) => ({
        id: item.id,
        description: item.title,
        quantity: item.quantity.toString(),
        amount: (item.unitPrice * item.quantity).toFixed(2),
      })),
    };

    if (request.customer.phone) {
      const phone = request.customer.phone.replace(/\D/g, '');
      baseData['senderPhone'] = {
        areaCode: phone.substring(0, 2),
        number: phone.substring(2),
      };
    }

    if (request.customer.document) {
      baseData['senderDocument'] = {
        type: request.customer.document.length === 11 ? 'CPF' : 'CNPJ',
        value: request.customer.document,
      };
    }

    return baseData;
  }

  private mapPaymentMethod(method: string): string {
    const methodMap: { [key: string]: string } = {
      'pix': 'pix',
      'credit_card': 'creditCard',
      'debit_card': 'debitCard',
      'boleto': 'boleto',
    };

    return methodMap[method] || 'creditCard';
  }

  private buildFormData(data: any): string {
    const params = new URLSearchParams();
    
    const flatten = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}${key}` : key;
          
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            flatten(obj[key], `${newKey}.`);
          } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any, index: number) => {
              if (typeof item === 'object') {
                flatten(item, `${newKey}[${index + 1}].`);
              } else {
                params.append(`${newKey}[${index + 1}]`, item);
              }
            });
          } else {
            params.append(newKey, obj[key]);
          }
        }
      }
    };

    flatten(data);
    params.append('email', this.config.credentials.email);
    params.append('token', this.config.credentials.token);
    
    return params.toString();
  }

  private parseXMLResponse(xmlData: string): any {
    // Implementação simplificada de parsing XML
    // Em produção, usar biblioteca xml2js
    try {
      const xml2js = require('xml2js');
      let result: any = {};

      xml2js.parseString(xmlData, (err: any, parsed: any) => {
        if (err) throw err;
        result = parsed;
      });

      return result;
    } catch (error) {
      throw new Error('Failed to parse XML response');
    }
  }

  private mapPaymentResponse(data: any): PaymentResponse {
    const transactionData = data.transaction || data;
    const fees = this.calculateFees(
      parseFloat(transactionData.grossAmount),
      transactionData.paymentMethod?.type
    );
    
    return {
      id: transactionData.code,
      status: this.mapStatus(parseInt(transactionData.status)),
      amount: parseFloat(transactionData.grossAmount),
      currency: 'BRL',
      paymentMethod: transactionData.paymentMethod?.type?.toString() || 'unknown',
      gatewayTransactionId: transactionData.code,
      paymentData: {
        paymentLink: transactionData.paymentLink,
        qrCode: transactionData.qrCode?.text,
        qrCodeBase64: transactionData.qrCode?.base64Image,
      },
      fees,
      netAmount: parseFloat(transactionData.netAmount || transactionData.grossAmount) - fees,
      createdAt: new Date(transactionData.date),
      expiresAt: transactionData.lastEventDate ? new Date(transactionData.lastEventDate) : undefined,
    };
  }
}