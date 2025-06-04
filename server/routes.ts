import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import { 
  insertUserSchema, 
  insertTenantSchema,
  insertProductSchema,
  insertBrandSchema,
  insertProductCategorySchema,
  insertOrderSchema,
  loginSchema, 
  tenantRegistrationSchema,
  type User,
  type Tenant,
  type Product,
  type Brand,
  type ProductCategory,
  type Order
} from "@shared/schema";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session token
      const token = `user_${user.id}_${Date.now()}`;
      
      res.json({ 
        user: { ...user, password: undefined },
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Tenant registration
  app.post("/api/register-tenant", async (req, res) => {
    try {
      const data = tenantRegistrationSchema.parse(req.body);
      
      // Check if domain is available
      const existingTenant = await storage.getTenantByDomain(data.domain);
      if (existingTenant) {
        return res.status(409).json({ message: "Domain already exists" });
      }

      // Check if email is available
      const existingUser = await storage.getUserByEmail(data.adminEmail);
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
      
      // Create tenant and user
      const { tenant, user } = await storage.registerTenant({
        ...data,
        adminPassword: hashedPassword
      });

      res.status(201).json({
        tenant,
        user: { ...user, password: undefined }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Tenant routes
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // Brand management
  app.get("/api/brands/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const brands = await storage.getBrandsByTenantId(tenantId);
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", async (req, res) => {
    try {
      const brandData = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(brandData);
      res.status(201).json(brand);
    } catch (error) {
      res.status(400).json({ message: "Invalid brand data" });
    }
  });

  app.put("/api/brands/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId, ...brandData } = req.body;
      const brand = await storage.updateBrand(id, tenantId, brandData);
      res.json(brand);
    } catch (error) {
      res.status(400).json({ message: "Failed to update brand" });
    }
  });

  app.delete("/api/brands/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId } = req.body;
      await storage.deleteBrand(id, tenantId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete brand" });
    }
  });

  // Category management
  app.get("/api/categories/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const categories = await storage.getCategoriesByTenantId(tenantId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertProductCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId, ...categoryData } = req.body;
      const category = await storage.updateCategory(id, tenantId, categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId } = req.body;
      await storage.deleteCategory(id, tenantId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete category" });
    }
  });

  // Product management with advanced features
  app.get("/api/products/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const products = await storage.getProductsByTenantId(tenantId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:tenantId/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tenantId = parseInt(req.params.tenantId);
      const product = await storage.getProductWithDetails(id, tenantId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { images, specifications, bulkPricingRules, ...productData } = req.body;
      const validatedProduct = insertProductSchema.parse(productData);
      
      const product = await storage.createProduct(validatedProduct);
      
      // Add images if provided
      if (images && images.length > 0) {
        const imageData = images.map((img: any) => ({
          ...img,
          productId: product.id
        }));
        await storage.updateProductImages(product.id, imageData);
      }
      
      // Add specifications if provided
      if (specifications && specifications.length > 0) {
        const specData = specifications.map((spec: any) => ({
          ...spec,
          productId: product.id
        }));
        await storage.updateProductSpecifications(product.id, specData);
      }
      
      // Add bulk pricing rules if provided
      if (bulkPricingRules && bulkPricingRules.length > 0) {
        const ruleData = bulkPricingRules.map((rule: any) => ({
          ...rule,
          productId: product.id
        }));
        await storage.updateBulkPricingRules(product.id, ruleData);
      }
      
      // Return product with details
      const productWithDetails = await storage.getProductWithDetails(product.id, product.tenantId);
      res.status(201).json(productWithDetails);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId, images, specifications, bulkPricingRules, ...productData } = req.body;
      
      const product = await storage.updateProduct(id, tenantId, productData);
      
      // Update images if provided
      if (images !== undefined) {
        const imageData = images.map((img: any) => ({
          ...img,
          productId: id
        }));
        await storage.updateProductImages(id, imageData);
      }
      
      // Update specifications if provided
      if (specifications !== undefined) {
        const specData = specifications.map((spec: any) => ({
          ...spec,
          productId: id
        }));
        await storage.updateProductSpecifications(id, specData);
      }
      
      // Update bulk pricing rules if provided
      if (bulkPricingRules !== undefined) {
        const ruleData = bulkPricingRules.map((rule: any) => ({
          ...rule,
          productId: id
        }));
        await storage.updateBulkPricingRules(id, ruleData);
      }
      
      // Return updated product with details
      const productWithDetails = await storage.getProductWithDetails(id, tenantId);
      res.json(productWithDetails);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId } = req.body;
      await storage.deleteProduct(id, tenantId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete product" });
    }
  });

  // Promotions management
  app.get("/api/promotions/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const promotions = await storage.getPromotionsByTenantId(tenantId);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.post("/api/promotions", async (req, res) => {
    try {
      const promotion = await storage.createPromotion(req.body);
      res.status(201).json(promotion);
    } catch (error) {
      res.status(400).json({ message: "Invalid promotion data" });
    }
  });

  app.put("/api/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId, ...promotionData } = req.body;
      const promotion = await storage.updatePromotion(id, tenantId, promotionData);
      res.json(promotion);
    } catch (error) {
      res.status(400).json({ message: "Failed to update promotion" });
    }
  });

  app.delete("/api/promotions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tenantId } = req.body;
      await storage.deletePromotion(id, tenantId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete promotion" });
    }
  });

  // Order management
  app.get("/api/orders/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const orders = await storage.getOrdersByTenantId(tenantId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  // Tenant-specific API routes for merchant dashboard
  app.get("/api/tenant/financial-stats", async (req, res) => {
    try {
      const tenantId = 5; // Using the demo tenant ID
      const orders = await storage.getOrdersByTenantId(tenantId);
      
      // Calculate financial stats from orders
      let grossSales = 0;
      let pendingAmount = 0;
      let completedAmount = 0;
      
      orders.forEach(order => {
        const orderTotal = parseFloat(order.totalPrice);
        grossSales += orderTotal;
        
        if (order.status === 'completed') {
          completedAmount += orderTotal;
        } else if (order.status === 'pending') {
          pendingAmount += orderTotal;
        }
      });
      
      // Calculate net revenue (assuming 5% platform fee)
      const netRevenue = completedAmount * 0.95;
      const availableBalance = netRevenue * 0.8; // 80% available for withdrawal
      
      const stats = {
        availableBalance: availableBalance.toFixed(2),
        pendingBalance: pendingAmount.toFixed(2), 
        monthlyWithdrawals: "0.00",
        dailyWithdrawals: "0.00",
        grossSales: grossSales.toFixed(2),
        netRevenue: netRevenue.toFixed(2)
      };
      res.json(stats);
    } catch (error) {
      console.error("Error calculating financial stats:", error);
      res.status(500).json({ message: "Failed to fetch financial stats" });
    }
  });

  app.get("/api/tenant/products", async (req, res) => {
    try {
      // Get tenant ID from user session or default to 5
      const tenantId = 5; // Using the demo tenant ID
      let products = await storage.getProductsByTenantId(tenantId);
      
      // If no products exist, create some sample data
      if (products.length === 0) {
        // Create sample brands first
        const sampleBrands = [
          { name: "Nike", tenantId, isActive: true },
          { name: "Adidas", tenantId, isActive: true },
          { name: "Apple", tenantId, isActive: true }
        ];
        
        for (const brand of sampleBrands) {
          try {
            await storage.createBrand(brand);
          } catch (e) {
            // Brand might already exist
          }
        }
        
        // Create sample categories
        const sampleCategories = [
          { name: "Esportes", tenantId, isActive: true },
          { name: "Tecnologia", tenantId, isActive: true },
          { name: "Moda", tenantId, isActive: true }
        ];
        
        for (const category of sampleCategories) {
          try {
            await storage.createCategory(category);
          } catch (e) {
            // Category might already exist
          }
        }
        
        // Create sample products
        const sampleProducts = [
          {
            name: "Tênis Nike Air Max",
            description: "Tênis esportivo confortável para corrida",
            price: "299.90",
            compareAtPrice: "399.90",
            sku: "NIKE-001",
            stock: 50,
            isActive: true,
            tenantId,
            weight: "500",
            dimensions: "30x20x15",
            ncm: "64041100",
            cfop: "5102",
            icmsRate: "18.00",
            ipiRate: "0.00",
            pisRate: "1.65",
            cofinsRate: "7.60"
          },
          {
            name: "iPhone 15 Pro",
            description: "Smartphone Apple com 128GB",
            price: "8999.00",
            compareAtPrice: "9999.00",
            sku: "APPLE-001",
            stock: 25,
            isActive: true,
            tenantId,
            weight: "187",
            dimensions: "15x7x1",
            ncm: "85171200",
            cfop: "5102",
            icmsRate: "18.00",
            ipiRate: "0.00",
            pisRate: "1.65",
            cofinsRate: "7.60"
          },
          {
            name: "Camiseta Adidas",
            description: "Camiseta esportiva de algodão",
            price: "89.90",
            compareAtPrice: "129.90",
            sku: "ADIDAS-001",
            stock: 100,
            isActive: true,
            tenantId,
            weight: "200",
            dimensions: "25x35x2",
            ncm: "61091000",
            cfop: "5102",
            icmsRate: "18.00",
            ipiRate: "0.00",
            pisRate: "1.65",
            cofinsRate: "7.60"
          }
        ];
        
        for (const product of sampleProducts) {
          try {
            await storage.createProduct(product);
          } catch (e) {
            console.error("Error creating sample product:", e);
          }
        }
        
        // Fetch products again after creating samples
        products = await storage.getProductsByTenantId(tenantId);
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching tenant products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/tenant/orders", async (req, res) => {
    try {
      const tenantId = 5; // Using the demo tenant ID
      let orders = await storage.getOrdersByTenantId(tenantId);
      
      // If no orders exist, create some sample data
      if (orders.length === 0) {
        // Get products to create orders for
        const products = await storage.getProductsByTenantId(tenantId);
        
        if (products.length > 0) {
          const sampleOrders = [
            {
              tenantId,
              productId: products[0].id,
              quantity: 2,
              unitPrice: products[0].price,
              totalPrice: (parseFloat(products[0].price) * 2).toFixed(2),
              status: "completed"
            },
            {
              tenantId,
              productId: products[1] ? products[1].id : products[0].id,
              quantity: 1,
              unitPrice: products[1] ? products[1].price : products[0].price,
              totalPrice: products[1] ? products[1].price : products[0].price,
              status: "pending"
            },
            {
              tenantId,
              productId: products[2] ? products[2].id : products[0].id,
              quantity: 3,
              unitPrice: products[2] ? products[2].price : products[0].price,
              totalPrice: products[2] ? (parseFloat(products[2].price) * 3).toFixed(2) : (parseFloat(products[0].price) * 3).toFixed(2),
              status: "completed"
            }
          ];
          
          for (const order of sampleOrders) {
            try {
              await storage.createOrder(order);
            } catch (e) {
              console.error("Error creating sample order:", e);
            }
          }
          
          // Fetch orders again after creating samples
          orders = await storage.getOrdersByTenantId(tenantId);
        }
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching tenant orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/tenant/withdrawals", async (req, res) => {
    try {
      // Return empty withdrawals array for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Notification API routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(1, 5); // Demo user and tenant
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(1, 5); // Demo user and tenant
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = req.body;
      const notification = await storage.createNotification({
        ...notificationData,
        tenantId: 5, // Demo tenant
        userId: 1    // Demo user
      });
      
      // Send real-time notification
      const server = httpServer as any;
      if (server.sendNotification) {
        server.sendNotification(5, 1, "merchant", notification);
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Public API routes for storefront
  app.get("/api/public/tenant/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      
      // For demo, return hardcoded demo tenant data
      if (subdomain === "demo") {
        res.json({
          id: 1,
          name: "Loja Demo",
          subdomain: "demo"
        });
      } else {
        return res.status(404).json({ message: "Tenant not found" });
      }
    } catch (error) {
      console.error("Error fetching public tenant:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  app.get("/api/public/products/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      
      // For demo, return hardcoded product data
      if (subdomain === "demo") {
        const demoProducts = [
          {
            id: 1,
            tenantId: 1,
            name: "Tênis Nike Air Max",
            description: "Tênis esportivo confortável para corrida e uso diário",
            price: "299.90",
            compareAtPrice: "399.90",
            sku: "NIKE-AM-001",
            stock: 50,
            isActive: true,
            isFeatured: true,
            tags: "tênis,esporte,nike,conforto",
            images: [{
              url: "https://via.placeholder.com/400x400/06b6d4/ffffff?text=Tênis+Nike",
              altText: "Tênis Nike Air Max",
              isPrimary: true
            }]
          },
          {
            id: 2,
            tenantId: 1,
            name: "iPhone 15 Pro",
            description: "Smartphone Apple com tecnologia avançada e câmera profissional",
            price: "7999.00",
            compareAtPrice: "8999.00",
            sku: "APPLE-IP15P-001",
            stock: 25,
            isActive: true,
            isFeatured: true,
            tags: "smartphone,apple,iphone,tecnologia",
            images: [{
              url: "https://via.placeholder.com/400x400/14b8a6/ffffff?text=iPhone+15+Pro",
              altText: "iPhone 15 Pro",
              isPrimary: true
            }]
          },
          {
            id: 3,
            tenantId: 1,
            name: "Camiseta Adidas Originals",
            description: "Camiseta casual da linha Originals com design clássico",
            price: "89.90",
            compareAtPrice: "129.90",
            sku: "ADIDAS-ORIG-001",
            stock: 75,
            isActive: true,
            isFeatured: false,
            tags: "camiseta,adidas,moda,casual",
            images: [{
              url: "https://via.placeholder.com/400x400/06b6d4/ffffff?text=Camiseta+Adidas",
              altText: "Camiseta Adidas Originals",
              isPrimary: true
            }]
          }
        ];
        
        res.json(demoProducts);
      } else {
        return res.status(404).json({ message: "Products not found" });
      }
    } catch (error) {
      console.error("Error fetching public products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Customer authentication routes for storefront
  app.post("/api/storefront/:subdomain/auth/login", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { email, password } = req.body;
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Find customer by email
      const customer = await storage.getCustomerByEmail(email, tenantId);
      if (!customer) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, customer.password || '');
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateCustomer(customer.id, tenantId, {
        lastLoginAt: new Date()
      });
      
      // Return customer data (excluding password)
      const { password: _, ...customerData } = customer;
      res.json({ customer: customerData });
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/storefront/:subdomain/auth/register", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { firstName, lastName, email, password, phone, cpf, birthDate, gender } = req.body;
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(email, tenantId);
      if (existingCustomer) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create customer
      const customer = await storage.createCustomer({
        tenantId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        cpf,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender,
        isActive: true,
        emailVerified: false,
        lastLoginAt: new Date()
      });
      
      // Return customer data (excluding password)
      const { password: _, ...customerData } = customer;
      res.status(201).json({ customer: customerData });
    } catch (error) {
      console.error("Customer registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/storefront/:subdomain/auth/social", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { provider, providerId, email, firstName, lastName } = req.body;
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Check if customer exists with social ID
      let customer = await storage.getCustomerBySocialId(provider, providerId, tenantId);
      
      if (!customer) {
        // Check if customer exists with email
        customer = await storage.getCustomerByEmail(email, tenantId);
        
        if (customer) {
          // Link social account to existing customer
          const updateData: any = { lastLoginAt: new Date() };
          if (provider === 'google') updateData.googleId = providerId;
          else if (provider === 'apple') updateData.appleId = providerId;
          else if (provider === 'facebook') updateData.facebookId = providerId;
          
          customer = await storage.updateCustomer(customer.id, tenantId, updateData);
        } else {
          // Create new customer with social account
          const createData: any = {
            tenantId,
            email,
            firstName,
            lastName,
            isActive: true,
            emailVerified: true,
            lastLoginAt: new Date()
          };
          
          if (provider === 'google') createData.googleId = providerId;
          else if (provider === 'apple') createData.appleId = providerId;
          else if (provider === 'facebook') createData.facebookId = providerId;
          
          customer = await storage.createCustomer(createData);
        }
      } else {
        // Update last login for existing social customer
        customer = await storage.updateCustomer(customer.id, tenantId, {
          lastLoginAt: new Date()
        });
      }
      
      // Return customer data (excluding password)
      const { password: _, ...customerData } = customer;
      res.json({ customer: customerData });
    } catch (error) {
      console.error("Social login error:", error);
      res.status(500).json({ message: "Social login failed" });
    }
  });

  app.get("/api/storefront/:subdomain/auth/customer", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const customerId = req.headers['x-customer-id'];
      
      if (!customerId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      const customer = await storage.getCustomerById(Number(customerId), tenantId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Return customer data (excluding password)
      const { password: _, ...customerData } = customer;
      res.json({ customer: customerData });
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({ message: "Failed to get customer" });
    }
  });

  // Demo route to test notifications
  app.post("/api/demo/notification", async (req, res) => {
    try {
      const notification = await storage.createNotification({
        tenantId: 5,
        userId: 1,
        type: "order",
        title: "Novo Pedido Recebido",
        message: "Pedido #12345 foi criado no valor de R$ 299,99",
        priority: "high",
        actionUrl: "/orders/12345",
        data: { orderId: 12345, amount: 299.99 }
      });
      
      // Send real-time notification
      const server = httpServer as any;
      if (server.sendNotification) {
        server.sendNotification(5, 1, "merchant", notification);
      }
      
      res.json({ success: true, notification });
    } catch (error) {
      console.error("Error creating demo notification:", error);
      res.status(500).json({ message: "Failed to create demo notification" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket Server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients by tenant and user
  const connectedClients = new Map<string, Set<WebSocket>>();
  
  wss.on('connection', (ws: WebSocket, request) => {
    console.log('New WebSocket connection established');
    
    // Handle authentication and tenant/user identification
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          const { tenantId, userId, userRole } = data;
          const clientKey = `${tenantId}:${userId}:${userRole}`;
          
          // Add client to the appropriate group
          if (!connectedClients.has(clientKey)) {
            connectedClients.set(clientKey, new Set());
          }
          connectedClients.get(clientKey)!.add(ws);
          
          // Store client info on the WebSocket
          (ws as any).clientKey = clientKey;
          (ws as any).tenantId = tenantId;
          (ws as any).userId = userId;
          (ws as any).userRole = userRole;
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Connected to notification service'
          }));
          
          console.log(`Client authenticated: ${clientKey}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from connected clients
      const clientKey = (ws as any).clientKey;
      if (clientKey && connectedClients.has(clientKey)) {
        connectedClients.get(clientKey)!.delete(ws);
        if (connectedClients.get(clientKey)!.size === 0) {
          connectedClients.delete(clientKey);
        }
      }
      console.log('WebSocket connection closed');
    });
  });
  
  // Notification service functions
  const sendNotification = (tenantId: number, userId: number, userRole: string, notification: any) => {
    const clientKey = `${tenantId}:${userId}:${userRole}`;
    const clients = connectedClients.get(clientKey);
    
    if (clients) {
      const notificationData = JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: new Date().toISOString()
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(notificationData);
        }
      });
    }
  };
  
  const broadcastToTenant = (tenantId: number, notification: any) => {
    connectedClients.forEach((clients, clientKey) => {
      if (clientKey.startsWith(`${tenantId}:`)) {
        const notificationData = JSON.stringify({
          type: 'notification',
          ...notification,
          timestamp: new Date().toISOString()
        });
        
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(notificationData);
          }
        });
      }
    });
  };
  
  // Attach notification functions to the server for use in routes
  (httpServer as any).sendNotification = sendNotification;
  (httpServer as any).broadcastToTenant = broadcastToTenant;

  return httpServer;
}