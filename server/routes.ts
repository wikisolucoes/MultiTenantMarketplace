import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { 
  users,
  tenants,
  products,
  orders,
  customers,
  type User,
  type Tenant,
  type Product,
  type Order,
  type Customer
} from "@shared/schema";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For demo purposes, accept "admin123" or "demo123" as passwords
      const validPassword = password === "admin123" || password === "demo123";
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        message: "Login successful", 
        user: { 
          id: user.id, 
          email: user.email, 
          tenantId: user.tenantId 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tenant routes
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Tenants error:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // User routes
  app.get("/api/users/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const users = await storage.getUsersByTenantId(tenantId);
      res.json(users);
    } catch (error) {
      console.error("Users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Product routes
  app.get("/api/products/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const products = await storage.getProductsByTenantId(tenantId);
      res.json(products);
    } catch (error) {
      console.error("Products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Order routes
  app.get("/api/orders/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const orders = await storage.getOrdersByTenantId(tenantId);
      res.json(orders);
    } catch (error) {
      console.error("Orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const order = await storage.createOrder(req.body);
      res.json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Customer routes
  app.get("/api/customers/:tenantId", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const customers = await storage.getCustomersByTenantId(tenantId);
      res.json(customers);
    } catch (error) {
      console.error("Customers error:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // E-COMMERCE CHECKOUT ROUTES WITH CELCOIN INTEGRATION

  // Create checkout and order
  app.post("/api/checkout/create", async (req, res) => {
    try {
      const { items, customerData, paymentMethod, shippingCost = 0, discount = 0, notes } = req.body;
      const tenantId = req.body.tenantId || 1;

      // Validate products and calculate totals
      const productIds = items.map((item: any) => item.productId);
      const dbProducts = await db.select().from(products).where(eq(products.tenantId, tenantId));
      const availableProducts = dbProducts.filter(p => productIds.includes(p.id));

      if (availableProducts.length !== productIds.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Alguns produtos não estão disponíveis' 
        });
      }

      // Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = availableProducts.find(p => p.id === item.productId);
        if (!product) {
          return res.status(400).json({ 
            success: false, 
            message: `Produto ${item.productId} não encontrado` 
          });
        }

        const productStock = product.stock || 0;
        if (productStock < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Estoque insuficiente para ${product.name || 'produto'}` 
          });
        }

        const productPrice = parseFloat(product.price || '0');
        const itemTotal = item.quantity * productPrice;
        subtotal += itemTotal;

        orderItems.push({
          productId: item.productId,
          name: product.name || 'Produto',
          quantity: item.quantity,
          unitPrice: productPrice,
          totalPrice: itemTotal
        });
      }

      const total = subtotal + shippingCost - discount;
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create order
      const [newOrder] = await db.insert(orders).values({
        tenantId,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerDocument: customerData.cpf || '',
        customerPhone: customerData.phone || '',
        total: total.toString(),
        status: 'pending',
        paymentMethod,
        paymentStatus: 'pending',
        shippingAddress: JSON.stringify(customerData.address || {}),
        items: JSON.stringify(orderItems),
        notes: notes || '',
        customerAddress: customerData.address?.street || '',
        customerCity: customerData.address?.city || '',
        customerState: customerData.address?.state || '',
        customerZipCode: customerData.address?.postalCode || '',
        taxTotal: '0.00'
      }).returning();

      // Reserve stock
      for (const item of items) {
        const product = availableProducts.find(p => p.id === item.productId);
        if (product && product.stock !== null) {
          const newStock = product.stock - item.quantity;
          await db.update(products)
            .set({ stock: newStock })
            .where(eq(products.id, item.productId));
        }
      }

      console.log(`Order created: ${orderNumber} for tenant ${tenantId}`);

      res.json({
        success: true,
        orderId: newOrder.id,
        orderNumber,
        total,
        subtotal,
        shippingCost,
        discount,
        paymentMethod,
        status: 'pending',
        items: orderItems
      });

    } catch (error) {
      console.error('Error creating checkout:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Process payment with Celcoin
  app.post("/api/checkout/payment/process", async (req, res) => {
    try {
      const { orderId, paymentMethod } = req.body;

      // Get order details
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Pedido não encontrado' 
        });
      }

      if (order.paymentStatus !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: 'Pagamento já foi processado' 
        });
      }

      const correlationId = `PAY_${orderId}_${Date.now()}`;
      let paymentResult: any = null;

      // Simulate Celcoin payment processing
      if (paymentMethod === 'pix') {
        paymentResult = {
          transactionId: `PIX_${Date.now()}`,
          pixKey: `00020126580014BR.GOV.BCB.PIX0136${correlationId}5204000053039865802BR5925E-commerce Demo6009SAO PAULO`,
          qrCode: `00020126580014BR.GOV.BCB.PIX0136${correlationId}5204000053039865802BR5925E-commerce Demo6009SAO PAULO`,
          expirationDate: new Date(Date.now() + 30 * 60000).toISOString(),
          status: 'pending',
          paymentMethod: 'pix'
        };
      } else if (paymentMethod === 'boleto') {
        paymentResult = {
          transactionId: `BOL_${Date.now()}`,
          digitableLine: '34191.79001 01043.510047 91020.150008 1 84560000001000',
          barCode: '34191845600000010001790010434510479102015000',
          pdfUrl: `https://api.celcoin.com/boleto/${correlationId}.pdf`,
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          paymentMethod: 'boleto'
        };
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Método de pagamento não suportado' 
        });
      }

      // Update order with payment info
      await db.update(orders)
        .set({ 
          celcoinTransactionId: paymentResult.transactionId,
          paymentStatus: 'processing'
        })
        .where(eq(orders.id, orderId));

      console.log(`Payment processed for order ${orderId}: ${paymentResult.transactionId}`);

      res.json({
        success: true,
        ...paymentResult
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar pagamento' 
      });
    }
  });

  // Payment callback webhook
  app.post("/api/checkout/payment/callback", async (req, res) => {
    try {
      const { transactionId, status } = req.body;

      // Find order by transaction ID
      const [order] = await db.select().from(orders)
        .where(eq(orders.celcoinTransactionId, transactionId));

      if (!order) {
        console.warn(`Order not found for transaction ${transactionId}`);
        return res.json({ success: false, message: 'Order not found' });
      }

      // Update order status based on payment status
      let newPaymentStatus = 'pending';
      let newOrderStatus = order.status;

      switch (status.toLowerCase()) {
        case 'paid':
        case 'approved':
        case 'confirmed':
          newPaymentStatus = 'succeeded';
          newOrderStatus = 'confirmed';
          break;
        case 'cancelled':
        case 'failed':
          newPaymentStatus = 'failed';
          newOrderStatus = 'cancelled';
          break;
        case 'pending':
        case 'processing':
          newPaymentStatus = 'processing';
          break;
      }

      await db.update(orders)
        .set({
          paymentStatus: newPaymentStatus,
          status: newOrderStatus
        })
        .where(eq(orders.id, order.id));

      // Restore stock if payment failed
      if (newPaymentStatus === 'failed') {
        const orderItemsStr = order.items || '[]';
        const orderItems = JSON.parse(orderItemsStr);
        for (const item of orderItems) {
          const currentProduct = await db.select().from(products).where(eq(products.id, item.productId));
          if (currentProduct.length > 0) {
            const newStock = (currentProduct[0].stock || 0) + item.quantity;
            await db.update(products)
              .set({ stock: newStock })
              .where(eq(products.id, item.productId));
          }
        }
        console.log(`Payment failed for order ${order.id}, stock restored`);
      } else if (newPaymentStatus === 'succeeded') {
        console.log(`Payment confirmed for order ${order.id}`);
      }

      res.json({ success: true, orderId: order.id, status: newPaymentStatus });

    } catch (error) {
      console.error('Error handling payment callback:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Get order details
  app.get("/api/checkout/order/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const tenantId = req.query.tenantId || 1;

      const [order] = await db.select().from(orders)
        .where(eq(orders.id, parseInt(orderId)));

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Pedido não encontrado' 
        });
      }

      const orderItemsStr = order.items || '[]';
      const shippingAddressStr = order.shippingAddress || '{}';
      
      res.json({
        success: true,
        order: {
          ...order,
          items: JSON.parse(orderItemsStr),
          shippingAddress: JSON.parse(shippingAddressStr)
        }
      });

    } catch (error) {
      console.error('Error getting order:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Get order status
  app.get("/api/checkout/order/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;

      const [order] = await db.select({
        id: orders.id,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        celcoinTransactionId: orders.celcoinTransactionId,
        total: orders.total
      }).from(orders).where(eq(orders.id, parseInt(orderId)));

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Pedido não encontrado' 
        });
      }

      res.json({
        success: true,
        ...order
      });

    } catch (error) {
      console.error('Error getting order status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Simulate payment approval (for testing)
  app.post("/api/checkout/payment/simulate-approval", async (req, res) => {
    try {
      const { orderId } = req.body;

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Simulate webhook callback
      const callbackData = {
        transactionId: order.celcoinTransactionId,
        status: 'approved'
      };

      // Call our own webhook endpoint
      await fetch(`http://localhost:5000/api/checkout/payment/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callbackData)
      });

      res.json({ success: true, message: 'Payment approved successfully' });

    } catch (error) {
      console.error('Error simulating payment approval:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}