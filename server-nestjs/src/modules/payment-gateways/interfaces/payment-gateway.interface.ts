export interface PaymentGatewayConfig {
  gatewayType: 'mercadopago' | 'pagseguro' | 'cielo';
  environment: 'sandbox' | 'production';
  credentials: Record<string, any>;
  supportedMethods: string[];
  fees: Record<string, number>;
  isActive: boolean;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  customer: {
    email: string;
    name?: string;
    document?: string;
    phone?: string;
  };
  order: {
    id: string;
    items: Array<{
      id: string;
      title: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod: string;
  gatewayTransactionId?: string;
  paymentData?: Record<string, any>;
  fees?: number;
  netAmount?: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PaymentGateway {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  getPayment(transactionId: string): Promise<PaymentResponse>;
  refundPayment(transactionId: string, amount?: number): Promise<any>;
  verifyWebhook(payload: string, signature: string): boolean;
  mapStatus(gatewayStatus: any): string;
  calculateFees(amount: number, paymentMethod: string): number;
}

export interface PixPaymentData {
  qrCode: string;
  qrCodeBase64?: string;
  pixKey?: string;
  expirationDate: Date;
}

export interface CreditCardPaymentData {
  installments: number;
  cardBrand?: string;
  lastFourDigits?: string;
  authorizationCode?: string;
}

export interface BoletoPaymentData {
  boletoUrl: string;
  barcode: string;
  digitableLine: string;
  expirationDate: Date;
}