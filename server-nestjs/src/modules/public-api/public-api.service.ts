import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PublicApiService {
  constructor(private prisma: PrismaService) {}

  async validateApiKey(apiKey: string) {
    const credential = await this.prisma.apiCredentials.findUnique({
      where: { key: apiKey, isActive: true }
    });

    if (!credential) {
      throw new ForbiddenException('Chave da API inválida');
    }

    return credential;
  }

  async checkPermission(apiKey: string, permission: string) {
    const credential = await this.validateApiKey(apiKey);
    
    if (!credential.permissions.includes(permission)) {
      throw new ForbiddenException(`Permissão '${permission}' não concedida`);
    }

    return credential;
  }

  async getApiInfo(apiKey: string) {
    const credential = await this.validateApiKey(apiKey);
    
    return {
      tenantId: credential.tenantId,
      permissions: credential.permissions,
      rateLimit: credential.rateLimit,
      endpoints: {
        products: {
          'GET /products': 'Listar produtos',
          'GET /products/:id': 'Obter produto',
          'POST /products': 'Criar produto',
          'PUT /products/:id': 'Atualizar produto',
          'PUT /products/:id/stock': 'Atualizar estoque'
        },
        orders: {
          'GET /orders': 'Listar pedidos',
          'GET /orders/:id': 'Obter pedido',
          'PUT /orders/:id/status': 'Atualizar status'
        },
        customers: {
          'GET /customers': 'Listar clientes',
          'GET /customers/:id': 'Obter cliente'
        },
        categories: {
          'GET /categories': 'Listar categorias'
        },
        brands: {
          'GET /brands': 'Listar marcas'
        }
      }
    };
  }

  async getProducts(apiKey: string, filters: any) {
    const credential = await this.checkPermission(apiKey, 'products:read');
    
    const where: any = { tenantId: credential.tenantId };
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.category) {
      where.categoryId = filters.category;
    }

    if (filters.brand) {
      where.brandId = filters.brand;
    }

    if (filters.status) {
      where.isActive = filters.status === 'active';
    }

    const skip = (filters.page - 1) * filters.limit;
    
    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.products.count({ where })
    ]);

    return {
      data: products,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    };
  }

  async getProduct(apiKey: string, id: number) {
    const credential = await this.checkPermission(apiKey, 'products:read');
    
    const product = await this.prisma.products.findFirst({
      where: { id, tenantId: credential.tenantId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async createProduct(apiKey: string, productData: any) {
    const credential = await this.checkPermission(apiKey, 'products:write');
    
    return this.prisma.products.create({
      data: {
        ...productData,
        tenantId: credential.tenantId
      }
    });
  }

  async updateProduct(apiKey: string, id: number, productData: any) {
    const credential = await this.checkPermission(apiKey, 'products:write');
    
    const product = await this.prisma.products.findFirst({
      where: { id, tenantId: credential.tenantId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.prisma.products.update({
      where: { id },
      data: {
        ...productData,
        updatedAt: new Date()
      }
    });
  }

  async updateProductStock(apiKey: string, id: number, stockData: any) {
    const credential = await this.checkPermission(apiKey, 'products:write');
    
    const product = await this.getProduct(apiKey, id);
    
    let newQuantity = stockData.quantity;
    
    if (stockData.operation === 'add') {
      newQuantity = product.stockQuantity + stockData.quantity;
    } else if (stockData.operation === 'subtract') {
      newQuantity = product.stockQuantity - stockData.quantity;
    }

    return this.prisma.products.update({
      where: { id },
      data: {
        stockQuantity: Math.max(0, newQuantity),
        updatedAt: new Date()
      }
    });
  }

  async getOrders(apiKey: string, filters: any) {
    const credential = await this.checkPermission(apiKey, 'orders:read');
    
    const where: any = { tenantId: credential.tenantId };
    
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customer) {
      where.OR = [
        { customerName: { contains: filters.customer, mode: 'insensitive' } },
        { customerEmail: { contains: filters.customer, mode: 'insensitive' } }
      ];
    }

    const skip = (filters.page - 1) * filters.limit;
    
    const [orders, total] = await Promise.all([
      this.prisma.orders.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.orders.count({ where })
    ]);

    return {
      data: orders,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    };
  }

  async getOrder(apiKey: string, id: number) {
    const credential = await this.checkPermission(apiKey, 'orders:read');
    
    const order = await this.prisma.orders.findFirst({
      where: { id, tenantId: credential.tenantId }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  async updateOrderStatus(apiKey: string, id: number, statusData: any) {
    const credential = await this.checkPermission(apiKey, 'orders:write');
    
    const order = await this.getOrder(apiKey, id);
    
    return this.prisma.orders.update({
      where: { id },
      data: {
        status: statusData.status,
        notes: statusData.notes || order.notes,
        updatedAt: new Date()
      }
    });
  }

  async getCustomers(apiKey: string, filters: any) {
    const credential = await this.checkPermission(apiKey, 'customers:read');
    
    const where: any = { tenantId: credential.tenantId };
    
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const skip = (filters.page - 1) * filters.limit;
    
    const [customers, total] = await Promise.all([
      this.prisma.customers.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.customers.count({ where })
    ]);

    return {
      data: customers,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    };
  }

  async getCustomer(apiKey: string, id: number) {
    const credential = await this.checkPermission(apiKey, 'customers:read');
    
    const customer = await this.prisma.customers.findFirst({
      where: { id, tenantId: credential.tenantId }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async getCategories(apiKey: string) {
    const credential = await this.checkPermission(apiKey, 'products:read');
    
    return this.prisma.categories.findMany({
      where: { tenantId: credential.tenantId, isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  async getBrands(apiKey: string) {
    const credential = await this.checkPermission(apiKey, 'products:read');
    
    return this.prisma.brands.findMany({
      where: { tenantId: credential.tenantId, isActive: true },
      orderBy: { name: 'asc' }
    });
  }
}