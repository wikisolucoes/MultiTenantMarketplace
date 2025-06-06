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
  date,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core tenant table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subdomain: varchar("subdomain", { length: 255 }).unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  activeTheme: varchar("active_theme", { length: 50 }).default("modern").notNull(),
  logo: text("logo"),
  favicon: text("favicon"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#0891b2"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#0e7490"),
  accentColor: varchar("accent_color", { length: 7 }).default("#06b6d4"),
  storeDescription: text("store_description"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  address: jsonb("address"),
  socialLinks: jsonb("social_links"),
  businessHours: jsonb("business_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  document: text("document"),
  documentType: text("document_type"),
  phone: text("phone"),
  role: text("role"),
  tenantId: integer("tenant_id"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  profileImage: text("profile_image"),
  lastLoginAt: timestamp("last_login_at"),
  permissions: jsonb("permissions"),
  createdBy: integer("created_by"),
});

// API credentials for public API access
export const apiCredentials = pgTable("api_credentials", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  apiKey: varchar("api_key", { length: 255 }).unique().notNull(),
  secretHash: varchar("secret_hash", { length: 255 }).notNull(),
  permissions: jsonb("permissions").notNull(),
  rateLimit: integer("rate_limit").default(1000).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// API rate limits
export const apiRateLimits = pgTable("api_rate_limits", {
  id: serial("id").primaryKey(),
  credentialId: integer("credential_id").references(() => apiCredentials.id).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  requestCount: integer("request_count").default(0).notNull(),
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API usage logs
export const apiUsageLogs = pgTable("api_usage_logs", {
  id: serial("id").primaryKey(),
  credentialId: integer("credential_id").references(() => apiCredentials.id).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  requestSize: integer("request_size"),
  responseSize: integer("response_size"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Balance snapshots
export const balanceSnapshots = pgTable("balance_snapshots", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  snapshotDate: date("snapshot_date").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  availableBalance: decimal("available_balance", { precision: 15, scale: 2 }).notNull(),
  blockedBalance: decimal("blocked_balance", { precision: 15, scale: 2 }).notNull(),
  totalIncoming: decimal("total_incoming", { precision: 15, scale: 2 }).notNull(),
  totalOutgoing: decimal("total_outgoing", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bank accounts
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  accountType: varchar("account_type", { length: 20 }).notNull(),
  bankCode: varchar("bank_code", { length: 10 }).notNull(),
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  agencyNumber: varchar("agency_number", { length: 10 }).notNull(),
  accountNumber: varchar("account_number", { length: 20 }).notNull(),
  accountDigit: varchar("account_digit", { length: 2 }),
  accountHolderName: varchar("account_holder_name", { length: 255 }).notNull(),
  accountHolderDocument: varchar("account_holder_document", { length: 20 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  verificationStatus: varchar("verification_status", { length: 20 }).default("pending").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Celcoin accounts
export const celcoinAccounts = pgTable("celcoin_accounts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  celcoinAccountId: varchar("celcoin_account_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  blockedBalance: decimal("blocked_balance", { precision: 15, scale: 2 }).default("0").notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  syncFrequency: integer("sync_frequency").default(300).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Celcoin transaction log
export const celcoinTransactionLog = pgTable("celcoin_transaction_log", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  celcoinTransactionId: varchar("celcoin_transaction_id", { length: 255 }).notNull(),
  correlationId: varchar("correlation_id", { length: 255 }).notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  pixKey: varchar("pix_key", { length: 255 }),
  boletoLine: text("boleto_line"),
  qrCode: text("qr_code"),
  expiresAt: timestamp("expires_at"),
  paidAt: timestamp("paid_at"),
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer addresses
export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  type: varchar("type", { length: 20 }).default("shipping").notNull(),
  label: varchar("label", { length: 50 }),
  street: varchar("street", { length: 255 }).notNull(),
  number: varchar("number", { length: 20 }).notNull(),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
  country: varchar("country", { length: 2 }).default("BR").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer order items
export const customerOrderItems = pgTable("customer_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => customerOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productSku: varchar("product_sku", { length: 100 }),
  productImage: text("product_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customer orders
export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending").notNull(),
  shippingStatus: varchar("shipping_status", { length: 20 }).default("pending").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentId: varchar("payment_id", { length: 255 }),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  notes: text("notes"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customers
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
  gender: varchar("gender", { length: 20 }),
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: varchar("two_factor_secret", { length: 32 }),
  backupCodes: jsonb("backup_codes"),
  preferences: jsonb("preferences"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  loginCount: integer("login_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email notifications
export const emailNotifications = pgTable("email_notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateId: varchar("template_id", { length: 100 }),
  templateData: jsonb("template_data"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ledger entries
export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull(),
  entryType: varchar("entry_type", { length: 20 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: varchar("reference_id", { length: 255 }),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NFe configurations
export const nfeConfigurations = pgTable("nfe_configurations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  certificateP12: text("certificate_p12"),
  certificatePassword: varchar("certificate_password", { length: 255 }),
  environment: varchar("environment", { length: 20 }).default("homologacao").notNull(),
  cnpj: varchar("cnpj", { length: 20 }).notNull(),
  inscricaoEstadual: varchar("inscricao_estadual", { length: 50 }),
  razaoSocial: varchar("razao_social", { length: 255 }).notNull(),
  nomeFantasia: varchar("nome_fantasia", { length: 255 }),
  endereco: jsonb("endereco").notNull(),
  lastSequenceNumber: integer("last_sequence_number").default(0).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id"),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  total: varchar("total", { length: 20 }).notNull(),
  subtotal: varchar("subtotal", { length: 20 }),
  taxAmount: varchar("tax_amount", { length: 20 }),
  shippingAmount: varchar("shipping_amount", { length: 20 }),
  discountAmount: varchar("discount_amount", { length: 20 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  customerName: varchar("customer_name", { length: 255 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  refundAmount: varchar("refund_amount", { length: 20 }),
  refundedAt: timestamp("refunded_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plan plugins
export const planPlugins = pgTable("plan_plugins", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  pluginId: integer("plugin_id").references(() => plugins.id).notNull(),
  isIncluded: boolean("is_included").default(true).notNull(),
  maxUsage: integer("max_usage"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Platform features
export const platformFeatures = pgTable("platform_features", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  rolloutPercentage: integer("rollout_percentage").default(0).notNull(),
  targetTenants: jsonb("target_tenants"),
  metadata: jsonb("metadata"),
  createdBy: integer("created_by").references(() => users.id),
  enabledBy: integer("enabled_by").references(() => users.id),
  enabledAt: timestamp("enabled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Platform maintenance
export const platformMaintenance = pgTable("platform_maintenance", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  maintenanceType: varchar("maintenance_type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).default("low").notNull(),
  affectedServices: jsonb("affected_services"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  status: varchar("status", { length: 20 }).default("scheduled").notNull(),
  notifyUsers: boolean("notify_users").default(true).notNull(),
  showBanner: boolean("show_banner").default(false).notNull(),
  bannerMessage: text("banner_message"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Platform settings
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value"),
  dataType: varchar("data_type", { length: 20 }).default("string").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  description: text("description"),
  validationRules: jsonb("validation_rules"),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plugin plans
export const pluginPlans = pgTable("plugin_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).default("subscription").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }),
  features: jsonb("features"),
  maxUsers: integer("max_users"),
  maxStorage: bigint("max_storage", { mode: 'number' }),
  maxApiCalls: integer("max_api_calls"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plugin subscription history
export const pluginSubscriptionHistory = pgTable("plugin_subscription_history", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => pluginSubscriptions.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  reason: text("reason"),
  oldStatus: varchar("old_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  metadata: jsonb("metadata"),
  performedBy: integer("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Plugin subscriptions
export const pluginSubscriptions = pgTable("plugin_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  pluginId: integer("plugin_id").references(() => plugins.id).notNull(),
  planId: integer("plan_id").references(() => pluginPlans.id),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }),
  autoRenew: boolean("auto_renew").default(true).notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plugin usage
export const pluginUsage = pgTable("plugin_usage", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  pluginId: integer("plugin_id").references(() => plugins.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => pluginSubscriptions.id),
  usageType: varchar("usage_type", { length: 50 }).notNull(),
  amount: integer("amount").default(1).notNull(),
  unit: varchar("unit", { length: 20 }).default("count").notNull(),
  metadata: jsonb("metadata"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Plugins
export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  version: varchar("version", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  developer: varchar("developer", { length: 255 }).notNull(),
  developerWebsite: varchar("developer_website", { length: 255 }),
  supportEmail: varchar("support_email", { length: 255 }),
  icon: varchar("icon", { length: 255 }),
  screenshots: jsonb("screenshots"),
  features: jsonb("features"),
  requirements: jsonb("requirements"),
  price: decimal("price", { precision: 10, scale: 2 }),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  hasFreeTrial: boolean("has_free_trial").default(false),
  trialDays: integer("trial_days"),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false),
  downloadCount: integer("download_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product brands
export const productBrands = pgTable("product_brands", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  website: varchar("website", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  image: text("image"),
  icon: varchar("icon", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product images
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id),
  url: text("url").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  fileSize: integer("file_size"),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product reviews
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  reportCount: integer("report_count").default(0).notNull(),
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product specifications
export const productSpecifications = pgTable("product_specifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: text("value").notNull(),
  unit: varchar("unit", { length: 50 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isHighlight: boolean("is_highlight").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product variants
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  barcode: varchar("barcode", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 3 }),
  weightUnit: varchar("weight_unit", { length: 10 }).default("kg"),
  dimensions: jsonb("dimensions"),
  stock: integer("stock").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  trackQuantity: boolean("track_quantity").default(true).notNull(),
  allowBackorder: boolean("allow_backorder").default(false).notNull(),
  requiresShipping: boolean("requires_shipping").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  variantOptions: jsonb("variant_options"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  name: text("name"),
  description: text("description"),
  price: decimal("price"),
  stock: integer("stock"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  categoryId: integer("category_id"),
  brandId: integer("brand_id"),
  ncm: varchar("ncm"),
  cest: varchar("cest"),
  cfop: varchar("cfop"),
  icmsOrigin: varchar("icms_origin"),
  icmsCst: varchar("icms_cst"),
  icmsRate: decimal("icms_rate"),
  ipiCst: varchar("ipi_cst"),
  ipiRate: decimal("ipi_rate"),
  pisCst: varchar("pis_cst"),
  pisRate: decimal("pis_rate"),
  cofinsCst: varchar("cofins_cst"),
  cofinsRate: decimal("cofins_rate"),
  productUnit: varchar("product_unit"),
  grossWeight: decimal("gross_weight"),
  netWeight: decimal("net_weight"),
  slug: varchar("slug"),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  promotionalPrice: decimal("promotional_price"),
  promotionalStartDate: timestamp("promotional_start_date"),
  promotionalEndDate: timestamp("promotional_end_date"),
  priceB2b: decimal("price_b2b"),
  priceB2c: decimal("price_b2c"),
  rewardPointsB2b: integer("reward_points_b2b"),
  rewardPointsB2c: integer("reward_points_b2c"),
  availabilityDate: timestamp("availability_date"),
  requiresShipping: boolean("requires_shipping"),
  isDigital: boolean("is_digital"),
  hasUnlimitedStock: boolean("has_unlimited_stock"),
  sku: varchar("sku"),
  compareAtPrice: decimal("compare_at_price"),
  costPrice: decimal("cost_price"),
  minStock: integer("min_stock"),
  maxStock: integer("max_stock"),
  isFeatured: boolean("is_featured"),
  tags: text("tags"),
  weight: decimal("weight"),
  dimensionsLength: decimal("dimensions_length"),
  dimensionsWidth: decimal("dimensions_width"),
  dimensionsHeight: decimal("dimensions_height"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  taxClass: varchar("tax_class", { length: 50 }),
  ncmCode: varchar("ncm_code", { length: 20 }),
  cfopCode: varchar("cfop_code", { length: 10 }),
  viewCount: integer("view_count").default(0),
  orderCount: integer("order_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reconciliation records
export const reconciliationRecords = pgTable("reconciliation_records", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  recordDate: date("record_date").notNull(),
  recordType: varchar("record_type", { length: 50 }).notNull(),
  platformBalance: decimal("platform_balance", { precision: 15, scale: 2 }).notNull(),
  celcoinBalance: decimal("celcoin_balance", { precision: 15, scale: 2 }).notNull(),
  discrepancy: decimal("discrepancy", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  notes: text("notes"),
  reconciledBy: integer("reconciled_by").references(() => users.id),
  reconciledAt: timestamp("reconciled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security audit log
export const securityAuditLog = pgTable("security_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tenantId: integer("tenant_id").references(() => tenants.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: varchar("resource_id", { length: 255 }),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  severity: varchar("severity", { length: 20 }).default("info").notNull(),
  status: varchar("status", { length: 20 }).default("success").notNull(),
  errorMessage: text("error_message"),
  sessionId: varchar("session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull(),
  trialDays: integer("trial_days").default(0).notNull(),
  features: jsonb("features"),
  limits: jsonb("limits"),
  isActive: boolean("is_active").default(true).notNull(),
  isPopular: boolean("is_popular").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support FAQs
export const supportFaqs = pgTable("support_faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  tags: jsonb("tags"),
  isPublished: boolean("is_published").default(true).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  notHelpfulCount: integer("not_helpful_count").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support ticket messages
export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  senderType: varchar("sender_type", { length: 20 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  attachments: jsonb("attachments"),
  isInternal: boolean("is_internal").default(false).notNull(),
  messageType: varchar("message_type", { length: 20 }).default("reply").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 50 }).unique().notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 20 }).default("medium").notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  assignedTo: integer("assigned_to"),
  attachments: jsonb("attachments"),
  tags: jsonb("tags"),
  satisfactionRating: integer("satisfaction_rating"),
  satisfactionComment: text("satisfaction_comment"),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  lastUpdatedBy: integer("last_updated_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tenant plugin subscriptions
export const tenantPluginSubscriptions = pgTable("tenant_plugin_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  pluginId: integer("plugin_id").references(() => plugins.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => pluginSubscriptions.id),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
  deactivatedAt: timestamp("deactivated_at"),
  config: jsonb("config"),
  usage: jsonb("usage"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tenant subscriptions
export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }).notNull(),
  autoRenew: boolean("auto_renew").default(true).notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  lastPaymentAt: timestamp("last_payment_at"),
  nextPaymentAt: timestamp("next_payment_at"),
  failedPaymentCount: integer("failed_payment_count").default(0).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  transactionId: varchar("transaction_id", { length: 255 }).unique().notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  feeAmount: decimal("fee_amount", { precision: 15, scale: 2 }),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }),
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 255 }),
  gatewayResponse: jsonb("gateway_response"),
  description: text("description"),
  metadata: jsonb("metadata"),
  processedAt: timestamp("processed_at"),
  settledAt: timestamp("settled_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User profiles
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  accessLevel: varchar("access_level", { length: 50 }).default("limited").notNull(),
  departmentId: integer("department_id"),
  jobTitle: varchar("job_title", { length: 255 }),
  canManageProducts: boolean("can_manage_products").default(false).notNull(),
  canManageOrders: boolean("can_manage_orders").default(false).notNull(),
  canViewFinancials: boolean("can_view_financials").default(false).notNull(),
  canManageUsers: boolean("can_manage_users").default(false).notNull(),
  canManageSettings: boolean("can_manage_settings").default(false).notNull(),
  canManageThemes: boolean("can_manage_themes").default(false).notNull(),
  canManageBanners: boolean("can_manage_banners").default(false).notNull(),
  canAccessSupport: boolean("can_access_support").default(true).notNull(),
  lastActivityAt: timestamp("last_activity_at"),
  loginAttempts: integer("login_attempts").default(0).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wishlist
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantId: integer("variant_id").references(() => productVariants.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Withdrawals
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  requestedBy: integer("requested_by").references(() => users.id).notNull(),
  processedBy: integer("processed_by").references(() => users.id),
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 255 }),
  gatewayResponse: jsonb("gateway_response"),
  feeAmount: decimal("fee_amount", { precision: 15, scale: 2 }),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// Zod schemas
export const insertTenantSchema = createInsertSchema(tenants);
export const insertUserSchema = createInsertSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertCustomerSchema = createInsertSchema(customers);

// Relations would go here...