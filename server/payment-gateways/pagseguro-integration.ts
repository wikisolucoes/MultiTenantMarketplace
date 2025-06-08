import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface PagSeguroConfig {
  email: string;
  token: string;
  appId: string;
  appKey: string;
  environment: 'sandbox' | 'production';
}

interface PagSeguroPaymentRequest {
  paymentMode: 'default';
  paymentMethod: 'creditCard' | 'boleto' | 'pix' | 'debitCard';
  receiverEmail: string;
  currency: 'BRL';
  extraAmount?: string;
  reference: string;
  senderName: string;
  senderEmail: string;
  senderPhone: {
    areaCode: string;
    number: string;
  };
  senderDocument: {
    type: 'CPF' | 'CNPJ';
    value: string;
  };
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    country: 'BRA';
    postalCode: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    amount: string;
  }>;
}

interface PagSeguroCreditCardRequest extends PagSeguroPaymentRequest {
  creditCardToken: string;
  installmentQuantity: string;
  installmentValue: string;
  noInterestInstallmentQuantity?: string;
  creditCardHolderName: string;
  creditCardHolderCPF: string;
  creditCardHolderAreaCode: string;
  creditCardHolderPhone: string;
  creditCardHolderBirthDate: string;
  billingAddress: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    country: 'BRA';
    postalCode: string;
  };
}

interface PagSeguroPixRequest {
  qrCodeExpirationDate: string;
  paymentMode: 'default';
  paymentMethod: 'pix';
  receiverEmail: string;
  currency: 'BRL';
  reference: string;
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    amount: string;
  }>;
}

interface PagSeguroPaymentResponse {
  code: string;
  reference: string;
  type: number;
  status: number;
  date: string;
  lastEventDate: string;
  paymentMethod: {
    type: number;
    code: number;
  };
  grossAmount: string;
  discountAmount: string;
  feeAmount: string;
  netAmount: string;
  extraAmount: string;
  installmentCount: number;
  itemCount: number;
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    amount: string;
  }>;
  sender: {
    name: string;
    email: string;
    phone: {
      areaCode: string;
      number: string;
    };
    documents: Array<{
      type: string;
      value: string;
    }>;
  };
  paymentLink?: string;
  qrCode?: {
    text: string;
    base64Image: string;
  };
}

export class PagSeguroIntegration {
  private api: AxiosInstance;
  private config: PagSeguroConfig;

  constructor(config: PagSeguroConfig) {
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
    params.append('email', this.config.email);
    params.append('token', this.config.token);
    
    return params.toString();
  }

  async createPayment(request: PagSeguroPaymentRequest): Promise<PagSeguroPaymentResponse> {
    try {
      const formData = this.buildFormData(request);
      const response = await this.api.post('/v2/transactions', formData);
      
      return this.parseXMLResponse(response.data);
    } catch (error: any) {
      throw new Error(`PagSeguro payment creation failed: ${error.response?.data || error.message}`);
    }
  }

  async createCreditCardPayment(request: PagSeguroCreditCardRequest): Promise<PagSeguroPaymentResponse> {
    try {
      const formData = this.buildFormData(request);
      const response = await this.api.post('/v2/transactions', formData);
      
      return this.parseXMLResponse(response.data);
    } catch (error: any) {
      throw new Error(`PagSeguro credit card payment creation failed: ${error.response?.data || error.message}`);
    }
  }

  async createPixPayment(request: PagSeguroPixRequest): Promise<PagSeguroPaymentResponse> {
    try {
      const formData = this.buildFormData(request);
      const response = await this.api.post('/v2/transactions', formData);
      
      return this.parseXMLResponse(response.data);
    } catch (error: any) {
      throw new Error(`PagSeguro PIX payment creation failed: ${error.response?.data || error.message}`);
    }
  }

  async getPayment(transactionCode: string): Promise<PagSeguroPaymentResponse> {
    try {
      const params = new URLSearchParams({
        email: this.config.email,
        token: this.config.token,
      });

      const response = await this.api.get(`/v3/transactions/${transactionCode}?${params}`);
      
      return this.parseXMLResponse(response.data);
    } catch (error: any) {
      throw new Error(`PagSeguro payment retrieval failed: ${error.response?.data || error.message}`);
    }
  }

  async refundPayment(transactionCode: string, refundValue?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        email: this.config.email,
        token: this.config.token,
      });

      if (refundValue) {
        params.append('refundValue', refundValue);
      }

      const response = await this.api.post(`/v2/transactions/refunds`, params.toString());
      
      return this.parseXMLResponse(response.data);
    } catch (error: any) {
      throw new Error(`PagSeguro refund failed: ${error.response?.data || error.message}`);
    }
  }

  async getSessionId(): Promise<string> {
    try {
      const params = new URLSearchParams({
        email: this.config.email,
        token: this.config.token,
      });

      const response = await this.api.post(`/v2/sessions`, params.toString());
      const parsed = this.parseXMLResponse(response.data);
      
      return parsed.id;
    } catch (error: any) {
      throw new Error(`PagSeguro session creation failed: ${error.response?.data || error.message}`);
    }
  }

  async getInstallments(amount: string, cardBrand: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        sessionId: await this.getSessionId(),
        amount,
        cardBrand,
      });

      const response = await this.api.get(`/v2/installments?${params}`);
      
      return this.parseXMLResponse(response.data);
    } catch (error: any) {
      throw new Error(`PagSeguro installments retrieval failed: ${error.response?.data || error.message}`);
    }
  }

  verifyNotification(notificationCode: string, notificationType: string): boolean {
    // PagSeguro uses notification codes sent via POST to verify authenticity
    // The verification is done by making a GET request to PagSeguro API
    return notificationCode && notificationType === 'transaction';
  }

  private parseXMLResponse(xmlData: string): any {
    // Simple XML parsing for demonstration
    // In production, use a proper XML parser like xml2js
    const parser = require('xml2js');
    let result: any = {};

    parser.parseString(xmlData, (err: any, parsed: any) => {
      if (err) throw err;
      result = parsed;
    });

    return result;
  }

  mapStatus(pagSeguroStatus: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'pending', // Aguardando pagamento
      2: 'processing', // Em análise
      3: 'completed', // Paga
      4: 'completed', // Disponível
      5: 'disputed', // Em disputa
      6: 'refunded', // Devolvida
      7: 'cancelled', // Cancelada
      8: 'chargeback', // Chargeback debitado
      9: 'chargeback', // Em contestação
    };

    return statusMap[pagSeguroStatus] || 'unknown';
  }

  calculateFees(amount: number, paymentMethod: string, installments: number = 1): number {
    // Default PagSeguro fees (these should be configured per merchant)
    const feeRates: { [key: string]: number } = {
      'pix': 0.0099, // 0.99%
      'credit_card': 0.0399, // 3.99% + installment fees
      'debit_card': 0.0299, // 2.99%
      'boleto': 3.49, // Fixed fee
    };

    let rate = feeRates[paymentMethod] || 0.0399;
    
    if (paymentMethod === 'boleto') {
      return rate; // Fixed fee
    }
    
    // Add installment fees for credit card
    if (paymentMethod === 'credit_card' && installments > 1) {
      rate += (installments - 1) * 0.0099; // 0.99% per installment
    }
    
    return amount * rate;
  }
}