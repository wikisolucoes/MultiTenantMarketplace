import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "./storage";
import { authenticateToken, generateToken, requireRole, requireTenant, type AuthRequest } from "./middleware/auth";
import { enforceTenantIsolation, type TenantRequest } from "./middleware/tenant";
import { ValidationService } from "./services/validation";
import { WithdrawalService } from "./services/withdrawal";
import { celcoinService } from "./services/celcoin";
import { 
  loginSchema, 
  tenantRegistrationSchema,
  insertProductSchema,
  insertOrderSchema,
  type LoginData,
  type TenantRegistrationData 
} from "@shared/schema";

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: "Muitas tentativas de login. Tente novamente em 15 minutos." },
});

const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 withdrawals per hour
  message: { message: "Limite de saques por hora excedido." },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password }: LoginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || undefined,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/register-tenant", async (req, res) => {
    try {
      const data: TenantRegistrationData = tenantRegistrationSchema.parse(req.body);

      // Validate document
      const documentValid = ValidationService.validateDocument(data.document, data.documentType);
      if (!documentValid) {
        return res.status(400).json({ message: "CPF/CNPJ inválido" });
      }

      // Check if subdomain is available
      const existingTenant = await storage.getTenantBySubdomain(data.subdomain);
      if (existingTenant) {
        return res.status(400).json({ message: "Subdomínio já está em uso" });
      }

      // Check if email is available
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "E-mail já está em uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create tenant, user, bank account, and Celcoin account
      const result = await storage.registerTenant({
        ...data,
        password: hashedPassword,
      });

      // Create Celcoin account via API
      try {
        await celcoinService.createAccount({
          document: data.document,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          bankAccount: {
            bank: data.bank,
            agency: data.agency,
            account: data.account,
          },
        });
      } catch (celcoinError) {
        console.error("Celcoin account creation error:", celcoinError);
        // Continue with registration even if Celcoin fails
      }

      // Generate token
      const token = generateToken({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.tenant.id,
      });

      res.status(201).json({
        token,
        tenant: result.tenant,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          tenantId: result.tenant.id,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Tenant registration error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Validation routes
  app.post("/api/validation/document", async (req, res) => {
    try {
      const { document, type } = req.body;
      
      if (!document || !type) {
        return res.status(400).json({ message: "Documento e tipo são obrigatórios" });
      }

      const result = await ValidationService.validateDocumentWithReceita(document, type);
      res.json(result);
    } catch (error) {
      console.error("Document validation error:", error);
      res.status(500).json({ message: "Erro na validação do documento" });
    }
  });

  // Protected routes
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
    });
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/admin/tenants", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Get tenants error:", error);
      res.status(500).json({ message: "Erro ao buscar lojistas" });
    }
  });

  // Tenant-scoped routes
  app.get("/api/tenant/financial-stats", authenticateToken, requireTenant, enforceTenantIsolation, async (req: TenantRequest, res) => {
    try {
      const stats = await storage.getTenantFinancialStats(req.tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Financial stats error:", error);
      res.status(500).json({ message: "Erro ao buscar dados financeiros" });
    }
  });

  app.get("/api/tenant/products", authenticateToken, requireTenant, enforceTenantIsolation, async (req: TenantRequest, res) => {
    try {
      const products = await storage.getProductsByTenantId(req.tenantId);
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  app.post("/api/tenant/products", authenticateToken, requireTenant, enforceTenantIsolation, async (req: TenantRequest, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });

      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create product error:", error);
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  });

  app.get("/api/tenant/orders", authenticateToken, requireTenant, enforceTenantIsolation, async (req: TenantRequest, res) => {
    try {
      const orders = await storage.getOrdersByTenantId(req.tenantId);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  app.post("/api/tenant/orders", authenticateToken, requireTenant, enforceTenantIsolation, async (req: TenantRequest, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        tenantId: req.tenantId,
      });

      const order = await storage.createOrder(orderData);

      // Process payment with Celcoin
      try {
        const celcoinAccount = await storage.getCelcoinAccountByTenantId(req.tenantId);
        if (celcoinAccount) {
          const paymentResult = await celcoinService.createPayment({
            accountId: celcoinAccount.celcoinAccountId,
            amount: order.total,
            paymentMethod: order.paymentMethod as "pix" | "credit_card" | "boleto",
            customerData: {
              name: order.customerName,
              email: order.customerEmail,
              document: "00000000000", // Would get from customer data
            },
          });

          // Update order with Celcoin transaction ID
          await storage.updateOrderStatus(order.id, order.status, order.paymentStatus);
        }
      } catch (celcoinError) {
        console.error("Celcoin payment error:", celcoinError);
        // Continue with order creation even if payment processing fails
      }

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create order error:", error);
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  app.get("/api/tenant/withdrawals", authenticateToken, requireTenant, enforceTenantIsolation, async (req: TenantRequest, res) => {
    try {
      const withdrawals = await storage.getWithdrawalsByTenantId(req.tenantId);
      res.json(withdrawals);
    } catch (error) {
      console.error("Get withdrawals error:", error);
      res.status(500).json({ message: "Erro ao buscar saques" });
    }
  });

  app.post("/api/tenant/withdrawals", withdrawalLimiter, authenticateToken, requireTenant, enforceTenantIsolation, async (req: TenantRequest, res) => {
    try {
      const { amount, bankAccountId } = req.body;

      if (!amount || !bankAccountId) {
        return res.status(400).json({ message: "Valor e conta bancária são obrigatórios" });
      }

      const result = await WithdrawalService.processWithdrawal(
        req.tenantId,
        parseFloat(amount),
        parseInt(bankAccountId)
      );

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({ message: "Saque solicitado com sucesso", withdrawalId: result.withdrawalId });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: "Erro ao processar saque" });
    }
  });

  // Public APIs for storefront (no authentication required)
  app.get("/api/public/tenant/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const tenant = await storage.getTenantBySubdomain(subdomain);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      res.json(tenant);
    } catch (error: any) {
      console.error("Public tenant fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/public/products/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const tenant = await storage.getTenantBySubdomain(subdomain);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      const products = await storage.getProductsByTenantId(tenant.id);
      res.json(products);
    } catch (error: any) {
      console.error("Public products fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/public/orders", async (req, res) => {
    try {
      const { 
        customerData, 
        shippingAddress, 
        paymentMethod, 
        items, 
        totalAmount, 
        shippingCost,
        subdomain 
      } = req.body;
      
      const tenant = await storage.getTenantBySubdomain(subdomain || 'demo');
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Create order
      const order = await storage.createOrder({
        tenantId: tenant.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        total: totalAmount,
        paymentMethod,
        status: "pending",
        paymentStatus: "pending",
      });

      res.json({ 
        orderId: order.id,
        status: "created",
        paymentInstructions: {
          method: paymentMethod,
          amount: totalAmount,
          message: "Instruções de pagamento enviadas por email"
        }
      });
    } catch (error: any) {
      console.error("Public order creation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook routes
  app.post("/api/webhooks/celcoin", async (req, res) => {
    try {
      const signature = req.headers["x-celcoin-signature"] as string;
      const payload = JSON.stringify(req.body);

      if (!celcoinService.verifyWebhookSignature(payload, signature)) {
        return res.status(401).json({ message: "Invalid signature" });
      }

      const { transactionId, status, type } = req.body;

      if (type === "withdrawal") {
        await WithdrawalService.handleWebhookUpdate(transactionId, status);
      } else if (type === "payment") {
        // Handle payment webhook
        console.log("Payment webhook received:", req.body);
      }

      res.json({ message: "Webhook processed" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
