const { db } = require('./db');
const { orders, products, ledgerEntries, celcoinTransactionLog, customers } = require('../shared/schema');
const { eq, and } = require('drizzle-orm');
const { celcoinApi } = require('./celcoin-integration');

// Create complete checkout with order creation and payment processing
async function createCheckout(req, res) {
  const { items, customerData, paymentMethod, shippingCost = 0, discount = 0, notes } = req.body;
  const tenantId = req.body.tenantId || 1; // Default tenant

  try {
    // Validate and get product details
    const productIds = items.map(item => item.productId);
    const dbProducts = await db.select().from(products)
      .where(and(
        products.tenantId.equals(tenantId),
        products.id.in(productIds)
      ));

    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Alguns produtos não estão disponíveis' 
      });
    }

    // Calculate totals and validate stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = dbProducts.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Produto ${item.productId} não encontrado` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Estoque insuficiente para ${product.name}` 
        });
      }

      const itemTotal = item.quantity * parseFloat(product.price);
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        unitPrice: parseFloat(product.price),
        totalPrice: itemTotal
      });
    }

    const total = subtotal + shippingCost - discount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create order in database
    const [newOrder] = await db.insert(orders).values({
      tenantId,
      customerName: customerData.name,
      customerEmail: customerData.email,
      customerDocument: customerData.cpf,
      customerPhone: customerData.phone,
      total: total.toString(),
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      shippingAddress: JSON.stringify(customerData.address),
      items: JSON.stringify(orderItems),
      notes,
      customerAddress: customerData.address?.street,
      customerCity: customerData.address?.city,
      customerState: customerData.address?.state,
      customerZipCode: customerData.address?.postalCode,
      taxTotal: '0.00'
    }).returning();

    // Reserve stock
    for (const item of items) {
      await db.update(products)
        .set({ stock: db.raw(`stock - ${item.quantity}`) })
        .where(eq(products.id, item.productId));
    }

    // Create ledger entry
    await db.insert(ledgerEntries).values({
      tenantId,
      entryType: 'order',
      transactionType: 'pending',
      amount: total.toString(),
      runningBalance: '0.00',
      orderId: newOrder.id,
      description: `Pedido criado: ${orderNumber}`,
      status: 'pending'
    });

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
}

// Process payment for existing order
async function processPayment(req, res) {
  const { orderId, paymentMethod } = req.body;

  try {
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
    let paymentResult;

    // Process payment based on method
    switch (paymentMethod) {
      case 'pix':
        paymentResult = await processPixPayment(order, correlationId);
        break;
      case 'boleto':
        paymentResult = await processBoletoPayment(order, correlationId);
        break;
      default:
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

    // Log transaction
    await db.insert(celcoinTransactionLog).values({
      tenantId: order.tenantId,
      externalTransactionId: paymentResult.transactionId,
      operationType: paymentMethod,
      requestPayload: JSON.stringify({ orderId, correlationId }),
      responsePayload: JSON.stringify(paymentResult),
      amount: order.total,
      isSuccessful: true,
      celcoinStatus: paymentResult.status
    });

    console.log(`Payment processed for order ${orderId}: ${paymentResult.transactionId}`);

    res.json({
      success: true,
      ...paymentResult
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    
    // Log failed transaction
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (order) {
        await db.insert(celcoinTransactionLog).values({
          tenantId: order.tenantId,
          externalTransactionId: `FAILED_${Date.now()}`,
          operationType: paymentMethod,
          requestPayload: JSON.stringify({ orderId }),
          errorMessage: error.message,
          amount: order.total,
          isSuccessful: false
        });
      }
    } catch (logError) {
      console.error('Error logging failed transaction:', logError);
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erro ao processar pagamento' 
    });
  }
}

// Process PIX payment via Celcoin
async function processPixPayment(order, correlationId) {
  const merchantData = {
    postalCode: order.customerZipCode || '01000000',
    city: order.customerCity || 'São Paulo',
    merchantCategoryCode: '5999',
    name: 'E-commerce Demo'
  };

  const pixPayment = await celcoinApi.createPixPayment({
    merchant: merchantData,
    amount: parseFloat(order.total),
    correlationID: correlationId,
    expiresDate: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes
    payer: {
      name: order.customerName,
      email: order.customerEmail,
      cpf: order.customerDocument
    }
  });

  return {
    transactionId: pixPayment.transactionId,
    pixKey: pixPayment.pixCopiaECola,
    qrCode: pixPayment.emvqrcps,
    expirationDate: pixPayment.expirationDate,
    status: pixPayment.status,
    paymentMethod: 'pix'
  };
}

// Process Boleto payment via Celcoin
async function processBoletoPayment(order, correlationId) {
  const merchantData = {
    postalCode: order.customerZipCode || '01000000',
    city: order.customerCity || 'São Paulo',
    merchantCategoryCode: '5999',
    name: 'E-commerce Demo'
  };

  const shippingAddress = JSON.parse(order.shippingAddress || '{}');

  const boleto = await celcoinApi.createBoleto({
    merchant: merchantData,
    amount: parseFloat(order.total),
    correlationID: correlationId,
    expiresDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    payer: {
      name: order.customerName,
      email: order.customerEmail,
      cpf: order.customerDocument,
      address: {
        street: shippingAddress.street || order.customerAddress,
        number: shippingAddress.number || '123',
        neighborhood: shippingAddress.neighborhood || 'Centro',
        city: shippingAddress.city || order.customerCity,
        state: shippingAddress.state || order.customerState,
        postalCode: shippingAddress.postalCode || order.customerZipCode
      }
    }
  });

  return {
    transactionId: boleto.transactionId,
    digitableLine: boleto.digitableLine,
    barCode: boleto.barCode,
    pdfUrl: boleto.pdf,
    expirationDate: boleto.expirationDate,
    status: boleto.status,
    paymentMethod: 'boleto'
  };
}

// Handle payment callback from Celcoin
async function handlePaymentCallback(req, res) {
  const { transactionId, status, correlationId } = req.body;

  try {
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

    // Update ledger entry
    if (newPaymentStatus === 'succeeded') {
      await db.update(ledgerEntries)
        .set({
          transactionType: 'credit',
          status: 'confirmed',
          confirmedAt: new Date(),
          celcoinTransactionId: transactionId
        })
        .where(eq(ledgerEntries.orderId, order.id));

      console.log(`Payment confirmed for order ${order.id}`);
    } else if (newPaymentStatus === 'failed') {
      // Restore stock if payment failed
      const orderItems = JSON.parse(order.items || '[]');
      for (const item of orderItems) {
        await db.update(products)
          .set({ stock: db.raw(`stock + ${item.quantity}`) })
          .where(eq(products.id, item.productId));
      }

      await db.update(ledgerEntries)
        .set({
          status: 'failed',
          reversedAt: new Date()
        })
        .where(eq(ledgerEntries.orderId, order.id));

      console.log(`Payment failed for order ${order.id}, stock restored`);
    }

    // Update Celcoin transaction log
    await db.update(celcoinTransactionLog)
      .set({
        celcoinStatus: status,
        isSuccessful: newPaymentStatus === 'succeeded',
        webhookReceived: true,
        webhookTimestamp: new Date()
      })
      .where(eq(celcoinTransactionLog.externalTransactionId, transactionId));

    res.json({ success: true, orderId: order.id, status: newPaymentStatus });

  } catch (error) {
    console.error('Error handling payment callback:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Get order details
async function getOrder(req, res) {
  const { orderId } = req.params;
  const tenantId = req.query.tenantId || 1;

  try {
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, parseInt(orderId)), eq(orders.tenantId, tenantId)));

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }

    res.json({
      success: true,
      order: {
        ...order,
        items: JSON.parse(order.items || '[]'),
        shippingAddress: JSON.parse(order.shippingAddress || '{}')
      }
    });

  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}

// Get order status
async function getOrderStatus(req, res) {
  const { orderId } = req.params;

  try {
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
}

module.exports = {
  createCheckout,
  processPayment,
  handlePaymentCallback,
  getOrder,
  getOrderStatus
};