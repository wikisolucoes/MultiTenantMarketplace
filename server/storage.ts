import { 
  tenants, 
  users, 
  userProfiles,
  supportTickets,
  supportTicketMessages,
  brands,
  productCategories,
  products,
  productImages,
  productSpecifications,
  productPromotions,
  bulkPricingRules,
  orders,
  notifications,
  notificationPreferences,
  customers,
  customerAddresses,
  apiCredentials,
  apiUsageLogs,
  type Tenant, 
  type User, 
  type InsertUser,
  type InsertTenant,
  type UserProfile,
  type InsertUserProfile,
  type CreateUserData,
  type UpdateUserData,
  type SupportTicket,
  type InsertSupportTicket,
  type CreateSupportTicketData,
  type UpdateSupportTicketData,
  type ApiCredential,
  type InsertApiCredential,
  type ApiUsageLog,
  type InsertApiUsageLog,
  type SupportTicketMessage,
  type InsertSupportTicketMessage,
  type CreateSupportMessageData,
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
  type Notification,
  type InsertNotification,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type Customer,
  type InsertCustomer,
  type CustomerAddress,
  type InsertCustomerAddress,
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
  getOrderWithDetails(id: number, tenantId: number): Promise<Order & { 
    items: OrderItem[];
    history: OrderHistory[];
  } | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, tenantId: number, order: Partial<InsertOrder>): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Order items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  
  // Order history
  getOrderHistory(orderId: number): Promise<OrderHistory[]>;
  addOrderHistory(history: InsertOrderHistory): Promise<OrderHistory>;
  
  // Notifications
  getNotificationsByUserId(userId: number, tenantId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number, tenantId: number): Promise<void>;
  getNotificationPreferences(userId: number, tenantId: number): Promise<NotificationPreferences | undefined>;
  updateNotificationPreferences(userId: number, tenantId: number, preferences: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences>;

  // Customer authentication
  getCustomerByEmail(email: string, tenantId: number): Promise<Customer | undefined>;
  getCustomerById(id: number, tenantId: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, tenantId: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  getCustomerBySocialId(provider: string, providerId: string, tenantId: number): Promise<Customer | undefined>;
  
  // Customer addresses
  getCustomerAddresses(customerId: number): Promise<CustomerAddress[]>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: number, customerId: number, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress>;
  deleteCustomerAddress(id: number, customerId: number): Promise<void>;

  // User profile management
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  getUsersByTenantId(tenantId: number): Promise<(User & { profile?: UserProfile })[]>;
  createUserWithProfile(userData: CreateUserData, tenantId: number, createdById: number): Promise<{ user: User; profile: UserProfile }>;
  updateUserProfile(userId: number, userData: UpdateUserData): Promise<{ user: User; profile: UserProfile }>;
  updateUserPermissions(userId: number, permissions: Partial<UserProfile>): Promise<UserProfile>;
  deactivateUser(userId: number): Promise<User>;
  getUserActivityLog(userId: number, tenantId: number): Promise<any[]>;

  // Support ticket system
  getSupportTicketsByTenantId(tenantId: number): Promise<SupportTicket[]>;
  getSupportTicketById(ticketId: number, tenantId: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticketData: CreateSupportTicketData, userId: number, tenantId: number): Promise<SupportTicket>;
  updateSupportTicket(ticketId: number, updateData: UpdateSupportTicketData): Promise<SupportTicket>;
  getSupportTicketMessages(ticketId: number): Promise<SupportTicketMessage[]>;
  createSupportTicketMessage(ticketId: number, messageData: CreateSupportMessageData, userId: number, senderName: string): Promise<SupportTicketMessage>;
  closeSupportTicket(ticketId: number, userId: number): Promise<SupportTicket>;
  rateSupportTicket(ticketId: number, rating: number, comment?: string): Promise<SupportTicket>;
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
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, domain));
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
    return await db.select().from(products).where(eq(products.tenantId, tenantId)).orderBy(desc(products.createdAt));
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

  // Notification methods
  async getNotificationsByUserId(userId: number, tenantId: number): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.tenantId, tenantId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return result;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number, tenantId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.tenantId, tenantId)));
  }

  async getNotificationPreferences(userId: number, tenantId: number): Promise<NotificationPreferences | undefined> {
    const [result] = await db
      .select()
      .from(notificationPreferences)
      .where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.tenantId, tenantId)));
    return result;
  }

  async updateNotificationPreferences(userId: number, tenantId: number, preferences: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences> {
    const [result] = await db
      .insert(notificationPreferences)
      .values({ ...preferences, userId, tenantId })
      .onConflictDoUpdate({
        target: [notificationPreferences.userId, notificationPreferences.tenantId],
        set: { ...preferences, updatedAt: new Date() }
      })
      .returning();
    return result;
  }

  // Customer authentication methods
  async getCustomerByEmail(email: string, tenantId: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.email, email),
        eq(customers.tenantId, tenantId)
      ));
    return customer || undefined;
  }

  async getCustomerById(id: number, tenantId: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.id, id),
        eq(customers.tenantId, tenantId)
      ));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, tenantId: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(and(
        eq(customers.id, id),
        eq(customers.tenantId, tenantId)
      ))
      .returning();
    
    if (!updated) {
      throw new Error("Customer not found");
    }
    
    return updated;
  }

  async getCustomerBySocialId(provider: string, providerId: string, tenantId: number): Promise<Customer | undefined> {
    let whereCondition;
    
    switch (provider) {
      case 'google':
        whereCondition = and(
          eq(customers.googleId, providerId),
          eq(customers.tenantId, tenantId)
        );
        break;
      case 'apple':
        whereCondition = and(
          eq(customers.appleId, providerId),
          eq(customers.tenantId, tenantId)
        );
        break;
      case 'facebook':
        whereCondition = and(
          eq(customers.facebookId, providerId),
          eq(customers.tenantId, tenantId)
        );
        break;
      default:
        return undefined;
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(whereCondition);
    return customer || undefined;
  }

  // Customer address methods
  async getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
    return await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const [newAddress] = await db
      .insert(customerAddresses)
      .values(address)
      .returning();
    return newAddress;
  }

  async updateCustomerAddress(id: number, customerId: number, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress> {
    const [updated] = await db
      .update(customerAddresses)
      .set(address)
      .where(and(
        eq(customerAddresses.id, id),
        eq(customerAddresses.customerId, customerId)
      ))
      .returning();
    
    if (!updated) {
      throw new Error("Customer address not found");
    }
    
    return updated;
  }

  async deleteCustomerAddress(id: number, customerId: number): Promise<void> {
    await db
      .delete(customerAddresses)
      .where(and(
        eq(customerAddresses.id, id),
        eq(customerAddresses.customerId, customerId)
      ));
  }

  // User profile management implementation
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async getUsersByTenantId(tenantId: number): Promise<(User & { profile?: UserProfile })[]> {
    const usersWithProfiles = await db
      .select()
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.tenantId, tenantId));

    return usersWithProfiles.map(row => ({
      ...row.users,
      profile: row.user_profiles || undefined
    }));
  }

  async createUserWithProfile(userData: CreateUserData, tenantId: number, createdById: number): Promise<{ user: User; profile: UserProfile }> {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(userData.email + "_temp_password", 10); // Generate temporary password
    
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        document: userData.document,
        documentType: userData.documentType,
        phone: userData.phone,
        role: userData.role,
        tenantId,
        createdBy: createdById,
        isActive: true,
      })
      .returning();

    const [profile] = await db
      .insert(userProfiles)
      .values({
        userId: user.id,
        tenantId,
        accessLevel: userData.accessLevel,
        jobTitle: userData.jobTitle,
        canManageProducts: userData.permissions.canManageProducts,
        canManageOrders: userData.permissions.canManageOrders,
        canViewFinancials: userData.permissions.canViewFinancials,
        canManageUsers: userData.permissions.canManageUsers,
        canManageSettings: userData.permissions.canManageSettings,
        canManageThemes: userData.permissions.canManageThemes,
        canManageBanners: userData.permissions.canManageBanners,
        canAccessSupport: userData.permissions.canAccessSupport,
      })
      .returning();

    return { user, profile };
  }

  async updateUserProfile(userId: number, userData: UpdateUserData): Promise<{ user: User; profile: UserProfile }> {
    const { permissions, ...userUpdateData } = userData;

    // Update user table
    const [user] = await db
      .update(users)
      .set({
        ...userUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Update profile if permissions are provided
    let profile;
    if (permissions) {
      [profile] = await db
        .update(userProfiles)
        .set({
          ...permissions,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();
    } else {
      const [existingProfile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
      profile = existingProfile;
    }

    if (!user || !profile) {
      throw new Error("User or profile not found");
    }

    return { user, profile };
  }

  async updateUserPermissions(userId: number, permissions: Partial<UserProfile>): Promise<UserProfile> {
    const [profile] = await db
      .update(userProfiles)
      .set({
        ...permissions,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (!profile) {
      throw new Error("User profile not found");
    }

    return profile;
  }

  async deactivateUser(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUserActivityLog(userId: number, tenantId: number): Promise<any[]> {
    // For now, return empty array - this would be implemented with an activity log table
    return [];
  }

  // Support ticket system implementation
  async getSupportTicketsByTenantId(tenantId: number): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.tenantId, tenantId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketById(ticketId: number, tenantId: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(
        eq(supportTickets.id, ticketId),
        eq(supportTickets.tenantId, tenantId)
      ));
    return ticket;
  }

  async createSupportTicket(ticketData: CreateSupportTicketData, userId: number, tenantId: number): Promise<SupportTicket> {
    const ticketNumber = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ticketNumber,
        tenantId,
        userId,
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        status: "open",
        attachments: ticketData.attachments ? JSON.stringify(ticketData.attachments) : null,
        tags: ticketData.tags ? JSON.stringify(ticketData.tags) : null,
      })
      .returning();

    return ticket;
  }

  async updateSupportTicket(ticketId: number, updateData: UpdateSupportTicketData): Promise<SupportTicket> {
    const updateFields: any = { ...updateData, updatedAt: new Date() };

    if (updateData.status === "resolved" && !updateData.satisfactionRating) {
      updateFields.resolvedAt = new Date();
    }
    
    if (updateData.status === "closed") {
      updateFields.closedAt = new Date();
    }

    const [ticket] = await db
      .update(supportTickets)
      .set(updateFields)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!ticket) {
      throw new Error("Support ticket not found");
    }

    return ticket;
  }

  async getSupportTicketMessages(ticketId: number): Promise<SupportTicketMessage[]> {
    return await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(supportTicketMessages.createdAt);
  }

  async createSupportTicketMessage(ticketId: number, messageData: CreateSupportMessageData, userId: number, senderName: string): Promise<SupportTicketMessage> {
    const [message] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId,
        userId,
        senderType: "user",
        senderName,
        message: messageData.message,
        attachments: messageData.attachments ? JSON.stringify(messageData.attachments) : null,
        isInternal: messageData.isInternal,
        messageType: messageData.messageType,
      })
      .returning();

    // Update ticket's last updated timestamp
    await db
      .update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));

    return message;
  }

  async closeSupportTicket(ticketId: number, userId: number): Promise<SupportTicket> {
    return await this.updateSupportTicket(ticketId, {
      status: "closed",
    });
  }

  async rateSupportTicket(ticketId: number, rating: number, comment?: string): Promise<SupportTicket> {
    return await this.updateSupportTicket(ticketId, {
      satisfactionRating: rating,
      satisfactionComment: comment,
    });
  }
}

export const storage = new DatabaseStorage();
