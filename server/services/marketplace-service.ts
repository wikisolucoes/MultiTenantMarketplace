import { db } from "../db";
import { storage } from "../storage";
import { marketplaceIntegrations, marketplaceProducts, products } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface MarketplaceCredentials {
  mercadolivre?: {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
    refreshToken?: string;
  };
  shopee?: {
    partnerId: string;
    partnerKey: string;
    shopId: string;
    accessToken?: string;
  };
  amazon?: {
    sellerId: string;
    mwsAuthToken: string;
    marketplaceId: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  instagram?: {
    facebookPageId: string;
    instagramBusinessId: string;
    accessToken: string;
  };
  google_shopping?: {
    merchantId: string;
    serviceAccountKey: string;
  };
}

export interface ProductSyncData {
  title: string;
  description: string;
  price: number;
  stock: number;
  images?: string[];
  category?: string;
  brand?: string;
  condition?: 'new' | 'used' | 'refurbished';
}

export class MarketplaceService {
  /**
   * Check if tenant has marketplace subscription for specific marketplace
   */
  static async hasMarketplaceSubscription(tenantId: number, marketplace: string): Promise<boolean> {
    try {
      const subscription = await storage.getTenantPluginSubscriptions(tenantId);
      const marketplacePluginMap: Record<string, number> = {
        'mercadolivre': 3,
        'shopee': 4,
        'amazon': 5,
        'instagram': 6,
        'google_shopping': 7,
      };
      
      const pluginId = marketplacePluginMap[marketplace];
      return subscription.some(sub => 
        sub.pluginId === pluginId && 
        sub.status === 'active'
      );
    } catch (error) {
      console.error(`Error checking ${marketplace} subscription:`, error);
      return false;
    }
  }

  /**
   * Setup marketplace integration
   */
  static async setupIntegration(
    tenantId: number, 
    marketplace: string, 
    credentials: any,
    settings: any = {}
  ) {
    try {
      const hasSubscription = await this.hasMarketplaceSubscription(tenantId, marketplace);
      if (!hasSubscription) {
        throw new Error(`${marketplace} integration not available. Please subscribe to the ${marketplace} plugin.`);
      }

      // Check if integration already exists
      const [existingIntegration] = await db
        .select()
        .from(marketplaceIntegrations)
        .where(
          and(
            eq(marketplaceIntegrations.tenantId, tenantId),
            eq(marketplaceIntegrations.marketplace, marketplace)
          )
        );

      if (existingIntegration) {
        // Update existing integration
        const [updated] = await db
          .update(marketplaceIntegrations)
          .set({
            credentials: JSON.stringify(credentials),
            settings: JSON.stringify(settings),
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(marketplaceIntegrations.id, existingIntegration.id))
          .returning();
        
        return updated;
      } else {
        // Create new integration
        const [integration] = await db
          .insert(marketplaceIntegrations)
          .values({
            tenantId,
            marketplace,
            credentials: JSON.stringify(credentials),
            settings: JSON.stringify(settings),
            isActive: true,
          })
          .returning();
        
        return integration;
      }
    } catch (error: any) {
      console.error(`Error setting up ${marketplace} integration:`, error);
      throw error;
    }
  }

  /**
   * Sync product to marketplace
   */
  static async syncProductToMarketplace(
    tenantId: number,
    productId: number,
    marketplace: string,
    syncData: ProductSyncData
  ) {
    try {
      const hasSubscription = await this.hasMarketplaceSubscription(tenantId, marketplace);
      if (!hasSubscription) {
        throw new Error(`${marketplace} integration not available. Please subscribe to the ${marketplace} plugin.`);
      }

      // Get marketplace integration
      const [integration] = await db
        .select()
        .from(marketplaceIntegrations)
        .where(
          and(
            eq(marketplaceIntegrations.tenantId, tenantId),
            eq(marketplaceIntegrations.marketplace, marketplace),
            eq(marketplaceIntegrations.isActive, true)
          )
        );

      if (!integration) {
        throw new Error(`${marketplace} integration not configured`);
      }

      // Sync based on marketplace
      let marketplaceProductId: string;
      let syncResult: any;

      switch (marketplace) {
        case 'mercadolivre':
          syncResult = await this.syncToMercadoLivre(integration, syncData);
          break;
        case 'shopee':
          syncResult = await this.syncToShopee(integration, syncData);
          break;
        case 'amazon':
          syncResult = await this.syncToAmazon(integration, syncData);
          break;
        case 'instagram':
          syncResult = await this.syncToInstagram(integration, syncData);
          break;
        case 'google_shopping':
          syncResult = await this.syncToGoogleShopping(integration, syncData);
          break;
        default:
          throw new Error(`Unsupported marketplace: ${marketplace}`);
      }

      marketplaceProductId = syncResult.id;

      // Save marketplace product record
      const [marketplaceProduct] = await db
        .insert(marketplaceProducts)
        .values({
          tenantId,
          productId,
          integrationId: integration.id,
          marketplaceProductId,
          title: syncData.title,
          description: syncData.description,
          price: syncData.price.toString(),
          stock: syncData.stock,
          status: 'active',
          syncStatus: 'completed',
          lastSync: new Date(),
        })
        .returning();

      return {
        success: true,
        marketplaceProduct,
        marketplaceProductId,
      };
    } catch (error: any) {
      console.error(`Error syncing to ${marketplace}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync to Mercado Livre
   */
  private static async syncToMercadoLivre(integration: any, syncData: ProductSyncData) {
    const credentials = JSON.parse(integration.credentials);
    
    // In a real implementation, this would call Mercado Livre API
    // For demo purposes, we simulate a successful response
    console.log('Syncing to Mercado Livre with credentials:', { clientId: credentials.clientId });
    
    return {
      id: `MLB${Date.now()}`,
      status: 'active',
      permalink: `https://mercadolivre.com.br/item/MLB${Date.now()}`,
    };
  }

  /**
   * Sync to Shopee
   */
  private static async syncToShopee(integration: any, syncData: ProductSyncData) {
    const credentials = JSON.parse(integration.credentials);
    
    // In a real implementation, this would call Shopee API
    console.log('Syncing to Shopee with credentials:', { partnerId: credentials.partnerId });
    
    return {
      id: `SP${Date.now()}`,
      status: 'active',
      url: `https://shopee.com.br/product/${Date.now()}`,
    };
  }

  /**
   * Sync to Amazon
   */
  private static async syncToAmazon(integration: any, syncData: ProductSyncData) {
    const credentials = JSON.parse(integration.credentials);
    
    // In a real implementation, this would call Amazon MWS/SP-API
    console.log('Syncing to Amazon with credentials:', { sellerId: credentials.sellerId });
    
    return {
      id: `ASIN${Date.now()}`,
      status: 'active',
      url: `https://amazon.com.br/dp/ASIN${Date.now()}`,
    };
  }

  /**
   * Sync to Instagram Shopping
   */
  private static async syncToInstagram(integration: any, syncData: ProductSyncData) {
    const credentials = JSON.parse(integration.credentials);
    
    // In a real implementation, this would call Facebook Graph API
    console.log('Syncing to Instagram with credentials:', { pageId: credentials.facebookPageId });
    
    return {
      id: `IG${Date.now()}`,
      status: 'active',
      url: `https://instagram.com/shop/product/${Date.now()}`,
    };
  }

  /**
   * Sync to Google Shopping
   */
  private static async syncToGoogleShopping(integration: any, syncData: ProductSyncData) {
    const credentials = JSON.parse(integration.credentials);
    
    // In a real implementation, this would call Google Merchant Center API
    console.log('Syncing to Google Shopping with credentials:', { merchantId: credentials.merchantId });
    
    return {
      id: `GS${Date.now()}`,
      status: 'active',
      url: `https://shopping.google.com/product/${Date.now()}`,
    };
  }

  /**
   * Get marketplace integrations for tenant
   */
  static async getIntegrations(tenantId: number) {
    return await db
      .select()
      .from(marketplaceIntegrations)
      .where(eq(marketplaceIntegrations.tenantId, tenantId));
  }

  /**
   * Get marketplace products for tenant
   */
  static async getMarketplaceProducts(tenantId: number, marketplace?: string) {
    const query = db
      .select({
        id: marketplaceProducts.id,
        productId: marketplaceProducts.productId,
        integrationId: marketplaceProducts.integrationId,
        marketplace: marketplaceIntegrations.marketplace,
        marketplaceProductId: marketplaceProducts.marketplaceProductId,
        title: marketplaceProducts.title,
        price: marketplaceProducts.price,
        stock: marketplaceProducts.stock,
        status: marketplaceProducts.status,
        syncStatus: marketplaceProducts.syncStatus,
        lastSync: marketplaceProducts.lastSync,
        productName: products.name,
      })
      .from(marketplaceProducts)
      .leftJoin(marketplaceIntegrations, eq(marketplaceProducts.integrationId, marketplaceIntegrations.id))
      .leftJoin(products, eq(marketplaceProducts.productId, products.id))
      .where(eq(marketplaceProducts.tenantId, tenantId));

    if (marketplace) {
      return await query.where(eq(marketplaceIntegrations.marketplace, marketplace));
    }

    return await query;
  }

  /**
   * Update marketplace product status
   */
  static async updateProductStatus(
    tenantId: number,
    marketplaceProductId: number,
    status: string,
    syncStatus?: string
  ) {
    return await db
      .update(marketplaceProducts)
      .set({
        status,
        syncStatus: syncStatus || 'completed',
        lastSync: new Date(),
      })
      .where(
        and(
          eq(marketplaceProducts.id, marketplaceProductId),
          eq(marketplaceProducts.tenantId, tenantId)
        )
      );
  }

  /**
   * Bulk sync products to marketplace
   */
  static async bulkSyncProducts(
    tenantId: number,
    marketplace: string,
    productIds: number[]
  ) {
    const results = [];
    
    for (const productId of productIds) {
      try {
        // Get product data
        const product = await storage.getProductsByTenantId(tenantId);
        const productData = product.find(p => p.id === productId);
        
        if (!productData) {
          results.push({
            productId,
            success: false,
            error: 'Product not found',
          });
          continue;
        }

        const syncData: ProductSyncData = {
          title: productData.name,
          description: productData.description || '',
          price: parseFloat(productData.price),
          stock: productData.stock,
          condition: 'new',
        };

        const result = await this.syncProductToMarketplace(
          tenantId,
          productId,
          marketplace,
          syncData
        );

        results.push({
          productId,
          ...result,
        });
      } catch (error: any) {
        results.push({
          productId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}