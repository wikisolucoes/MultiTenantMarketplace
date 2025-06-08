import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
            users: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.TenantCreateInput) {
    return this.prisma.tenant.create({
      data,
    });
  }

  async update(id: number, data: Prisma.TenantUpdateInput) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async getStats(tenantId: number) {
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { tenantId },
      }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          status: 'confirmed',
        },
        _sum: {
          total: true,
        },
      }),
      this.prisma.customer.count({
        where: { tenantId },
      }),
      this.prisma.product.count({
        where: { tenantId },
      }),
      this.prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(CAST(total AS DECIMAL)) as revenue,
          COUNT(*) as orders
        FROM orders 
        WHERE tenant_id = ${tenantId} 
          AND status = 'confirmed'
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `,
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalCustomers,
      totalProducts,
      recentOrders,
      monthlyRevenue,
    };
  }

  async getCoupons(tenantId: number) {
    return this.prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(tenantId: number, data: any) {
    return this.prisma.coupon.create({
      data: {
        ...data,
        tenantId,
        value: parseFloat(data.value),
        minimumOrder: data.minimumOrder ? parseFloat(data.minimumOrder) : null,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
      },
    });
  }

  async getGiftCards(tenantId: number) {
    return this.prisma.giftCard.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGiftCard(tenantId: number, data: any) {
    const code = this.generateGiftCardCode();
    return this.prisma.giftCard.create({
      data: {
        tenant: { connect: { id: tenantId } },
        code,
        value: parseFloat(data.initialValue),
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        message: data.message,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        isActive: true,
      },
    });
  }

  async getAffiliates(tenantId: number) {
    return this.prisma.affiliate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAffiliate(tenantId: number, data: any) {
    const affiliateCode = this.generateAffiliateCode(data.name);
    return this.prisma.affiliate.create({
      data: {
        tenant: { connect: { id: tenantId } },
        name: data.name,
        email: data.email,
        code: affiliateCode,
        commissionRate: parseFloat(data.commissionRate),
        isActive: true,
      },
    });
  }

  async getShippingMethods(tenantId: number) {
    return this.prisma.shippingMethod.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createShippingMethod(tenantId: number, data: any) {
    return this.prisma.shippingMethod.create({
      data: {
        tenant: { connect: { id: tenantId } },
        name: data.name,
        cost: data.cost ? parseFloat(data.cost) : null,
        freeThreshold: data.freeThreshold ? parseFloat(data.freeThreshold) : null,
        estimatedDays: data.estimatedDays ? parseInt(data.estimatedDays) : null,
        isActive: true,
      },
    });
  }

  private generateGiftCardCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateAffiliateCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${cleanName.substr(0, 4)}${randomSuffix}`;
  }
}