import { db } from "./db";
import { orders, orderItems, orderHistory } from "@shared/schema";

export async function seedOrders() {
  try {
    // Insert sample orders
    const sampleOrders = [
      {
        id: 1,
        tenantId: 1,
        status: "completed",
        customerName: "João Silva",
        customerEmail: "joao.silva@email.com",
        customerPhone: "(11) 99999-8888",
        customerDocument: "123.456.789-10",
        total: "299.90",
        taxAmount: "25.00",
        shippingCost: "25.00",
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        billingAddress: "Rua das Flores, 123",
        billingCity: "São Paulo",
        billingState: "SP",
        billingZipCode: "01234-567",
        shippingAddress: "Rua das Flores, 123",
        shippingCity: "São Paulo",
        shippingState: "SP",
        shippingZipCode: "01234-567",
        trackingCode: "BR123456789",
        notes: "Entrega rápida solicitada",
      },
      {
        id: 2,
        tenantId: 1,
        status: "processing",
        customerName: "Maria Santos",
        customerEmail: "maria.santos@email.com",
        customerPhone: "(21) 98888-7777",
        customerDocument: "987.654.321-00",
        total: "159.50",
        taxAmount: "15.00",
        shippingCost: "15.00",
        paymentMethod: "pix",
        paymentStatus: "paid",
        billingAddress: "Av. Copacabana, 456",
        billingCity: "Rio de Janeiro",
        billingState: "RJ",
        billingZipCode: "22070-001",
        shippingAddress: "Av. Copacabana, 456",
        shippingCity: "Rio de Janeiro",
        shippingState: "RJ",
        shippingZipCode: "22070-001",
        notes: "Cliente preferencial",
      },
      {
        id: 3,
        tenantId: 1,
        status: "pending",
        customerName: "Carlos Oliveira",
        customerEmail: "carlos.oliveira@email.com",
        customerPhone: "(31) 97777-6666",
        customerDocument: "456.789.123-45",
        total: "89.90",
        taxAmount: "8.00",
        shippingCost: "2.00",
        paymentMethod: "boleto",
        paymentStatus: "pending",
        billingAddress: "Rua da Liberdade, 789",
        billingCity: "Belo Horizonte",
        billingState: "MG",
        billingZipCode: "30112-000",
        shippingAddress: "Rua da Liberdade, 789",
        shippingCity: "Belo Horizonte",
        shippingState: "MG",
        shippingZipCode: "30112-000",
        notes: "Aguardando pagamento do boleto",
      }
    ];

    for (const order of sampleOrders) {
      await db.insert(orders).values(order).onConflictDoNothing();
    }

    // Insert sample order items
    const sampleOrderItems = [
      {
        orderId: 1,
        productId: 1,
        productName: "Smartphone XYZ",
        productSku: "PHONE-001",
        quantity: 1,
        unitPrice: "199.90",
        totalPrice: "199.90",
      },
      {
        orderId: 1,
        productId: 2,
        productName: "Capinha Protetora",
        productSku: "CASE-001",
        quantity: 1,
        unitPrice: "50.00",
        totalPrice: "50.00",
      },
      {
        orderId: 2,
        productId: 3,
        productName: "Fone Bluetooth",
        productSku: "HEADPHONE-001",
        quantity: 1,
        unitPrice: "129.50",
        totalPrice: "129.50",
      },
      {
        orderId: 3,
        productId: 4,
        productName: "Carregador USB",
        productSku: "CHARGER-001",
        quantity: 1,
        unitPrice: "79.90",
        totalPrice: "79.90",
      }
    ];

    for (const item of sampleOrderItems) {
      await db.insert(orderItems).values(item).onConflictDoNothing();
    }

    // Insert sample order history
    const sampleHistory = [
      {
        orderId: 1,
        status: "completed",
        comment: "Pedido entregue com sucesso",
        userId: 1,
        userType: "admin",
        notifyCustomer: true,
      },
      {
        orderId: 2,
        status: "processing",
        comment: "Pedido em processamento",
        userId: 1,
        userType: "admin",
        notifyCustomer: true,
      },
      {
        orderId: 3,
        status: "pending",
        comment: "Aguardando pagamento",
        userId: 1,
        userType: "system",
        notifyCustomer: false,
      }
    ];

    for (const history of sampleHistory) {
      await db.insert(orderHistory).values(history).onConflictDoNothing();
    }

    console.log("Order data seeded successfully");
  } catch (error) {
    console.error("Error seeding order data:", error);
  }
}

// Execute seeding immediately
seedOrders();