// Re-export types from shared schema
export type { Tenant, Product, User, Order, Withdrawal } from "@shared/schema";

// Additional API types
export interface FinancialStats {
  availableBalance: string;
  pendingBalance: string;
  monthlyWithdrawals: string;
  dailyWithdrawals: string;
  grossSales: string;
  netRevenue: string;
}