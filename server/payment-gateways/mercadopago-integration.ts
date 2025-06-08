import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
}

interface MercadoPagoPaymentRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  token?: string; // For card payments
  installments?: number;
  external_reference: string;
  notification_url?: string;
  metadata?: any;
}

interface MercadoPagoPixRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: 'pix';
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  external_reference: string;
  notification_url?: string;
}

interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved: string;
  external_reference: string;
  payment_method_id: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code_base64?: string;
      qr_code?: string;
      ticket_url?: string;
    };
  };
  fee_details?: Array<{
    type: string;
    amount: number;
  }>;
}

export class MercadoPagoIntegration {
  private api: AxiosInstance;
  private config: MercadoPagoConfig;

  constructor(config: MercadoPagoConfig) {
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://api.mercadopago.com'
      : 'https://api.mercadopago.com'; // Same URL, sandbox is determined by credentials

    this.api = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': this.generateIdempotencyKey(),
      },
    });
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  async createPayment(request: MercadoPagoPaymentRequest): Promise<MercadoPagoPaymentResponse> {
    try {
      const response = await this.api.post('/v1/payments', request);
      return response.data;
    } catch (error: any) {
      throw new Error(`MercadoPago payment creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async createPixPayment(request: MercadoPagoPixRequest): Promise<MercadoPagoPaymentResponse> {
    try {
      const response = await this.api.post('/v1/payments', request);
      return response.data;
    } catch (error: any) {
      throw new Error(`MercadoPago PIX payment creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
    try {
      const response = await this.api.get(`/v1/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`MercadoPago payment retrieval failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundData = amount ? { amount } : {};
      const response = await this.api.post(`/v1/payments/${paymentId}/refunds`, refundData);
      return response.data;
    } catch (error: any) {
      throw new Error(`MercadoPago refund failed: ${error.response?.data?.message || error.message}`);
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
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
      'authorized': 'authorized',
      'in_process': 'processing',
      'in_mediation': 'disputed',
      'rejected': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'chargeback',
    };

    return statusMap[mercadoPagoStatus] || 'unknown';
  }

  calculateFees(amount: number, paymentMethod: string): number {
    // Default MercadoPago fees (these should be configured per merchant)
    const feeRates: { [key: string]: number } = {
      'pix': 0.0099, // 0.99%
      'credit_card': 0.0499, // 4.99%
      'debit_card': 0.0299, // 2.99%
      'boleto': 3.49, // Fixed fee
    };

    const rate = feeRates[paymentMethod] || 0.0499;
    
    if (paymentMethod === 'boleto') {
      return rate; // Fixed fee
    }
    
    return amount * rate;
  }

  async createPreference(items: any[], backUrls?: any): Promise<any> {
    try {
      const preference = {
        items,
        back_urls: backUrls,
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12,
        },
      };

      const response = await this.api.post('/checkout/preferences', preference);
      return response.data;
    } catch (error: any) {
      throw new Error(`MercadoPago preference creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getInstallments(amount: number, paymentMethodId: string): Promise<any> {
    try {
      const response = await this.api.get('/v1/payment_methods/installments', {
        params: {
          amount,
          payment_method_id: paymentMethodId,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`MercadoPago installments retrieval failed: ${error.response?.data?.message || error.message}`);
    }
  }
}