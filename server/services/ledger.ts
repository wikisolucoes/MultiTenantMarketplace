import { db } from "../db";
import { 
  ledgerEntries, 
  balanceSnapshots, 
  celcoinTransactionLog, 
  securityAuditLog,
  celcoinAccounts,
  type InsertLedgerEntry,
  type InsertBalanceSnapshot,
  type InsertCelcoinTransactionLog,
  type InsertSecurityAuditLog,
  type LedgerEntry,
  type BalanceSnapshot
} from "@shared/schema";
import { eq, desc, and, gte, lte, sum, sql } from "drizzle-orm";
import { celcoinService } from "./celcoin";

export interface LedgerContext {
  tenantId: number;
  userId?: number;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  orderId?: number;
  withdrawalId?: number;
}

export interface FinancialOperation {
  type: "sale" | "withdrawal" | "fee" | "refund" | "chargeback" | "adjustment" | "cash_in" | "cash_out";
  amount: string; // Decimal string for precision
  description: string;
  referenceId?: string;
  celcoinTransactionId?: string;
  metadata?: Record<string, any>;
}

export class FinancialLedgerService {
  /**
   * Creates a secure ledger entry with double-entry bookkeeping
   * All financial operations must go through this method for auditability
   */
  static async createSecureLedgerEntry(
    context: LedgerContext,
    operation: FinancialOperation
  ): Promise<LedgerEntry> {
    return await db.transaction(async (tx) => {
      try {
        // 1. Get current balance with row-level locking
        const currentBalance = await this.getCurrentBalanceWithLock(tx, context.tenantId);
        
        // 2. Calculate new balance based on operation type
        const { entryType, newBalance } = this.calculateNewBalance(currentBalance, operation);
        
        // 3. Validate operation constraints
        await this.validateOperation(context, operation, currentBalance);
        
        // 4. Create ledger entry
        const [ledgerEntry] = await tx.insert(ledgerEntries).values({
          tenantId: context.tenantId,
          entryType,
          transactionType: operation.type,
          amount: operation.amount,
          runningBalance: newBalance,
          referenceId: operation.referenceId,
          orderId: context.orderId,
          withdrawalId: context.withdrawalId,
          celcoinTransactionId: operation.celcoinTransactionId,
          description: operation.description,
          status: "pending",
          metadata: operation.metadata,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          sessionId: context.sessionId,
        }).returning();
        
        // 5. Create security audit log
        await this.createSecurityAudit(tx, {
          tenantId: context.tenantId,
          userId: context.userId,
          action: "ledger_entry_created",
          resource: "ledger_entry",
          resourceId: ledgerEntry.id.toString(),
          newValues: {
            amount: operation.amount,
            type: operation.type,
            balance: newBalance
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          sessionId: context.sessionId,
          success: true,
        });
        
        // 6. Create balance snapshot for transaction-level tracking
        await this.createBalanceSnapshot(tx, context.tenantId, newBalance, ledgerEntry.id, "transaction");
        
        return ledgerEntry;
      } catch (error) {
        // Security audit for failed operations
        await this.createSecurityAudit(tx, {
          tenantId: context.tenantId,
          userId: context.userId,
          action: "ledger_entry_failed",
          resource: "ledger_entry",
          newValues: {
            amount: operation.amount,
            type: operation.type,
            error: error instanceof Error ? error.message : "Unknown error"
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          sessionId: context.sessionId,
          success: false,
          failureReason: error instanceof Error ? error.message : "Unknown error",
          riskScore: this.calculateRiskScore(context, operation),
        });
        throw error;
      }
    });
  }

  /**
   * Confirms a pending ledger entry after external validation (e.g., Celcoin webhook)
   */
  static async confirmLedgerEntry(
    ledgerEntryId: number,
    celcoinTransactionId?: string,
    metadata?: Record<string, any>
  ): Promise<LedgerEntry> {
    return await db.transaction(async (tx) => {
      const [updatedEntry] = await tx
        .update(ledgerEntries)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          celcoinTransactionId,
          metadata: metadata ? sql`${ledgerEntries.metadata} || ${metadata}` : ledgerEntries.metadata,
        })
        .where(eq(ledgerEntries.id, ledgerEntryId))
        .returning();

      if (!updatedEntry) {
        throw new Error(`Ledger entry ${ledgerEntryId} not found`);
      }

      // Update Celcoin account balance if this was a cash operation
      if (updatedEntry.transactionType === "cash_in" || updatedEntry.transactionType === "cash_out") {
        await this.syncCelcoinBalance(updatedEntry.tenantId);
      }

      return updatedEntry;
    });
  }

  /**
   * Reverses a ledger entry with full audit trail
   */
  static async reverseLedgerEntry(
    context: LedgerContext,
    ledgerEntryId: number,
    reason: string
  ): Promise<LedgerEntry> {
    return await db.transaction(async (tx) => {
      // Get original entry
      const [originalEntry] = await tx
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.id, ledgerEntryId));

      if (!originalEntry) {
        throw new Error(`Ledger entry ${ledgerEntryId} not found`);
      }

      if (originalEntry.status === "reversed") {
        throw new Error("Entry already reversed");
      }

      // Mark original as reversed
      await tx
        .update(ledgerEntries)
        .set({
          status: "reversed",
          reversedAt: new Date(),
        })
        .where(eq(ledgerEntries.id, ledgerEntryId));

      // Create reversal entry
      const reversalOperation: FinancialOperation = {
        type: "adjustment",
        amount: originalEntry.amount,
        description: `Reversal: ${reason}`,
        referenceId: `REV-${originalEntry.id}`,
        metadata: {
          originalEntryId: originalEntry.id,
          reversalReason: reason,
        },
      };

      // Reverse the entry type
      const reversalContext = {
        ...context,
        tenantId: originalEntry.tenantId,
      };

      return await this.createSecureLedgerEntry(reversalContext, reversalOperation);
    });
  }

  /**
   * Gets current balance with optional locking for atomic operations
   */
  static async getCurrentBalance(tenantId: number): Promise<string> {
    const [latest] = await db
      .select({ balance: ledgerEntries.runningBalance })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.tenantId, tenantId))
      .orderBy(desc(ledgerEntries.id))
      .limit(1);

    return latest?.balance || "0.00";
  }

  /**
   * Gets current balance with row-level locking for atomic operations
   */
  private static async getCurrentBalanceWithLock(tx: any, tenantId: number): Promise<string> {
    const [latest] = await tx
      .select({ balance: ledgerEntries.runningBalance })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.tenantId, tenantId))
      .orderBy(desc(ledgerEntries.id))
      .limit(1)
      .for("update");

    return latest?.balance || "0.00";
  }

  /**
   * Calculates new balance and determines entry type
   */
  private static calculateNewBalance(
    currentBalance: string,
    operation: FinancialOperation
  ): { entryType: "debit" | "credit"; newBalance: string } {
    const current = parseFloat(currentBalance);
    const amount = parseFloat(operation.amount);

    let entryType: "debit" | "credit";
    let newBalance: number;

    switch (operation.type) {
      case "sale":
      case "cash_in":
        entryType = "credit";
        newBalance = current + amount;
        break;
      case "withdrawal":
      case "fee":
      case "cash_out":
        entryType = "debit";
        newBalance = current - amount;
        break;
      case "refund":
        entryType = "debit";
        newBalance = current - amount;
        break;
      case "chargeback":
        entryType = "debit";
        newBalance = current - amount;
        break;
      case "adjustment":
        // Adjustment can be either credit or debit based on amount sign
        if (amount >= 0) {
          entryType = "credit";
          newBalance = current + amount;
        } else {
          entryType = "debit";
          newBalance = current + amount; // amount is negative
        }
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    return {
      entryType,
      newBalance: newBalance.toFixed(2),
    };
  }

  /**
   * Validates operation constraints and business rules
   */
  private static async validateOperation(
    context: LedgerContext,
    operation: FinancialOperation,
    currentBalance: string
  ): Promise<void> {
    const balance = parseFloat(currentBalance);
    const amount = parseFloat(operation.amount);

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error("Operation amount must be positive");
    }

    // Validate sufficient balance for debit operations
    if (["withdrawal", "fee", "cash_out", "refund", "chargeback"].includes(operation.type)) {
      if (balance < amount) {
        throw new Error("Insufficient balance for operation");
      }
    }

    // Validate daily withdrawal limits
    if (operation.type === "withdrawal" || operation.type === "cash_out") {
      const dailyWithdrawals = await this.getDailyWithdrawals(context.tenantId);
      const dailyLimit = 50000; // R$ 50,000 daily limit

      if (dailyWithdrawals + amount > dailyLimit) {
        throw new Error("Daily withdrawal limit exceeded");
      }
    }

    // Validate maximum transaction amount
    const maxTransactionAmount = 100000; // R$ 100,000
    if (amount > maxTransactionAmount) {
      throw new Error("Transaction amount exceeds maximum limit");
    }
  }

  /**
   * Gets daily withdrawals for limit validation
   */
  private static async getDailyWithdrawals(tenantId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [result] = await db
      .select({ total: sum(ledgerEntries.amount) })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.tenantId, tenantId),
          eq(ledgerEntries.entryType, "debit"),
          gte(ledgerEntries.createdAt, today),
          lte(ledgerEntries.createdAt, tomorrow),
          eq(ledgerEntries.status, "confirmed")
        )
      );

    return parseFloat(result?.total || "0");
  }

  /**
   * Creates balance snapshot for audit trail
   */
  private static async createBalanceSnapshot(
    tx: any,
    tenantId: number,
    balance: string,
    lastLedgerEntryId: number,
    snapshotType: "daily" | "transaction" | "reconciliation" | "manual"
  ): Promise<void> {
    await tx.insert(balanceSnapshots).values({
      tenantId,
      balance,
      pendingBalance: "0.00", // Calculate if needed
      lastLedgerEntryId,
      snapshotType,
    });
  }

  /**
   * Creates security audit log entry
   */
  private static async createSecurityAudit(
    tx: any,
    audit: InsertSecurityAuditLog
  ): Promise<void> {
    await tx.insert(securityAuditLog).values(audit);
  }

  /**
   * Calculates risk score for security monitoring
   */
  private static calculateRiskScore(
    context: LedgerContext,
    operation: FinancialOperation
  ): number {
    let score = 0;
    const amount = parseFloat(operation.amount);

    // Amount-based risk
    if (amount > 10000) score += 30;
    else if (amount > 5000) score += 20;
    else if (amount > 1000) score += 10;

    // Operation type risk
    if (operation.type === "cash_out" || operation.type === "withdrawal") score += 20;
    if (operation.type === "adjustment") score += 40;

    // Time-based risk (off-hours operations)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Syncs balance with Celcoin account
   */
  private static async syncCelcoinBalance(tenantId: number): Promise<void> {
    try {
      const [celcoinAccount] = await db
        .select()
        .from(celcoinAccounts)
        .where(eq(celcoinAccounts.tenantId, tenantId))
        .limit(1);

      if (celcoinAccount) {
        const balanceData = await celcoinService.getAccountBalance(celcoinAccount.celcoinAccountId);
        
        // Update local Celcoin account balance
        await db
          .update(celcoinAccounts)
          .set({
            balance: balanceData.balance,
            updatedAt: new Date(),
          })
          .where(eq(celcoinAccounts.id, celcoinAccount.id));
      }
    } catch (error) {
      console.error("Failed to sync Celcoin balance:", error);
      // Don't throw - this is a background sync operation
    }
  }

  /**
   * Logs Celcoin API interactions for compliance
   */
  static async logCelcoinTransaction(
    log: InsertCelcoinTransactionLog
  ): Promise<void> {
    await db.insert(celcoinTransactionLog).values(log);
  }

  /**
   * Gets ledger entries for a tenant with pagination
   */
  static async getLedgerEntries(
    tenantId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.tenantId, tenantId))
      .orderBy(desc(ledgerEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Gets balance history for reconciliation
   */
  static async getBalanceHistory(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<BalanceSnapshot[]> {
    return await db
      .select()
      .from(balanceSnapshots)
      .where(
        and(
          eq(balanceSnapshots.tenantId, tenantId),
          gte(balanceSnapshots.createdAt, startDate),
          lte(balanceSnapshots.createdAt, endDate)
        )
      )
      .orderBy(desc(balanceSnapshots.createdAt));
  }
}