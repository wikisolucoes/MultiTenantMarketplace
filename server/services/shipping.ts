import { db } from "../db";
import { 
  shippingMethods, 
  type ShippingMethod, 
  type InsertShippingMethod 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface ShippingCalculation {
  methodId: number;
  name: string;
  cost: number;
  estimatedDays: number;
  isFree: boolean;
}

export interface ShippingRequest {
  weight: number;
  itemCount: number;
  subtotal: number;
  zipCode: string;
  region?: string;
}

export interface MelhorEnvioRate {
  service: string;
  carrier: string;
  price: number;
  deliveryTime: number;
}

export class ShippingService {
  /**
   * Calculates shipping costs for all available methods
   */
  static async calculateShipping(
    tenantId: number,
    request: ShippingRequest
  ): Promise<ShippingCalculation[]> {
    const methods = await db
      .select()
      .from(shippingMethods)
      .where(
        and(
          eq(shippingMethods.tenantId, tenantId),
          eq(shippingMethods.isActive, true)
        )
      );

    const calculations: ShippingCalculation[] = [];

    for (const method of methods) {
      const calculation = await this.calculateMethodCost(method, request);
      if (calculation) {
        calculations.push(calculation);
      }
    }

    return calculations.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Calculates cost for a specific shipping method
   */
  private static async calculateMethodCost(
    method: ShippingMethod,
    request: ShippingRequest
  ): Promise<ShippingCalculation | null> {
    let cost = 0;
    let isFree = false;

    switch (method.type) {
      case 'free':
        // Check if order meets free shipping threshold
        if (!method.freeThreshold || request.subtotal >= parseFloat(method.freeThreshold)) {
          isFree = true;
        } else {
          return null; // Free shipping not available
        }
        break;

      case 'fixed':
        cost = parseFloat(method.cost || "0");
        // Check if qualifies for free shipping
        if (method.freeThreshold && request.subtotal >= parseFloat(method.freeThreshold)) {
          cost = 0;
          isFree = true;
        }
        break;

      case 'weight_based':
        cost = this.calculateWeightBasedCost(method, request.weight);
        break;

      case 'item_based':
        cost = this.calculateItemBasedCost(method, request.itemCount);
        break;

      case 'store_pickup':
        cost = 0;
        isFree = true;
        break;

      case 'melhor_envio':
        const melhorEnvioRate = await this.getMelhorEnvioRate(method, request);
        if (melhorEnvioRate) {
          cost = melhorEnvioRate.price;
        } else {
          return null; // Service not available
        }
        break;

      default:
        return null;
    }

    return {
      methodId: method.id,
      name: method.name,
      cost: Math.round(cost * 100) / 100,
      estimatedDays: method.estimatedDays || 0,
      isFree,
    };
  }

  /**
   * Calculates weight-based shipping cost
   */
  private static calculateWeightBasedCost(method: ShippingMethod, weight: number): number {
    const rates = method.weightRates as any || {};
    
    // Find applicable weight bracket
    let cost = parseFloat(method.cost || "0"); // Base cost
    
    for (const [weightLimit, rate] of Object.entries(rates)) {
      if (weight <= parseFloat(weightLimit)) {
        cost = parseFloat(rate as string);
        break;
      }
    }

    return cost;
  }

  /**
   * Calculates item-based shipping cost
   */
  private static calculateItemBasedCost(method: ShippingMethod, itemCount: number): number {
    const rates = method.itemRates as any || {};
    
    let cost = parseFloat(method.cost || "0"); // Base cost
    
    for (const [itemLimit, rate] of Object.entries(rates)) {
      if (itemCount <= parseInt(itemLimit)) {
        cost = parseFloat(rate as string);
        break;
      }
    }

    return cost;
  }

  /**
   * Gets Melhor Envio shipping rates (integration placeholder)
   */
  private static async getMelhorEnvioRate(
    method: ShippingMethod,
    request: ShippingRequest
  ): Promise<MelhorEnvioRate | null> {
    // This would integrate with Melhor Envio API
    // For now, return a mock rate
    return {
      service: "PAC",
      carrier: "Correios",
      price: 15.90,
      deliveryTime: 7,
    };
  }

  /**
   * Creates a new shipping method
   */
  static async createShippingMethod(methodData: InsertShippingMethod): Promise<ShippingMethod> {
    const [method] = await db
      .insert(shippingMethods)
      .values(methodData)
      .returning();

    return method;
  }

  /**
   * Gets all shipping methods for a tenant
   */
  static async getShippingMethods(tenantId: number): Promise<ShippingMethod[]> {
    return await db
      .select()
      .from(shippingMethods)
      .where(eq(shippingMethods.tenantId, tenantId));
  }

  /**
   * Updates a shipping method
   */
  static async updateShippingMethod(
    methodId: number,
    updates: Partial<InsertShippingMethod>
  ): Promise<ShippingMethod> {
    const [method] = await db
      .update(shippingMethods)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(shippingMethods.id, methodId))
      .returning();

    return method;
  }

  /**
   * Deletes a shipping method
   */
  static async deleteShippingMethod(methodId: number): Promise<void> {
    await db
      .delete(shippingMethods)
      .where(eq(shippingMethods.id, methodId));
  }

  /**
   * Gets shipping method by ID
   */
  static async getShippingMethod(methodId: number): Promise<ShippingMethod | null> {
    const [method] = await db
      .select()
      .from(shippingMethods)
      .where(eq(shippingMethods.id, methodId))
      .limit(1);

    return method || null;
  }

  /**
   * Validates ZIP code format (Brazilian format)
   */
  static validateZipCode(zipCode: string): boolean {
    const cleanZip = zipCode.replace(/\D/g, '');
    return cleanZip.length === 8;
  }

  /**
   * Creates default shipping methods for a new tenant
   */
  static async createDefaultMethods(tenantId: number): Promise<ShippingMethod[]> {
    const defaultMethods: InsertShippingMethod[] = [
      {
        tenantId,
        name: "Frete Grátis",
        type: "free",
        cost: "0",
        freeThreshold: "100.00",
        estimatedDays: 7,
        isActive: true,
      },
      {
        tenantId,
        name: "Frete Fixo",
        type: "fixed",
        cost: "15.00",
        estimatedDays: 5,
        isActive: true,
      },
      {
        tenantId,
        name: "Retirar na Loja",
        type: "store_pickup",
        cost: "0",
        estimatedDays: 0,
        isActive: true,
      },
    ];

    const methods = [];
    for (const methodData of defaultMethods) {
      const method = await this.createShippingMethod(methodData);
      methods.push(method);
    }

    return methods;
  }

  /**
   * Gets available shipping methods for a specific request
   */
  static async getAvailableMethods(
    tenantId: number,
    request: ShippingRequest
  ): Promise<ShippingCalculation[]> {
    // Validate ZIP code
    if (!this.validateZipCode(request.zipCode)) {
      throw new Error("CEP inválido");
    }

    return await this.calculateShipping(tenantId, request);
  }

  /**
   * Updates shipping method rates
   */
  static async updateMethodRates(
    methodId: number,
    type: 'weight' | 'item',
    rates: Record<string, number>
  ): Promise<void> {
    const field = type === 'weight' ? 'weightRates' : 'itemRates';
    
    await db
      .update(shippingMethods)
      .set({
        [field]: rates,
        updatedAt: new Date(),
      })
      .where(eq(shippingMethods.id, methodId));
  }
}