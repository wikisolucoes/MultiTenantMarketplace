import { Router } from 'express';
import { db } from './db';
import { 
  products, 
  productVariants, 
  orders, 
  orderItems, 
  customers, 
  productCategories,
  brands,
  apiCredentials,
  tenants,
  insertProductSchema,
  insertOrderSchema,
  insertCustomerSchema
} from '@shared/schema';
import { 
  authenticateApi, 
  requirePermission, 
  logApiUsage, 
  generateApiCredentials,
  AuthenticatedApiRequest 
} from './api-auth';
import { eq, and, desc, asc, sql, like, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

/**
 * @swagger
 * tags:
 *   - name: API Info
 *     description: Informações da API e autenticação
 *   - name: Products
 *     description: Gerenciamento de produtos
 *   - name: Orders
 *     description: Gerenciamento de pedidos
 *   - name: Customers
 *     description: Gerenciamento de clientes
 *   - name: Categories
 *     description: Gerenciamento de categorias
 *   - name: Brands
 *     description: Gerenciamento de marcas
 */

const router = Router();

// Apply authentication and logging to all routes
router.use(authenticateApi);
router.use(logApiUsage);

/**
 * @swagger
 * /info:
 *   get:
 *     summary: Informações da API
 *     description: Retorna informações sobre a API, permissões da credencial e endpoints disponíveis
 *     tags: [API Info]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Informações da API
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiInfo'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/info', (req: AuthenticatedApiRequest, res) => {
  res.json({
    version: '1.0.0',
    tenant_id: req.apiCredential?.tenantId,
    permissions: req.apiCredential?.permissions,
    rate_limit: req.apiCredential?.rateLimit,
    endpoints: {
      products: {
        'GET /products': 'List all products',
        'GET /products/:id': 'Get product details',
        'POST /products': 'Create new product',
        'PUT /products/:id': 'Update product',
        'DELETE /products/:id': 'Delete product',
        'PUT /products/:id/stock': 'Update product stock'
      },
      orders: {
        'GET /orders': 'List all orders',
        'GET /orders/:id': 'Get order details',
        'POST /orders': 'Create new order',
        'PUT /orders/:id/status': 'Update order status'
      },
      customers: {
        'GET /customers': 'List all customers',
        'GET /customers/:id': 'Get customer details',
        'POST /customers': 'Create new customer',
        'PUT /customers/:id': 'Update customer'
      },
      categories: {
        'GET /categories': 'List all categories',
        'GET /categories/:id': 'Get category details'
      },
      brands: {
        'GET /brands': 'List all brands',
        'GET /brands/:id': 'Get brand details'
      }
    }
  });
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar produtos
 *     description: Retorna uma lista paginada de produtos com filtros opcionais
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, descrição ou SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da categoria
 *       - in: query
 *         name: brand
 *         schema:
 *           type: integer
 *         description: Filtrar por ID da marca
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/products', requirePermission('products:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;
    
    const search = req.query.search as string;
    const category = req.query.category as string;
    const brand = req.query.brand as string;
    const status = req.query.status as string;

    let query = db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        sku: products.sku,
        status: products.status,
        categoryId: products.categoryId,
        brandId: products.brandId,
        weight: products.weight,
        dimensions: products.dimensions,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt
      })
      .from(products)
      .where(eq(products.tenantId, req.apiCredential!.tenantId));

    // Apply filters
    if (search) {
      query = query.where(
        sql`${products.name} ILIKE ${`%${search}%`} OR ${products.description} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`}`
      );
    }

    if (category) {
      query = query.where(eq(products.categoryId, parseInt(category)));
    }

    if (brand) {
      query = query.where(eq(products.brandId, parseInt(brand)));
    }

    if (status) {
      query = query.where(eq(products.status, status));
    }

    const results = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.tenantId, req.apiCredential!.tenantId));

    res.json({
      data: results,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:id', requirePermission('products:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const productId = parseInt(req.params.id);

    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, productId),
        eq(products.tenantId, req.apiCredential!.tenantId)
      ));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    res.json({
      ...product,
      variants
    });
  } catch (error) {
    console.error('Product API error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

const createProductSchema = insertProductSchema.extend({
  name: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().min(0)
});

router.post('/products', requirePermission('products:write'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const productData = createProductSchema.parse(req.body);

    const [newProduct] = await db
      .insert(products)
      .values({
        ...productData,
        tenantId: req.apiCredential!.tenantId
      })
      .returning();

    res.status(201).json(newProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Create product API error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', requirePermission('products:write'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const productId = parseInt(req.params.id);
    const updateData = createProductSchema.partial().parse(req.body);

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(products.id, productId),
        eq(products.tenantId, req.apiCredential!.tenantId)
      ))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Update product API error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.put('/products/:id/stock', requirePermission('products:write'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { stock, operation = 'set' } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'Invalid stock value' });
    }

    let updateQuery;
    if (operation === 'add') {
      updateQuery = db
        .update(products)
        .set({ 
          stock: sql`${products.stock} + ${stock}`,
          updatedAt: new Date()
        });
    } else if (operation === 'subtract') {
      updateQuery = db
        .update(products)
        .set({ 
          stock: sql`GREATEST(0, ${products.stock} - ${stock})`,
          updatedAt: new Date()
        });
    } else {
      updateQuery = db
        .update(products)
        .set({ 
          stock,
          updatedAt: new Date()
        });
    }

    const [updatedProduct] = await updateQuery
      .where(and(
        eq(products.id, productId),
        eq(products.tenantId, req.apiCredential!.tenantId)
      ))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ 
      id: updatedProduct.id,
      stock: updatedProduct.stock,
      operation,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Update stock API error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

router.delete('/products/:id', requirePermission('products:delete'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const productId = parseInt(req.params.id);

    const [deletedProduct] = await db
      .delete(products)
      .where(and(
        eq(products.id, productId),
        eq(products.tenantId, req.apiCredential!.tenantId)
      ))
      .returning({ id: products.id });

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', id: deletedProduct.id });
  } catch (error) {
    console.error('Delete product API error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ORDERS ENDPOINTS
router.get('/orders', requirePermission('orders:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;
    
    const status = req.query.status as string;
    const customerId = req.query.customer_id as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;

    let query = db
      .select()
      .from(orders)
      .where(eq(orders.tenantId, req.apiCredential!.tenantId));

    if (status) {
      query = query.where(eq(orders.status, status));
    }

    if (customerId) {
      query = query.where(eq(orders.customerId, parseInt(customerId)));
    }

    if (dateFrom) {
      query = query.where(gte(orders.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      query = query.where(lte(orders.createdAt, new Date(dateTo)));
    }

    const results = await query
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.tenantId, req.apiCredential!.tenantId));

    res.json({
      data: results,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Orders API error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/orders/:id', requirePermission('orders:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.tenantId, req.apiCredential!.tenantId)
      ));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    res.json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Order API error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/orders/:id/status', requirePermission('orders:write'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', valid_statuses: validStatuses });
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(and(
        eq(orders.id, orderId),
        eq(orders.tenantId, req.apiCredential!.tenantId)
      ))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status API error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// CUSTOMERS ENDPOINTS
router.get('/customers', requirePermission('customers:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;
    
    const search = req.query.search as string;

    let query = db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, req.apiCredential!.tenantId));

    if (search) {
      query = query.where(
        sql`${customers.fullName} ILIKE ${`%${search}%`} OR ${customers.email} ILIKE ${`%${search}%`} OR ${customers.document} ILIKE ${`%${search}%`}`
      );
    }

    const results = await query
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.tenantId, req.apiCredential!.tenantId));

    res.json({
      data: results,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Customers API error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/customers/:id', requirePermission('customers:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const customerId = parseInt(req.params.id);

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.id, customerId),
        eq(customers.tenantId, req.apiCredential!.tenantId)
      ));

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Customer API error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// CATEGORIES AND BRANDS ENDPOINTS
router.get('/categories', requirePermission('products:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const categories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.tenantId, req.apiCredential!.tenantId))
      .orderBy(asc(productCategories.name));

    res.json({ data: categories });
  } catch (error) {
    console.error('Categories API error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/brands', requirePermission('products:read'), async (req: AuthenticatedApiRequest, res) => {
  try {
    const brandsList = await db
      .select()
      .from(brands)
      .where(eq(brands.tenantId, req.apiCredential!.tenantId))
      .orderBy(asc(brands.name));

    res.json({ data: brandsList });
  } catch (error) {
    console.error('Brands API error:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

export default router;