import { db } from "../db";
import { 
  products, 
  productImports,
  type Product,
  type InsertProduct,
  type ProductImport 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  errors: string[];
  importId: number;
}

export interface ProductCSVRow {
  name: string;
  description?: string;
  price: string;
  stock?: string;
  sku?: string;
  category?: string;
  brand?: string;
  weight?: string;
  dimensions?: string;
  active?: string;
}

export interface StockUpdateRow {
  sku: string;
  stock: string;
  price?: string;
}

export class CSVImportService {
  /**
   * Imports products from CSV data
   */
  static async importProducts(
    tenantId: number,
    fileName: string,
    csvData: ProductCSVRow[]
  ): Promise<ImportResult> {
    const importRecord = await this.createImportRecord(
      tenantId,
      fileName,
      'products',
      csvData.length
    );

    const errors: string[] = [];
    let successCount = 0;
    let processedCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      processedCount++;

      try {
        // Validate required fields
        if (!row.name || !row.price) {
          errors.push(`Linha ${i + 1}: Nome e preço são obrigatórios`);
          continue;
        }

        // Parse price
        const price = parseFloat(row.price.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(price) || price < 0) {
          errors.push(`Linha ${i + 1}: Preço inválido: ${row.price}`);
          continue;
        }

        // Parse stock
        let stock = 0;
        if (row.stock) {
          stock = parseInt(row.stock);
          if (isNaN(stock)) {
            errors.push(`Linha ${i + 1}: Estoque inválido: ${row.stock}`);
            continue;
          }
        }

        // Check if product with SKU already exists
        if (row.sku) {
          const existing = await db
            .select()
            .from(products)
            .where(
              and(
                eq(products.tenantId, tenantId),
                eq(products.sku, row.sku)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            // Update existing product
            await db
              .update(products)
              .set({
                name: row.name,
                description: row.description || null,
                price: price.toString(),
                stock: stock,
                updatedAt: new Date(),
              })
              .where(eq(products.id, existing[0].id));
          } else {
            // Create new product
            await this.createProduct(tenantId, row, price, stock);
          }
        } else {
          // Create new product without SKU
          await this.createProduct(tenantId, row, price, stock);
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Linha ${i + 1}: Erro ao processar - ${error.message}`);
      }
    }

    // Update import record
    await this.updateImportRecord(importRecord.id, {
      status: errors.length === csvData.length ? 'failed' : 
              errors.length > 0 ? 'partial' : 'completed',
      processedRows: processedCount,
      successRows: successCount,
      errorRows: errors.length,
      errors: errors,
    });

    return {
      success: successCount > 0,
      totalRows: csvData.length,
      processedRows: processedCount,
      successRows: successCount,
      errorRows: errors.length,
      errors,
      importId: importRecord.id,
    };
  }

  /**
   * Updates stock from CSV data
   */
  static async updateStock(
    tenantId: number,
    fileName: string,
    csvData: StockUpdateRow[]
  ): Promise<ImportResult> {
    const importRecord = await this.createImportRecord(
      tenantId,
      fileName,
      'stock',
      csvData.length
    );

    const errors: string[] = [];
    let successCount = 0;
    let processedCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      processedCount++;

      try {
        // Validate required fields
        if (!row.sku || !row.stock) {
          errors.push(`Linha ${i + 1}: SKU e estoque são obrigatórios`);
          continue;
        }

        // Parse stock
        const stock = parseInt(row.stock);
        if (isNaN(stock) || stock < 0) {
          errors.push(`Linha ${i + 1}: Estoque inválido: ${row.stock}`);
          continue;
        }

        // Find product by SKU
        const [product] = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.sku, row.sku)
            )
          )
          .limit(1);

        if (!product) {
          errors.push(`Linha ${i + 1}: Produto não encontrado com SKU: ${row.sku}`);
          continue;
        }

        // Update stock and optionally price
        const updateData: any = {
          stock,
          updatedAt: new Date(),
        };

        if (row.price) {
          const price = parseFloat(row.price.replace(/[^\d.,]/g, '').replace(',', '.'));
          if (!isNaN(price) && price >= 0) {
            updateData.price = price.toString();
          }
        }

        await db
          .update(products)
          .set(updateData)
          .where(eq(products.id, product.id));

        successCount++;
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Linha ${i + 1}: Erro ao processar - ${error.message}`);
      }
    }

    // Update import record
    await this.updateImportRecord(importRecord.id, {
      status: errors.length === csvData.length ? 'failed' : 
              errors.length > 0 ? 'partial' : 'completed',
      processedRows: processedCount,
      successRows: successCount,
      errorRows: errors.length,
      errors: errors,
    });

    return {
      success: successCount > 0,
      totalRows: csvData.length,
      processedRows: processedCount,
      successRows: successCount,
      errorRows: errors.length,
      errors,
      importId: importRecord.id,
    };
  }

  /**
   * Creates a new product from CSV row
   */
  private static async createProduct(
    tenantId: number,
    row: ProductCSVRow,
    price: number,
    stock: number
  ): Promise<Product> {
    // Generate SKU if not provided
    const sku = row.sku || this.generateSKU(row.name);

    const productData: InsertProduct = {
      tenantId,
      name: row.name,
      description: row.description || null,
      price: price.toString(),
      stock,
      sku,
      isActive: row.active ? row.active.toLowerCase() === 'true' : true,
    };

    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();

    return product;
  }

  /**
   * Generates a SKU from product name
   */
  private static generateSKU(productName: string): string {
    const clean = productName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);
    
    const timestamp = Date.now().toString().slice(-4);
    return `${clean}${timestamp}`;
  }

  /**
   * Creates an import record
   */
  private static async createImportRecord(
    tenantId: number,
    fileName: string,
    type: 'products' | 'stock' | 'prices',
    totalRows: number
  ): Promise<ProductImport> {
    const [importRecord] = await db
      .insert(productImports)
      .values({
        tenantId,
        fileName,
        type,
        totalRows,
        status: 'processing',
      })
      .returning();

    return importRecord;
  }

  /**
   * Updates an import record
   */
  private static async updateImportRecord(
    importId: number,
    updates: Partial<{
      status: 'processing' | 'completed' | 'failed' | 'partial';
      processedRows: number;
      successRows: number;
      errorRows: number;
      errors: string[];
      results: any;
    }>
  ): Promise<void> {
    await db
      .update(productImports)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(productImports.id, importId));
  }

  /**
   * Gets import history for tenant
   */
  static async getImportHistory(tenantId: number): Promise<ProductImport[]> {
    return await db
      .select()
      .from(productImports)
      .where(eq(productImports.tenantId, tenantId))
      .orderBy(eq(productImports.createdAt, 'desc'));
  }

  /**
   * Gets import details by ID
   */
  static async getImportDetails(importId: number): Promise<ProductImport | null> {
    const [importRecord] = await db
      .select()
      .from(productImports)
      .where(eq(productImports.id, importId))
      .limit(1);

    return importRecord || null;
  }

  /**
   * Validates CSV headers for product import
   */
  static validateProductHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
    const requiredHeaders = ['name', 'price'];
    const validHeaders = ['name', 'description', 'price', 'stock', 'sku', 'category', 'brand', 'weight', 'dimensions', 'active'];
    
    const errors: string[] = [];
    
    // Check required headers
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        errors.push(`Coluna obrigatória ausente: ${required}`);
      }
    }

    // Check for invalid headers
    for (const header of headers) {
      if (!validHeaders.includes(header.toLowerCase())) {
        errors.push(`Coluna inválida: ${header}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates CSV headers for stock update
   */
  static validateStockHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
    const requiredHeaders = ['sku', 'stock'];
    const validHeaders = ['sku', 'stock', 'price'];
    
    const errors: string[] = [];
    
    // Check required headers
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        errors.push(`Coluna obrigatória ausente: ${required}`);
      }
    }

    // Check for invalid headers
    for (const header of headers) {
      if (!validHeaders.includes(header.toLowerCase())) {
        errors.push(`Coluna inválida: ${header}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parses CSV string to array of objects
   */
  static parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return rows;
  }
}