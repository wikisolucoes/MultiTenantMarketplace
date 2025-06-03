import { db } from "../db";
import { 
  coupons, 
  type Coupon, 
  type InsertCoupon 
} from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discount: number;
  freeShipping: boolean;
  error?: string;
}

export interface CouponApplicationData {
  orderSubtotal: number;
  shippingCost: number;
  productIds: number[];
  categoryIds: number[];
  customerId?: number;
}

export class CouponService {
  /**
   * Validates and applies a coupon to an order
   */
  static async validateAndApplyCoupon(
    tenantId: number,
    couponCode: string,
    applicationData: CouponApplicationData
  ): Promise<CouponValidationResult> {
    try {
      // Find active coupon
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.tenantId, tenantId),
            eq(coupons.code, couponCode.toUpperCase()),
            eq(coupons.isActive, true),
            lte(coupons.validFrom, new Date()),
            gte(coupons.validUntil, new Date())
          )
        )
        .limit(1);

      if (!coupon) {
        return {
          isValid: false,
          discount: 0,
          freeShipping: false,
          error: "Cupom inválido ou expirado"
        };
      }

      // Check usage limits
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return {
          isValid: false,
          discount: 0,
          freeShipping: false,
          error: "Cupom esgotado"
        };
      }

      // Check minimum order value
      if (coupon.minimumOrder && applicationData.orderSubtotal < parseFloat(coupon.minimumOrder)) {
        return {
          isValid: false,
          discount: 0,
          freeShipping: false,
          error: `Valor mínimo do pedido: R$ ${coupon.minimumOrder}`
        };
      }

      // Check product/category restrictions
      if (coupon.applicableProducts || coupon.applicableCategories) {
        const applicableProducts = coupon.applicableProducts as number[] || [];
        const applicableCategories = coupon.applicableCategories as number[] || [];
        
        const hasApplicableProduct = applicableProducts.length === 0 || 
          applicationData.productIds.some(id => applicableProducts.includes(id));
        
        const hasApplicableCategory = applicableCategories.length === 0 || 
          applicationData.categoryIds.some(id => applicableCategories.includes(id));

        if (!hasApplicableProduct && !hasApplicableCategory) {
          return {
            isValid: false,
            discount: 0,
            freeShipping: false,
            error: "Cupom não aplicável aos produtos selecionados"
          };
        }
      }

      // Calculate discount
      let discount = 0;
      let freeShipping = false;

      switch (coupon.type) {
        case "percentage":
          discount = (applicationData.orderSubtotal * parseFloat(coupon.value)) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, parseFloat(coupon.maxDiscount));
          }
          break;

        case "fixed_amount":
          discount = Math.min(parseFloat(coupon.value), applicationData.orderSubtotal);
          break;

        case "free_shipping":
          freeShipping = true;
          discount = applicationData.shippingCost;
          break;
      }

      return {
        isValid: true,
        coupon,
        discount: Math.round(discount * 100) / 100,
        freeShipping,
      };

    } catch (error) {
      console.error("Coupon validation error:", error);
      return {
        isValid: false,
        discount: 0,
        freeShipping: false,
        error: "Erro ao validar cupom"
      };
    }
  }

  /**
   * Records coupon usage
   */
  static async recordCouponUsage(couponId: number): Promise<void> {
    await db
      .update(coupons)
      .set({
        usageCount: sql`${coupons.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, couponId));
  }

  /**
   * Creates a new coupon
   */
  static async createCoupon(couponData: InsertCoupon): Promise<Coupon> {
    // Generate unique code if not provided
    if (!couponData.code) {
      couponData.code = this.generateCouponCode();
    } else {
      couponData.code = couponData.code.toUpperCase();
    }

    const [coupon] = await db
      .insert(coupons)
      .values(couponData)
      .returning();

    return coupon;
  }

  /**
   * Gets all coupons for a tenant
   */
  static async getCoupons(tenantId: number): Promise<Coupon[]> {
    return await db
      .select()
      .from(coupons)
      .where(eq(coupons.tenantId, tenantId))
      .orderBy(sql`${coupons.createdAt} DESC`);
  }

  /**
   * Updates a coupon
   */
  static async updateCoupon(couponId: number, updates: Partial<InsertCoupon>): Promise<Coupon> {
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
    }

    const [coupon] = await db
      .update(coupons)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, couponId))
      .returning();

    return coupon;
  }

  /**
   * Deletes a coupon
   */
  static async deleteCoupon(couponId: number): Promise<void> {
    await db
      .delete(coupons)
      .where(eq(coupons.id, couponId));
  }

  /**
   * Generates a unique coupon code
   */
  private static generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Gets active coupons for storefront display
   */
  static async getActiveCoupons(tenantId: number): Promise<Coupon[]> {
    return await db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.tenantId, tenantId),
          eq(coupons.isActive, true),
          lte(coupons.validFrom, new Date()),
          gte(coupons.validUntil, new Date())
        )
      )
      .orderBy(sql`${coupons.createdAt} DESC`);
  }

  /**
   * Bulk creates coupons
   */
  static async bulkCreateCoupons(
    tenantId: number,
    count: number,
    template: Omit<InsertCoupon, 'tenantId' | 'code'>
  ): Promise<Coupon[]> {
    const couponsData: InsertCoupon[] = [];
    
    for (let i = 0; i < count; i++) {
      couponsData.push({
        ...template,
        tenantId,
        code: this.generateCouponCode(),
      });
    }

    return await db
      .insert(coupons)
      .values(couponsData)
      .returning();
  }
}