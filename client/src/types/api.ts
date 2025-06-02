export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  tenantId?: number;
}

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  tenant?: Tenant;
}

export interface FinancialStats {
  availableBalance: string;
  pendingBalance: string;
  monthlyWithdrawals: string;
  dailyWithdrawals: string;
  grossSales: string;
  netRevenue: string;
}

export interface AdminStats {
  totalStores: number;
  transactionVolume: string;
  platformRevenue: string;
  activeStores: number;
}

export interface Product {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  tenantId: number;
  customerName: string;
  customerEmail: string;
  total: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  celcoinTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: number;
  tenantId: number;
  amount: string;
  fee: string;
  netAmount: string;
  bankAccountId: number;
  status: string;
  celcoinTransactionId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: number;
  userId: number;
  bank: string;
  agency: string;
  account: string;
  accountType: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  name?: string;
  status?: string;
}

export interface TenantRegistrationData {
  storeName: string;
  subdomain: string;
  category: string;
  fullName: string;
  document: string;
  documentType: "cpf" | "cnpj";
  email: string;
  phone: string;
  password: string;
  bank: string;
  agency: string;
  account: string;
}
