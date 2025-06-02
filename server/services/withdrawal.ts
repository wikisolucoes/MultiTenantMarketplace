import { storage } from "../storage";
import { celcoinService } from "./celcoin";
import { ValidationService } from "./validation";

export class WithdrawalService {
  private static readonly DAILY_LIMIT = 10000; // R$ 10,000
  private static readonly WITHDRAWAL_FEE = 2.50; // R$ 2.50

  static async validateWithdrawal(tenantId: number, amount: number): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Check minimum amount
    if (amount < 10) {
      return { valid: false, error: "Valor mínimo para saque é R$ 10,00" };
    }

    // Check available balance
    const financialStats = await storage.getTenantFinancialStats(tenantId);
    const availableBalance = parseFloat(financialStats.availableBalance);
    
    if (amount > availableBalance) {
      return { valid: false, error: "Saldo insuficiente" };
    }

    // Check daily limit
    const dailyWithdrawals = parseFloat(financialStats.dailyWithdrawals);
    if (dailyWithdrawals + amount > this.DAILY_LIMIT) {
      const remaining = this.DAILY_LIMIT - dailyWithdrawals;
      return { 
        valid: false, 
        error: `Limite diário excedido. Disponível hoje: R$ ${remaining.toFixed(2)}` 
      };
    }

    return { valid: true };
  }

  static async processWithdrawal(
    tenantId: number, 
    amount: number, 
    bankAccountId: number
  ): Promise<{
    success: boolean;
    withdrawalId?: number;
    error?: string;
  }> {
    try {
      // Validate withdrawal
      const validation = await this.validateWithdrawal(tenantId, amount);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Get bank account details
      const bankAccounts = await storage.getBankAccountsByUserId(tenantId);
      const bankAccount = bankAccounts.find(ba => ba.id === bankAccountId);
      
      if (!bankAccount) {
        return { success: false, error: "Conta bancária não encontrada" };
      }

      // Get Celcoin account
      const celcoinAccount = await storage.getCelcoinAccountByTenantId(tenantId);
      if (!celcoinAccount) {
        return { success: false, error: "Conta Celcoin não encontrada" };
      }

      // Calculate net amount
      const fee = this.WITHDRAWAL_FEE;
      const netAmount = amount - fee;

      // Create withdrawal record
      const withdrawal = await storage.createWithdrawal({
        tenantId,
        amount: amount.toString(),
        fee: fee.toString(),
        netAmount: netAmount.toString(),
        bankAccountId,
        status: "pending",
      });

      // Process withdrawal with Celcoin
      try {
        const celcoinResponse = await celcoinService.processWithdrawal({
          accountId: celcoinAccount.celcoinAccountId,
          amount: netAmount.toString(),
          bankAccount: {
            bank: bankAccount.bank,
            agency: bankAccount.agency,
            account: bankAccount.account,
          },
        });

        // Update withdrawal with Celcoin transaction ID
        await storage.updateWithdrawalStatus(
          withdrawal.id,
          "processing",
          celcoinResponse.transactionId
        );

        // Update Celcoin account balance
        const currentBalance = parseFloat(celcoinAccount.balance);
        const newBalance = (currentBalance - amount).toFixed(2);
        await storage.updateCelcoinBalance(tenantId, newBalance);

        return { success: true, withdrawalId: withdrawal.id };

      } catch (celcoinError) {
        // Update withdrawal status to failed
        await storage.updateWithdrawalStatus(
          withdrawal.id,
          "failed",
          undefined,
          (celcoinError as Error).message
        );

        return { 
          success: false, 
          error: "Erro ao processar saque. Tente novamente." 
        };
      }

    } catch (error) {
      console.error("Withdrawal processing error:", error);
      return { 
        success: false, 
        error: "Erro interno. Tente novamente." 
      };
    }
  }

  static async handleWebhookUpdate(
    transactionId: string, 
    status: "completed" | "failed",
    errorMessage?: string
  ): Promise<void> {
    try {
      // Find withdrawal by Celcoin transaction ID
      // This would require adding a method to storage to find by celcoinTransactionId
      // For now, we'll log the webhook
      console.log("Withdrawal webhook received:", {
        transactionId,
        status,
        errorMessage,
      });

      // In production, update the withdrawal status based on the webhook
      // await storage.updateWithdrawalStatusByTransactionId(transactionId, status, errorMessage);

    } catch (error) {
      console.error("Error handling withdrawal webhook:", error);
    }
  }

  static calculateFee(amount: number): number {
    return this.WITHDRAWAL_FEE;
  }

  static calculateNetAmount(amount: number): number {
    return amount - this.calculateFee(amount);
  }
}
