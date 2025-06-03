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
  financialSecurityStack, 
  financialOperationLimiter,
  type SecureRequest 
} from "./middleware/financial-security";
import { FinancialLedgerService, type LedgerContext } from "./services/ledger";
import { CelcoinIntegrationService } from "./services/celcoin-integration";
import { ReconciliationService } from "./services/reconciliation";
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

  // Integrated Withdrawal with Celcoin Cash-Out
  app.post("/api/tenant/withdrawals", 
    withdrawalLimiter, 
    financialOperationLimiter,
    ...financialSecurityStack,
    authenticateToken, 
    requireTenant, 
    enforceTenantIsolation, 
    async (req: TenantRequest & SecureRequest, res) => {
    try {
      const { amount, bankAccountId } = req.body;

      if (!amount || !bankAccountId) {
        return res.status(400).json({ message: "Valor e conta bancária são obrigatórios" });
      }

      // Get bank account details
      const bankAccounts = await storage.getBankAccountsByUserId(req.user!.id);
      const bankAccount = bankAccounts.find(acc => acc.id === parseInt(bankAccountId));

      if (!bankAccount) {
        return res.status(404).json({ message: "Conta bancária não encontrada" });
      }

      // Create ledger context for security audit
      const ledgerContext: LedgerContext = {
        tenantId: req.tenantId,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        sessionId: req.sessionId,
      };

      // Process secure Celcoin cash-out
      const celcoinResult = await CelcoinIntegrationService.processCashOut({
        tenantId: req.tenantId,
        amount: amount.toString(),
        bankAccount: {
          bank: bankAccount.bank,
          agency: bankAccount.agency,
          account: bankAccount.account,
        },
        description: `Saque para ${bankAccount.bank} - Agência: ${bankAccount.agency}`,
        metadata: {
          bankAccountId,
          riskScore: req.riskScore,
          deviceFingerprint: req.deviceFingerprint,
        }
      }, ledgerContext);

      if (!celcoinResult.success) {
        return res.status(400).json({ 
          message: celcoinResult.message,
          transactionId: celcoinResult.transactionId 
        });
      }

      // Create withdrawal record in our system
      const withdrawal = await storage.createWithdrawal({
        tenantId: req.tenantId,
        amount: parseFloat(amount),
        bankAccountId: parseInt(bankAccountId),
        status: "processing",
        celcoinTransactionId: celcoinResult.celcoinTransactionId || "",
      });

      res.json({ 
        message: "Saque processado com Celcoin com sucesso",
        withdrawalId: withdrawal.id,
        transactionId: celcoinResult.transactionId,
        celcoinTransactionId: celcoinResult.celcoinTransactionId,
        amount: amount,
        status: celcoinResult.status,
        ledgerEntryId: celcoinResult.ledgerEntryId
      });

    } catch (error) {
      console.error("Integrated withdrawal error:", error);
      res.status(500).json({ message: "Erro ao processar saque com Celcoin" });
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

  // Integrated Checkout with Celcoin Cash-In
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

      // Create order first
      const order = await storage.createOrder({
        tenantId: tenant.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        total: totalAmount,
        paymentMethod,
        status: "pending",
        paymentStatus: "pending",
      });

      // If payment method requires immediate processing (PIX, Credit Card)
      if (paymentMethod === "pix" || paymentMethod === "credit_card") {
        // Create ledger context for the transaction
        const ledgerContext: LedgerContext = {
          tenantId: tenant.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
          orderId: order.id,
        };

        // Process Celcoin cash-in for immediate payment methods
        const celcoinResult = await CelcoinIntegrationService.processCashIn({
          tenantId: tenant.id,
          amount: totalAmount.toString(),
          paymentMethod: paymentMethod as "pix" | "credit_card",
          customerData: {
            name: customerData.name,
            email: customerData.email,
            document: customerData.document || "",
          },
          metadata: {
            orderId: order.id,
            items,
            shippingAddress,
          }
        }, ledgerContext);

        if (celcoinResult.success) {
          // Update order with Celcoin transaction ID
          await storage.updateOrderStatus(
            order.id, 
            "confirmed", 
            celcoinResult.status === "confirmed" ? "paid" : "processing"
          );

          res.json({ 
            orderId: order.id,
            status: "confirmed",
            paymentStatus: celcoinResult.status,
            transactionId: celcoinResult.transactionId,
            celcoinTransactionId: celcoinResult.celcoinTransactionId,
            paymentInstructions: {
              method: paymentMethod,
              amount: totalAmount,
              status: celcoinResult.status,
              message: paymentMethod === "pix" 
                ? "Pagamento PIX processado com sucesso"
                : "Pagamento no cartão processado com sucesso"
            }
          });
        } else {
          res.status(400).json({ 
            error: "Payment processing failed",
            orderId: order.id,
            details: celcoinResult.message 
          });
        }
      } else {
        // For boleto or other methods, return order without immediate processing
        res.json({ 
          orderId: order.id,
          status: "created",
          paymentInstructions: {
            method: paymentMethod,
            amount: totalAmount,
            message: "Instruções de pagamento enviadas por email"
          }
        });
      }
    } catch (error: any) {
      console.error("Integrated checkout error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Secure Financial Operations - Celcoin Cash-In/Cash-Out with Full Ledger Integration
  
  // Cash-In (Receive Payment) with Full Security Stack
  app.post("/api/financial/cash-in", 
    financialOperationLimiter,
    ...financialSecurityStack,
    authenticateToken, 
    requireTenant, 
    enforceTenantIsolation, 
    async (req: TenantRequest & SecureRequest, res) => {
    try {
      const { amount, paymentMethod, customerData } = req.body;

      if (!amount || !paymentMethod || !customerData) {
        return res.status(400).json({ 
          error: "Amount, payment method, and customer data are required" 
        });
      }

      // Create ledger context for security audit
      const ledgerContext: LedgerContext = {
        tenantId: req.tenantId,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        sessionId: req.sessionId,
      };

      // Process secure cash-in operation
      const result = await CelcoinIntegrationService.processCashIn({
        tenantId: req.tenantId,
        amount,
        paymentMethod,
        customerData,
        metadata: {
          riskScore: req.riskScore,
          deviceFingerprint: req.deviceFingerprint,
        }
      }, ledgerContext);

      if (!result.success) {
        return res.status(400).json({ 
          error: result.message,
          transactionId: result.transactionId 
        });
      }

      res.json({
        success: true,
        transactionId: result.transactionId,
        celcoinTransactionId: result.celcoinTransactionId,
        amount: result.amount,
        status: result.status,
        message: "Cash-in operation initiated successfully"
      });

    } catch (error) {
      console.error("Cash-in error:", error);
      res.status(500).json({ 
        error: "Failed to process cash-in operation",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Cash-Out (Withdrawal) with Enhanced Security Controls
  app.post("/api/financial/cash-out", 
    withdrawalLimiter,
    financialOperationLimiter,
    ...financialSecurityStack,
    authenticateToken, 
    requireTenant, 
    enforceTenantIsolation, 
    async (req: TenantRequest & SecureRequest, res) => {
    try {
      const { amount, bankAccount, description } = req.body;

      if (!amount || !bankAccount) {
        return res.status(400).json({ 
          error: "Amount and bank account details are required" 
        });
      }

      // Create ledger context for security audit
      const ledgerContext: LedgerContext = {
        tenantId: req.tenantId,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        sessionId: req.sessionId,
      };

      // Process secure cash-out operation
      const result = await CelcoinIntegrationService.processCashOut({
        tenantId: req.tenantId,
        amount,
        bankAccount,
        description,
        metadata: {
          riskScore: req.riskScore,
          deviceFingerprint: req.deviceFingerprint,
        }
      }, ledgerContext);

      if (!result.success) {
        return res.status(400).json({ 
          error: result.message,
          transactionId: result.transactionId 
        });
      }

      res.json({
        success: true,
        transactionId: result.transactionId,
        celcoinTransactionId: result.celcoinTransactionId,
        amount: result.amount,
        status: result.status,
        message: "Cash-out operation initiated successfully"
      });

    } catch (error) {
      console.error("Cash-out error:", error);
      res.status(500).json({ 
        error: "Failed to process cash-out operation",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Financial Ledger - Get Transaction History
  app.get("/api/financial/ledger", 
    authenticateToken, 
    requireTenant, 
    enforceTenantIsolation, 
    async (req: TenantRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const entries = await FinancialLedgerService.getLedgerEntries(
        req.tenantId, 
        limit, 
        offset
      );

      const currentBalance = await FinancialLedgerService.getCurrentBalance(req.tenantId);

      res.json({
        currentBalance,
        entries,
        pagination: {
          limit,
          offset,
          hasMore: entries.length === limit
        }
      });

    } catch (error) {
      console.error("Ledger retrieval error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve ledger entries" 
      });
    }
  });

  // Balance Synchronization with Celcoin
  app.post("/api/financial/sync-balance", 
    authenticateToken, 
    requireTenant, 
    enforceTenantIsolation, 
    async (req: TenantRequest, res) => {
    try {
      const syncResult = await CelcoinIntegrationService.syncBalance(req.tenantId);

      res.json({
        systemBalance: syncResult.systemBalance,
        celcoinBalance: syncResult.celcoinBalance,
        isReconciled: syncResult.isReconciled,
        difference: (parseFloat(syncResult.systemBalance) - parseFloat(syncResult.celcoinBalance)).toFixed(2)
      });

    } catch (error) {
      console.error("Balance sync error:", error);
      res.status(500).json({ 
        error: "Failed to synchronize balance with Celcoin" 
      });
    }
  });

  // Financial Reconciliation - Get History
  app.get("/api/financial/reconciliation", 
    authenticateToken, 
    requireTenant, 
    enforceTenantIsolation, 
    async (req: TenantRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const reconciliations = await ReconciliationService.getReconciliationHistory(
        req.tenantId, 
        limit, 
        offset
      );

      res.json(reconciliations);

    } catch (error) {
      console.error("Reconciliation history error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve reconciliation history" 
      });
    }
  });

  // Manual Reconciliation Trigger
  app.post("/api/financial/reconciliation/manual", 
    authenticateToken, 
    requireTenant, 
    enforceTenantIsolation, 
    async (req: TenantRequest, res) => {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: "Start date and end date are required" 
        });
      }

      const result = await ReconciliationService.performReconciliation(
        req.tenantId,
        new Date(startDate),
        new Date(endDate),
        "manual"
      );

      res.json({
        reconciliationId: result.record.id,
        isReconciled: result.isReconciled,
        requiresManualReview: result.requiresManualReview,
        discrepancies: result.discrepancies,
        systemBalance: result.record.systemBalance,
        celcoinBalance: result.record.celcoinBalance,
        difference: result.record.difference
      });

    } catch (error) {
      console.error("Manual reconciliation error:", error);
      res.status(500).json({ 
        error: "Failed to perform manual reconciliation" 
      });
    }
  });

  // Admin Routes - Financial Overview and Compliance
  app.get("/api/admin/financial/overview", 
    authenticateToken, 
    requireRole("admin"), 
    async (req, res) => {
    try {
      // Get pending reconciliations requiring manual review
      const pendingReconciliations = await ReconciliationService.getPendingReconciliations();
      
      // Get admin stats with financial data
      const adminStats = await storage.getAdminStats();

      res.json({
        adminStats,
        pendingReconciliations: pendingReconciliations.length,
        requiresAttention: pendingReconciliations.filter(r => r.status === "discrepancy_found").length
      });

    } catch (error) {
      console.error("Admin financial overview error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve financial overview" 
      });
    }
  });

  // Enhanced Webhook Handler with Ledger Integration
  app.post("/api/webhooks/celcoin", async (req, res) => {
    try {
      const signature = req.headers["x-celcoin-signature"] as string;
      const payload = JSON.stringify(req.body);

      if (!celcoinService.verifyWebhookSignature(payload, signature)) {
        return res.status(401).json({ message: "Invalid webhook signature" });
      }

      const { transactionId, status, type, tenantId } = req.body;

      // Enhanced webhook processing with ledger integration
      if (type === "withdrawal" || type === "cash_out") {
        await WithdrawalService.handleWebhookUpdate(transactionId, status);
      } else if (type === "payment" || type === "cash_in") {
        await CelcoinIntegrationService.handleWebhook(tenantId, req.body, signature);
      }

      res.json({ 
        message: "Webhook processed successfully",
        transactionId,
        status: "processed"
      });

    } catch (error) {
      console.error("Enhanced webhook error:", error);
      res.status(500).json({ 
        message: "Webhook processing failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
