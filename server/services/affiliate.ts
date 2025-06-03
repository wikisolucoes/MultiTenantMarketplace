import { db } from "../db";
import { 
  affiliates, 
  affiliateCommissions,
  customerOrders,
  type Affiliate, 
  type InsertAffiliate,
  type AffiliateCommission 
} from "@shared/schema";
import { eq, and, sum, sql, desc } from "drizzle-orm";

export interface AffiliateStats {
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  totalSales: number;
  conversionRate: number;
  clickCount: number;
}

export interface CommissionCalculation {
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
}

export class AffiliateService {
  /**
   * Creates a new affiliate
   */
  static async createAffiliate(affiliateData: Omit<InsertAffiliate, 'affiliateCode'>): Promise<Affiliate> {
    const affiliateCode = this.generateAffiliateCode();
    
    const [affiliate] = await db
      .insert(affiliates)
      .values({
        ...affiliateData,
        affiliateCode,
      })
      .returning();

    return affiliate;
  }

  /**
   * Gets affiliate by code
   */
  static async getAffiliateByCode(tenantId: number, code: string): Promise<Affiliate | null> {
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(
        and(
          eq(affiliates.tenantId, tenantId),
          eq(affiliates.affiliateCode, code.toUpperCase()),
          eq(affiliates.isActive, true)
        )
      )
      .limit(1);

    return affiliate || null;
  }

  /**
   * Gets all affiliates for a tenant
   */
  static async getAffiliates(tenantId: number): Promise<Affiliate[]> {
    return await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.tenantId, tenantId))
      .orderBy(desc(affiliates.createdAt));
  }

  /**
   * Calculates commission for a sale
   */
  static calculateCommission(saleAmount: number, commissionRate: number): CommissionCalculation {
    const commissionAmount = (saleAmount * commissionRate) / 100;
    
    return {
      saleAmount,
      commissionRate,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
    };
  }

  /**
   * Records a commission for an affiliate
   */
  static async recordCommission(
    tenantId: number,
    affiliateId: number,
    orderId: number,
    saleAmount: number
  ): Promise<AffiliateCommission> {
    // Get affiliate to get commission rate
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, affiliateId))
      .limit(1);

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    const commission = this.calculateCommission(saleAmount, parseFloat(affiliate.commissionRate));

    const [affiliateCommission] = await db
      .insert(affiliateCommissions)
      .values({
        tenantId,
        affiliateId,
        orderId,
        saleAmount: commission.saleAmount.toString(),
        commissionRate: commission.commissionRate.toString(),
        commissionAmount: commission.commissionAmount.toString(),
        status: "pending",
      })
      .returning();

    // Update affiliate stats
    await this.updateAffiliateStats(affiliateId, commission.commissionAmount, saleAmount);

    return affiliateCommission;
  }

  /**
   * Updates affiliate statistics
   */
  static async updateAffiliateStats(
    affiliateId: number, 
    commissionAmount: number, 
    saleAmount: number
  ): Promise<void> {
    await db
      .update(affiliates)
      .set({
        totalEarnings: sql`${affiliates.totalEarnings} + ${commissionAmount}`,
        pendingEarnings: sql`${affiliates.pendingEarnings} + ${commissionAmount}`,
        totalSales: sql`${affiliates.totalSales} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliateId));
  }

  /**
   * Gets affiliate statistics
   */
  static async getAffiliateStats(affiliateId: number): Promise<AffiliateStats> {
    const [affiliate] = await db
      .select({
        totalEarnings: affiliates.totalEarnings,
        paidEarnings: affiliates.paidEarnings,
        pendingEarnings: affiliates.pendingEarnings,
        totalSales: affiliates.totalSales,
      })
      .from(affiliates)
      .where(eq(affiliates.id, affiliateId))
      .limit(1);

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    return {
      totalEarnings: parseFloat(affiliate.totalEarnings),
      paidEarnings: parseFloat(affiliate.paidEarnings),
      pendingEarnings: parseFloat(affiliate.pendingEarnings),
      totalSales: affiliate.totalSales,
      conversionRate: 0, // Would need click tracking data
      clickCount: 0, // Would need click tracking data
    };
  }

  /**
   * Gets affiliate commissions
   */
  static async getAffiliateCommissions(
    tenantId: number,
    affiliateId?: number,
    status?: string
  ): Promise<AffiliateCommission[]> {
    let query = db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.tenantId, tenantId));

    if (affiliateId) {
      query = query.where(eq(affiliateCommissions.affiliateId, affiliateId));
    }

    if (status) {
      query = query.where(eq(affiliateCommissions.status, status));
    }

    return await query.orderBy(desc(affiliateCommissions.createdAt));
  }

  /**
   * Approves pending commissions
   */
  static async approveCommissions(commissionIds: number[]): Promise<void> {
    await db
      .update(affiliateCommissions)
      .set({
        status: "approved",
        approvedAt: new Date(),
      })
      .where(sql`${affiliateCommissions.id} IN (${commissionIds.join(',')})`);
  }

  /**
   * Pays approved commissions
   */
  static async payCommissions(commissionIds: number[]): Promise<void> {
    // Get commission amounts to update affiliate paid earnings
    const commissions = await db
      .select({
        affiliateId: affiliateCommissions.affiliateId,
        commissionAmount: affiliateCommissions.commissionAmount,
      })
      .from(affiliateCommissions)
      .where(sql`${affiliateCommissions.id} IN (${commissionIds.join(',')})`);

    // Mark commissions as paid
    await db
      .update(affiliateCommissions)
      .set({
        status: "paid",
        paidAt: new Date(),
      })
      .where(sql`${affiliateCommissions.id} IN (${commissionIds.join(',')})`);

    // Update affiliate paid/pending earnings
    for (const commission of commissions) {
      const amount = parseFloat(commission.commissionAmount);
      await db
        .update(affiliates)
        .set({
          paidEarnings: sql`${affiliates.paidEarnings} + ${amount}`,
          pendingEarnings: sql`${affiliates.pendingEarnings} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, commission.affiliateId));
    }
  }

  /**
   * Updates affiliate information
   */
  static async updateAffiliate(
    affiliateId: number,
    updates: Partial<InsertAffiliate>
  ): Promise<Affiliate> {
    const [affiliate] = await db
      .update(affiliates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliateId))
      .returning();

    return affiliate;
  }

  /**
   * Deactivates an affiliate
   */
  static async deactivateAffiliate(affiliateId: number): Promise<void> {
    await db
      .update(affiliates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliateId));
  }

  /**
   * Gets top performing affiliates
   */
  static async getTopAffiliates(tenantId: number, limit: number = 10): Promise<Affiliate[]> {
    return await db
      .select()
      .from(affiliates)
      .where(
        and(
          eq(affiliates.tenantId, tenantId),
          eq(affiliates.isActive, true)
        )
      )
      .orderBy(desc(affiliates.totalEarnings))
      .limit(limit);
  }

  /**
   * Generates a unique affiliate code
   */
  private static generateAffiliateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'AFF';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validates affiliate code format
   */
  static isValidAffiliateCode(code: string): boolean {
    return /^AFF[A-Z0-9]{8}$/.test(code);
  }

  /**
   * Gets affiliate earnings summary
   */
  static async getEarningsSummary(tenantId: number): Promise<{
    totalCommissionsPaid: number;
    totalCommissionsPending: number;
    totalAffiliates: number;
    activeAffiliates: number;
  }> {
    const [summary] = await db
      .select({
        totalPaid: sum(affiliates.paidEarnings),
        totalPending: sum(affiliates.pendingEarnings),
        totalAffiliates: sql<number>`COUNT(*)`,
        activeAffiliates: sql<number>`COUNT(CASE WHEN ${affiliates.isActive} = true THEN 1 END)`,
      })
      .from(affiliates)
      .where(eq(affiliates.tenantId, tenantId));

    return {
      totalCommissionsPaid: parseFloat(summary.totalPaid || "0"),
      totalCommissionsPending: parseFloat(summary.totalPending || "0"),
      totalAffiliates: summary.totalAffiliates,
      activeAffiliates: summary.activeAffiliates,
    };
  }
}