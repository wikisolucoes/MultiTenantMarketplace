import { db } from "../db";
import { 
  loyaltyPoints, 
  customers,
  customerOrders,
  type LoyaltyPoint 
} from "@shared/schema";
import { eq, and, sum, desc, sql } from "drizzle-orm";

export interface LoyaltyConfig {
  pointsPerReal: number; // Points earned per R$1 spent
  pointsValue: number; // How many points = R$1
  welcomeBonus: number; // Points given on signup
  birthdayBonus: number; // Points given on birthday
  minRedemption: number; // Minimum points to redeem
  expirationDays: number; // Days until points expire
}

export interface CustomerLoyaltyStats {
  totalPoints: number;
  availablePoints: number;
  expiredPoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  lifetimeValue: number;
}

export class LoyaltyService {
  private static defaultConfig: LoyaltyConfig = {
    pointsPerReal: 1,
    pointsValue: 100, // 100 points = R$1
    welcomeBonus: 100,
    birthdayBonus: 200,
    minRedemption: 100,
    expirationDays: 365,
  };

  /**
   * Awards points to customer for purchase
   */
  static async awardPurchasePoints(
    tenantId: number,
    customerId: number,
    orderId: number,
    purchaseAmount: number,
    config: LoyaltyConfig = this.defaultConfig
  ): Promise<LoyaltyPoint> {
    const points = Math.floor(purchaseAmount * config.pointsPerReal);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.expirationDays);

    const [loyaltyPoint] = await db
      .insert(loyaltyPoints)
      .values({
        tenantId,
        customerId,
        orderId,
        points,
        type: "earned",
        reason: `Compra de R$ ${purchaseAmount.toFixed(2)}`,
        expiresAt,
      })
      .returning();

    return loyaltyPoint;
  }

  /**
   * Awards bonus points (welcome, birthday, etc.)
   */
  static async awardBonusPoints(
    tenantId: number,
    customerId: number,
    points: number,
    reason: string,
    expirationDays: number = 365
  ): Promise<LoyaltyPoint> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const [loyaltyPoint] = await db
      .insert(loyaltyPoints)
      .values({
        tenantId,
        customerId,
        points,
        type: "bonus",
        reason,
        expiresAt,
      })
      .returning();

    return loyaltyPoint;
  }

  /**
   * Redeems points for discount
   */
  static async redeemPoints(
    tenantId: number,
    customerId: number,
    pointsToRedeem: number,
    reason: string = "Resgate de pontos",
    config: LoyaltyConfig = this.defaultConfig
  ): Promise<{ success: boolean; discountValue: number; error?: string }> {
    if (pointsToRedeem < config.minRedemption) {
      return {
        success: false,
        discountValue: 0,
        error: `Mínimo de ${config.minRedemption} pontos para resgate`
      };
    }

    const availablePoints = await this.getAvailablePoints(tenantId, customerId);
    
    if (availablePoints < pointsToRedeem) {
      return {
        success: false,
        discountValue: 0,
        error: `Pontos insuficientes. Disponível: ${availablePoints}`
      };
    }

    // Calculate discount value
    const discountValue = pointsToRedeem / config.pointsValue;

    // Record redemption
    const [redemption] = await db
      .insert(loyaltyPoints)
      .values({
        tenantId,
        customerId,
        points: -pointsToRedeem,
        type: "redeemed",
        reason,
      })
      .returning();

    return {
      success: true,
      discountValue: Math.round(discountValue * 100) / 100,
    };
  }

  /**
   * Gets customer's available points (non-expired)
   */
  static async getAvailablePoints(tenantId: number, customerId: number): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${loyaltyPoints.points}), 0)`,
      })
      .from(loyaltyPoints)
      .where(
        and(
          eq(loyaltyPoints.tenantId, tenantId),
          eq(loyaltyPoints.customerId, customerId),
          sql`(${loyaltyPoints.expiresAt} IS NULL OR ${loyaltyPoints.expiresAt} > NOW())`
        )
      );

    return Math.max(0, result.total || 0);
  }

  /**
   * Gets customer loyalty statistics
   */
  static async getCustomerStats(tenantId: number, customerId: number): Promise<CustomerLoyaltyStats> {
    // Get points summary
    const [pointsSummary] = await db
      .select({
        totalEarned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyPoints.points} > 0 THEN ${loyaltyPoints.points} ELSE 0 END), 0)`,
        totalRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyPoints.points} < 0 THEN ABS(${loyaltyPoints.points}) ELSE 0 END), 0)`,
        currentTotal: sql<number>`COALESCE(SUM(${loyaltyPoints.points}), 0)`,
      })
      .from(loyaltyPoints)
      .where(
        and(
          eq(loyaltyPoints.tenantId, tenantId),
          eq(loyaltyPoints.customerId, customerId)
        )
      );

    // Get available points (non-expired)
    const availablePoints = await this.getAvailablePoints(tenantId, customerId);

    // Get expired points
    const [expiredResult] = await db
      .select({
        expired: sql<number>`COALESCE(SUM(${loyaltyPoints.points}), 0)`,
      })
      .from(loyaltyPoints)
      .where(
        and(
          eq(loyaltyPoints.tenantId, tenantId),
          eq(loyaltyPoints.customerId, customerId),
          sql`${loyaltyPoints.expiresAt} < NOW()`,
          sql`${loyaltyPoints.points} > 0`
        )
      );

    // Get lifetime order value
    const [lifetimeResult] = await db
      .select({
        lifetime: sql<number>`COALESCE(SUM(${customerOrders.total}), 0)`,
      })
      .from(customerOrders)
      .where(
        and(
          eq(customerOrders.tenantId, tenantId),
          eq(customerOrders.customerId, customerId)
        )
      );

    return {
      totalPoints: pointsSummary.currentTotal || 0,
      availablePoints,
      expiredPoints: expiredResult.expired || 0,
      pointsEarned: pointsSummary.totalEarned || 0,
      pointsRedeemed: pointsSummary.totalRedeemed || 0,
      lifetimeValue: parseFloat(lifetimeResult.lifetime?.toString() || "0"),
    };
  }

  /**
   * Gets customer loyalty history
   */
  static async getCustomerHistory(
    tenantId: number,
    customerId: number,
    limit: number = 50
  ): Promise<LoyaltyPoint[]> {
    return await db
      .select()
      .from(loyaltyPoints)
      .where(
        and(
          eq(loyaltyPoints.tenantId, tenantId),
          eq(loyaltyPoints.customerId, customerId)
        )
      )
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(limit);
  }

  /**
   * Expires old points
   */
  static async expireOldPoints(tenantId: number): Promise<number> {
    // Mark expired points
    const expiredPoints = await db
      .update(loyaltyPoints)
      .set({
        type: "expired",
      })
      .where(
        and(
          eq(loyaltyPoints.tenantId, tenantId),
          sql`${loyaltyPoints.expiresAt} < NOW()`,
          eq(loyaltyPoints.type, "earned"),
          sql`${loyaltyPoints.points} > 0`
        )
      )
      .returning();

    return expiredPoints.length;
  }

  /**
   * Gets loyalty program statistics for tenant
   */
  static async getTenantLoyaltyStats(tenantId: number): Promise<{
    totalCustomersWithPoints: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalPointsExpired: number;
    averagePointsPerCustomer: number;
  }> {
    const [stats] = await db
      .select({
        customersWithPoints: sql<number>`COUNT(DISTINCT ${loyaltyPoints.customerId})`,
        totalIssued: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyPoints.points} > 0 THEN ${loyaltyPoints.points} ELSE 0 END), 0)`,
        totalRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyPoints.type} = 'redeemed' THEN ABS(${loyaltyPoints.points}) ELSE 0 END), 0)`,
        totalExpired: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyPoints.type} = 'expired' THEN ${loyaltyPoints.points} ELSE 0 END), 0)`,
      })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.tenantId, tenantId));

    const averagePoints = stats.customersWithPoints > 0 
      ? (stats.totalIssued || 0) / stats.customersWithPoints 
      : 0;

    return {
      totalCustomersWithPoints: stats.customersWithPoints || 0,
      totalPointsIssued: stats.totalIssued || 0,
      totalPointsRedeemed: stats.totalRedeemed || 0,
      totalPointsExpired: stats.totalExpired || 0,
      averagePointsPerCustomer: Math.round(averagePoints),
    };
  }

  /**
   * Gets top loyalty customers
   */
  static async getTopLoyaltyCustomers(
    tenantId: number,
    limit: number = 10
  ): Promise<Array<{
    customerId: number;
    customerName: string;
    customerEmail: string;
    totalPoints: number;
    availablePoints: number;
    lifetimeValue: number;
  }>> {
    const topCustomers = await db
      .select({
        customerId: loyaltyPoints.customerId,
        totalPoints: sql<number>`SUM(${loyaltyPoints.points})`,
      })
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.tenantId, tenantId))
      .groupBy(loyaltyPoints.customerId)
      .orderBy(sql`SUM(${loyaltyPoints.points}) DESC`)
      .limit(limit);

    const results = [];
    for (const customer of topCustomers) {
      // Get customer details
      const [customerData] = await db
        .select({
          name: customers.name,
          email: customers.email,
        })
        .from(customers)
        .where(eq(customers.id, customer.customerId))
        .limit(1);

      // Get available points and lifetime value
      const stats = await this.getCustomerStats(tenantId, customer.customerId);

      results.push({
        customerId: customer.customerId,
        customerName: customerData?.name || "Cliente",
        customerEmail: customerData?.email || "",
        totalPoints: customer.totalPoints,
        availablePoints: stats.availablePoints,
        lifetimeValue: stats.lifetimeValue,
      });
    }

    return results;
  }

  /**
   * Calculates points value in currency
   */
  static calculatePointsValue(points: number, config: LoyaltyConfig = this.defaultConfig): number {
    return Math.round((points / config.pointsValue) * 100) / 100;
  }

  /**
   * Calculates how many points for a given currency amount
   */
  static calculatePointsForAmount(amount: number, config: LoyaltyConfig = this.defaultConfig): number {
    return Math.floor(amount * config.pointsPerReal);
  }
}