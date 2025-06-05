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

  // Get tenant details with real metrics
  app.get("/api/admin/tenants/:id/details", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const tenant = await storage.getTenant(tenantId);
      
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Get real data from database
      const orders = await storage.getOrdersByTenantId(tenantId);
      const products = await storage.getProductsByTenantId(tenantId);
      
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
      const activeProducts = products.filter(p => p.isActive).length;
      const uniqueCustomers = new Set(orders.map(order => order.customerEmail)).size;
      const conversionRate = uniqueCustomers > 0 ? ((orders.length / uniqueCustomers) * 100).toFixed(1) : '0.0';
      
      const details = {
        ...tenant,
        metrics: {
          totalRevenue: totalRevenue.toFixed(2),
          monthlyRevenue: totalRevenue.toFixed(2),
          totalOrders: orders.length,
          activeProducts,
          customers: uniqueCustomers,
          averageOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00',
          conversionRate: `${conversionRate}%`,
          lastActivity: orders.length > 0 ? orders[orders.length - 1].createdAt : new Date().toISOString()
        },
        recentOrders: orders.slice(-5).reverse().map(order => ({
          id: order.id,
          customerName: order.customerName || order.customerEmail?.split('@')[0] || 'Cliente',
          customerEmail: order.customerEmail,
          value: `R$ ${parseFloat(order.total || '0').toFixed(2)}`,
          status: order.status === 'completed' ? 'Entregue' : 
                  order.status === 'processing' ? 'Processando' : 
                  order.status === 'shipped' ? 'Enviado' : 'Pendente',
          date: new Date(order.createdAt).toLocaleDateString('pt-BR')
        }))
      };

      res.json(details);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      res.status(500).json({ message: 'Failed to fetch tenant details' });
    }
  });

  // Get products by tenant ID
  app.get('/api/products/:tenantId', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const products = await storage.getProductsByTenantId(tenantId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
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
  // Reports API endpoint with authentic database calculations
  app.get("/api/reports", async (req, res) => {
    try {
      const tenantId = 5; // Using the demo tenant ID
      const orders = await storage.getOrdersByTenantId(tenantId);
      const products = await storage.getProductsByTenantId(tenantId);
      
      // Calculate monthly financial data from orders
      const monthlyData: Record<string, { receita: number; despesas: number; lucro: number }> = {};
      const productSalesData: Record<string, { vendas: number; receita: number }> = {};
      const customerData: Record<string, { pedidos: number; total: number }> = {};
      
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = orderDate.toLocaleDateString('pt-BR', { month: 'short' });
        const orderTotal = parseFloat(order.total || "0");
        
        // Monthly financial aggregation
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { receita: 0, despesas: 0, lucro: 0 };
        }
        
        monthlyData[monthKey].receita += orderTotal;
        monthlyData[monthKey].despesas += orderTotal * 0.15; // 15% operational costs
        monthlyData[monthKey].lucro = monthlyData[monthKey].receita - monthlyData[monthKey].despesas;
        
        // Product sales aggregation - using notes field as product name for now
        const productName = order.notes || 'Produto Sem Nome';
        if (!productSalesData[productName]) {
          productSalesData[productName] = { vendas: 0, receita: 0 };
        }
        productSalesData[productName].vendas += 1;
        productSalesData[productName].receita += orderTotal;
        
        // Customer aggregation
        if (order.customerName) {
          if (!customerData[order.customerName]) {
            customerData[order.customerName] = { pedidos: 0, total: 0 };
          }
          customerData[order.customerName].pedidos += 1;
          customerData[order.customerName].total += orderTotal;
        }
      });
      
      // Convert to arrays for charts
      const financialData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
      }));
      
      const salesData = Object.entries(productSalesData)
        .map(([product, data]) => ({ product, ...data }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10); // Top 10 products
      
      const customersData = Object.entries(customerData)
        .map(([customer, data]) => ({ customer, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // Top 10 customers
      
      // Inventory data from products
      const inventoryData = products.map(product => ({
        product: product.name,
        estoque: product.stock,
        valor: parseFloat(product.price || "0") * product.stock
      }));
      
      // Calculate summary statistics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      
      res.json({
        financialData,
        salesData,
        customersData,
        inventoryData,
        summary: {
          totalOrders,
          totalRevenue: totalRevenue.toFixed(2),
          averageOrderValue: averageOrderValue.toFixed(2),
          conversionRate: conversionRate.toFixed(1)
        }
      });
    } catch (error) {
      console.error("Error generating reports:", error);
      res.status(500).json({ message: "Failed to generate reports" });
    }
  });

  app.get("/api/tenant/financial-stats", async (req, res) => {
    try {
      const tenantId = 5; // Using the demo tenant ID
      const orders = await storage.getOrdersByTenantId(tenantId);
      
      // Calculate financial stats from orders
      let grossSales = 0;
      let pendingAmount = 0;
      let completedAmount = 0;
      
      orders.forEach(order => {
        const orderTotal = parseFloat(order.total || "0");
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

  // Password recovery request
  app.post("/api/storefront/:subdomain/auth/forgot-password", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { email } = req.body;
      
      // Rate limiting
      const rateLimitKey = `forgot-password:${req.ip}`;
      if (!checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
        return res.status(429).json({ message: "Too many requests. Try again later." });
      }
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      const customer = await storage.getCustomerByEmail(email, tenantId);
      if (!customer) {
        // Don't reveal if email exists for security
        return res.json({ message: "If the email exists, a password reset link has been sent." });
      }
      
      // Generate password reset token
      const resetToken = generateSecureToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await storage.updateCustomer(customer.id, tenantId, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      });
      
      // Send password reset email
      const emailSent = await sendEmail(email, "password_reset", {
        firstName: customer.firstName,
        storeName: "Loja Demo",
        subdomain,
        token: resetToken
      });
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send reset email" });
      }
      
      res.json({ message: "If the email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Password reset confirmation
  app.post("/api/storefront/:subdomain/auth/reset-password", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Find customer by reset token
      const customers = await storage.getCustomersByTenantId(tenantId);
      const customer = customers.find(c => 
        c.passwordResetToken === token && 
        c.passwordResetExpires && 
        c.passwordResetExpires > new Date()
      );
      
      if (!customer) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update customer password and clear reset token
      await storage.updateCustomer(customer.id, tenantId, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0 // Reset failed attempts
      });
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Email verification
  app.get("/api/storefront/:subdomain/auth/verify-email", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Find customer by verification token
      const customers = await storage.getCustomersByTenantId(tenantId);
      const customer = customers.find(c => 
        c.emailVerificationToken === token &&
        c.emailVerificationExpires &&
        c.emailVerificationExpires > new Date()
      );
      
      if (!customer) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      // Mark email as verified
      await storage.updateCustomer(customer.id, tenantId, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });
      
      // Redirect to storefront with success message
      res.redirect(`/storefront/${subdomain}?verified=true`);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend email verification
  app.post("/api/storefront/:subdomain/auth/resend-verification", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { email } = req.body;
      
      // Rate limiting
      const rateLimitKey = `resend-verification:${req.ip}`;
      // Temporarily disable rate limiting for demo
      // if (!checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)) {
      //   return res.status(429).json({ message: "Too many requests. Try again later." });
      // }
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      const customer = await storage.getCustomerByEmail(email, tenantId);
      if (!customer || customer.emailVerified) {
        return res.json({ message: "If the email exists and is unverified, a verification email has been sent." });
      }
      
      // Generate new verification token
      const verificationToken = "demo-token-" + Math.random().toString(36).substring(2);
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.updateCustomer(customer.id, tenantId, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });
      
      // For demo purposes, log the verification link instead of sending email
      console.log(`Demo verification link: /storefront/${subdomain}?verified=true&token=${verificationToken}`);
      
      res.json({ message: "Verification email sent successfully." });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification" });
    }
  });

  // 2FA Setup - Generate QR Code
  app.post("/api/storefront/:subdomain/auth/2fa/setup", async (req, res) => {
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
      
      if (customer.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
      }
      
      // Generate 2FA secret and QR code (simplified for demo)
      const secret = Math.random().toString(36).substring(2, 18);
      const qrCode = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">Demo QR Code<br/>Secret: ${secret}</text></svg>`).toString('base64')}`;
      
      // Store the secret temporarily (not activated until verification)
      await storage.updateCustomer(customer.id, tenantId, {
        twoFactorSecret: secret
      });
      
      res.json({
        qrCode,
        secret,
        manualEntryKey: secret
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  // 2FA Activation - Verify and Enable
  app.post("/api/storefront/:subdomain/auth/2fa/activate", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { token } = req.body;
      const customerId = req.headers['x-customer-id'];
      
      if (!customerId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!token) {
        return res.status(400).json({ message: "2FA token is required" });
      }
      
      // Get tenant ID from subdomain
      let tenantId = 1; // Default to demo tenant
      if (subdomain !== "demo") {
        return res.status(404).json({ message: "Store not found" });
      }
      
      const customer = await storage.getCustomerById(Number(customerId), tenantId);
      if (!customer || !customer.twoFactorSecret) {
        return res.status(400).json({ message: "2FA setup not found" });
      }
      
      // For demo purposes, accept any 6-digit token
      if (token.length !== 6 || !/^\d{6}$/.test(token)) {
        return res.status(400).json({ message: "Invalid 2FA token" });
      }
      
      // Generate backup codes
      const backupCodes = [];
      for (let i = 0; i < 8; i++) {
        backupCodes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
      }
      
      // Enable 2FA
      await storage.updateCustomer(customer.id, tenantId, {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
        twoFactorLastUsed: new Date()
      });
      
      res.json({
        message: "2FA enabled successfully",
        backupCodes
      });
    } catch (error) {
      console.error("2FA activation error:", error);
      res.status(500).json({ message: "Failed to activate 2FA" });
    }
  });

  // 2FA Disable
  app.post("/api/storefront/:subdomain/auth/2fa/disable", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { password } = req.body;
      const customerId = req.headers['x-customer-id'];
      
      if (!customerId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!password) {
        return res.status(400).json({ message: "Password is required to disable 2FA" });
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
      
      // Verify password
      const isValid = await bcrypt.compare(password, customer.password || '');
      if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Disable 2FA
      await storage.updateCustomer(customer.id, tenantId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        twoFactorLastUsed: null
      });
      
      res.json({ message: "2FA disabled successfully" });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  // Enhanced login with 2FA support
  app.post("/api/storefront/:subdomain/auth/login-2fa", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const { email, password, twoFactorToken } = req.body;
      
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
      
      // Check if account is locked
      if (customer.lockoutUntil && customer.lockoutUntil > new Date()) {
        return res.status(423).json({ message: "Account temporarily locked due to too many failed attempts" });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, customer.password || '');
      if (!isValid) {
        // Increment failed attempts
        const failedAttempts = (customer.failedLoginAttempts || 0) + 1;
        const lockoutUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minute lockout
        
        await storage.updateCustomer(customer.id, tenantId, {
          failedLoginAttempts: failedAttempts,
          lockoutUntil
        });
        
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // If 2FA is enabled, verify token
      if (customer.twoFactorEnabled) {
        if (!twoFactorToken) {
          return res.status(200).json({ 
            requiresTwoFactor: true,
            message: "2FA token required" 
          });
        }
        
        // For demo purposes, accept any 6-digit token or backup codes
        if (!/^\d{6}$/.test(twoFactorToken) && !customer.twoFactorBackupCodes?.includes(twoFactorToken)) {
          return res.status(401).json({ message: "Invalid 2FA token" });
        }
        
        // If backup code was used, remove it
        if (customer.twoFactorBackupCodes?.includes(twoFactorToken)) {
          const backupCodes = JSON.parse(customer.twoFactorBackupCodes);
          const updatedCodes = backupCodes.filter((code: string) => code !== twoFactorToken);
          
          await storage.updateCustomer(customer.id, tenantId, {
            twoFactorBackupCodes: JSON.stringify(updatedCodes)
          });
        }
      }
      
      // Reset failed attempts and update last login
      await storage.updateCustomer(customer.id, tenantId, {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || req.connection.remoteAddress
      });
      
      // Return customer data (excluding sensitive fields)
      const { password: _, twoFactorSecret: __, twoFactorBackupCodes: ___, ...customerData } = customer;
      res.json({ customer: customerData });
    } catch (error) {
      console.error("Enhanced login error:", error);
      res.status(500).json({ message: "Login failed" });
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

  // User Management Routes
  app.get("/api/users", async (req, res) => {
    try {
      const tenantId = 1; // Get from authenticated user
      const users = await storage.getUsersByTenantId(tenantId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const tenantId = 1; // Get from authenticated user
      const createdById = 1; // Get from authenticated user
      const userData = req.body;
      
      const result = await storage.createUserWithProfile(userData, tenantId, createdById);
      res.json(result);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:userId/permissions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permissions = req.body;
      
      const result = await storage.updateUserPermissions(userId, permissions);
      res.json(result);
    } catch (error) {
      console.error("Error updating permissions:", error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  });

  app.patch("/api/users/:userId/deactivate", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const result = await storage.deactivateUser(userId);
      res.json(result);
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Support Ticket Routes
  app.get("/api/support-tickets", async (req, res) => {
    try {
      const tenantId = 1; // Get from authenticated user
      const tickets = await storage.getSupportTicketsByTenantId(tenantId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.post("/api/support-tickets", async (req, res) => {
    try {
      const tenantId = 1; // Get from authenticated user
      const userId = 1; // Get from authenticated user
      const ticketData = req.body;
      
      const ticket = await storage.createSupportTicket(ticketData, userId, tenantId);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.get("/api/support-tickets/:ticketId/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const messages = await storage.getSupportTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch ticket messages" });
    }
  });

  app.post("/api/support-tickets/:ticketId/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const userId = 1; // Get from authenticated user
      const senderName = "User"; // Get from authenticated user
      const messageData = req.body;
      
      const message = await storage.createSupportTicketMessage(ticketId, messageData, userId, senderName);
      res.json(message);
    } catch (error) {
      console.error("Error creating ticket message:", error);
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  app.patch("/api/support-tickets/:ticketId/rate", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const { rating, comment } = req.body;
      
      const ticket = await storage.rateSupportTicket(ticketId, rating, comment);
      res.json(ticket);
    } catch (error) {
      console.error("Error rating ticket:", error);
      res.status(500).json({ message: "Failed to rate ticket" });
    }
  });

  // Admin: Cancel plugin subscription
  app.patch("/api/admin/plugin-subscriptions/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Update subscription
      const result = await db.execute(sql`
        UPDATE plugin_subscriptions 
        SET status = 'cancelled', cancelled_at = NOW(), auto_renew = false,
            notes = COALESCE(notes, '') || ${reason ? `\nCancellation reason: ${reason}` : '\nCancelled by admin'}
        WHERE id = ${parseInt(id)} AND status = 'active'
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Active subscription not found" });
      }

      // Record in history
      await db.execute(sql`
        INSERT INTO plugin_subscription_history (
          subscription_id, action, description
        ) VALUES (
          ${parseInt(id)}, 'cancelled', 
          ${reason || 'Subscription cancelled by admin'}
        )
      `);

      res.json({ 
        message: "Subscription cancelled successfully",
        subscription: result.rows[0]
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
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
  
  // Admin Routes - Statistics and Management
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // Get comprehensive platform statistics
      const totalTenantsResult = await db.execute(sql`SELECT COUNT(*) as count FROM tenants`);
      const activeTenantsResult = await db.execute(sql`SELECT COUNT(*) as count FROM tenants WHERE status = 'active'`);
      const totalUsersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      const activeUsersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE is_active = true`);
      const totalOrdersResult = await db.execute(sql`SELECT COUNT(*) as count FROM orders`);
      const totalRevenueResult = await db.execute(sql`SELECT COALESCE(SUM(CAST(total AS DECIMAL)), 0) as total FROM orders WHERE status = 'completed'`);
      const monthlyRevenueResult = await db.execute(sql`
        SELECT COALESCE(SUM(CAST(total AS DECIMAL)), 0) as total 
        FROM orders 
        WHERE status = 'completed' 
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `);

      const totalTenants = totalTenantsResult.rows[0]?.count || 0;
      const activeTenants = activeTenantsResult.rows[0]?.count || 0;
      const totalUsers = totalUsersResult.rows[0]?.count || 0;
      const activeUsers = activeUsersResult.rows[0]?.count || 0;
      const totalOrders = totalOrdersResult.rows[0]?.count || 0;
      const totalRevenue = totalRevenueResult.rows[0]?.total || '0';
      const monthlyRevenue = monthlyRevenueResult.rows[0]?.total || '0';
      const platformFee = (parseFloat(totalRevenue) * 0.025).toFixed(2); // 2.5% platform fee

      res.json({
        totalTenants: parseInt(totalTenants),
        activeTenants: parseInt(activeTenants),
        totalUsers: parseInt(totalUsers),
        activeUsers: parseInt(activeUsers),
        totalOrders: parseInt(totalOrders),
        totalRevenue: totalRevenue.toString(),
        monthlyRevenue: monthlyRevenue.toString(),
        platformFee: platformFee
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/admin/tenants", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          t.*,
          COALESCE(o.monthly_revenue, '0') as monthly_revenue,
          COALESCE(o.total_orders, 0) as total_orders
        FROM tenants t
        LEFT JOIN (
          SELECT 
            tenant_id,
            SUM(CAST(total AS DECIMAL)) as monthly_revenue,
            COUNT(*) as total_orders
          FROM orders 
          WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
          GROUP BY tenant_id
        ) o ON t.id = o.tenant_id
        ORDER BY t.created_at DESC
      `);

      const tenants = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        subdomain: row.subdomain,
        status: row.status || 'active',
        category: row.category || 'retail',
        monthlyRevenue: row.monthly_revenue || '0',
        totalOrders: parseInt(row.total_orders) || 0,
        createdAt: row.created_at,
        contactPerson: row.contact_person,
        email: row.email,
        phone: row.phone,
        cnpj: row.cnpj
      }));

      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.post("/api/admin/tenants", async (req, res) => {
    try {
      const tenantData = req.body;
      
      const result = await db.execute(sql`
        INSERT INTO tenants (
          name, subdomain, category, cnpj, corporate_name, fantasy_name,
          description, address, city, state, zip_code, phone, email, 
          contact_person, status, created_at, updated_at
        ) VALUES (
          ${tenantData.name}, ${tenantData.subdomain}, ${tenantData.category}, 
          ${tenantData.cnpj}, ${tenantData.name}, ${tenantData.name},
          ${'Loja ' + tenantData.name}, ${'Endereço a ser definido'}, ${'São Paulo'}, 
          ${'SP'}, ${'00000-000'}, ${tenantData.phone}, ${tenantData.email},
          ${tenantData.contactPerson}, ${tenantData.status}, NOW(), NOW()
        ) RETURNING *
      `);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  app.put("/api/admin/tenants/:id", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const updateData = req.body;
      
      const result = await db.execute(sql`
        UPDATE tenants 
        SET 
          name = ${updateData.name},
          subdomain = ${updateData.subdomain},
          category = ${updateData.category},
          cnpj = ${updateData.cnpj},
          phone = ${updateData.phone},
          email = ${updateData.email},
          contact_person = ${updateData.contactPerson},
          status = ${updateData.status},
          updated_at = NOW()
        WHERE id = ${tenantId}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  app.delete("/api/admin/tenants/:id", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      
      await db.execute(sql`DELETE FROM tenants WHERE id = ${tenantId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          u.*,
          t.name as tenant_name
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        ORDER BY u.created_at DESC
      `);

      const users = result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        document: row.document,
        documentType: row.document_type,
        phone: row.phone,
        role: row.role,
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        profileImage: row.profile_image,
        isActive: row.is_active,
        permissions: row.permissions,
        lastLoginAt: row.last_login_at,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user endpoint
  app.post("/api/admin/users", async (req, res) => {
    try {
      const {
        email,
        fullName,
        document,
        documentType,
        phone,
        role,
        tenantId,
        profileImage,
        isActive = true,
        permissions = [],
        password,
        adminNotes
      } = req.body;

      // Validate required fields
      if (!email || !fullName || !password) {
        return res.status(400).json({ message: "Email, fullName, and password are required" });
      }

      // Check if user already exists
      const existingUser = await db.execute(sql`
        SELECT id FROM users WHERE email = ${email}
      `);

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.execute(sql`
        INSERT INTO users (
          email, password, full_name, document, document_type, phone,
          role, tenant_id, profile_image, is_active, permissions,
          created_at, updated_at
        )
        VALUES (
          ${email}, ${hashedPassword}, ${fullName}, ${document || ''}, ${documentType || 'cpf'}, ${phone || ''},
          ${role}, ${tenantId || null}, ${profileImage || null}, ${isActive}, ${JSON.stringify(permissions)},
          NOW(), NOW()
        )
        RETURNING id, email, full_name, document, document_type, phone, role, tenant_id, 
                  profile_image, is_active, permissions, created_at, updated_at
      `);

      const newUser = result.rows[0];
      const userResponse = {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        document: newUser.document,
        documentType: newUser.document_type,
        phone: newUser.phone,
        role: newUser.role,
        tenantId: newUser.tenant_id,
        profileImage: newUser.profile_image,
        isActive: newUser.is_active,
        permissions: newUser.permissions,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at
      };

      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Email notifications endpoints
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          en.*,
          u.full_name as created_by_name
        FROM email_notifications en
        LEFT JOIN users u ON en.created_by = u.id
        ORDER BY en.created_at DESC
        LIMIT 50
      `);

      const notifications = result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        recipientType: row.recipient_type,
        recipientIds: row.recipient_ids,
        sentCount: row.sent_count,
        failedCount: row.failed_count,
        status: row.status,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        sentAt: row.sent_at
      }));

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/admin/notifications", async (req, res) => {
    try {
      const {
        title,
        message,
        recipientType,
        recipientIds = [],
        buttonText,
        buttonUrl
      } = req.body;

      if (!title || !message || !recipientType) {
        return res.status(400).json({ message: "Title, message, and recipient type are required" });
      }

      // Create notification record
      const notificationResult = await db.execute(sql`
        INSERT INTO email_notifications (
          title, message, recipient_type, recipient_ids, created_by, created_at, status
        )
        VALUES (
          ${title}, ${message}, ${recipientType}, ${JSON.stringify(recipientIds)}, 
          ${1}, NOW(), 'pending'
        )
        RETURNING id
      `);

      const notificationId = notificationResult.rows[0].id;

      // Get recipients based on type
      let recipients: string[] = [];
      
      if (recipientType === 'all') {
        // Get all active users
        const usersResult = await db.execute(sql`
          SELECT email FROM users WHERE is_active = true AND email IS NOT NULL
        `);
        recipients = usersResult.rows.map((row: any) => row.email);
      } else if (recipientType === 'specific' && recipientIds.length > 0) {
        // Get specific users by ID
        const usersResult = await db.execute(sql`
          SELECT email FROM users 
          WHERE id = ANY(${recipientIds}) AND is_active = true AND email IS NOT NULL
        `);
        recipients = usersResult.rows.map((row: any) => row.email);
      } else if (recipientType === 'tenant' && recipientIds.length > 0) {
        // Get all users from specific tenants
        const usersResult = await db.execute(sql`
          SELECT email FROM users 
          WHERE tenant_id = ANY(${recipientIds}) AND is_active = true AND email IS NOT NULL
        `);
        recipients = usersResult.rows.map((row: any) => row.email);
      }

      if (recipients.length === 0) {
        await db.execute(sql`
          UPDATE email_notifications 
          SET status = 'failed', sent_at = NOW()
          WHERE id = ${notificationId}
        `);
        return res.status(400).json({ message: "No valid recipients found" });
      }

      // Update status to sending
      await db.execute(sql`
        UPDATE email_notifications 
        SET status = 'sending'
        WHERE id = ${notificationId}
      `);

      // Send emails asynchronously
      setTimeout(async () => {
        try {
          const { sendBulkEmails, createNotificationTemplate } = await import('./email-service');
          
          const htmlContent = createNotificationTemplate(title, message, buttonText, buttonUrl);
          const textContent = message;

          const result = await sendBulkEmails({
            recipients,
            subject: title,
            htmlContent,
            textContent
          });

          // Update notification with results
          await db.execute(sql`
            UPDATE email_notifications 
            SET 
              sent_count = ${result.success},
              failed_count = ${result.failed},
              status = 'completed',
              sent_at = NOW()
            WHERE id = ${notificationId}
          `);

          console.log(`Notification ${notificationId} sent: ${result.success} success, ${result.failed} failed`);
        } catch (error) {
          console.error(`Failed to send notification ${notificationId}:`, error);
          await db.execute(sql`
            UPDATE email_notifications 
            SET status = 'failed', sent_at = NOW()
            WHERE id = ${notificationId}
          `);
        }
      }, 100);

      res.json({
        id: notificationId,
        message: `Notification queued for ${recipients.length} recipients`,
        recipientCount: recipients.length
      });

    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.get("/api/admin/notification-recipients", async (req, res) => {
    try {
      const { type, tenantId } = req.query;

      let query = sql`SELECT id, email, full_name, role, tenant_id FROM users WHERE is_active = true`;
      
      if (type === 'tenant' && tenantId) {
        query = sql`
          SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, t.name as tenant_name
          FROM users u
          LEFT JOIN tenants t ON u.tenant_id = t.id
          WHERE u.is_active = true AND u.tenant_id = ${tenantId}
        `;
      } else {
        query = sql`
          SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, t.name as tenant_name
          FROM users u
          LEFT JOIN tenants t ON u.tenant_id = t.id
          WHERE u.is_active = true
          ORDER BY u.full_name
        `;
      }

      const result = await db.execute(query);
      
      const users = result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        tenantId: row.tenant_id,
        tenantName: row.tenant_name
      }));

      res.json(users);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      res.status(500).json({ message: "Failed to fetch recipients" });
    }
  });

  app.get("/api/admin/system-metrics", async (req, res) => {
    try {
      // Get database size
      const dbSizeResult = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      
      // Get active connections
      const connectionsResult = await db.execute(sql`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      // Get table counts for metrics
      const tableStatsResult = await db.execute(sql`
        SELECT 
          (SELECT count(*) FROM tenants) as total_tenants,
          (SELECT count(*) FROM users) as total_users,
          (SELECT count(*) FROM orders) as total_orders,
          (SELECT count(*) FROM products) as total_products
      `);

      const dbSize = dbSizeResult.rows[0]?.size || "0 MB";
      const activeConnections = parseInt(connectionsResult.rows[0]?.active_connections) || 0;
      const stats = tableStatsResult.rows[0] || {};

      const metrics = [
        {
          name: "Database Size",
          value: dbSize,
          change: "+120MB",
          status: "stable"
        },
        {
          name: "Active Connections",
          value: activeConnections.toString(),
          change: "+5",
          status: "stable"
        },
        {
          name: "Total Tenants",
          value: (stats.total_tenants || 0).toString(),
          change: "+2",
          status: "up"
        },
        {
          name: "Total Users",
          value: (stats.total_users || 0).toString(),
          change: "+8",
          status: "up"
        },
        {
          name: "Total Orders",
          value: (stats.total_orders || 0).toString(),
          change: "+24",
          status: "up"
        },
        {
          name: "Total Products",
          value: (stats.total_products || 0).toString(),
          change: "+12",
          status: "stable"
        }
      ];

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.get("/api/admin/plugins", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.id,
          COALESCE(p.display_name, p.name) as name,
          p.description,
          p.is_active,
          p.category,
          p.price,
          p.monthly_price,
          p.yearly_price,
          p.features,
          p.icon,
          p.slug,
          p.created_at,
          p.updated_at,
          COALESCE(ps.installation_count, 0) as installations
        FROM plugins p
        LEFT JOIN (
          SELECT 
            plugin_id,
            COUNT(*) as installation_count
          FROM plugin_subscriptions 
          WHERE status = 'active'
          GROUP BY plugin_id
        ) ps ON p.id = ps.plugin_id
        ORDER BY p.created_at DESC
      `);

      const plugins = result.rows.map((row: any) => {
        let features = [];
        try {
          if (row.features) {
            features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features;
          }
        } catch (e) {
          console.warn(`Failed to parse features for plugin ${row.id}:`, e);
          features = [];
        }

        return {
          id: row.id,
          name: row.name,
          displayName: row.name,
          description: row.description,
          version: "1.0.0",
          isActive: row.is_active,
          installations: row.installations || 0,
          category: row.category,
          icon: row.icon,
          slug: row.slug,
          developer: "WikiStore Team",
          price: row.price,
          monthlyPrice: row.monthly_price,
          yearlyPrice: row.yearly_price,
          features: features,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });

      res.json(plugins);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  // Create new plugin
  app.post("/api/admin/plugins", async (req, res) => {
    try {
      const { name, description, category, price, developer, isActive } = req.body;
      
      const result = await db.execute(sql`
        INSERT INTO plugins (name, display_name, description, category, price, is_active)
        VALUES (${name.toLowerCase().replace(/\s+/g, '_')}, ${name}, ${description}, ${category}, ${price}, ${isActive})
        RETURNING *
      `);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating plugin:", error);
      res.status(500).json({ message: "Failed to create plugin" });
    }
  });

  // Update plugin
  app.patch("/api/admin/plugins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      console.log("Updating plugin:", { id, isActive });
      
      // Simple update for is_active field
      const result = await db.execute(sql`
        UPDATE plugins 
        SET is_active = ${isActive}, updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Plugin not found" });
      }

      console.log("Plugin updated successfully:", result.rows[0]);
      res.json({ 
        success: true, 
        plugin: result.rows[0],
        message: `Plugin ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error("Error updating plugin:", error);
      res.status(500).json({ message: "Failed to update plugin" });
    }
  });

  // Delete plugin
  app.delete("/api/admin/plugins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.execute(sql`
        DELETE FROM plugins WHERE id = ${id}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Plugin not found" });
      }

      res.json({ message: "Plugin deleted successfully" });
    } catch (error) {
      console.error("Error deleting plugin:", error);
      res.status(500).json({ message: "Failed to delete plugin" });
    }
  });

  app.put("/api/admin/plugins/:id", async (req, res) => {
    try {
      const pluginId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const result = await db.execute(sql`
        UPDATE plugins 
        SET is_active = ${isActive}, updated_at = NOW()
        WHERE id = ${pluginId}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Plugin not found" });
      }
      
      res.json({ success: true, pluginId, isActive });
    } catch (error) {
      console.error("Error updating plugin:", error);
      res.status(500).json({ message: "Failed to update plugin" });
    }
  });

  // Get plugin plans (Admin)
  app.get("/api/admin/plugin-plans", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          pp.*,
          COUNT(ps.id) as active_subscriptions
        FROM plugin_plans pp
        LEFT JOIN plugin_subscriptions ps ON pp.id = ps.plan_id AND ps.status = 'active'
        GROUP BY pp.id
        ORDER BY pp.display_order ASC, pp.monthly_price ASC
      `);

      const plans = await Promise.all(result.rows.map(async (row: any) => {
        let features = [];
        try {
          if (row.features) {
            // Handle escaped JSON from database
            let featuresStr = row.features;
            if (typeof featuresStr === 'string') {
              // Remove outer quotes if present and unescape
              featuresStr = featuresStr.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
              features = JSON.parse(featuresStr);
            } else {
              features = featuresStr;
            }
          }
        } catch (error) {
          console.error('Error parsing features for plan', row.id, ':', error);
          features = [];
        }

        // Get linked plugins
        const pluginsResult = await db.execute(sql`
          SELECT plugin_id FROM plan_plugins WHERE plan_id = ${row.id}
        `);
        const plugins = pluginsResult.rows.map((p: any) => p.plugin_id);
        
        return {
          ...row,
          features: Array.isArray(features) ? features : [],
          activeSubscriptions: parseInt(row.active_subscriptions) || 0,
          plugins
        };
      }));

      res.json(plans);
    } catch (error) {
      console.error("Error fetching plugin plans:", error);
      res.status(500).json({ message: "Failed to fetch plugin plans" });
    }
  });

  // Create plugin plan
  app.post("/api/admin/plugin-plans", async (req, res) => {
    try {
      const { name, description, monthlyPrice, yearlyPrice, maxTenants, features, isActive, selectedPlugins } = req.body;
      
      const result = await db.execute(sql`
        INSERT INTO plugin_plans (
          name, description, monthly_price, yearly_price, max_tenants, features, is_active, display_order
        ) VALUES (
          ${name}, ${description}, ${monthlyPrice}, ${yearlyPrice || monthlyPrice * 10}, 
          ${maxTenants}, ${JSON.stringify(features)}, ${isActive}, 
          (SELECT COALESCE(MAX(display_order), 0) + 1 FROM plugin_plans)
        )
        RETURNING *
      `);

      const planId = result.rows[0].id;

      // Link plugins to plan
      if (selectedPlugins && selectedPlugins.length > 0) {
        for (const pluginId of selectedPlugins) {
          await db.execute(sql`
            INSERT INTO plan_plugins (plan_id, plugin_id, is_required) 
            VALUES (${planId}, ${pluginId}, true)
            ON CONFLICT (plan_id, plugin_id) DO NOTHING
          `);
        }
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating plugin plan:", error);
      res.status(500).json({ message: "Failed to create plugin plan" });
    }
  });

  // Update plugin plan
  app.patch("/api/admin/plugin-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, monthlyPrice, yearlyPrice, maxTenants, features, isActive, selectedPlugins } = req.body;
      
      const result = await db.execute(sql`
        UPDATE plugin_plans 
        SET 
          name = ${name},
          description = ${description},
          monthly_price = ${monthlyPrice},
          yearly_price = ${yearlyPrice},
          max_tenants = ${maxTenants},
          features = ${JSON.stringify(features)},
          is_active = ${isActive},
          updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Update linked plugins
      if (selectedPlugins !== undefined) {
        // Remove existing plugin links
        await db.execute(sql`
          DELETE FROM plan_plugins WHERE plan_id = ${parseInt(id)}
        `);

        // Add new plugin links
        if (selectedPlugins && selectedPlugins.length > 0) {
          for (const pluginId of selectedPlugins) {
            await db.execute(sql`
              INSERT INTO plan_plugins (plan_id, plugin_id, is_required) 
              VALUES (${parseInt(id)}, ${pluginId}, true)
            `);
          }
        }
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating plugin plan:", error);
      res.status(500).json({ message: "Failed to update plugin plan" });
    }
  });

  // Delete plugin plan
  app.delete("/api/admin/plugin-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if plan has active subscriptions
      const subscriptionsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM plugin_subscriptions 
        WHERE plan_id = ${parseInt(id)} AND status = 'active'
      `);

      if (subscriptionsResult.rows[0].count > 0) {
        return res.status(400).json({ 
          message: "Cannot delete plan with active subscriptions" 
        });
      }

      // Remove plan-plugin relationships first
      await db.execute(sql`
        DELETE FROM plan_plugins WHERE plan_id = ${parseInt(id)}
      `);

      const result = await db.execute(sql`
        DELETE FROM plugin_plans WHERE id = ${parseInt(id)}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Plan not found" });
      }

      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plugin plan:", error);
      res.status(500).json({ message: "Failed to delete plugin plan" });
    }
  });

  // Toggle plugin plan status
  app.patch("/api/admin/plugin-plans/:id/toggle-status", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const result = await db.execute(sql`
        UPDATE plugin_plans 
        SET 
          is_active = ${isActive},
          updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Plan not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error toggling plugin plan status:", error);
      res.status(500).json({ message: "Failed to toggle plugin plan status" });
    }
  });

  // Get all plugin subscriptions (Admin)
  app.get("/api/admin/plugin-subscriptions", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          ps.*,
          pp.name as plan_name,
          t.name as tenant_name,
          t.subdomain
        FROM plugin_subscriptions ps
        LEFT JOIN plugin_plans pp ON ps.plan_id = pp.id
        LEFT JOIN tenants t ON ps.tenant_id = t.id
        WHERE ps.subscription_type = 'plan'
        ORDER BY ps.created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching plugin subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch plugin subscriptions" });
    }
  });

  // Activate plan plugins for tenant
  app.post("/api/admin/activate-plan-plugins", async (req, res) => {
    try {
      const { tenantId, planId } = req.body;

      if (!tenantId || !planId) {
        return res.status(400).json({ message: "Tenant ID and Plan ID are required" });
      }

      // Get plugins associated with the plan
      const planPluginsResult = await db.execute(sql`
        SELECT pp.plugin_id, p.name as plugin_name
        FROM plan_plugins pp
        JOIN plugins p ON pp.plugin_id = p.id
        WHERE pp.plan_id = ${planId}
      `);

      if (planPluginsResult.rows.length === 0) {
        return res.json({ message: "No plugins associated with this plan", activatedPlugins: [] });
      }

      const activatedPlugins = [];

      // Activate each plugin for the tenant
      for (const row of planPluginsResult.rows) {
        const pluginId = row.plugin_id;
        
        // Check if plugin is already active for this tenant
        const existingResult = await db.execute(sql`
          SELECT id FROM plugin_subscriptions 
          WHERE tenant_id = ${tenantId} AND plugin_id = ${pluginId} AND status = 'active'
        `);

        if (existingResult.rows.length === 0) {
          // Create plugin subscription for individual plugin
          await db.execute(sql`
            INSERT INTO plugin_subscriptions (
              tenant_id, plugin_id, subscription_type, status, started_at, current_price
            ) VALUES (
              ${tenantId}, ${pluginId}, 'individual', 'active', NOW(), 0
            )
          `);

          activatedPlugins.push({
            pluginId,
            pluginName: row.plugin_name
          });
        }
      }

      res.json({ 
        message: `Activated ${activatedPlugins.length} plugins for tenant`,
        activatedPlugins
      });
    } catch (error) {
      console.error("Error activating plan plugins:", error);
      res.status(500).json({ message: "Failed to activate plan plugins" });
    }
  });

  // Get tenant plugin subscriptions
  app.get("/api/tenant/:tenantId/plugin-subscriptions", async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await db.execute(sql`
        SELECT 
          ps.*,
          p.name as plugin_name,
          p.display_name,
          p.description as plugin_description,
          p.category,
          pp.name as plan_name,
          pp.description as plan_description
        FROM plugin_subscriptions ps
        LEFT JOIN plugins p ON ps.plugin_id = p.id
        LEFT JOIN plugin_plans pp ON ps.plan_id = pp.id
        WHERE ps.tenant_id = ${tenantId}
        ORDER BY ps.created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching tenant plugin subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch plugin subscriptions" });
    }
  });

  // Subscribe to individual plugin
  app.post("/api/tenant/:tenantId/subscribe-plugin", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { pluginId, billingCycle } = req.body;

      // Check if already subscribed
      const existingResult = await db.execute(sql`
        SELECT id FROM plugin_subscriptions 
        WHERE tenant_id = ${tenantId} AND plugin_id = ${pluginId} AND status = 'active'
      `);

      if (existingResult.rows.length > 0) {
        return res.status(400).json({ message: "Already subscribed to this plugin" });
      }

      // Get plugin details
      const pluginResult = await db.execute(sql`
        SELECT * FROM plugins WHERE id = ${pluginId} AND is_active = true
      `);

      if (pluginResult.rows.length === 0) {
        return res.status(404).json({ message: "Plugin not found or inactive" });
      }

      const plugin = pluginResult.rows[0];
      const price = billingCycle === 'yearly' ? plugin.yearly_price : plugin.monthly_price;

      // Create subscription
      const subscriptionResult = await db.execute(sql`
        INSERT INTO plugin_subscriptions (
          tenant_id, plugin_id, subscription_type, billing_cycle, 
          current_price, next_billing_date, status
        ) VALUES (
          ${tenantId}, ${pluginId}, 'plugin', ${billingCycle}, 
          ${price}, 
          ${billingCycle === 'yearly' ? sql`NOW() + INTERVAL '1 year'` : sql`NOW() + INTERVAL '1 month'`},
          'active'
        ) RETURNING *
      `);

      // Record in history
      await db.execute(sql`
        INSERT INTO plugin_subscription_history (
          subscription_id, action, amount, description
        ) VALUES (
          ${subscriptionResult.rows[0].id}, 'created', ${price}, 
          'Plugin subscription created'
        )
      `);

      res.json({ 
        message: "Successfully subscribed to plugin",
        subscription: subscriptionResult.rows[0]
      });
    } catch (error) {
      console.error("Error subscribing to plugin:", error);
      res.status(500).json({ message: "Failed to subscribe to plugin" });
    }
  });

  // Subscribe to plugin plan
  app.post("/api/tenant/:tenantId/subscribe-plan", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { planId, billingCycle } = req.body;

      // Check if already subscribed to a plan
      const existingResult = await db.execute(sql`
        SELECT id FROM plugin_subscriptions 
        WHERE tenant_id = ${tenantId} AND subscription_type = 'plan' AND status = 'active'
      `);

      if (existingResult.rows.length > 0) {
        return res.status(400).json({ message: "Already subscribed to a plan. Cancel existing subscription first." });
      }

      // Get plan details
      const planResult = await db.execute(sql`
        SELECT * FROM plugin_plans WHERE id = ${planId} AND is_active = true
      `);

      if (planResult.rows.length === 0) {
        return res.status(404).json({ message: "Plugin plan not found or inactive" });
      }

      const plan = planResult.rows[0];
      const price = billingCycle === 'yearly' ? plan.yearly_price : plan.monthly_price;

      // Create subscription
      const subscriptionResult = await db.execute(sql`
        INSERT INTO plugin_subscriptions (
          tenant_id, plan_id, subscription_type, billing_cycle, 
          current_price, next_billing_date, status
        ) VALUES (
          ${tenantId}, ${planId}, 'plan', ${billingCycle}, 
          ${price}, 
          ${billingCycle === 'yearly' ? sql`NOW() + INTERVAL '1 year'` : sql`NOW() + INTERVAL '1 month'`},
          'active'
        ) RETURNING *
      `);

      // Record in history
      await db.execute(sql`
        INSERT INTO plugin_subscription_history (
          subscription_id, action, amount, description
        ) VALUES (
          ${subscriptionResult.rows[0].id}, 'created', ${price}, 
          'Plugin plan subscription created'
        )
      `);

      res.json({ 
        message: "Successfully subscribed to plugin plan",
        subscription: subscriptionResult.rows[0]
      });
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      res.status(500).json({ message: "Failed to subscribe to plan" });
    }
  });

  // Cancel plugin subscription
  app.post("/api/tenant/:tenantId/cancel-subscription/:subscriptionId", async (req, res) => {
    try {
      const { tenantId, subscriptionId } = req.params;
      const { reason } = req.body;

      // Update subscription
      const result = await db.execute(sql`
        UPDATE plugin_subscriptions 
        SET status = 'cancelled', cancelled_at = NOW(), auto_renew = false,
            notes = COALESCE(notes, '') || ${reason ? `\nCancellation reason: ${reason}` : '\nCancelled by user'}
        WHERE id = ${subscriptionId} AND tenant_id = ${tenantId} AND status = 'active'
        RETURNING *
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Active subscription not found" });
      }

      // Record in history
      await db.execute(sql`
        INSERT INTO plugin_subscription_history (
          subscription_id, action, description
        ) VALUES (
          ${subscriptionId}, 'cancelled', 
          ${reason || 'Subscription cancelled by user'}
        )
      `);

      res.json({ 
        message: "Subscription cancelled successfully",
        subscription: result.rows[0]
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Get tenant available plugins (considering active subscriptions)
  app.get("/api/tenant/:tenantId/available-plugins", async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await db.execute(sql`
        SELECT 
          p.*,
          CASE WHEN ps.id IS NOT NULL THEN true ELSE false END as is_subscribed,
          ps.subscription_type,
          ps.billing_cycle,
          ps.expires_at,
          CASE WHEN plan_sub.id IS NOT NULL THEN true ELSE false END as included_in_plan
        FROM plugins p
        LEFT JOIN plugin_subscriptions ps ON p.id = ps.plugin_id 
          AND ps.tenant_id = ${tenantId} AND ps.status = 'active'
        LEFT JOIN plugin_subscriptions plan_sub ON plan_sub.tenant_id = ${tenantId} 
          AND plan_sub.subscription_type = 'plan' AND plan_sub.status = 'active'
        LEFT JOIN plugin_plans pp ON plan_sub.plan_id = pp.id
        WHERE p.is_active = true AND p.is_public = true
        ORDER BY p.category, p.name
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching available plugins:", error);
      res.status(500).json({ message: "Failed to fetch available plugins" });
    }
  });

  app.get("/api/admin/reports", async (req, res) => {
    try {
      // Revenue data for the last 12 months
      const revenueResult = await db.execute(sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          SUM(CAST(total AS DECIMAL)) as revenue
        FROM orders 
        WHERE status = 'completed' 
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `);

      // Tenant growth data
      const tenantGrowthResult = await db.execute(sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          COUNT(*) as count
        FROM tenants 
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `);

      // Category distribution
      const categoryResult = await db.execute(sql`
        SELECT 
          category as name,
          COUNT(*) as count,
          COALESCE(SUM(CAST(o.total AS DECIMAL)), 0) as revenue
        FROM tenants t
        LEFT JOIN orders o ON t.id = o.tenant_id AND o.status = 'completed'
        GROUP BY t.category
        ORDER BY count DESC
      `);

      const revenueData = revenueResult.rows.map((row: any) => ({
        month: row.month,
        revenue: parseFloat(row.revenue) || 0
      }));

      const tenantGrowthData = tenantGrowthResult.rows.map((row: any) => ({
        month: row.month,
        count: parseInt(row.count) || 0
      }));

      const categoryDistribution = categoryResult.rows.map((row: any) => ({
        name: row.name || 'Não definido',
        count: parseInt(row.count) || 0,
        revenue: parseFloat(row.revenue) || 0
      }));

      res.json({
        revenueData,
        tenantGrowthData,
        categoryDistribution
      });
    } catch (error) {
      console.error("Error fetching admin reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Attach notification functions to the server for use in routes
  (httpServer as any).sendNotification = sendNotification;
  (httpServer as any).broadcastToTenant = broadcastToTenant;

  return httpServer;
}