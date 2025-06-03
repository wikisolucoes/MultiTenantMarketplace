import { FinancialLedgerService, type LedgerContext, type FinancialOperation } from "./ledger";
import { celcoinService } from "./celcoin";
import { ReconciliationService } from "./reconciliation";
import { db } from "../db";
import { 
  celcoinTransactionLog, 
  type InsertCelcoinTransactionLog 
} from "@shared/schema";

export interface CelcoinCashInRequest {
  tenantId: number;
  amount: string;
  paymentMethod: "pix" | "credit_card" | "boleto";
  customerData: {
    name: string;
    email: string;
    document: string;
  };
  metadata?: Record<string, any>;
}

export interface CelcoinCashOutRequest {
  tenantId: number;
  amount: string;
  bankAccount: {
    bank: string;
    agency: string;
    account: string;
  };
  description?: string;
  metadata?: Record<string, any>;
}

export interface CelcoinOperationResult {
  success: boolean;
  transactionId: string;
  celcoinTransactionId?: string;
  ledgerEntryId?: number;
  amount: string;
  status: "pending" | "confirmed" | "failed";
  message?: string;
  errorCode?: string;
}

export class CelcoinIntegrationService {
  /**
   * Secure cash-in operation with full ledger integration
   */
  static async processCashIn(
    request: CelcoinCashInRequest,
    context: LedgerContext
  ): Promise<CelcoinOperationResult> {
    const transactionId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 1. Log the initial request
      await this.logCelcoinTransaction({
        tenantId: request.tenantId,
        externalTransactionId: transactionId,
        operationType: "payment",
        requestPayload: {
          amount: request.amount,
          paymentMethod: request.paymentMethod,
          customerData: request.customerData,
        },
        amount: request.amount,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // 2. Process payment with Celcoin
      const celcoinResult = await celcoinService.createPayment({
        accountId: await this.getCelcoinAccountId(request.tenantId),
        amount: request.amount,
        paymentMethod: request.paymentMethod,
        customerData: request.customerData,
      });

      // 3. Create ledger entry for cash-in
      const ledgerOperation: FinancialOperation = {
        type: "cash_in",
        amount: request.amount,
        description: `Cash-in via ${request.paymentMethod.toUpperCase()} - Customer: ${request.customerData.name}`,
        referenceId: transactionId,
        celcoinTransactionId: celcoinResult.transactionId,
        metadata: {
          paymentMethod: request.paymentMethod,
          customerData: request.customerData,
          celcoinData: celcoinResult,
          ...request.metadata,
        },
      };

      const ledgerEntry = await FinancialLedgerService.createSecureLedgerEntry(
        context,
        ledgerOperation
      );

      // 4. Update transaction log with success
      await this.updateCelcoinTransactionLog(transactionId, {
        responsePayload: celcoinResult,
        httpStatus: 200,
        celcoinStatus: celcoinResult.status,
        celcoinTransactionId: celcoinResult.transactionId,
        netAmount: request.amount,
        isSuccessful: true,
      });

      return {
        success: true,
        transactionId,
        celcoinTransactionId: celcoinResult.transactionId,
        ledgerEntryId: ledgerEntry.id,
        amount: request.amount,
        status: celcoinResult.status === "completed" ? "confirmed" : "pending",
        message: "Cash-in operation initiated successfully",
      };

    } catch (error) {
      // Log failure
      await this.updateCelcoinTransactionLog(transactionId, {
        responsePayload: { error: error instanceof Error ? error.message : "Unknown error" },
        httpStatus: 500,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        isSuccessful: false,
      });

      return {
        success: false,
        transactionId,
        amount: request.amount,
        status: "failed",
        message: error instanceof Error ? error.message : "Cash-in operation failed",
        errorCode: "CASH_IN_FAILED",
      };
    }
  }

  /**
   * Secure cash-out operation with full compliance checks
   */
  static async processCashOut(
    request: CelcoinCashOutRequest,
    context: LedgerContext
  ): Promise<CelcoinOperationResult> {
    const transactionId = `CO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 1. Validate sufficient balance
      const currentBalance = await FinancialLedgerService.getCurrentBalance(request.tenantId);
      if (parseFloat(currentBalance) < parseFloat(request.amount)) {
        throw new Error("Insufficient balance for cash-out operation");
      }

      // 2. Log the initial request
      await this.logCelcoinTransaction({
        tenantId: request.tenantId,
        externalTransactionId: transactionId,
        operationType: "withdrawal",
        requestPayload: {
          amount: request.amount,
          bankAccount: request.bankAccount,
          description: request.description,
        },
        amount: request.amount,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // 3. Create ledger entry for cash-out (debit)
      const ledgerOperation: FinancialOperation = {
        type: "cash_out",
        amount: request.amount,
        description: request.description || `Cash-out to ${request.bankAccount.bank} - Account: ${request.bankAccount.account}`,
        referenceId: transactionId,
        metadata: {
          bankAccount: request.bankAccount,
          ...request.metadata,
        },
      };

      const ledgerEntry = await FinancialLedgerService.createSecureLedgerEntry(
        context,
        ledgerOperation
      );

      // 4. Process withdrawal with Celcoin
      const celcoinResult = await celcoinService.processWithdrawal({
        accountId: await this.getCelcoinAccountId(request.tenantId),
        amount: request.amount,
        bankAccount: request.bankAccount,
      });

      // 5. Update ledger entry with Celcoin transaction ID
      await FinancialLedgerService.confirmLedgerEntry(
        ledgerEntry.id,
        celcoinResult.transactionId,
        { celcoinData: celcoinResult }
      );

      // 6. Update transaction log with success
      await this.updateCelcoinTransactionLog(transactionId, {
        responsePayload: celcoinResult,
        httpStatus: 200,
        celcoinStatus: celcoinResult.status,
        celcoinTransactionId: celcoinResult.transactionId,
        fee: celcoinResult.fee,
        netAmount: (parseFloat(request.amount) - parseFloat(celcoinResult.fee || "0")).toFixed(2),
        isSuccessful: true,
      });

      return {
        success: true,
        transactionId,
        celcoinTransactionId: celcoinResult.transactionId,
        ledgerEntryId: ledgerEntry.id,
        amount: request.amount,
        status: celcoinResult.status === "completed" ? "confirmed" : "pending",
        message: "Cash-out operation initiated successfully",
      };

    } catch (error) {
      // Log failure
      await this.updateCelcoinTransactionLog(transactionId, {
        responsePayload: { error: error instanceof Error ? error.message : "Unknown error" },
        httpStatus: 500,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        isSuccessful: false,
      });

      return {
        success: false,
        transactionId,
        amount: request.amount,
        status: "failed",
        message: error instanceof Error ? error.message : "Cash-out operation failed",
        errorCode: "CASH_OUT_FAILED",
      };
    }
  }

  /**
   * Handles Celcoin webhooks for transaction status updates
   */
  static async handleWebhook(
    tenantId: number,
    webhookData: any,
    signature?: string
  ): Promise<void> {
    try {
      // 1. Verify webhook signature
      if (signature && !celcoinService.verifyWebhookSignature(JSON.stringify(webhookData), signature)) {
        throw new Error("Invalid webhook signature");
      }

      // 2. Log webhook reception
      await this.logCelcoinTransaction({
        tenantId,
        externalTransactionId: webhookData.transactionId || "WEBHOOK",
        operationType: "webhook",
        requestPayload: webhookData,
        ipAddress: "celcoin",
        userAgent: "Celcoin Webhook",
      });

      // 3. Find corresponding ledger entry
      const ledgerEntries = await FinancialLedgerService.getLedgerEntries(tenantId, 100, 0);
      const matchingEntry = ledgerEntries.find(
        entry => entry.celcoinTransactionId === webhookData.transactionId
      );

      if (matchingEntry) {
        // 4. Update ledger entry status based on webhook
        if (webhookData.status === "completed") {
          await FinancialLedgerService.confirmLedgerEntry(
            matchingEntry.id,
            webhookData.transactionId,
            { webhookData }
          );
        } else if (webhookData.status === "failed") {
          // Handle failed transaction - potentially reverse the entry
          console.warn(`Transaction ${webhookData.transactionId} failed via webhook`);
        }
      }

      // 5. Update transaction log with webhook data
      await this.updateCelcoinTransactionLogByExternal(webhookData.transactionId, {
        webhookReceived: true,
        webhookTimestamp: new Date(),
        responsePayload: { webhook: webhookData },
      });

    } catch (error) {
      console.error("Webhook processing failed:", error);
      throw error;
    }
  }

  /**
   * Performs balance synchronization with Celcoin
   */
  static async syncBalance(tenantId: number): Promise<{
    systemBalance: string;
    celcoinBalance: string;
    isReconciled: boolean;
  }> {
    try {
      const systemBalance = await FinancialLedgerService.getCurrentBalance(tenantId);
      const celcoinAccountId = await this.getCelcoinAccountId(tenantId);
      const celcoinBalanceData = await celcoinService.getAccountBalance(celcoinAccountId);

      const difference = Math.abs(parseFloat(systemBalance) - parseFloat(celcoinBalanceData.balance));
      const isReconciled = difference < 0.01; // Less than 1 cent difference

      if (!isReconciled) {
        // Trigger reconciliation process
        await ReconciliationService.performDailyReconciliation(tenantId);
      }

      return {
        systemBalance,
        celcoinBalance: celcoinBalanceData.balance,
        isReconciled,
      };

    } catch (error) {
      console.error("Balance sync failed:", error);
      throw error;
    }
  }

  /**
   * Gets transaction status from Celcoin
   */
  static async getTransactionStatus(
    tenantId: number,
    celcoinTransactionId: string
  ): Promise<any> {
    try {
      const status = await celcoinService.getTransactionStatus(celcoinTransactionId);
      
      // Log status check
      await this.logCelcoinTransaction({
        tenantId,
        externalTransactionId: celcoinTransactionId,
        operationType: "balance_check",
        requestPayload: { transactionId: celcoinTransactionId },
        responsePayload: status,
        ipAddress: "system",
        userAgent: "Status Check",
        isSuccessful: true,
      });

      return status;
    } catch (error) {
      console.error("Status check failed:", error);
      throw error;
    }
  }

  /**
   * Helper: Get Celcoin account ID for tenant
   */
  private static async getCelcoinAccountId(tenantId: number): Promise<string> {
    const [celcoinAccount] = await db
      .select()
      .from(db.query.celcoinAccounts)
      .where(eq(db.query.celcoinAccounts.tenantId, tenantId))
      .limit(1);

    if (!celcoinAccount) {
      throw new Error(`Celcoin account not found for tenant ${tenantId}`);
    }

    return celcoinAccount.celcoinAccountId;
  }

  /**
   * Helper: Log Celcoin transaction
   */
  private static async logCelcoinTransaction(
    log: InsertCelcoinTransactionLog
  ): Promise<void> {
    await FinancialLedgerService.logCelcoinTransaction(log);
  }

  /**
   * Helper: Update existing transaction log
   */
  private static async updateCelcoinTransactionLog(
    externalTransactionId: string,
    updates: Partial<InsertCelcoinTransactionLog>
  ): Promise<void> {
    await db
      .update(celcoinTransactionLog)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(celcoinTransactionLog.externalTransactionId, externalTransactionId));
  }

  /**
   * Helper: Update transaction log by Celcoin transaction ID
   */
  private static async updateCelcoinTransactionLogByExternal(
    celcoinTransactionId: string,
    updates: Partial<InsertCelcoinTransactionLog>
  ): Promise<void> {
    await db
      .update(celcoinTransactionLog)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(celcoinTransactionLog.celcoinTransactionId, celcoinTransactionId));
  }
}