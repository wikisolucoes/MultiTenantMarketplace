import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  settings: jsonb("settings"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  document: text("document").notNull(), // CPF/CNPJ
  documentType: text("document_type", { enum: ["cpf", "cnpj"] }).notNull(),
  phone: text("phone").notNull(),
  role: text("role", { enum: ["admin", "merchant"] }).notNull().default("merchant"),
  tenantId: integer("tenant_id").references(() => tenants.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Brands table
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Categories table
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => productCategories.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  sku: text("sku"),
  barcode: text("barcode"),
  brandId: integer("brand_id").references(() => brands.id),
  categoryId: integer("category_id").references(() => productCategories.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock"),
  stockTracking: boolean("stock_tracking").notNull().default(true),
  allowBackorder: boolean("allow_backorder").notNull().default(false),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  dimensions: jsonb("dimensions"), // {length, width, height} em cm
  isActive: boolean("is_active").notNull().default(true),
  isDigital: boolean("is_digital").notNull().default(false),
  requiresShipping: boolean("requires_shipping").notNull().default(true),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  tags: text("tags").array(),
  // Tax configuration for NF-e
  ncm: text("ncm"),
  cest: text("cest"),
  cfop: text("cfop"),
  icmsOrigin: text("icms_origin", { enum: ["0", "1", "2", "3", "4", "5", "6", "7", "8"] }),
  icmsCst: text("icms_cst"),
  icmsRate: decimal("icms_rate", { precision: 5, scale: 2 }),
  ipiCst: text("ipi_cst"),
  ipiRate: decimal("ipi_rate", { precision: 5, scale: 2 }),
  pisCst: text("pis_cst"),
  pisRate: decimal("pis_rate", { precision: 5, scale: 2 }),
  cofinsCst: text("cofins_cst"),
  cofinsRate: decimal("cofins_rate", { precision: 5, scale: 2 }),
  productUnit: text("product_unit").default("UN"),
  grossWeight: decimal("gross_weight", { precision: 10, scale: 3 }),
  netWeight: decimal("net_weight", { precision: 10, scale: 3 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Images table
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  position: integer("position").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product Specifications table
export const productSpecifications = pgTable("product_specifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  type: text("type", { enum: ["text", "number", "boolean", "select"] }).notNull().default("text"),
  unit: text("unit"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product Promotions table
export const productPromotions = pgTable("product_promotions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["percentage", "fixed_amount", "bulk_pricing"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minQuantity: integer("min_quantity").default(1),
  maxQuantity: integer("max_quantity"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Promotion Products (Many-to-Many)
export const productPromotionProducts = pgTable("product_promotion_products", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id").references(() => productPromotions.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bulk Pricing Rules table
export const bulkPricingRules = pgTable("bulk_pricing_rules", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"),
  priceType: text("price_type", { enum: ["fixed", "percentage_off"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { 
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"] 
  }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  products: many(products),
  brands: many(brands),
  categories: many(productCategories),
  promotions: many(productPromotions),
  orders: many(orders),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [brands.tenantId],
    references: [tenants.id],
  }),
  products: many(products),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productCategories.tenantId],
    references: [tenants.id],
  }),
  parent: one(productCategories, {
    fields: [productCategories.parentId],
    references: [productCategories.id],
    relationName: "parentCategory",
  }),
  children: many(productCategories, {
    relationName: "parentCategory",
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  images: many(productImages),
  specifications: many(productSpecifications),
  bulkPricingRules: many(bulkPricingRules),
  orders: many(orders),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productSpecificationsRelations = relations(productSpecifications, ({ one }) => ({
  product: one(products, {
    fields: [productSpecifications.productId],
    references: [products.id],
  }),
}));

export const productPromotionsRelations = relations(productPromotions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productPromotions.tenantId],
    references: [tenants.id],
  }),
  products: many(productPromotionProducts),
}));

export const productPromotionProductsRelations = relations(productPromotionProducts, ({ one }) => ({
  promotion: one(productPromotions, {
    fields: [productPromotionProducts.promotionId],
    references: [productPromotions.id],
  }),
  product: one(products, {
    fields: [productPromotionProducts.productId],
    references: [products.id],
  }),
}));

export const bulkPricingRulesRelations = relations(bulkPricingRules, ({ one }) => ({
  product: one(products, {
    fields: [bulkPricingRules.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

export const insertProductSpecificationSchema = createInsertSchema(productSpecifications).omit({
  id: true,
  createdAt: true,
});

export const insertProductPromotionSchema = createInsertSchema(productPromotions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBulkPricingRuleSchema = createInsertSchema(bulkPricingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Login and registration schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const tenantRegistrationSchema = z.object({
  tenantName: z.string().min(2),
  domain: z.string().min(3),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  adminFullName: z.string().min(2),
  adminDocument: z.string().min(8),
  adminDocumentType: z.enum(["cpf", "cnpj"]),
  adminPhone: z.string().min(8),
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductSpecification = typeof productSpecifications.$inferSelect;
export type InsertProductSpecification = z.infer<typeof insertProductSpecificationSchema>;
export type ProductPromotion = typeof productPromotions.$inferSelect;
export type InsertProductPromotion = z.infer<typeof insertProductPromotionSchema>;
export type ProductPromotionProduct = typeof productPromotionProducts.$inferSelect;
export type BulkPricingRule = typeof bulkPricingRules.$inferSelect;
export type InsertBulkPricingRule = z.infer<typeof insertBulkPricingRuleSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type TenantRegistrationData = z.infer<typeof tenantRegistrationSchema>;