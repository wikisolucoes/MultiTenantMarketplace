import { db } from "./db";
import { orders } from "@shared/schema";

export async function seedOrders() {
  try {
    // Insert sample orders using correct table structure
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
        taxTotal: "25.00",
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        customerAddress: "Rua das Flores, 123",
        customerCity: "São Paulo",
        customerState: "SP",
        customerZipCode: "01234-567",
        trackingCode: "BR123456789",
        notes: "Entrega rápida solicitada",
        items: JSON.stringify([
          { id: 1, name: "Smartphone XYZ", sku: "PHONE-001", quantity: 1, price: "199.90" },
          { id: 2, name: "Capinha Protetora", sku: "CASE-001", quantity: 1, price: "50.00" }
        ]),
        shippingAddress: JSON.stringify({
          street: "Rua das Flores, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567"
        })
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
        taxTotal: "15.00",
        paymentMethod: "pix",
        paymentStatus: "paid",
        customerAddress: "Av. Copacabana, 456",
        customerCity: "Rio de Janeiro",
        customerState: "RJ",
        customerZipCode: "22070-001",
        notes: "Cliente preferencial",
        items: JSON.stringify([
          { id: 3, name: "Fone Bluetooth", sku: "HEADPHONE-001", quantity: 1, price: "129.50" }
        ]),
        shippingAddress: JSON.stringify({
          street: "Av. Copacabana, 456",
          city: "Rio de Janeiro",
          state: "RJ",
          zipCode: "22070-001"
        })
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
        taxTotal: "8.00",
        paymentMethod: "boleto",
        paymentStatus: "pending",
        customerAddress: "Rua da Liberdade, 789",
        customerCity: "Belo Horizonte",
        customerState: "MG",
        customerZipCode: "30112-000",
        notes: "Aguardando pagamento do boleto",
        items: JSON.stringify([
          { id: 4, name: "Carregador USB", sku: "CHARGER-001", quantity: 1, price: "79.90" }
        ]),
        shippingAddress: JSON.stringify({
          street: "Rua da Liberdade, 789",
          city: "Belo Horizonte",
          state: "MG",
          zipCode: "30112-000"
        })
      }
    ];

    for (const order of sampleOrders) {
      await db.insert(orders).values(order).onConflictDoNothing();
    }

    // Orders seeded successfully - items and history are stored as JSON in the orders table

    console.log("Order data seeded successfully");
  } catch (error) {
    console.error("Error seeding order data:", error);
  }
}

// Execute seeding immediately
seedOrders();