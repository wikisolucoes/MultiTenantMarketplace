import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: varchar("subdomain", { length: 50 }).notNull().unique(),
  category: text("category").notNull(),
  status: text("status", { enum: ["active", "suspended", "pending"] }).notNull().default("pending"),
  // Tax configuration for NF-e
  cnpj: text("cnpj"),
  corporateName: text("corporate_name"),
  fantasyName: text("fantasy_name"),
  stateRegistration: text("state_registration"),
  cityRegistration: text("city_registration"),
  taxRegime: text("tax_regime", { enum: ["simples_nacional", "lucro_presumido", "lucro_real"] }),
  address: text("address"),
  addressNumber: text("address_number"),
  addressComplement: text("address_complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  // LGPD compliance
  privacyPolicy: text("privacy_policy"),
  termsOfService: text("terms_of_service"),
  cookiePolicy: text("cookie_policy"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (owners of tenants)
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

// Bank accounts table
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bank: text("bank").notNull(),
  agency: text("agency").notNull(),
  account: text("account").notNull(),
  accountType: text("account_type", { enum: ["checking", "savings"] }).notNull().default("checking"),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Celcoin accounts table
export const celcoinAccounts = pgTable("celcoin_accounts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  celcoinAccountId: text("celcoin_account_id").notNull().unique(),
  status: text("status", { enum: ["active", "pending", "suspended"] }).notNull().default("pending"),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  // Tax configuration for NF-e
  ncm: text("ncm"), // Nomenclatura Comum do Mercosul
  cest: text("cest"), // Código Especificador da Substituição Tributária
  cfop: text("cfop"), // Código Fiscal de Operações e Prestações
  icmsOrigin: text("icms_origin", { enum: ["0", "1", "2", "3", "4", "5", "6", "7", "8"] }),
  icmsCst: text("icms_cst"), // Código de Situação Tributária do ICMS
  icmsRate: decimal("icms_rate", { precision: 5, scale: 2 }),
  ipiCst: text("ipi_cst"), // Código de Situação Tributária do IPI
  ipiRate: decimal("ipi_rate", { precision: 5, scale: 2 }),
  pisCst: text("pis_cst"), // Código de Situação Tributária do PIS
  pisRate: decimal("pis_rate", { precision: 5, scale: 2 }),
  cofinsCst: text("cofins_cst"), // Código de Situação Tributária do COFINS
  cofinsRate: decimal("cofins_rate", { precision: 5, scale: 2 }),
  productUnit: text("product_unit").default("UN"), // Unidade do produto
  grossWeight: decimal("gross_weight", { precision: 10, scale: 3 }), // Peso bruto em kg
  netWeight: decimal("net_weight", { precision: 10, scale: 3 }), // Peso líquido em kg
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerDocument: text("customer_document"), // CPF/CNPJ
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  customerState: text("customer_state"),
  customerZipCode: text("customer_zip_code"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status", { enum: ["pending", "paid", "shipped", "delivered", "cancelled"] }).notNull().default("pending"),
  paymentMethod: text("payment_method", { enum: ["pix", "credit_card", "boleto"] }).notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  celcoinTransactionId: text("celcoin_transaction_id"),
  // NF-e fields
  nfeKey: text("nfe_key"), // Chave da NF-e
  nfeNumber: text("nfe_number"), // Número da NF-e
  nfeStatus: text("nfe_status", { enum: ["not_issued", "pending", "issued", "cancelled", "error"] }).default("not_issued"),
  nfeXml: text("nfe_xml"), // XML da NF-e
  nfeProtocol: text("nfe_protocol"), // Protocolo de autorização
  nfeErrorMessage: text("nfe_error_message"), // Mensagem de erro se houver
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  celcoinTransactionId: text("celcoin_transaction_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Financial Ledger System for Celcoin Operations
export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  entryType: text("entry_type", { 
    enum: ["debit", "credit"] 
  }).notNull(),
  transactionType: text("transaction_type", { 
    enum: ["sale", "withdrawal", "fee", "refund", "chargeback", "adjustment", "cash_in", "cash_out"] 
  }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  runningBalance: decimal("running_balance", { precision: 15, scale: 2 }).notNull(),
  referenceId: varchar("reference_id", { length: 100 }), // External transaction ID
  orderId: integer("order_id").references(() => orders.id),
  withdrawalId: integer("withdrawal_id").references(() => withdrawals.id),
  celcoinTransactionId: varchar("celcoin_transaction_id", { length: 100 }),
  description: text("description").notNull(),
  status: text("status", { 
    enum: ["pending", "confirmed", "failed", "reversed"] 
  }).notNull().default("pending"),
  metadata: jsonb("metadata"), // Additional transaction data
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  reversedAt: timestamp("reversed_at"),
});

// Account Balance Snapshots for audit trail
export const balanceSnapshots = pgTable("balance_snapshots", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  pendingBalance: decimal("pending_balance", { precision: 15, scale: 2 }).notNull(),
  lastLedgerEntryId: integer("last_ledger_entry_id").references(() => ledgerEntries.id),
  snapshotType: text("snapshot_type", { 
    enum: ["daily", "transaction", "reconciliation", "manual"] 
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Celcoin Transaction Log for API interactions
export const celcoinTransactionLog = pgTable("celcoin_transaction_log", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  externalTransactionId: varchar("external_transaction_id", { length: 100 }).notNull(),
  operationType: text("operation_type", { 
    enum: ["payment", "withdrawal", "balance_check", "account_creation", "webhook"] 
  }).notNull(),
  requestPayload: jsonb("request_payload").notNull(),
  responsePayload: jsonb("response_payload"),
  httpStatus: integer("http_status"),
  celcoinStatus: varchar("celcoin_status", { length: 50 }),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  fee: decimal("fee", { precision: 15, scale: 2 }),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }),
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  isSuccessful: boolean("is_successful").default(false),
  webhookReceived: boolean("webhook_received").default(false),
  webhookTimestamp: timestamp("webhook_timestamp"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Security Audit Log
export const securityAuditLog = pgTable("security_audit_log", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 100 }),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  riskScore: integer("risk_score"), // 1-100 risk assessment
  geoLocation: jsonb("geo_location"),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial Reconciliation Records
export const reconciliationRecords = pgTable("reconciliation_records", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  reconciliationType: text("reconciliation_type", { 
    enum: ["daily", "weekly", "monthly", "manual"] 
  }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  systemBalance: decimal("system_balance", { precision: 15, scale: 2 }).notNull(),
  celcoinBalance: decimal("celcoin_balance", { precision: 15, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 15, scale: 2 }).notNull(),
  transactionCount: integer("transaction_count").notNull(),
  discrepancies: jsonb("discrepancies"),
  status: text("status", { 
    enum: ["pending", "reconciled", "discrepancy_found", "resolved"] 
  }).notNull().default("pending"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rate Limiting for API calls
export const apiRateLimits = pgTable("api_rate_limits", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  requestCount: integer("request_count").default(0),
  windowStart: timestamp("window_start").defaultNow().notNull(),
  isBlocked: boolean("is_blocked").default(false),
  blockedUntil: timestamp("blocked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Legacy transactions table (deprecated in favor of ledger)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  type: text("type", { enum: ["sale", "withdrawal", "fee"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Plugin/Module system tables
export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  category: text("category", { enum: ["nfe", "integration", "import", "analytics", "marketing"] }).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  features: jsonb("features").notNull(), // Array of features this plugin provides
  requirements: jsonb("requirements"), // Technical requirements
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantPluginSubscriptions = pgTable("tenant_plugin_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  pluginId: integer("plugin_id").references(() => plugins.id).notNull(),
  status: text("status", { enum: ["active", "cancelled", "suspended", "trial"] }).notNull().default("trial"),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(true),
  lastBillingDate: timestamp("last_billing_date"),
  nextBillingDate: timestamp("next_billing_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  cancellationReason: text("cancellation_reason"),
  settings: jsonb("settings"), // Plugin-specific configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User sessions and LGPD compliance
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  cartData: jsonb("cart_data"), // Shopping cart contents
  userData: jsonb("user_data"), // Form data, preferences, etc
  cookieConsent: jsonb("cookie_consent"), // Cookie consent preferences
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cookieConsents = pgTable("cookie_consents", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").references(() => userSessions.sessionId).notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  consentGiven: boolean("consent_given").notNull(),
  consentTypes: jsonb("consent_types").notNull(), // { necessary: true, analytics: false, marketing: true }
  consentDate: timestamp("consent_date").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  withdrawnAt: timestamp("withdrawn_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NF-e (Electronic Invoice) tables
export const nfeConfigurations = pgTable("nfe_configurations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull().unique(),
  certificatePath: text("certificate_path"), // Path to A1 certificate
  certificatePassword: text("certificate_password"), // Encrypted certificate password
  environment: text("environment", { enum: ["homologacao", "producao"] }).notNull().default("homologacao"),
  serie: integer("serie").notNull().default(1), // Serie da NF-e
  lastNfeNumber: integer("last_nfe_number").notNull().default(0),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nfeDocuments = pgTable("nfe_documents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  nfeNumber: integer("nfe_number").notNull(),
  serie: integer("serie").notNull(),
  accessKey: text("access_key").notNull().unique(), // Chave de acesso
  status: text("status", { enum: ["draft", "sent", "authorized", "cancelled", "rejected"] }).notNull().default("draft"),
  xmlContent: text("xml_content"), // Generated XML
  danfeUrl: text("danfe_url"), // URL for DANFE PDF
  protocolNumber: text("protocol_number"), // Protocolo de autorização
  authorizationDate: timestamp("authorization_date"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// XML Import for purchase invoices
export const xmlImports = pgTable("xml_imports", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  fileName: text("file_name").notNull(),
  accessKey: text("access_key").notNull(),
  supplierCnpj: text("supplier_cnpj").notNull(),
  supplierName: text("supplier_name").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: timestamp("invoice_date").notNull(),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "processed", "error", "ignored"] }).notNull().default("pending"),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  xmlContent: text("xml_content").notNull(),
  productsData: jsonb("products_data"), // Extracted products data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Marketplace integrations
export const marketplaceIntegrations = pgTable("marketplace_integrations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  marketplace: text("marketplace", { enum: ["mercado_livre", "shopee", "amazon", "instagram", "google_shopping"] }).notNull(),
  isActive: boolean("is_active").notNull().default(false),
  credentials: jsonb("credentials"), // Encrypted API credentials
  settings: jsonb("settings"), // Integration-specific settings
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status", { enum: ["success", "error", "in_progress"] }),
  syncError: text("sync_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketplaceProducts = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  integrationId: integer("integration_id").references(() => marketplaceIntegrations.id).notNull(),
  externalId: text("external_id").notNull(), // Product ID on marketplace
  externalUrl: text("external_url"),
  isActive: boolean("is_active").notNull().default(true),
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status", { enum: ["success", "error", "pending"] }).notNull().default("pending"),
  syncError: text("sync_error"),
  marketplaceData: jsonb("marketplace_data"), // Marketplace-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(users, {
    fields: [tenants.id],
    references: [users.tenantId],
  }),
  celcoinAccount: one(celcoinAccounts),
  products: many(products),
  orders: many(orders),
  withdrawals: many(withdrawals),
  transactions: many(transactions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  bankAccounts: many(bankAccounts),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [bankAccounts.userId],
    references: [users.id],
  }),
  withdrawals: many(withdrawals),
}));

export const celcoinAccountsRelations = relations(celcoinAccounts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [celcoinAccounts.tenantId],
    references: [tenants.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  transactions: many(transactions),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  tenant: one(tenants, {
    fields: [withdrawals.tenantId],
    references: [tenants.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [withdrawals.bankAccountId],
    references: [bankAccounts.id],
  }),
}));

// Ledger relations
export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ledgerEntries.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [ledgerEntries.orderId],
    references: [orders.id],
  }),
  withdrawal: one(withdrawals, {
    fields: [ledgerEntries.withdrawalId],
    references: [withdrawals.id],
  }),
}));

export const balanceSnapshotsRelations = relations(balanceSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [balanceSnapshots.tenantId],
    references: [tenants.id],
  }),
  lastLedgerEntry: one(ledgerEntries, {
    fields: [balanceSnapshots.lastLedgerEntryId],
    references: [ledgerEntries.id],
  }),
}));

export const celcoinTransactionLogRelations = relations(celcoinTransactionLog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [celcoinTransactionLog.tenantId],
    references: [tenants.id],
  }),
}));

export const securityAuditLogRelations = relations(securityAuditLog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [securityAuditLog.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [securityAuditLog.userId],
    references: [users.id],
  }),
}));

export const reconciliationRecordsRelations = relations(reconciliationRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [reconciliationRecords.tenantId],
    references: [tenants.id],
  }),
  resolvedBy: one(users, {
    fields: [reconciliationRecords.resolvedBy],
    references: [users.id],
  }),
}));

export const apiRateLimitsRelations = relations(apiRateLimits, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiRateLimits.tenantId],
    references: [tenants.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [transactions.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
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
  isActive: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

// Ledger insert schemas
export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
  reversedAt: true,
});

export const insertBalanceSnapshotSchema = createInsertSchema(balanceSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertCelcoinTransactionLogSchema = createInsertSchema(celcoinTransactionLog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSecurityAuditLogSchema = createInsertSchema(securityAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertReconciliationRecordSchema = createInsertSchema(reconciliationRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New insert schemas for plugin system and LGPD compliance
export const insertPluginSchema = createInsertSchema(plugins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantPluginSubscriptionSchema = createInsertSchema(tenantPluginSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertCookieConsentSchema = createInsertSchema(cookieConsents).omit({
  id: true,
  createdAt: true,
});

export const insertNfeConfigurationSchema = createInsertSchema(nfeConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNfeDocumentSchema = createInsertSchema(nfeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertXmlImportSchema = createInsertSchema(xmlImports).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceIntegrationSchema = createInsertSchema(marketplaceIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceProductSchema = createInsertSchema(marketplaceProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Tenant registration schema
export const tenantRegistrationSchema = z.object({
  // Store data
  storeName: z.string().min(2, "Nome da loja deve ter pelo menos 2 caracteres"),
  subdomain: z.string().min(3, "Subdomínio deve ter pelo menos 3 caracteres").regex(/^[a-zA-Z0-9-]+$/, "Subdomínio deve conter apenas letras, números e hífens"),
  category: z.string().min(1, "Categoria é obrigatória"),
  
  // Owner data
  fullName: z.string().min(2, "Nome completo é obrigatório"),
  document: z.string().min(11, "CPF/CNPJ é obrigatório"),
  documentType: z.enum(["cpf", "cnpj"]),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  
  // Bank data
  bank: z.string().min(1, "Banco é obrigatório"),
  agency: z.string().min(1, "Agência é obrigatória"),
  account: z.string().min(1, "Conta é obrigatória"),
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type CelcoinAccount = typeof celcoinAccounts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type TenantRegistrationData = z.infer<typeof tenantRegistrationSchema>;

// Ledger types
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type BalanceSnapshot = typeof balanceSnapshots.$inferSelect;
export type InsertBalanceSnapshot = z.infer<typeof insertBalanceSnapshotSchema>;
export type CelcoinTransactionLog = typeof celcoinTransactionLog.$inferSelect;
export type InsertCelcoinTransactionLog = z.infer<typeof insertCelcoinTransactionLogSchema>;
export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type InsertSecurityAuditLog = z.infer<typeof insertSecurityAuditLogSchema>;
export type ReconciliationRecord = typeof reconciliationRecords.$inferSelect;
export type InsertReconciliationRecord = z.infer<typeof insertReconciliationRecordSchema>;
export type ApiRateLimit = typeof apiRateLimits.$inferSelect;

// Subscription plans for tenant billing
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  features: jsonb("features").notNull(), // JSON array of features
  maxProducts: integer("max_products").default(100),
  maxOrders: integer("max_orders").default(1000),
  maxStorage: integer("max_storage").default(1024), // MB
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tenant subscriptions
export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull().unique(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, cancelled, suspended, past_due
  billingCycle: varchar("billing_cycle", { length: 10 }).notNull().default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelledAt: timestamp("cancelled_at"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enhanced subscription system tables (replacing duplicates)

// New types for enhanced system
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type TenantSubscription = typeof tenantSubscriptions.$inferSelect;
export type InsertTenantSubscription = typeof tenantSubscriptions.$inferInsert;
export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = typeof plugins.$inferInsert;
export type TenantPluginSubscription = typeof tenantPluginSubscriptions.$inferSelect;
export type InsertTenantPluginSubscription = typeof tenantPluginSubscriptions.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type CookieConsent = typeof cookieConsents.$inferSelect;
export type InsertCookieConsent = typeof cookieConsents.$inferInsert;
export type NfeConfiguration = typeof nfeConfigurations.$inferSelect;
export type InsertNfeConfiguration = typeof nfeConfigurations.$inferInsert;
export type NfeDocument = typeof nfeDocuments.$inferSelect;
export type InsertNfeDocument = typeof nfeDocuments.$inferInsert;
export type XmlImport = typeof xmlImports.$inferSelect;
export type InsertXmlImport = typeof xmlImports.$inferInsert;
export type MarketplaceIntegration = typeof marketplaceIntegrations.$inferSelect;
export type InsertMarketplaceIntegration = typeof marketplaceIntegrations.$inferInsert;
export type MarketplaceProduct = typeof marketplaceProducts.$inferSelect;
export type InsertMarketplaceProduct = typeof marketplaceProducts.$inferInsert;

// Customer tables for storefront functionality
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  birthDate: timestamp("birth_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'home', 'work', 'other'
  name: varchar("name", { length: 100 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  street: varchar("street", { length: 255 }).notNull(),
  number: varchar("number", { length: 20 }).notNull(),
  complement: varchar("complement", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull(), // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  paymentStatus: varchar("payment_status", { length: 50 }).notNull(), // 'pending', 'paid', 'failed', 'refunded'
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text("shipping_address").notNull(), // JSON string
  trackingCode: varchar("tracking_code", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerOrderItems = pgTable("customer_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => customerOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  orderId: integer("order_id").references(() => customerOrders.id),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 200 }),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false), // verified purchase
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  parentId: integer("parent_id").references(() => productCategories.id),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productBrands = pgTable("product_brands", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  logo: varchar("logo", { length: 500 }),
  website: varchar("website", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").default(0),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productSpecifications = pgTable("product_specifications", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  group: varchar("group", { length: 100 }), // 'Dimensões', 'Características', etc.
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Additional relations for new tables
export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  addresses: many(customerAddresses),
  orders: many(customerOrders),
  wishlistItems: many(wishlist),
  reviews: many(productReviews),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));

export const customerOrdersRelations = relations(customerOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerOrders.customerId],
    references: [customers.id],
  }),
  tenant: one(tenants, {
    fields: [customerOrders.tenantId],
    references: [tenants.id],
  }),
  items: many(customerOrderItems),
}));

export const customerOrderItemsRelations = relations(customerOrderItems, ({ one }) => ({
  order: one(customerOrders, {
    fields: [customerOrderItems.orderId],
    references: [customerOrders.id],
  }),
  product: one(products, {
    fields: [customerOrderItems.productId],
    references: [products.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  customer: one(customers, {
    fields: [wishlist.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [productReviews.customerId],
    references: [customers.id],
  }),
  order: one(customerOrders, {
    fields: [productReviews.orderId],
    references: [customerOrders.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productCategories.tenantId],
    references: [tenants.id],
  }),
  parent: one(productCategories, {
    fields: [productCategories.parentId],
    references: [productCategories.id],
  }),
  children: many(productCategories),
}));

export const productBrandsRelations = relations(productBrands, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productBrands.tenantId],
    references: [tenants.id],
  }),
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

// Add new field to products table for enhanced e-commerce
export const productsExtended = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  categoryId: integer("category_id").references(() => productCategories.id),
  brandId: integer("brand_id").references(() => productBrands.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  sku: varchar("sku", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }), // original price for discounts
  cost: decimal("cost", { precision: 10, scale: 2 }), // cost price
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  weight: decimal("weight", { precision: 8, scale: 3 }), // in kg
  dimensions: jsonb("dimensions"), // {length, width, height}
  requiresShipping: boolean("requires_shipping").default(true),
  taxable: boolean("taxable").default(true),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: varchar("seo_description", { length: 500 }),
  tags: text("tags").array(), // product tags for search
  vendor: varchar("vendor", { length: 255 }),
  warranty: varchar("warranty", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, draft, archived
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enhanced relations for products
export const productsExtendedRelations = relations(productsExtended, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productsExtended.tenantId],
    references: [tenants.id],
  }),
  category: one(productCategories, {
    fields: [productsExtended.categoryId],
    references: [productCategories.id],
  }),
  brand: one(productBrands, {
    fields: [productsExtended.brandId],
    references: [productBrands.id],
  }),
  images: many(productImages),
  specifications: many(productSpecifications),
  reviews: many(productReviews),
  wishlistItems: many(wishlist),
  orderItems: many(customerOrderItems),
}));

// Insert schemas for new tables
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerOrderSchema = createInsertSchema(customerOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductBrandSchema = createInsertSchema(productBrands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type CustomerOrder = typeof customerOrders.$inferSelect;
export type InsertCustomerOrder = z.infer<typeof insertCustomerOrderSchema>;
export type CustomerOrderItem = typeof customerOrderItems.$inferSelect;
export type WishlistItem = typeof wishlist.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type ProductBrand = typeof productBrands.$inferSelect;
export type InsertProductBrand = z.infer<typeof insertProductBrandSchema>;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductSpecification = typeof productSpecifications.$inferSelect;

// Advanced E-commerce Features

// Coupons and Discount System
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: text("type", { enum: ["percentage", "fixed_amount", "free_shipping"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  userLimit: integer("user_limit").default(1),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true),
  applicableProducts: jsonb("applicable_products"), // Array of product IDs
  applicableCategories: jsonb("applicable_categories"), // Array of category IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gift Cards System
export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  initialValue: decimal("initial_value", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull(),
  purchaserEmail: varchar("purchaser_email", { length: 255 }),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientName: varchar("recipient_name", { length: 255 }),
  message: text("message"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
});

// Affiliate Program
export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  affiliateCode: varchar("affiliate_code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).default("0"),
  paidEarnings: decimal("paid_earnings", { precision: 15, scale: 2 }).default("0"),
  pendingEarnings: decimal("pending_earnings", { precision: 15, scale: 2 }).default("0"),
  totalSales: integer("total_sales").default(0),
  isActive: boolean("is_active").default(true),
  bankAccount: jsonb("bank_account"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Affiliate Commissions
export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  orderId: integer("order_id").references(() => customerOrders.id).notNull(),
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "approved", "paid", "cancelled"] }).default("pending"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Marketing Campaigns
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: text("type", { enum: ["email", "social", "display", "affiliate", "referral"] }).notNull(),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  utmTerm: varchar("utm_term", { length: 100 }),
  utmContent: varchar("utm_content", { length: 100 }),
  targetAudience: jsonb("target_audience"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Campaign Analytics
export const campaignAnalytics = pgTable("campaign_analytics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id).notNull(),
  orderId: integer("order_id").references(() => customerOrders.id),
  visitorId: varchar("visitor_id", { length: 100 }),
  event: text("event", { enum: ["impression", "click", "conversion", "purchase"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Newsletter Segments
export const newsletterSegments = pgTable("newsletter_segments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(),
  customerCount: integer("customer_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Newsletter Campaigns
export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  segmentId: integer("segment_id").references(() => newsletterSegments.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  unsubscribeCount: integer("unsubscribe_count").default(0),
  status: text("status", { enum: ["draft", "scheduled", "sending", "sent", "paused"] }).default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Points System
export const loyaltyPoints = pgTable("loyalty_points", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  points: integer("points").notNull(),
  type: text("type", { enum: ["earned", "redeemed", "expired", "bonus"] }).notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  orderId: integer("order_id").references(() => customerOrders.id),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product Promotions
export const productPromotions = pgTable("product_promotions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: text("type", { enum: ["percentage", "fixed_amount", "buy_x_get_y", "quantity_discount"] }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  productIds: jsonb("product_ids").notNull(),
  categoryIds: jsonb("category_ids"),
  minimumQuantity: integer("minimum_quantity").default(1),
  maximumQuantity: integer("maximum_quantity"),
  stackable: boolean("stackable").default(false),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shipping Methods
export const shippingMethods = pgTable("shipping_methods", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: text("type", { enum: ["fixed", "free", "weight_based", "item_based", "store_pickup", "melhor_envio"] }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  freeThreshold: decimal("free_threshold", { precision: 10, scale: 2 }),
  weightRates: jsonb("weight_rates"),
  itemRates: jsonb("item_rates"),
  estimatedDays: integer("estimated_days"),
  isActive: boolean("is_active").default(true),
  regions: jsonb("regions"), // Geographic regions where this method applies
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// SEO Management
export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  entityType: text("entity_type", { enum: ["product", "category", "page", "brand"] }).notNull(),
  entityId: integer("entity_id").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  keywords: text("keywords"),
  canonicalUrl: text("canonical_url"),
  ogTitle: varchar("og_title", { length: 255 }),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  structuredData: jsonb("structured_data"),
  customHead: text("custom_head"),
  isIndexable: boolean("is_indexable").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Imports/Updates
export const productImports = pgTable("product_imports", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  type: text("type", { enum: ["products", "stock", "prices"] }).notNull(),
  status: text("status", { enum: ["processing", "completed", "failed", "partial"] }).default("processing"),
  totalRows: integer("total_rows"),
  processedRows: integer("processed_rows").default(0),
  successRows: integer("success_rows").default(0),
  errorRows: integer("error_rows").default(0),
  errors: jsonb("errors"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer Segments for Marketing
export const customerSegments = pgTable("customer_segments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  rules: jsonb("rules").notNull(), // Segmentation rules
  customerCount: integer("customer_count").default(0),
  lastCalculated: timestamp("last_calculated"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Comparisons
export const productComparisons = pgTable("product_comparisons", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  sessionId: varchar("session_id", { length: 100 }),
  productIds: jsonb("product_ids").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Return/Refund System
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  orderId: integer("order_id").references(() => customerOrders.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  returnNumber: varchar("return_number", { length: 50 }).unique().notNull(),
  items: jsonb("items").notNull(), // Array of returned items with quantities
  reason: text("reason").notNull(),
  status: text("status", { enum: ["requested", "approved", "processing", "completed", "rejected"] }).default("requested"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundMethod: text("refund_method", { enum: ["original_payment", "store_credit", "gift_card"] }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Digital Product Downloads
export const digitalDownloads = pgTable("digital_downloads", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  orderId: integer("order_id").references(() => customerOrders.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  downloadLimit: integer("download_limit").default(5),
  downloadCount: integer("download_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastDownloadedAt: timestamp("last_downloaded_at"),
});

// Relations for advanced features
export const couponsRelations = relations(coupons, ({ one }) => ({
  tenant: one(tenants, {
    fields: [coupons.tenantId],
    references: [tenants.id],
  }),
}));

export const giftCardsRelations = relations(giftCards, ({ one }) => ({
  tenant: one(tenants, {
    fields: [giftCards.tenantId],
    references: [tenants.id],
  }),
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [affiliates.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id],
  }),
  commissions: many(affiliateCommissions),
}));

export const affiliateCommissionsRelations = relations(affiliateCommissions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [affiliateCommissions.tenantId],
    references: [tenants.id],
  }),
  affiliate: one(affiliates, {
    fields: [affiliateCommissions.affiliateId],
    references: [affiliates.id],
  }),
  order: one(customerOrders, {
    fields: [affiliateCommissions.orderId],
    references: [customerOrders.id],
  }),
}));

export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [marketingCampaigns.tenantId],
    references: [tenants.id],
  }),
  analytics: many(campaignAnalytics),
}));

export const campaignAnalyticsRelations = relations(campaignAnalytics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [campaignAnalytics.tenantId],
    references: [tenants.id],
  }),
  campaign: one(marketingCampaigns, {
    fields: [campaignAnalytics.campaignId],
    references: [marketingCampaigns.id],
  }),
  order: one(customerOrders, {
    fields: [campaignAnalytics.orderId],
    references: [customerOrders.id],
  }),
}));

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  tenant: one(tenants, {
    fields: [loyaltyPoints.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [loyaltyPoints.customerId],
    references: [customers.id],
  }),
  order: one(customerOrders, {
    fields: [loyaltyPoints.orderId],
    references: [customerOrders.id],
  }),
}));

export const productPromotionsRelations = relations(productPromotions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productPromotions.tenantId],
    references: [tenants.id],
  }),
}));

export const shippingMethodsRelations = relations(shippingMethods, ({ one }) => ({
  tenant: one(tenants, {
    fields: [shippingMethods.tenantId],
    references: [tenants.id],
  }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  tenant: one(tenants, {
    fields: [returns.tenantId],
    references: [tenants.id],
  }),
  order: one(customerOrders, {
    fields: [returns.orderId],
    references: [customerOrders.id],
  }),
  customer: one(customers, {
    fields: [returns.customerId],
    references: [customers.id],
  }),
}));

export const digitalDownloadsRelations = relations(digitalDownloads, ({ one }) => ({
  tenant: one(tenants, {
    fields: [digitalDownloads.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [digitalDownloads.productId],
    references: [products.id],
  }),
  order: one(customerOrders, {
    fields: [digitalDownloads.orderId],
    references: [customerOrders.id],
  }),
  customer: one(customers, {
    fields: [digitalDownloads.customerId],
    references: [customers.id],
  }),
}));

// Insert schemas for advanced features
export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductPromotionSchema = createInsertSchema(productPromotions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShippingMethodSchema = createInsertSchema(shippingMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for advanced features
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type CampaignAnalytics = typeof campaignAnalytics.$inferSelect;
export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;
export type ProductPromotion = typeof productPromotions.$inferSelect;
export type InsertProductPromotion = z.infer<typeof insertProductPromotionSchema>;
export type ShippingMethod = typeof shippingMethods.$inferSelect;
export type InsertShippingMethod = z.infer<typeof insertShippingMethodSchema>;
export type SeoSetting = typeof seoSettings.$inferSelect;
export type ProductImport = typeof productImports.$inferSelect;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type DigitalDownload = typeof digitalDownloads.$inferSelect;
