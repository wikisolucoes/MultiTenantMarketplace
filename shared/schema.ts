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
  subdomain: varchar("subdomain", { length: 255 }).unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // Theme and customization settings
  activeTheme: varchar("active_theme", { length: 50 }).default("modern").notNull(),
  logo: text("logo"), // Logo URL
  favicon: text("favicon"), // Favicon URL
  primaryColor: varchar("primary_color", { length: 7 }).default("#0891b2"), // Hex color
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#0e7490"),
  accentColor: varchar("accent_color", { length: 7 }).default("#06b6d4"),
  // Store configuration
  storeDescription: text("store_description"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  address: jsonb("address"), // Full address object
  socialLinks: jsonb("social_links"), // Instagram, Facebook, etc.
  businessHours: jsonb("business_hours"), // Opening hours
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
  // Profile and permissions
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true).notNull(),
  permissions: jsonb("permissions"), // Array of permission strings
  lastLoginAt: timestamp("last_login_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User profiles with additional details and permissions
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  accessLevel: varchar("access_level", { length: 50 }).default("limited").notNull(), // 'full', 'limited', 'readonly'
  departmentId: integer("department_id"),
  jobTitle: varchar("job_title", { length: 255 }),
  // Specific permissions
  canManageProducts: boolean("can_manage_products").default(false).notNull(),
  canManageOrders: boolean("can_manage_orders").default(false).notNull(),
  canViewFinancials: boolean("can_view_financials").default(false).notNull(),
  canManageUsers: boolean("can_manage_users").default(false).notNull(),
  canManageSettings: boolean("can_manage_settings").default(false).notNull(),
  canManageThemes: boolean("can_manage_themes").default(false).notNull(),
  canManageBanners: boolean("can_manage_banners").default(false).notNull(),
  canAccessSupport: boolean("can_access_support").default(true).notNull(),
  // Activity tracking
  lastActivityAt: timestamp("last_activity_at"),
  loginAttempts: integer("login_attempts").default(0).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support ticket system
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 50 }).unique().notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'bug', 'feature', 'support', 'billing', 'technical'
  priority: varchar("priority", { length: 20 }).default("medium").notNull(), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status", { length: 20 }).default("open").notNull(), // 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
  assignedTo: integer("assigned_to"), // Support team member ID (optional)
  attachments: jsonb("attachments"), // Array of file URLs/paths
  tags: jsonb("tags"), // Array of tags for categorization
  // Customer satisfaction
  satisfactionRating: integer("satisfaction_rating"), // 1-5 stars
  satisfactionComment: text("satisfaction_comment"),
  // Tracking
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  lastUpdatedBy: integer("last_updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support ticket messages/comments
export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // 'user', 'support', 'system'
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  attachments: jsonb("attachments"), // Array of file URLs/paths
  isInternal: boolean("is_internal").default(false).notNull(), // Internal notes for support team
  messageType: varchar("message_type", { length: 20 }).default("reply").notNull(), // 'reply', 'note', 'status_change'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer accounts for storefront
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 20 }),
  birthDate: timestamp("birth_date"),
  gender: varchar("gender", { length: 20 }), // 'masculino', 'feminino', 'outro'
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  // 2FA fields
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  twoFactorBackupCodes: jsonb("two_factor_backup_codes"), // Array of backup codes
  twoFactorLastUsed: timestamp("two_factor_last_used"),
  // Security fields
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockoutUntil: timestamp("lockout_until"),
  // Social login fields
  googleId: varchar("google_id", { length: 255 }),
  appleId: varchar("apple_id", { length: 255 }),
  facebookId: varchar("facebook_id", { length: 255 }),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer login sessions for enhanced security
export const customerSessions = pgTable("customer_sessions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  deviceInfo: jsonb("device_info"), // Browser, OS, device type
  ipAddress: varchar("ip_address", { length: 45 }),
  location: varchar("location", { length: 255 }), // City, country
  isActive: boolean("is_active").default(true).notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer security events log
export const customerSecurityEvents = pgTable("customer_security_events", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'login', 'password_change', '2fa_enabled', 'suspicious_activity'
  description: text("description"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional event-specific data
  severity: varchar("severity", { length: 20 }).default("info").notNull(), // 'info', 'warning', 'critical'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Theme banners/carousel management
export const storefrontBanners = pgTable("storefront_banners", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  mobileImageUrl: text("mobile_image_url"), // Optional mobile-specific image
  linkUrl: text("link_url"), // Where banner links to
  linkText: varchar("link_text", { length: 100 }), // CTA text
  position: integer("position").default(0).notNull(), // Display order
  isActive: boolean("is_active").default(true).notNull(),
  showOnThemes: jsonb("show_on_themes").default(['modern', 'classic', 'minimal', 'bold', 'elegant']), // Which themes to show on
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  clickCount: integer("click_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Theme customization sections
export const themeCustomizations = pgTable("theme_customizations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  themeName: varchar("theme_name", { length: 50 }).notNull(), // 'modern', 'classic', etc.
  sectionName: varchar("section_name", { length: 50 }).notNull(), // 'hero', 'features', 'testimonials', etc.
  isEnabled: boolean("is_enabled").default(true).notNull(),
  position: integer("position").default(0).notNull(),
  content: jsonb("content").notNull(), // Section-specific content and settings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer addresses
export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'billing', 'shipping', 'both'
  isDefault: boolean("is_default").default(false).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).default("Brasil").notNull(),
  phone: varchar("phone", { length: 20 }),
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
  customers: many(customers),
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

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  addresses: many(customerAddresses),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
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

// Customer schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const customerRegisterSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["masculino", "feminino", "outro"]).optional(),
});

export const socialLoginSchema = z.object({
  provider: z.enum(["google", "apple", "facebook"]),
  providerId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
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

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;

export type StorefrontBanner = typeof storefrontBanners.$inferSelect;
export type InsertStorefrontBanner = typeof storefrontBanners.$inferInsert;

export type ThemeCustomization = typeof themeCustomizations.$inferSelect;
export type InsertThemeCustomization = typeof themeCustomizations.$inferInsert;

// User profile and support ticket schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles);
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ 
  id: true, 
  ticketNumber: true,
  createdAt: true, 
  updatedAt: true 
});
export const insertSupportTicketMessageSchema = createInsertSchema(supportTicketMessages).omit({ 
  id: true, 
  createdAt: true 
});

// Additional schemas for user management
export const userPermissionSchema = z.object({
  canManageProducts: z.boolean().default(false),
  canManageOrders: z.boolean().default(false),
  canViewFinancials: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canManageSettings: z.boolean().default(false),
  canManageThemes: z.boolean().default(false),
  canManageBanners: z.boolean().default(false),
  canAccessSupport: z.boolean().default(true),
});

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  document: z.string().min(11, "Documento inválido"),
  documentType: z.enum(["cpf", "cnpj"]),
  phone: z.string().optional(),
  role: z.enum(["admin", "merchant"]).default("merchant"),
  jobTitle: z.string().optional(),
  accessLevel: z.enum(["full", "limited", "readonly"]).default("limited"),
  permissions: userPermissionSchema,
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.number(),
  isActive: z.boolean().optional(),
});

export const supportTicketCreateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  category: z.enum(["bug", "feature", "support", "billing", "technical"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const supportTicketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting_response", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.number().optional(),
  satisfactionRating: z.number().min(1).max(5).optional(),
  satisfactionComment: z.string().optional(),
});

export const supportMessageCreateSchema = z.object({
  message: z.string().min(1, "Mensagem é obrigatória"),
  attachments: z.array(z.string()).optional(),
  isInternal: z.boolean().default(false),
  messageType: z.enum(["reply", "note", "status_change"]).default("reply"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type TenantRegistrationData = z.infer<typeof tenantRegistrationSchema>;
export type CustomerLoginData = z.infer<typeof customerLoginSchema>;
export type CustomerRegisterData = z.infer<typeof customerRegisterSchema>;
export type SocialLoginData = z.infer<typeof socialLoginSchema>;

// User profile types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type UserPermissions = z.infer<typeof userPermissionSchema>;

// Support ticket types
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = z.infer<typeof insertSupportTicketMessageSchema>;
export type CreateSupportTicketData = z.infer<typeof supportTicketCreateSchema>;
export type UpdateSupportTicketData = z.infer<typeof supportTicketUpdateSchema>;
export type CreateSupportMessageData = z.infer<typeof supportMessageCreateSchema>;