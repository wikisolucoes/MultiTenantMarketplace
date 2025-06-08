import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number, query: ProductQueryDto) {
    const { page, limit, search, categoryId, brandId, status, isFeatured, minPrice, maxPrice, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (status) {
      where.status = status;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          brand: true
        }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number, tenantId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        brand: true
      }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        isActive: true
      },
      include: {
        category: true,
        brand: true
      }
    });
  }

  async update(id: number, tenantId: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id, tenantId);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        updatedAt: new Date()
      },
      include: {
        category: true,
        brand: true
      }
    });
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);

    return this.prisma.product.delete({
      where: { id }
    });
  }

  async updateStock(id: number, tenantId: number, quantity: number, operation: 'add' | 'subtract' | 'set') {
    const product = await this.findOne(id, tenantId);
    
    let newStock = product.stock || 0;
    
    switch (operation) {
      case 'add':
        newStock += quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, newStock - quantity);
        break;
      case 'set':
        newStock = Math.max(0, quantity);
        break;
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
        updatedAt: new Date()
      }
    });
  }

  async getFeaturedProducts(tenantId: number, limit: number = 10) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isFeatured: true,
        isActive: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        brand: true
      }
    });
  }

  async getLowStockProducts(tenantId: number) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        stock: {
          lte: this.prisma.product.fields.minStock
        }
      },
      orderBy: { stock: 'asc' },
      include: {
        category: true,
        brand: true
      }
    });
  }
}