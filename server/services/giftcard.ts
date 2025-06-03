import { db } from "../db";
import { 
  giftCards, 
  type GiftCard, 
  type InsertGiftCard 
} from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export interface GiftCardValidationResult {
  isValid: boolean;
  giftCard?: GiftCard;
  availableBalance: number;
  error?: string;
}

export class GiftCardService {
  /**
   * Creates a new gift card
   */
  static async createGiftCard(giftCardData: Omit<InsertGiftCard, 'code' | 'currentBalance'>): Promise<GiftCard> {
    const code = this.generateGiftCardCode();
    
    const [giftCard] = await db
      .insert(giftCards)
      .values({
        ...giftCardData,
        code,
        currentBalance: giftCardData.initialValue,
      })
      .returning();

    return giftCard;
  }

  /**
   * Validates a gift card for use
   */
  static async validateGiftCard(
    tenantId: number,
    code: string,
    requiredAmount?: number
  ): Promise<GiftCardValidationResult> {
    try {
      const [giftCard] = await db
        .select()
        .from(giftCards)
        .where(
          and(
            eq(giftCards.tenantId, tenantId),
            eq(giftCards.code, code.toUpperCase()),
            eq(giftCards.isActive, true),
            gte(giftCards.currentBalance, "0.01")
          )
        )
        .limit(1);

      if (!giftCard) {
        return {
          isValid: false,
          availableBalance: 0,
          error: "Vale presente inválido ou sem saldo"
        };
      }

      // Check expiration
      if (giftCard.validUntil && new Date() > giftCard.validUntil) {
        return {
          isValid: false,
          availableBalance: 0,
          error: "Vale presente expirado"
        };
      }

      const availableBalance = parseFloat(giftCard.currentBalance);

      // Check if has sufficient balance for required amount
      if (requiredAmount && availableBalance < requiredAmount) {
        return {
          isValid: false,
          giftCard,
          availableBalance,
          error: `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`
        };
      }

      return {
        isValid: true,
        giftCard,
        availableBalance,
      };

    } catch (error) {
      console.error("Gift card validation error:", error);
      return {
        isValid: false,
        availableBalance: 0,
        error: "Erro ao validar vale presente"
      };
    }
  }

  /**
   * Uses (debits) a gift card
   */
  static async useGiftCard(
    giftCardId: number,
    amount: number
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      const [updated] = await db
        .update(giftCards)
        .set({
          currentBalance: sql`${giftCards.currentBalance} - ${amount}`,
          usedAt: new Date(),
        })
        .where(
          and(
            eq(giftCards.id, giftCardId),
            gte(giftCards.currentBalance, amount.toString())
          )
        )
        .returning();

      if (!updated) {
        return {
          success: false,
          newBalance: 0,
          error: "Saldo insuficiente no vale presente"
        };
      }

      return {
        success: true,
        newBalance: parseFloat(updated.currentBalance),
      };

    } catch (error) {
      console.error("Gift card usage error:", error);
      return {
        success: false,
        newBalance: 0,
        error: "Erro ao usar vale presente"
      };
    }
  }

  /**
   * Gets gift card by code
   */
  static async getGiftCardByCode(tenantId: number, code: string): Promise<GiftCard | null> {
    const [giftCard] = await db
      .select()
      .from(giftCards)
      .where(
        and(
          eq(giftCards.tenantId, tenantId),
          eq(giftCards.code, code.toUpperCase())
        )
      )
      .limit(1);

    return giftCard || null;
  }

  /**
   * Gets all gift cards for a tenant
   */
  static async getGiftCards(tenantId: number): Promise<GiftCard[]> {
    return await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.tenantId, tenantId))
      .orderBy(sql`${giftCards.createdAt} DESC`);
  }

  /**
   * Checks gift card balance
   */
  static async checkBalance(tenantId: number, code: string): Promise<{
    balance: number;
    isValid: boolean;
    expiresAt?: Date;
    error?: string;
  }> {
    const giftCard = await this.getGiftCardByCode(tenantId, code);

    if (!giftCard) {
      return {
        balance: 0,
        isValid: false,
        error: "Vale presente não encontrado"
      };
    }

    if (!giftCard.isActive) {
      return {
        balance: 0,
        isValid: false,
        error: "Vale presente desativado"
      };
    }

    if (giftCard.validUntil && new Date() > giftCard.validUntil) {
      return {
        balance: 0,
        isValid: false,
        error: "Vale presente expirado"
      };
    }

    return {
      balance: parseFloat(giftCard.currentBalance),
      isValid: true,
      expiresAt: giftCard.validUntil || undefined,
    };
  }

  /**
   * Deactivates a gift card
   */
  static async deactivateGiftCard(giftCardId: number): Promise<void> {
    await db
      .update(giftCards)
      .set({
        isActive: false,
      })
      .where(eq(giftCards.id, giftCardId));
  }

  /**
   * Bulk creates gift cards
   */
  static async bulkCreateGiftCards(
    tenantId: number,
    count: number,
    value: number,
    validUntil?: Date
  ): Promise<GiftCard[]> {
    const giftCardsData: InsertGiftCard[] = [];
    
    for (let i = 0; i < count; i++) {
      giftCardsData.push({
        tenantId,
        code: this.generateGiftCardCode(),
        initialValue: value.toString(),
        currentBalance: value.toString(),
        validUntil,
        isActive: true,
      });
    }

    return await db
      .insert(giftCards)
      .values(giftCardsData)
      .returning();
  }

  /**
   * Generates a unique gift card code
   */
  private static generateGiftCardCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'GC';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Sends gift card email (integration point for email service)
   */
  static async sendGiftCardEmail(giftCard: GiftCard): Promise<boolean> {
    // This would integrate with your email service (SendGrid, etc.)
    // For now, return true as placeholder
    console.log(`Gift card ${giftCard.code} ready to be sent to ${giftCard.recipientEmail}`);
    return true;
  }

  /**
   * Gets gift cards purchased by customer email
   */
  static async getGiftCardsByPurchaser(tenantId: number, email: string): Promise<GiftCard[]> {
    return await db
      .select()
      .from(giftCards)
      .where(
        and(
          eq(giftCards.tenantId, tenantId),
          eq(giftCards.purchaserEmail, email)
        )
      )
      .orderBy(sql`${giftCards.createdAt} DESC`);
  }
}