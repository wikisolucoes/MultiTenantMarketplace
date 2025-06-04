import type { Express } from "express";
import { createServer, type Server } from "http";
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

  const httpServer = createServer(app);
  return httpServer;
}