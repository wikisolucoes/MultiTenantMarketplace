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

  const httpServer = createServer(app);
  return httpServer;
}