import { 
  tenants, 
  users, 
  brands,
  productCategories,
  products,
  productImages,
  productSpecifications,
  productPromotions,
  bulkPricingRules,
  orders,
  type Tenant, 
  type User, 
  type InsertUser,
  type InsertTenant,
  type Brand,
  type InsertBrand,
  type ProductCategory,
  type InsertProductCategory,
  type Product,
  type InsertProduct,
  type ProductImage,
  type InsertProductImage,
  type ProductSpecification,
  type InsertProductSpecification,
  type ProductPromotion,
  type InsertProductPromotion,
  type BulkPricingRule,
  type InsertBulkPricingRule,
  type Order,
  type InsertOrder,
  type TenantRegistrationData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, count } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tenant management
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getAllTenants(): Promise<Tenant[]>;
  
  // Tenant registration (complete flow)
  registerTenant(data: TenantRegistrationData): Promise<{ tenant: Tenant; user: User }>;
  
  // Brands (tenant-scoped)
  getBrandsByTenantId(tenantId: number): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: number, tenantId: number, brand: Partial<InsertBrand>): Promise<Brand>;
  deleteBrand(id: number, tenantId: number): Promise<void>;
  
  // Product Categories (tenant-scoped)
  getCategoriesByTenantId(tenantId: number): Promise<ProductCategory[]>;
  createCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateCategory(id: number, tenantId: number, category: Partial<InsertProductCategory>): Promise<ProductCategory>;
  deleteCategory(id: number, tenantId: number): Promise<void>;
  
  // Products (tenant-scoped with advanced features)
  getProductsByTenantId(tenantId: number): Promise<Product[]>;
  getProductWithDetails(id: number, tenantId: number): Promise<Product & { 
    brand?: Brand;
    category?: ProductCategory;
    images: ProductImage[];
    specifications: ProductSpecification[];
    bulkPricingRules: BulkPricingRule[];
  } | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, tenantId: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number, tenantId: number): Promise<void>;
  
  // Product Images
  createProductImage(image: InsertProductImage): Promise<ProductImage>;
  updateProductImages(productId: number, images: InsertProductImage[]): Promise<ProductImage[]>;
  deleteProductImage(id: number): Promise<void>;
  
  // Product Specifications
  createProductSpecification(spec: InsertProductSpecification): Promise<ProductSpecification>;
  updateProductSpecifications(productId: number, specs: InsertProductSpecification[]): Promise<ProductSpecification[]>;
  deleteProductSpecification(id: number): Promise<void>;
  
  // Bulk Pricing Rules
  createBulkPricingRule(rule: InsertBulkPricingRule): Promise<BulkPricingRule>;
  updateBulkPricingRules(productId: number, rules: InsertBulkPricingRule[]): Promise<BulkPricingRule[]>;
  deleteBulkPricingRule(id: number): Promise<void>;
  
  // Product Promotions
  getPromotionsByTenantId(tenantId: number): Promise<ProductPromotion[]>;
  createPromotion(promotion: InsertProductPromotion): Promise<ProductPromotion>;
  updatePromotion(id: number, tenantId: number, promotion: Partial<InsertProductPromotion>): Promise<ProductPromotion>;
  deletePromotion(id: number, tenantId: number): Promise<void>;
  
  // Orders (tenant-scoped)
  getOrdersByTenantId(tenantId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    return tenant || undefined;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async registerTenant(data: TenantRegistrationData): Promise<{ tenant: Tenant; user: User }> {
    return await db.transaction(async (tx) => {
      // Create tenant
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: data.tenantName,
          domain: data.domain,
          isActive: true
        })
        .returning();

      // Create user (tenant owner)
      const [user] = await tx
        .insert(users)
        .values({
          email: data.adminEmail,
          password: data.adminPassword, // Will be hashed in the route handler
          fullName: data.adminFullName,
          document: data.adminDocument,
          documentType: data.adminDocumentType,
          phone: data.adminPhone,
          role: "merchant",
          tenantId: tenant.id
        })
        .returning();

      return { tenant, user };
    });
  }

  // Brands
  async getBrandsByTenantId(tenantId: number): Promise<Brand[]> {
    return await db.select().from(brands).where(eq(brands.tenantId, tenantId)).orderBy(desc(brands.createdAt));
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async updateBrand(id: number, tenantId: number, brand: Partial<InsertBrand>): Promise<Brand> {
    const [updatedBrand] = await db
      .update(brands)
      .set({ ...brand, updatedAt: new Date() })
      .where(and(eq(brands.id, id), eq(brands.tenantId, tenantId)))
      .returning();
    return updatedBrand;
  }

  async deleteBrand(id: number, tenantId: number): Promise<void> {
    await db.delete(brands).where(and(eq(brands.id, id), eq(brands.tenantId, tenantId)));
  }

  // Product Categories
  async getCategoriesByTenantId(tenantId: number): Promise<ProductCategory[]> {
    return await db.select().from(productCategories).where(eq(productCategories.tenantId, tenantId)).orderBy(desc(productCategories.createdAt));
  }

  async createCategory(category: InsertProductCategory): Promise<ProductCategory> {
    const [newCategory] = await db.insert(productCategories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, tenantId: number, category: Partial<InsertProductCategory>): Promise<ProductCategory> {
    const [updatedCategory] = await db
      .update(productCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(and(eq(productCategories.id, id), eq(productCategories.tenantId, tenantId)))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number, tenantId: number): Promise<void> {
    await db.delete(productCategories).where(and(eq(productCategories.id, id), eq(productCategories.tenantId, tenantId)));
  }

  // Products with advanced features
  async getProductsByTenantId(tenantId: number): Promise<Product[]> {
    return await db.select({
      id: products.id,
      tenantId: products.tenantId,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      categoryId: products.categoryId,
      brandId: products.brandId,
      ncm: products.ncm,
      cest: products.cest,
      cfop: products.cfop,
      icmsOrigin: products.icmsOrigin,
      icmsCst: products.icmsCst,
      icmsRate: products.icmsRate,
      ipiCst: products.ipiCst,
      ipiRate: products.ipiRate,
      pisCst: products.pisCst,
      pisRate: products.pisRate,
      cofinsCst: products.cofinsCst,
      cofinsRate: products.cofinsRate,
      productUnit: products.productUnit,
      grossWeight: products.grossWeight,
      netWeight: products.netWeight
    }).from(products).where(eq(products.tenantId, tenantId)).orderBy(desc(products.createdAt));
  }

  async getProductWithDetails(id: number, tenantId: number): Promise<Product & { 
    brand?: Brand;
    category?: ProductCategory;
    images: ProductImage[];
    specifications: ProductSpecification[];
    bulkPricingRules: BulkPricingRule[];
  } | undefined> {
    // Get the product
    const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
    if (!product) return undefined;

    // Get related data
    const [brand] = product.brandId ? await db.select().from(brands).where(eq(brands.id, product.brandId)) : [undefined];
    const [category] = product.categoryId ? await db.select().from(productCategories).where(eq(productCategories.id, product.categoryId)) : [undefined];
    const images = await db.select().from(productImages).where(eq(productImages.productId, id));
    const specifications = await db.select().from(productSpecifications).where(eq(productSpecifications.productId, id));
    const bulkPricingRules = await db.select().from(bulkPricingRules).where(eq(bulkPricingRules.productId, id));

    return {
      ...product,
      brand,
      category,
      images,
      specifications,
      bulkPricingRules
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, tenantId: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number, tenantId: number): Promise<void> {
    await db.delete(products).where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
  }

  // Product Images
  async createProductImage(image: InsertProductImage): Promise<ProductImage> {
    const [newImage] = await db.insert(productImages).values(image).returning();
    return newImage;
  }

  async updateProductImages(productId: number, images: InsertProductImage[]): Promise<ProductImage[]> {
    // Delete existing images and insert new ones
    await db.delete(productImages).where(eq(productImages.productId, productId));
    if (images.length === 0) return [];
    
    const newImages = await db.insert(productImages).values(images).returning();
    return newImages;
  }

  async deleteProductImage(id: number): Promise<void> {
    await db.delete(productImages).where(eq(productImages.id, id));
  }

  // Product Specifications
  async createProductSpecification(spec: InsertProductSpecification): Promise<ProductSpecification> {
    const [newSpec] = await db.insert(productSpecifications).values(spec).returning();
    return newSpec;
  }

  async updateProductSpecifications(productId: number, specs: InsertProductSpecification[]): Promise<ProductSpecification[]> {
    // Delete existing specs and insert new ones
    await db.delete(productSpecifications).where(eq(productSpecifications.productId, productId));
    if (specs.length === 0) return [];
    
    const newSpecs = await db.insert(productSpecifications).values(specs).returning();
    return newSpecs;
  }

  async deleteProductSpecification(id: number): Promise<void> {
    await db.delete(productSpecifications).where(eq(productSpecifications.id, id));
  }

  // Bulk Pricing Rules
  async createBulkPricingRule(rule: InsertBulkPricingRule): Promise<BulkPricingRule> {
    const [newRule] = await db.insert(bulkPricingRules).values(rule).returning();
    return newRule;
  }

  async updateBulkPricingRules(productId: number, rules: InsertBulkPricingRule[]): Promise<BulkPricingRule[]> {
    // Delete existing rules and insert new ones
    await db.delete(bulkPricingRules).where(eq(bulkPricingRules.productId, productId));
    if (rules.length === 0) return [];
    
    const newRules = await db.insert(bulkPricingRules).values(rules).returning();
    return newRules;
  }

  async deleteBulkPricingRule(id: number): Promise<void> {
    await db.delete(bulkPricingRules).where(eq(bulkPricingRules.id, id));
  }

  // Product Promotions
  async getPromotionsByTenantId(tenantId: number): Promise<ProductPromotion[]> {
    return await db.select().from(productPromotions).where(eq(productPromotions.tenantId, tenantId)).orderBy(desc(productPromotions.createdAt));
  }

  async createPromotion(promotion: InsertProductPromotion): Promise<ProductPromotion> {
    const [newPromotion] = await db.insert(productPromotions).values(promotion).returning();
    return newPromotion;
  }

  async updatePromotion(id: number, tenantId: number, promotion: Partial<InsertProductPromotion>): Promise<ProductPromotion> {
    const [updatedPromotion] = await db
      .update(productPromotions)
      .set({ ...promotion, updatedAt: new Date() })
      .where(and(eq(productPromotions.id, id), eq(productPromotions.tenantId, tenantId)))
      .returning();
    return updatedPromotion;
  }

  async deletePromotion(id: number, tenantId: number): Promise<void> {
    await db.delete(productPromotions).where(and(eq(productPromotions.id, id), eq(productPromotions.tenantId, tenantId)));
  }

  // Orders
  async getOrdersByTenantId(tenantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.tenantId, tenantId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
}

export const storage = new DatabaseStorage();
