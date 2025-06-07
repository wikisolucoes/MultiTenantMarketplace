import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async getFinancialStats(tenantId: number) {
    const [orders, products, totalRevenue] = await Promise.all([
      this.prisma.order.count({
        where: { tenantId }
      }),
      this.prisma.product.count({
        where: { tenantId }
      }),
      this.prisma.order.aggregate({
        where: { 
          tenantId,
          status: 'completed'
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    const recentOrders = await this.prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true
      }
    });

    return {
      totalOrders: orders,
      totalProducts: products,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      recentOrders
    };
  }

  async getProducts(tenantId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.product.count({
        where: { tenantId }
      })
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

  async getOrders(tenantId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.order.count({
        where: { tenantId }
      })
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getWithdrawals(tenantId: number) {
    // This would integrate with bank accounts and withdrawal records
    // For now, return empty array as placeholder
    return [];
  }

  async getTenantById(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}