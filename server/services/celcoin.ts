import crypto from "crypto";

export interface CelcoinAccount {
  accountId: string;
  status: "active" | "pending" | "suspended";
  balance: string;
}

export interface CelcoinTransaction {
  transactionId: string;
  amount: string;
  status: "pending" | "completed" | "failed";
  type: "payment" | "withdrawal";
}

export interface PaymentRequest {
  accountId: string;
  amount: string;
  paymentMethod: "pix" | "credit_card" | "boleto";
  customerData: {
    name: string;
    email: string;
    document: string;
  };
}

export interface WithdrawalRequest {
  accountId: string;
  amount: string;
  bankAccount: {
    bank: string;
    agency: string;
    account: string;
  };
}

class CelcoinService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CELCOIN_API_KEY || "mock-api-key";
    this.apiSecret = process.env.CELCOIN_API_SECRET || "mock-api-secret";
    this.baseUrl = process.env.CELCOIN_API_URL || "https://api.celcoin.com.br/v1";
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(data)
      .digest("hex");
  }

  private async makeRequest(endpoint: string, method: string = "GET", body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const timestamp = Date.now().toString();
    const bodyString = body ? JSON.stringify(body) : "";
    const signature = this.generateSignature(`${method}${endpoint}${timestamp}${bodyString}`);

    // Mock response for development
    if (this.apiKey === "mock-api-key") {
      return this.mockResponse(endpoint, method, body);
    }

    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "X-Signature": signature,
      "X-Timestamp": timestamp,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: bodyString || undefined,
    });

    if (!response.ok) {
      throw new Error(`Celcoin API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private mockResponse(endpoint: string, method: string, body?: any): any {
    // Mock responses for development
    if (endpoint === "/accounts" && method === "POST") {
      return {
        accountId: `CELCOIN_${Date.now()}`,
        status: "active",
        balance: "0.00",
      };
    }

    if (endpoint.includes("/accounts/") && endpoint.includes("/balance")) {
      return {
        accountId: endpoint.split("/")[2],
        balance: "3247.50",
        pendingBalance: "1582.30",
      };
    }

    if (endpoint === "/payments" && method === "POST") {
      return {
        transactionId: `TXN_${Date.now()}`,
        amount: body.amount,
        status: "pending",
        paymentUrl: `https://mock-payment.celcoin.com.br/${Date.now()}`,
        qrCode: body.paymentMethod === "pix" ? `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==` : undefined,
      };
    }

    if (endpoint === "/withdrawals" && method === "POST") {
      return {
        transactionId: `WTH_${Date.now()}`,
        amount: body.amount,
        status: "processing",
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    return {};
  }

  async createAccount(accountData: {
    document: string;
    fullName: string;
    email: string;
    phone: string;
    bankAccount: {
      bank: string;
      agency: string;
      account: string;
    };
  }): Promise<CelcoinAccount> {
    const response = await this.makeRequest("/accounts", "POST", accountData);
    return response;
  }

  async getAccountBalance(accountId: string): Promise<{ balance: string; pendingBalance: string }> {
    const response = await this.makeRequest(`/accounts/${accountId}/balance`);
    return response;
  }

  async createPayment(paymentData: PaymentRequest): Promise<{
    transactionId: string;
    paymentUrl: string;
    qrCode?: string;
    boletoUrl?: string;
  }> {
    const response = await this.makeRequest("/payments", "POST", paymentData);
    return response;
  }

  async processWithdrawal(withdrawalData: WithdrawalRequest): Promise<{
    transactionId: string;
    status: string;
    estimatedCompletion: string;
  }> {
    const response = await this.makeRequest("/withdrawals", "POST", withdrawalData);
    return response;
  }

  async getTransactionStatus(transactionId: string): Promise<{
    transactionId: string;
    status: string;
    amount: string;
    completedAt?: string;
  }> {
    const response = await this.makeRequest(`/transactions/${transactionId}`);
    return response;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  }
}

export const celcoinService = new CelcoinService();
