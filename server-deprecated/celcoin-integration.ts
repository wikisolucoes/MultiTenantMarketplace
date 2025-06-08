import axios, { AxiosInstance } from 'axios';

interface CelcoinConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

interface CelcoinTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CelcoinPixPaymentRequest {
  merchant: {
    postalCode: string;
    city: string;
    merchantCategoryCode: string;
    name: string;
  };
  amount: number;
  correlationID: string;
  expiresDate?: string;
  payer?: {
    name?: string;
    email?: string;
    cpf?: string;
  };
}

interface CelcoinPixPaymentResponse {
  transactionId: string;
  emvqrcps: string;
  pixCopiaECola: string;
  expirationDate: string;
  status: string;
}

interface CelcoinBoletoRequest {
  merchant: {
    postalCode: string;
    city: string;
    merchantCategoryCode: string;
    name: string;
  };
  amount: number;
  correlationID: string;
  expiresDate: string;
  payer: {
    name: string;
    email: string;
    cpf: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
}

interface CelcoinBoletoResponse {
  transactionId: string;
  digitableLine: string;
  barCode: string;
  pdf: string;
  expirationDate: string;
  status: string;
}

interface CelcoinAccountBalance {
  available: number;
  blocked: number;
  total: number;
}

interface CelcoinTransaction {
  id: string;
  correlationId: string;
  amount: number;
  type: 'pix' | 'boleto' | 'ted' | 'deposit' | 'withdrawal';
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
  description: string;
}

export class CelcoinIntegration {
  private api: AxiosInstance;
  private config: CelcoinConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.config = {
      apiUrl: process.env.CELCOIN_API_URL || 'https://sandbox.openfinance.celcoin.dev/v5',
      clientId: process.env.CELCOIN_CLIENT_ID || '',
      clientSecret: process.env.CELCOIN_CLIENT_SECRET || '',
      environment: (process.env.CELCOIN_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };

    this.api = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor to automatically add auth token
    this.api.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || new Date() >= this.tokenExpiresAt) {
      await this.authenticate();
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.apiUrl}/token`, {
        client_id: this.config.clientId,
        grant_type: 'client_credentials',
        client_secret: this.config.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const tokenData: CelcoinTokenResponse = response.data;
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    } catch (error: any) {
      console.error('Celcoin authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Celcoin API');
    }
  }

  // PIX Payment Methods
  async createPixPayment(request: CelcoinPixPaymentRequest): Promise<CelcoinPixPaymentResponse> {
    try {
      const response = await this.api.post('/pix/payment', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating PIX payment:', error.response?.data || error.message);
      throw new Error('Failed to create PIX payment');
    }
  }

  async getPixPaymentStatus(transactionId: string): Promise<any> {
    try {
      const response = await this.api.get(`/pix/payment/${transactionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting PIX payment status:', error.response?.data || error.message);
      throw new Error('Failed to get PIX payment status');
    }
  }

  // Boleto Payment Methods
  async createBoleto(request: CelcoinBoletoRequest): Promise<CelcoinBoletoResponse> {
    try {
      const response = await this.api.post('/boleto/payment', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating boleto:', error.response?.data || error.message);
      throw new Error('Failed to create boleto');
    }
  }

  async getBoletoStatus(transactionId: string): Promise<any> {
    try {
      const response = await this.api.get(`/boleto/payment/${transactionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting boleto status:', error.response?.data || error.message);
      throw new Error('Failed to get boleto status');
    }
  }

  // Account and Balance Management
  async getAccountBalance(): Promise<CelcoinAccountBalance> {
    try {
      const response = await this.api.get('/account/balance');
      return response.data;
    } catch (error: any) {
      console.error('Error getting account balance:', error.response?.data || error.message);
      throw new Error('Failed to get account balance');
    }
  }

  async getAccountStatement(startDate: string, endDate: string): Promise<CelcoinTransaction[]> {
    try {
      const response = await this.api.get('/account/statement', {
        params: {
          startDate,
          endDate
        }
      });
      return response.data.transactions || [];
    } catch (error: any) {
      console.error('Error getting account statement:', error.response?.data || error.message);
      throw new Error('Failed to get account statement');
    }
  }

  // Withdrawal Methods
  async createWithdrawal(amount: number, bankAccount: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'checking' | 'savings';
    accountHolder: {
      name: string;
      document: string;
    };
  }): Promise<any> {
    try {
      const response = await this.api.post('/account/withdrawal', {
        amount,
        bankAccount
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating withdrawal:', error.response?.data || error.message);
      throw new Error('Failed to create withdrawal');
    }
  }

  async getWithdrawalStatus(withdrawalId: string): Promise<any> {
    try {
      const response = await this.api.get(`/account/withdrawal/${withdrawalId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting withdrawal status:', error.response?.data || error.message);
      throw new Error('Failed to get withdrawal status');
    }
  }

  // Webhook signature validation
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Utility methods
  formatPixKey(pixKey: string): string {
    // Remove special characters and spaces
    return pixKey.replace(/[^a-zA-Z0-9@.-]/g, '');
  }

  validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit === 10 || digit === 11) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit === 10 || digit === 11) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cnpj.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cnpj.charAt(13))) return false;

    return true;
  }
}

// Export singleton instance
export const celcoinApi = new CelcoinIntegration();