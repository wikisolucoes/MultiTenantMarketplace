import { db } from "./db";
import { ledgerEntries, orders, transactions } from "@shared/schema";

export async function seedLedgerAndTransactions() {
  console.log("🌱 Seeding ledger entries and transactions...");

  try {
    // First, let's create some orders for reference
    const orderData = [
      {
        id: "ORD-001",
        tenantId: 5,
        userId: 3,
        total: "299.99",
        status: "completed",
        paymentStatus: "succeeded",
        celcoinTransactionId: "CEL001",
        createdAt: new Date("2024-12-01T10:00:00Z"),
        updatedAt: new Date("2024-12-01T10:00:00Z")
      },
      {
        id: "ORD-002", 
        tenantId: 5,
        userId: 3,
        total: "149.50",
        status: "completed",
        paymentStatus: "succeeded",
        celcoinTransactionId: "CEL002",
        createdAt: new Date("2024-12-02T14:30:00Z"),
        updatedAt: new Date("2024-12-02T14:30:00Z")
      },
      {
        id: "ORD-003",
        tenantId: 1,
        userId: 2,
        total: "89.90",
        status: "completed", 
        paymentStatus: "succeeded",
        celcoinTransactionId: "CEL003",
        createdAt: new Date("2024-12-03T16:15:00Z"),
        updatedAt: new Date("2024-12-03T16:15:00Z")
      },
      {
        id: "ORD-004",
        tenantId: 2,
        userId: 4,
        total: "199.00",
        status: "completed",
        paymentStatus: "succeeded", 
        celcoinTransactionId: "CEL004",
        createdAt: new Date("2024-12-04T09:45:00Z"),
        updatedAt: new Date("2024-12-04T09:45:00Z")
      },
      {
        id: "ORD-005",
        tenantId: 5,
        userId: 3,
        total: "349.99",
        status: "completed",
        paymentStatus: "succeeded",
        celcoinTransactionId: "CEL005",
        createdAt: new Date("2024-12-05T11:20:00Z"),
        updatedAt: new Date("2024-12-05T11:20:00Z")
      }
    ];

    // Insert orders
    for (const order of orderData) {
      await db.insert(orders).values(order).onConflictDoNothing();
    }

    // Create ledger entries for these orders
    const ledgerData = [
      // Credits from sales
      {
        tenantId: 5,
        transactionType: "credit",
        amount: "284.99", // Order total minus platform fee
        description: "Venda - Pedido ORD-001",
        referenceType: "order",
        referenceId: "ORD-001",
        celcoinTransactionId: "CEL001",
        metadata: { orderId: "ORD-001", platformFee: "15.00" },
        createdAt: new Date("2024-12-01T10:05:00Z")
      },
      {
        tenantId: 5,
        transactionType: "credit", 
        amount: "142.03", // Order total minus platform fee
        description: "Venda - Pedido ORD-002",
        referenceType: "order",
        referenceId: "ORD-002",
        celcoinTransactionId: "CEL002",
        metadata: { orderId: "ORD-002", platformFee: "7.47" },
        createdAt: new Date("2024-12-02T14:35:00Z")
      },
      {
        tenantId: 1,
        transactionType: "credit",
        amount: "85.41", // Order total minus platform fee
        description: "Venda - Pedido ORD-003",
        referenceType: "order", 
        referenceId: "ORD-003",
        celcoinTransactionId: "CEL003",
        metadata: { orderId: "ORD-003", platformFee: "4.49" },
        createdAt: new Date("2024-12-03T16:20:00Z")
      },
      {
        tenantId: 2,
        transactionType: "credit",
        amount: "189.05", // Order total minus platform fee
        description: "Venda - Pedido ORD-004",
        referenceType: "order",
        referenceId: "ORD-004", 
        celcoinTransactionId: "CEL004",
        metadata: { orderId: "ORD-004", platformFee: "9.95" },
        createdAt: new Date("2024-12-04T09:50:00Z")
      },
      {
        tenantId: 5,
        transactionType: "credit",
        amount: "332.49", // Order total minus platform fee
        description: "Venda - Pedido ORD-005",
        referenceType: "order",
        referenceId: "ORD-005",
        celcoinTransactionId: "CEL005", 
        metadata: { orderId: "ORD-005", platformFee: "17.50" },
        createdAt: new Date("2024-12-05T11:25:00Z")
      },
      // Debits for fees and withdrawals
      {
        tenantId: 5,
        transactionType: "debit",
        amount: "50.00",
        description: "Taxa de Saque Celcoin",
        referenceType: "withdrawal",
        referenceId: "WD001",
        celcoinTransactionId: "CEL006",
        metadata: { withdrawalAmount: "500.00", fee: "50.00" },
        createdAt: new Date("2024-12-06T10:00:00Z")
      },
      {
        tenantId: 1,
        transactionType: "debit", 
        amount: "25.00",
        description: "Taxa Mensal Celcoin",
        referenceType: "fee",
        referenceId: "FEE001",
        celcoinTransactionId: "CEL007",
        metadata: { feeType: "monthly", period: "2024-12" },
        createdAt: new Date("2024-12-07T08:00:00Z")
      },
      {
        tenantId: 2,
        transactionType: "debit",
        amount: "30.00", 
        description: "Taxa de Processamento",
        referenceType: "fee",
        referenceId: "FEE002",
        celcoinTransactionId: "CEL008",
        metadata: { feeType: "processing", transactions: 15 },
        createdAt: new Date("2024-12-08T09:30:00Z")
      },
      // Additional credits
      {
        tenantId: 5,
        transactionType: "credit",
        amount: "500.00",
        description: "Depósito Inicial Celcoin",
        referenceType: "deposit",
        referenceId: "DEP001",
        celcoinTransactionId: "CEL009",
        metadata: { depositType: "initial", source: "bank_transfer" },
        createdAt: new Date("2024-11-30T15:00:00Z")
      },
      {
        tenantId: 1,
        transactionType: "credit",
        amount: "250.00",
        description: "Bônus de Ativação",
        referenceType: "bonus",
        referenceId: "BON001", 
        celcoinTransactionId: "CEL010",
        metadata: { bonusType: "activation", campaign: "launch2024" },
        createdAt: new Date("2024-11-28T12:00:00Z")
      }
    ];

    // Insert ledger entries
    for (const entry of ledgerData) {
      await db.insert(ledgerEntries).values(entry).onConflictDoNothing();
    }

    // Create transaction records
    const transactionData = [
      {
        id: "TXN-001",
        tenantId: 5,
        orderId: "ORD-001",
        amount: "299.99",
        type: "payment",
        status: "completed",
        paymentMethod: "credit_card",
        celcoinTransactionId: "CEL001",
        metadata: { cardLast4: "1234", brand: "visa" },
        createdAt: new Date("2024-12-01T10:00:00Z"),
        updatedAt: new Date("2024-12-01T10:00:00Z")
      },
      {
        id: "TXN-002",
        tenantId: 5,
        orderId: "ORD-002", 
        amount: "149.50",
        type: "payment",
        status: "completed",
        paymentMethod: "pix",
        celcoinTransactionId: "CEL002",
        metadata: { pixKey: "user@example.com" },
        createdAt: new Date("2024-12-02T14:30:00Z"),
        updatedAt: new Date("2024-12-02T14:30:00Z")
      },
      {
        id: "TXN-003",
        tenantId: 1,
        orderId: "ORD-003",
        amount: "89.90",
        type: "payment", 
        status: "completed",
        paymentMethod: "debit_card",
        celcoinTransactionId: "CEL003",
        metadata: { cardLast4: "5678", brand: "mastercard" },
        createdAt: new Date("2024-12-03T16:15:00Z"),
        updatedAt: new Date("2024-12-03T16:15:00Z")
      },
      {
        id: "TXN-004",
        tenantId: 2,
        orderId: "ORD-004",
        amount: "199.00",
        type: "payment",
        status: "completed",
        paymentMethod: "credit_card",
        celcoinTransactionId: "CEL004",
        metadata: { cardLast4: "9012", brand: "visa" },
        createdAt: new Date("2024-12-04T09:45:00Z"),
        updatedAt: new Date("2024-12-04T09:45:00Z")
      },
      {
        id: "TXN-005",
        tenantId: 5,
        orderId: "ORD-005",
        amount: "349.99",
        type: "payment",
        status: "completed", 
        paymentMethod: "pix",
        celcoinTransactionId: "CEL005",
        metadata: { pixKey: "+5511999887766" },
        createdAt: new Date("2024-12-05T11:20:00Z"),
        updatedAt: new Date("2024-12-05T11:20:00Z")
      }
    ];

    // Insert transactions
    for (const transaction of transactionData) {
      await db.insert(transactions).values(transaction).onConflictDoNothing();
    }

    console.log("✅ Ledger entries and transactions seeded successfully!");
    console.log(`📊 Created:
    - ${orderData.length} orders
    - ${ledgerData.length} ledger entries  
    - ${transactionData.length} transactions`);

  } catch (error) {
    console.error("❌ Error seeding ledger data:", error);
    throw error;
  }
}