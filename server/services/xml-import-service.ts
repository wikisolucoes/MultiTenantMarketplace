import { db } from "../db";
import { storage } from "../storage";
import { xmlImports, products } from "@shared/schema";
import { eq } from "drizzle-orm";
import { parseString } from 'xml2js';

export interface XmlImportData {
  filename: string;
  xmlContent: string;
}

export interface ImportedProduct {
  code: string;
  name: string;
  ncm: string;
  quantity: number;
  unitPrice: number;
  cfop: string;
  supplierCnpj: string;
  supplierName: string;
}

export class XmlImportService {
  /**
   * Check if tenant has XML import subscription
   */
  static async hasXmlImportSubscription(tenantId: number): Promise<boolean> {
    try {
      const subscription = await storage.getTenantPluginSubscriptions(tenantId);
      return subscription.some(sub => 
        sub.pluginId === 2 && // XML Import plugin ID
        sub.status === 'active'
      );
    } catch (error) {
      console.error("Error checking XML import subscription:", error);
      return false;
    }
  }

  /**
   * Process XML import
   */
  static async processXmlImport(tenantId: number, importData: XmlImportData) {
    try {
      // Check if tenant has XML import subscription
      const hasSubscription = await this.hasXmlImportSubscription(tenantId);
      if (!hasSubscription) {
        throw new Error("XML Import module not active. Please subscribe to the XML Import plugin.");
      }

      // Create import record
      const [xmlImport] = await db
        .insert(xmlImports)
        .values({
          tenantId,
          filename: importData.filename,
          xmlContent: importData.xmlContent,
          status: 'processing',
        })
        .returning();

      try {
        // Parse XML content
        const parsedData = await this.parseNfeXml(importData.xmlContent);
        
        // Extract supplier information
        const supplierCnpj = parsedData.supplierCnpj;
        const supplierName = parsedData.supplierName;
        
        // Process products
        const importedProducts = parsedData.products;
        let processedCount = 0;

        for (const product of importedProducts) {
          await this.updateProductStock(tenantId, product);
          processedCount++;
        }

        // Update import record with success
        await db
          .update(xmlImports)
          .set({
            status: 'completed',
            totalItems: importedProducts.length,
            processedItems: processedCount,
            supplierCnpj,
            supplierName,
          })
          .where(eq(xmlImports.id, xmlImport.id));

        return {
          success: true,
          importId: xmlImport.id,
          totalItems: importedProducts.length,
          processedItems: processedCount,
          supplierCnpj,
          supplierName,
        };

      } catch (parseError: any) {
        // Update import record with error
        await db
          .update(xmlImports)
          .set({
            status: 'error',
            errorMessage: parseError.message,
          })
          .where(eq(xmlImports.id, xmlImport.id));

        throw parseError;
      }

    } catch (error: any) {
      console.error("Error processing XML import:", error);
      throw error;
    }
  }

  /**
   * Parse NF-e XML content
   */
  private static async parseNfeXml(xmlContent: string): Promise<{
    supplierCnpj: string;
    supplierName: string;
    products: ImportedProduct[];
  }> {
    return new Promise((resolve, reject) => {
      parseString(xmlContent, (err, result) => {
        if (err) {
          reject(new Error(`Invalid XML format: ${err.message}`));
          return;
        }

        try {
          // Extract NFe data (handles both direct NFe and nfeProc wrapper)
          let nfe;
          if (result.nfeProc) {
            nfe = result.nfeProc.NFe[0];
          } else if (result.NFe) {
            nfe = result.NFe;
          } else {
            throw new Error('Invalid NF-e XML structure');
          }

          const infNFe = nfe.infNFe[0];
          
          // Extract supplier information
          const emit = infNFe.emit[0];
          const supplierCnpj = emit.CNPJ ? emit.CNPJ[0] : emit.CPF[0];
          const supplierName = emit.xNome[0];

          // Extract products
          const products: ImportedProduct[] = [];
          const detElements = infNFe.det || [];

          for (const det of detElements) {
            const prod = det.prod[0];
            
            products.push({
              code: prod.cProd[0],
              name: prod.xProd[0],
              ncm: prod.NCM ? prod.NCM[0] : '',
              quantity: parseFloat(prod.qCom[0]),
              unitPrice: parseFloat(prod.vUnCom[0]),
              cfop: prod.CFOP[0],
              supplierCnpj,
              supplierName,
            });
          }

          resolve({
            supplierCnpj,
            supplierName,
            products,
          });

        } catch (parseError: any) {
          reject(new Error(`Error parsing NF-e data: ${parseError.message}`));
        }
      });
    });
  }

  /**
   * Update product stock based on imported data
   */
  private static async updateProductStock(tenantId: number, importedProduct: ImportedProduct) {
    try {
      // Find existing product by code or NCM
      const existingProducts = await storage.getProductsByTenantId(tenantId);
      const existingProduct = existingProducts.find(p => 
        p.name.toLowerCase().includes(importedProduct.name.toLowerCase()) ||
        p.ncm === importedProduct.ncm
      );

      if (existingProduct) {
        // Update existing product stock
        await db
          .update(products)
          .set({
            stock: existingProduct.stock + Math.floor(importedProduct.quantity),
            updatedAt: new Date(),
          })
          .where(eq(products.id, existingProduct.id));
      } else {
        // Create new product if not found
        await db
          .insert(products)
          .values({
            tenantId,
            name: importedProduct.name,
            description: `Produto importado via XML NF-e - Fornecedor: ${importedProduct.supplierName}`,
            price: importedProduct.unitPrice.toString(),
            stock: Math.floor(importedProduct.quantity),
            ncm: importedProduct.ncm,
            cfop: importedProduct.cfop,
            isActive: true,
          });
      }
    } catch (error: any) {
      console.error(`Error updating product stock for ${importedProduct.name}:`, error);
      throw error;
    }
  }

  /**
   * Get import history for tenant
   */
  static async getImportHistory(tenantId: number) {
    return await db
      .select()
      .from(xmlImports)
      .where(eq(xmlImports.tenantId, tenantId))
      .orderBy(xmlImports.createdAt);
  }

  /**
   * Get import details by ID
   */
  static async getImportById(tenantId: number, importId: number) {
    const [xmlImport] = await db
      .select()
      .from(xmlImports)
      .where(
        eq(xmlImports.id, importId) && 
        eq(xmlImports.tenantId, tenantId)
      );

    return xmlImport;
  }

  /**
   * Validate XML content before processing
   */
  static validateXmlContent(xmlContent: string): { valid: boolean; error?: string } {
    try {
      // Basic XML validation
      if (!xmlContent.trim().startsWith('<?xml')) {
        return { valid: false, error: 'Invalid XML format - missing XML declaration' };
      }

      // Check for NFe structure
      if (!xmlContent.includes('<NFe') && !xmlContent.includes('<nfeProc')) {
        return { valid: false, error: 'Invalid NF-e XML - missing NFe or nfeProc elements' };
      }

      // Check for required elements
      const requiredElements = ['<emit>', '<det>', '<prod>'];
      for (const element of requiredElements) {
        if (!xmlContent.includes(element)) {
          return { valid: false, error: `Missing required element: ${element}` };
        }
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Retry failed import
   */
  static async retryImport(tenantId: number, importId: number) {
    try {
      const xmlImport = await this.getImportById(tenantId, importId);
      
      if (!xmlImport) {
        throw new Error('Import not found');
      }

      if (xmlImport.status !== 'error') {
        throw new Error('Can only retry failed imports');
      }

      // Reset import status
      await db
        .update(xmlImports)
        .set({
          status: 'processing',
          errorMessage: null,
          processedItems: 0,
        })
        .where(eq(xmlImports.id, importId));

      // Reprocess the import
      return await this.processXmlImport(tenantId, {
        filename: xmlImport.filename,
        xmlContent: xmlImport.xmlContent,
      });

    } catch (error: any) {
      console.error("Error retrying import:", error);
      throw error;
    }
  }
}