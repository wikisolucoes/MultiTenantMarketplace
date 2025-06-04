// Re-export types from shared schema
export type { Tenant, Product, User, Order } from "@shared/schema";

// Authentication types
export interface AuthResponse {
  user: User;
  token: string;
}

// Additional API types
export interface FinancialStats {
  availableBalance: string;
  pendingBalance: string;
  monthlyWithdrawals: string;
  dailyWithdrawals: string;
  grossSales: string;
  netRevenue: string;
}