import { 
  tenants, 
  users, 
  products,
  orders,
  customers,
  type Tenant, 
  type User, 
  type InsertUser,
  type InsertTenant,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Customer,
  type InsertCustomer
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByTenantId(tenantId: number): Promise<User[]>;
  
  // Tenant management
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getAllTenants(): Promise<Tenant[]>;
  
  // Products (tenant-scoped)
  getProductsByTenantId(tenantId: number): Promise<Product[]>;
  getProduct(id: number, tenantId: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, tenantId: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number, tenantId: number): Promise<void>;
  
  // Orders (tenant-scoped)
  getOrdersByTenantId(tenantId: number): Promise<Order[]>;
  getOrder(id: number, tenantId: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  
  // Customers (tenant-scoped)
  getCustomersByTenantId(tenantId: number): Promise<Customer[]>;
  getCustomer(id: number, tenantId: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsersByTenantId(tenantId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  // Tenant operations
  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, domain));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants);
  }

  // Product operations
  async getProductsByTenantId(tenantId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.tenantId, tenantId));
  }

  async getProduct(id: number, tenantId: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, tenantId: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db.update(products)
      .set(product)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number, tenantId: number): Promise<void> {
    await db.delete(products)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
  }

  // Order operations
  async getOrdersByTenantId(tenantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.tenantId, tenantId));
  }

  async getOrder(id: number, tenantId: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db.update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Customer operations
  async getCustomersByTenantId(tenantId: number): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.tenantId, tenantId));
  }

  async getCustomer(id: number, tenantId: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db.update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }
}

export const storage = new DatabaseStorage();