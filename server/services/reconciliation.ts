import { db } from "../db";
import { 
  reconciliationRecords,
  ledgerEntries,
  celcoinAccounts,
  celcoinTransactionLog,
  tenants,
  type InsertReconciliationRecord,
  type ReconciliationRecord
} from "@shared/schema";
import { eq, and, gte, lte, desc, sum } from "drizzle-orm";
import { celcoinService } from "./celcoin";
import { FinancialLedgerService } from "./ledger";

export interface ReconciliationDiscrepancy {
  type: "missing_transaction" | "amount_mismatch" | "status_mismatch" | "duplicate_transaction";
  systemTransactionId?: number;
  celcoinTransactionId?: string;
  expectedAmount?: string;
  actualAmount?: string;
  description: string;
}

export interface ReconciliationResult {
  record: ReconciliationRecord;
  discrepancies: ReconciliationDiscrepancy[];
  isReconciled: boolean;
  requiresManualReview: boolean;
}

export class ReconciliationService {
  /**
   * Performs daily reconciliation between system ledger and Celcoin account
   */
  static async performDailyReconciliation(tenantId: number): Promise<ReconciliationResult> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return await this.performReconciliation(tenantId, startDate, endDate, "daily");
  }

  /**
   * Performs reconciliation for a specific date range
   */
  static async performReconciliation(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    type: "daily" | "weekly" | "monthly" | "manual"
  ): Promise<ReconciliationResult> {
    const discrepancies: ReconciliationDiscrepancy[] = [];

    try {
      // 1. Get system balance and transactions
      const systemData = await this.getSystemFinancialData(tenantId, startDate, endDate);
      
      // 2. Get Celcoin account balance and transactions
      const celcoinData = await this.getCelcoinFinancialData(tenantId, startDate, endDate);
      
      // 3. Calculate differences
      const difference = (parseFloat(systemData.balance) - parseFloat(celcoinData.balance)).toFixed(2);
      
      // 4. Identify discrepancies
      await this.identifyDiscrepancies(systemData, celcoinData, discrepancies);
      
      // 5. Create reconciliation record
      const reconciliationData: InsertReconciliationRecord = {
        tenantId,
        reconciliationType: type,
        startDate,
        endDate,
        systemBalance: systemData.balance,
        celcoinBalance: celcoinData.balance,
        difference,
        transactionCount: systemData.transactionCount,
        discrepancies: discrepancies.length > 0 ? discrepancies : null,
        status: discrepancies.length === 0 ? "reconciled" : "discrepancy_found",
      };

      const [record] = await db.insert(reconciliationRecords).values(reconciliationData).returning();

      // 6. Auto-resolve minor discrepancies if possible
      const isAutoResolvable = await this.attemptAutoResolution(record.id, discrepancies);
      
      return {
        record,
        discrepancies,
        isReconciled: discrepancies.length === 0 || isAutoResolvable,
        requiresManualReview: discrepancies.length > 0 && !isAutoResolvable,
      };

    } catch (error) {
      // Create failed reconciliation record
      const [failedRecord] = await db.insert(reconciliationRecords).values({
        tenantId,
        reconciliationType: type,
        startDate,
        endDate,
        systemBalance: "0.00",
        celcoinBalance: "0.00",
        difference: "0.00",
        transactionCount: 0,
        status: "discrepancy_found",
        notes: `Reconciliation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }).returning();

      return {
        record: failedRecord,
        discrepancies: [{
          type: "missing_transaction",
          description: `Reconciliation process failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        }],
        isReconciled: false,
        requiresManualReview: true,
      };
    }
  }

  /**
   * Gets system financial data for reconciliation period
   */
  private static async getSystemFinancialData(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    balance: string;
    transactionCount: number;
    transactions: any[];
  }> {
    // Get current balance
    const currentBalance = await FinancialLedgerService.getCurrentBalance(tenantId);
    
    // Get transactions in period
    const transactions = await db
      .select()
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.tenantId, tenantId),
          gte(ledgerEntries.createdAt, startDate),
          lte(ledgerEntries.createdAt, endDate),
          eq(ledgerEntries.status, "confirmed")
        )
      )
      .orderBy(desc(ledgerEntries.createdAt));

    return {
      balance: currentBalance,
      transactionCount: transactions.length,
      transactions,
    };
  }

  /**
   * Gets Celcoin financial data for reconciliation period
   */
  private static async getCelcoinFinancialData(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    balance: string;
    transactions: any[];
  }> {
    // Get Celcoin account
    const [celcoinAccount] = await db
      .select()
      .from(celcoinAccounts)
      .where(eq(celcoinAccounts.tenantId, tenantId))
      .limit(1);

    if (!celcoinAccount) {
      throw new Error("Celcoin account not found for tenant");
    }

    // Get current balance from Celcoin
    const balanceData = await celcoinService.getAccountBalance(celcoinAccount.celcoinAccountId);
    
    // Get Celcoin transactions from our transaction log
    const transactions = await db
      .select()
      .from(celcoinTransactionLog)
      .where(
        and(
          eq(celcoinTransactionLog.tenantId, tenantId),
          gte(celcoinTransactionLog.createdAt, startDate),
          lte(celcoinTransactionLog.createdAt, endDate),
          eq(celcoinTransactionLog.isSuccessful, true)
        )
      );

    return {
      balance: balanceData.balance,
      transactions,
    };
  }

  /**
   * Identifies discrepancies between system and Celcoin data
   */
  private static async identifyDiscrepancies(
    systemData: any,
    celcoinData: any,
    discrepancies: ReconciliationDiscrepancy[]
  ): Promise<void> {
    const systemBalance = parseFloat(systemData.balance);
    const celcoinBalance = parseFloat(celcoinData.balance);
    const balanceDifference = Math.abs(systemBalance - celcoinBalance);

    // Check for significant balance discrepancies (> R$ 0.05)
    if (balanceDifference > 0.05) {
      discrepancies.push({
        type: "amount_mismatch",
        expectedAmount: systemData.balance,
        actualAmount: celcoinData.balance,
        description: `Balance mismatch: System shows ${systemData.balance}, Celcoin shows ${celcoinData.balance}`,
      });
    }

    // Check for missing transactions
    const systemTransactionIds = new Set(
      systemData.transactions
        .filter((t: any) => t.celcoinTransactionId)
        .map((t: any) => t.celcoinTransactionId)
    );

    const celcoinTransactionIds = new Set(
      celcoinData.transactions.map((t: any) => t.externalTransactionId)
    );

    // Find transactions in system but not in Celcoin
    for (const transaction of systemData.transactions) {
      if (transaction.celcoinTransactionId && !celcoinTransactionIds.has(transaction.celcoinTransactionId)) {
        discrepancies.push({
          type: "missing_transaction",
          systemTransactionId: transaction.id,
          celcoinTransactionId: transaction.celcoinTransactionId,
          description: `Transaction ${transaction.celcoinTransactionId} found in system but not in Celcoin records`,
        });
      }
    }

    // Find transactions in Celcoin but not in system
    for (const transaction of celcoinData.transactions) {
      if (!systemTransactionIds.has(transaction.externalTransactionId)) {
        discrepancies.push({
          type: "missing_transaction",
          celcoinTransactionId: transaction.externalTransactionId,
          description: `Transaction ${transaction.externalTransactionId} found in Celcoin but not in system records`,
        });
      }
    }

    // Check for amount mismatches in matching transactions
    for (const systemTx of systemData.transactions) {
      if (systemTx.celcoinTransactionId) {
        const celcoinTx = celcoinData.transactions.find(
          (t: any) => t.externalTransactionId === systemTx.celcoinTransactionId
        );
        
        if (celcoinTx) {
          const systemAmount = parseFloat(systemTx.amount);
          const celcoinAmount = parseFloat(celcoinTx.amount || "0");
          
          if (Math.abs(systemAmount - celcoinAmount) > 0.01) {
            discrepancies.push({
              type: "amount_mismatch",
              systemTransactionId: systemTx.id,
              celcoinTransactionId: systemTx.celcoinTransactionId,
              expectedAmount: systemTx.amount,
              actualAmount: celcoinTx.amount?.toString() || "0",
              description: `Amount mismatch for transaction ${systemTx.celcoinTransactionId}: System ${systemTx.amount}, Celcoin ${celcoinTx.amount}`,
            });
          }
        }
      }
    }
  }

  /**
   * Attempts to automatically resolve minor discrepancies
   */
  private static async attemptAutoResolution(
    reconciliationId: number,
    discrepancies: ReconciliationDiscrepancy[]
  ): Promise<boolean> {
    let resolvedCount = 0;

    for (const discrepancy of discrepancies) {
      try {
        switch (discrepancy.type) {
          case "amount_mismatch":
            // Auto-resolve if difference is less than R$ 0.10 (rounding differences)
            if (discrepancy.expectedAmount && discrepancy.actualAmount) {
              const diff = Math.abs(
                parseFloat(discrepancy.expectedAmount) - parseFloat(discrepancy.actualAmount)
              );
              if (diff <= 0.10) {
                resolvedCount++;
              }
            }
            break;
            
          case "missing_transaction":
            // Could implement auto-retry logic for recent transactions
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error("Error in auto-resolution:", error);
      }
    }

    // If all discrepancies were auto-resolved, mark reconciliation as resolved
    if (resolvedCount === discrepancies.length && discrepancies.length > 0) {
      await db
        .update(reconciliationRecords)
        .set({
          status: "resolved",
          resolvedAt: new Date(),
          notes: "Auto-resolved minor discrepancies (rounding differences)",
          updatedAt: new Date(),
        })
        .where(eq(reconciliationRecords.id, reconciliationId));
      
      return true;
    }

    return false;
  }

  /**
   * Manually resolves a reconciliation discrepancy
   */
  static async resolveReconciliation(
    reconciliationId: number,
    resolvedBy: number,
    notes: string
  ): Promise<ReconciliationRecord> {
    const [updated] = await db
      .update(reconciliationRecords)
      .set({
        status: "resolved",
        resolvedBy,
        resolvedAt: new Date(),
        notes,
        updatedAt: new Date(),
      })
      .where(eq(reconciliationRecords.id, reconciliationId))
      .returning();

    if (!updated) {
      throw new Error(`Reconciliation record ${reconciliationId} not found`);
    }

    return updated;
  }

  /**
   * Gets reconciliation history for a tenant
   */
  static async getReconciliationHistory(
    tenantId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ReconciliationRecord[]> {
    return await db
      .select()
      .from(reconciliationRecords)
      .where(eq(reconciliationRecords.tenantId, tenantId))
      .orderBy(desc(reconciliationRecords.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Gets pending reconciliations that require manual review
   */
  static async getPendingReconciliations(): Promise<ReconciliationRecord[]> {
    return await db
      .select()
      .from(reconciliationRecords)
      .where(eq(reconciliationRecords.status, "discrepancy_found"))
      .orderBy(desc(reconciliationRecords.createdAt));
  }

  /**
   * Schedules automated daily reconciliation
   */
  static async scheduleAutomatedReconciliation(): Promise<void> {
    // This would typically integrate with a job scheduler
    // For now, we'll implement a simple daily check
    const allTenants = await db.query.tenants.findMany();
    
    for (const tenant of allTenants) {
      try {
        const result = await this.performDailyReconciliation(tenant.id);
        
        if (result.requiresManualReview) {
          console.warn(`Tenant ${tenant.id} requires manual reconciliation review`);
          // Could send alerts/notifications here
        }
      } catch (error) {
        console.error(`Daily reconciliation failed for tenant ${tenant.id}:`, error);
      }
    }
  }
}