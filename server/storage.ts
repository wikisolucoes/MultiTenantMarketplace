import { 
  tenants, 
  users, 
  bankAccounts,
  celcoinAccounts,
  products,
  orders,
  withdrawals,
  transactions,
  type Tenant, 
  type User, 
  type InsertUser,
  type InsertTenant,
  type BankAccount,
  type InsertBankAccount,
  type CelcoinAccount,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Withdrawal,
  type InsertWithdrawal,
  type Transaction,
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
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getAllTenants(): Promise<Tenant[]>;
  
  // Tenant registration (complete flow)
  registerTenant(data: TenantRegistrationData): Promise<{ tenant: Tenant; user: User; bankAccount: BankAccount; celcoinAccount: CelcoinAccount }>;
  
  // Bank accounts
  createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount>;
  getBankAccountsByUserId(userId: number): Promise<BankAccount[]>;
  
  // Celcoin accounts
  createCelcoinAccount(tenantId: number, celcoinAccountId: string): Promise<CelcoinAccount>;
  getCelcoinAccountByTenantId(tenantId: number): Promise<CelcoinAccount | undefined>;
  updateCelcoinBalance(tenantId: number, balance: string): Promise<void>;
  
  // Products (tenant-scoped)
  getProductsByTenantId(tenantId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Orders (tenant-scoped)
  getOrdersByTenantId(tenantId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, paymentStatus?: string): Promise<Order>;
  
  // Withdrawals (tenant-scoped)
  getWithdrawalsByTenantId(tenantId: number): Promise<Withdrawal[]>;
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  updateWithdrawalStatus(id: number, status: string, celcoinTransactionId?: string, errorMessage?: string): Promise<Withdrawal>;
  
  // Financial stats
  getTenantFinancialStats(tenantId: number): Promise<{
    availableBalance: string;
    pendingBalance: string;
    monthlyWithdrawals: string;
    dailyWithdrawals: string;
    grossSales: string;
    netRevenue: string;
  }>;
  
  // Admin stats
  getAdminStats(): Promise<{
    totalStores: number;
    transactionVolume: string;
    platformRevenue: string;
    activeStores: number;
  }>;
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

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
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

  async registerTenant(data: TenantRegistrationData): Promise<{ tenant: Tenant; user: User; bankAccount: BankAccount; celcoinAccount: CelcoinAccount }> {
    return await db.transaction(async (tx) => {
      // Create tenant
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: data.storeName,
          subdomain: data.subdomain,
          category: data.category,
          status: "active"
        })
        .returning();

      // Create user (tenant owner)
      const [user] = await tx
        .insert(users)
        .values({
          email: data.email,
          password: data.password, // Will be hashed in the route handler
          fullName: data.fullName,
          document: data.document,
          documentType: data.documentType,
          phone: data.phone,
          role: "merchant",
          tenantId: tenant.id
        })
        .returning();

      // Create bank account
      const [bankAccount] = await tx
        .insert(bankAccounts)
        .values({
          userId: user.id,
          bank: data.bank,
          agency: data.agency,
          account: data.account,
          accountType: "checking",
          isDefault: true
        })
        .returning();

      // Create Celcoin account (mock ID for now)
      const celcoinAccountId = `CELCOIN_${tenant.id}_${Date.now()}`;
      const [celcoinAccount] = await tx
        .insert(celcoinAccounts)
        .values({
          tenantId: tenant.id,
          celcoinAccountId,
          status: "active",
          balance: "0.00"
        })
        .returning();

      return { tenant, user, bankAccount, celcoinAccount };
    });
  }

  async createBankAccount(insertBankAccount: InsertBankAccount): Promise<BankAccount> {
    const [bankAccount] = await db
      .insert(bankAccounts)
      .values(insertBankAccount)
      .returning();
    return bankAccount;
  }

  async getBankAccountsByUserId(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createCelcoinAccount(tenantId: number, celcoinAccountId: string): Promise<CelcoinAccount> {
    const [celcoinAccount] = await db
      .insert(celcoinAccounts)
      .values({
        tenantId,
        celcoinAccountId,
        status: "active",
        balance: "0.00"
      })
      .returning();
    return celcoinAccount;
  }

  async getCelcoinAccountByTenantId(tenantId: number): Promise<CelcoinAccount | undefined> {
    const [celcoinAccount] = await db.select().from(celcoinAccounts).where(eq(celcoinAccounts.tenantId, tenantId));
    return celcoinAccount || undefined;
  }

  async updateCelcoinBalance(tenantId: number, balance: string): Promise<void> {
    await db
      .update(celcoinAccounts)
      .set({ balance, updatedAt: new Date() })
      .where(eq(celcoinAccounts.tenantId, tenantId));
  }

  async getProductsByTenantId(tenantId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.tenantId, tenantId));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async getOrdersByTenantId(tenantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.tenantId, tenantId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string, paymentStatus?: string): Promise<Order> {
    const updateData: any = { status, updatedAt: new Date() };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getWithdrawalsByTenantId(tenantId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.tenantId, tenantId)).orderBy(desc(withdrawals.createdAt));
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values(insertWithdrawal)
      .returning();
    return withdrawal;
  }

  async updateWithdrawalStatus(id: number, status: string, celcoinTransactionId?: string, errorMessage?: string): Promise<Withdrawal> {
    const updateData: any = { status, updatedAt: new Date() };
    if (celcoinTransactionId) {
      updateData.celcoinTransactionId = celcoinTransactionId;
    }
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    
    const [withdrawal] = await db
      .update(withdrawals)
      .set(updateData)
      .where(eq(withdrawals.id, id))
      .returning();
    return withdrawal;
  }

  async getTenantFinancialStats(tenantId: number): Promise<{
    availableBalance: string;
    pendingBalance: string;
    monthlyWithdrawals: string;
    dailyWithdrawals: string;
    grossSales: string;
    netRevenue: string;
  }> {
    const celcoinAccount = await this.getCelcoinAccountByTenantId(tenantId);
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Get monthly withdrawals
    const monthlyWithdrawalsResult = await db
      .select({ total: sum(withdrawals.amount) })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.tenantId, tenantId),
          eq(withdrawals.status, "completed")
        )
      );

    // Get daily withdrawals
    const dailyWithdrawalsResult = await db
      .select({ total: sum(withdrawals.amount) })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.tenantId, tenantId),
          eq(withdrawals.status, "completed")
        )
      );

    // Get gross sales (this month)
    const grossSalesResult = await db
      .select({ total: sum(orders.total) })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.paymentStatus, "paid")
        )
      );

    return {
      availableBalance: celcoinAccount?.balance || "0.00",
      pendingBalance: "0.00", // Would be calculated from pending orders
      monthlyWithdrawals: monthlyWithdrawalsResult[0]?.total || "0.00",
      dailyWithdrawals: dailyWithdrawalsResult[0]?.total || "0.00",
      grossSales: grossSalesResult[0]?.total || "0.00",
      netRevenue: grossSalesResult[0]?.total || "0.00", // Simplified
    };
  }

  async getAdminStats(): Promise<{
    totalStores: number;
    transactionVolume: string;
    platformRevenue: string;
    activeStores: number;
  }> {
    const totalStoresResult = await db.select({ count: count() }).from(tenants);
    const activeStoresResult = await db.select({ count: count() }).from(tenants).where(eq(tenants.status, "active"));
    const transactionVolumeResult = await db.select({ total: sum(orders.total) }).from(orders).where(eq(orders.paymentStatus, "paid"));

    const totalStores = totalStoresResult[0]?.count || 0;
    const activeStores = activeStoresResult[0]?.count || 0;
    const transactionVolume = transactionVolumeResult[0]?.total || "0.00";
    
    // Platform revenue is 2% of transaction volume
    const platformRevenue = (parseFloat(transactionVolume) * 0.02).toFixed(2);

    return {
      totalStores,
      transactionVolume,
      platformRevenue,
      activeStores,
    };
  }
}

export const storage = new DatabaseStorage();
