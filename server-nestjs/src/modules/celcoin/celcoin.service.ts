import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { CreateBoletoDto } from './dto/create-boleto.dto';

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

export interface CelcoinPixPaymentResponse {
  transactionId: string;
  emvqrcps: string;
  pixCopiaECola: string;
  expirationDate: string;
  status: string;
}

export interface CelcoinBoletoResponse {
  transactionId: string;
  digitableLine: string;
  barCode: string;
  pdf: string;
  expirationDate: string;
  status: string;
}

export interface CelcoinAccountBalance {
  available: number;
  blocked: number;
  total: number;
}

export interface CelcoinTransaction {
  id: string;
  correlationId: string;
  amount: number;
  type: 'pix' | 'boleto' | 'ted' | 'deposit' | 'withdrawal';
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
  description: string;
}

@Injectable()
export class CelcoinService {
  private readonly logger = new Logger(CelcoinService.name);
  private api: AxiosInstance;
  private config: CelcoinConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(private configService: ConfigService) {
    this.config = {
      apiUrl: this.configService.get<string>('CELCOIN_API_URL') || 'https://sandbox.openfinance.celcoin.dev',
      clientId: this.configService.get<string>('CELCOIN_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('CELCOIN_CLIENT_SECRET') || '',
      environment: this.configService.get<string>('CELCOIN_ENVIRONMENT') as 'sandbox' | 'production' || 'sandbox'
    };

    this.api = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
    });
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || new Date() >= this.tokenExpiresAt) {
      await this.authenticate();
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await this.api.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      });

      const tokenData: CelcoinTokenResponse = response.data;
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in - 60) * 1000);

      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
      
      this.logger.log('Celcoin authentication successful');
    } catch (error) {
      this.logger.error('Celcoin authentication failed', error);
      throw new Error('Failed to authenticate with Celcoin API');
    }
  }

  async createPixPayment(request: CreatePixPaymentDto): Promise<CelcoinPixPaymentResponse> {
    await this.ensureValidToken();

    try {
      const response = await this.api.post('/pix/payment', request);
      this.logger.log(`PIX payment created: ${response.data.transactionId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create PIX payment', error);
      throw new Error('Failed to create PIX payment');
    }
  }

  async getPixPaymentStatus(transactionId: string): Promise<any> {
    await this.ensureValidToken();

    try {
      const response = await this.api.get(`/pix/payment/${transactionId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get PIX payment status for ${transactionId}`, error);
      throw new Error('Failed to get PIX payment status');
    }
  }

  async createBoleto(request: CreateBoletoDto): Promise<CelcoinBoletoResponse> {
    await this.ensureValidToken();

    try {
      const response = await this.api.post('/boleto/payment', request);
      this.logger.log(`Boleto created: ${response.data.transactionId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create boleto', error);
      throw new Error('Failed to create boleto');
    }
  }

  async getBoletoStatus(transactionId: string): Promise<any> {
    await this.ensureValidToken();

    try {
      const response = await this.api.get(`/boleto/payment/${transactionId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get boleto status for ${transactionId}`, error);
      throw new Error('Failed to get boleto status');
    }
  }

  async getAccountBalance(): Promise<CelcoinAccountBalance> {
    await this.ensureValidToken();

    try {
      const response = await this.api.get('/account/balance');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get account balance', error);
      throw new Error('Failed to get account balance');
    }
  }

  async getAccountStatement(startDate: string, endDate: string): Promise<CelcoinTransaction[]> {
    await this.ensureValidToken();

    try {
      const response = await this.api.get('/account/statement', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get account statement', error);
      throw new Error('Failed to get account statement');
    }
  }

  async createWithdrawal(amount: number, bankAccount: {
    bank: string;
    agency: string;
    account: string;
    accountDigit: string;
    document: string;
    name: string;
  }): Promise<any> {
    await this.ensureValidToken();

    try {
      const response = await this.api.post('/withdrawal', {
        amount,
        bankAccount
      });
      this.logger.log(`Withdrawal created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create withdrawal', error);
      throw new Error('Failed to create withdrawal');
    }
  }

  async getWithdrawalStatus(withdrawalId: string): Promise<any> {
    await this.ensureValidToken();

    try {
      const response = await this.api.get(`/withdrawal/${withdrawalId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get withdrawal status for ${withdrawalId}`, error);
      throw new Error('Failed to get withdrawal status');
    }
  }

  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  formatPixKey(pixKey: string): string {
    // Remove special characters and format PIX key
    return pixKey.replace(/[^\w@.-]/g, '');
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
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
  }

  validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  }
}