import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  decimal,
  boolean,
  serial,
  jsonb,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  document: varchar("document", { length: 20 }).notNull(),
  documentType: varchar("document_type", { length: 10 }).notNull(), // 'cpf' or 'cnpj'
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).default("merchant").notNull(), // 'admin', 'merchant'
  tenantId: integer("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  parentReference: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
  }),
}));

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0).notNull(),
  minStock: integer("min_stock").default(0).notNull(),
  maxStock: integer("max_stock").default(100).notNull(),
  brandId: integer("brand_id").references(() => brands.id),
  categoryId: integer("category_id").references(() => productCategories.id),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  tags: text("tags"),
  weight: decimal("weight", { precision: 8, scale: 3 }),
  dimensionsLength: decimal("dimensions_length", { precision: 8, scale: 2 }),
  dimensionsWidth: decimal("dimensions_width", { precision: 8, scale: 2 }),
  dimensionsHeight: decimal("dimensions_height", { precision: 8, scale: 2 }),
  
  // SEO fields
  slug: varchar("slug", { length: 255 }),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  
  // Promotional pricing
  promotionalPrice: decimal("promotional_price", { precision: 10, scale: 2 }),
  promotionalStartDate: timestamp("promotional_start_date"),
  promotionalEndDate: timestamp("promotional_end_date"),
  
  // Customer type pricing
  priceB2B: decimal("price_b2b", { precision: 10, scale: 2 }),
  priceB2C: decimal("price_b2c", { precision: 10, scale: 2 }),
  
  // Reward points
  rewardPointsB2B: integer("reward_points_b2b").default(0),
  rewardPointsB2C: integer("reward_points_b2c").default(0),
  
  // Product availability and settings
  availabilityDate: timestamp("availability_date"),
  requiresShipping: boolean("requires_shipping").default(true),
  isDigital: boolean("is_digital").default(false),
  hasUnlimitedStock: boolean("has_unlimited_stock").default(false),
  
  // Brazilian tax fields
  ncm: varchar("ncm", { length: 10 }),
  cest: varchar("cest", { length: 7 }),
  cfop: varchar("cfop", { length: 4 }),
  icmsOrigin: varchar("icms_origin", { length: 1 }),
  icmsCst: varchar("icms_cst", { length: 3 }),
  icmsRate: decimal("icms_rate", { precision: 5, scale: 2 }),
  ipiCst: varchar("ipi_cst", { length: 2 }),
  ipiRate: decimal("ipi_rate", { precision: 5, scale: 2 }),
  pisCst: varchar("pis_cst", { length: 2 }),
  pisRate: decimal("pis_rate", { precision: 5, scale: 2 }),
  cofinsCst: varchar("cofins_cst", { length: 2 }),
  cofinsRate: decimal("cofins_rate", { precision: 5, scale: 2 }),
  productUnit: varchar("product_unit", { length: 10 }),
  grossWeight: decimal("gross_weight", { precision: 8, scale: 3 }),
  netWeight: decimal("net_weight", { precision: 8, scale: 3 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productSpecifications = pgTable("product_specifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productPromotions = pgTable("product_promotions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage', 'fixed_amount'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productPromotionProducts = pgTable("product_promotion_products", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id").references(() => productPromotions.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
});

export const bulkPricingRules = pgTable("bulk_pricing_rules", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Tamanho", "Cor"
  value: varchar("value", { length: 255 }).notNull(), // e.g., "M", "Azul"
  price: decimal("price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  sku: varchar("sku", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerDocument: varchar("customer_document", { length: 20 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  customerState: text("customer_state"),
  customerZipCode: text("customer_zip_code"),
  total: decimal("total", { precision: 10, scale: 2 }),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }),
  status: text("status").default("pending").notNull(),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status"),
  celcoinTransactionId: text("celcoin_transaction_id"),
  shippingAddress: jsonb("shipping_address"),
  items: jsonb("items"),
  nfeKey: text("nfe_key"),
  nfeNumber: text("nfe_number"),
  nfeStatus: text("nfe_status"),
  nfeXml: text("nfe_xml"),
  nfeProtocol: text("nfe_protocol"),
  nfeErrorMessage: text("nfe_error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'order', 'payment', 'stock', 'system', 'promotion'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data for the notification
  priority: varchar("priority", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url", { length: 500 }), // URL to redirect when clicked
  expiresAt: timestamp("expires_at"), // For time-sensitive notifications
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  emailNotifications: boolean("email_notifications").default(true),
  browserNotifications: boolean("browser_notifications").default(true),
  orderNotifications: boolean("order_notifications").default(true),
  paymentNotifications: boolean("payment_notifications").default(true),
  stockNotifications: boolean("stock_notifications").default(true),
  systemNotifications: boolean("system_notifications").default(true),
  promotionNotifications: boolean("promotion_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  brands: many(brands),
  categories: many(productCategories),
  products: many(products),
  promotions: many(productPromotions),
  orders: many(orders),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, { fields: [notifications.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [notificationPreferences.tenantId], references: [tenants.id] }),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  tenant: one(tenants, { fields: [brands.tenantId], references: [tenants.id] }),
  products: many(products),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  tenant: one(tenants, { fields: [productCategories.tenantId], references: [tenants.id] }),
  parent: one(productCategories, { fields: [productCategories.parentId], references: [productCategories.id] }),
  children: many(productCategories),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  category: one(productCategories, { fields: [products.categoryId], references: [productCategories.id] }),
  images: many(productImages),
  specifications: many(productSpecifications),
  bulkPricingRules: many(bulkPricingRules),
  variants: many(productVariants),
  orders: many(orders),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productSpecificationsRelations = relations(productSpecifications, ({ one }) => ({
  product: one(products, { fields: [productSpecifications.productId], references: [products.id] }),
}));

export const productPromotionsRelations = relations(productPromotions, ({ one, many }) => ({
  tenant: one(tenants, { fields: [productPromotions.tenantId], references: [tenants.id] }),
  products: many(productPromotionProducts),
}));

export const productPromotionProductsRelations = relations(productPromotionProducts, ({ one }) => ({
  promotion: one(productPromotions, { fields: [productPromotionProducts.promotionId], references: [productPromotions.id] }),
  product: one(products, { fields: [productPromotionProducts.productId], references: [products.id] }),
}));

export const bulkPricingRulesRelations = relations(bulkPricingRules, ({ one }) => ({
  product: one(products, { fields: [bulkPricingRules.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
}));

// Zod schemas for validation
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

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Additional validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const tenantRegistrationSchema = z.object({
  domain: z.string().min(3).max(50).regex(/^[a-zA-Z0-9-]+$/),
  tenantName: z.string().min(1).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
  adminFullName: z.string().min(1).max(100),
  adminDocument: z.string().min(11).max(14),
  adminDocumentType: z.enum(["cpf", "cnpj"]),
  adminPhone: z.string().min(10).max(15),
});

// Type exports
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

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type LoginData = z.infer<typeof loginSchema>;
export type TenantRegistrationData = z.infer<typeof tenantRegistrationSchema>;