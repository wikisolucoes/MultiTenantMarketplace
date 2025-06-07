import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number, query: OrderQueryDto) {
    const { page, limit, search, status, paymentStatus, paymentMethod, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { id: { equals: parseInt(search) || 0 } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {};
      if (minAmount !== undefined) where.totalAmount.gte = minAmount;
      if (maxAmount !== undefined) where.totalAmount.lte = maxAmount;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      }),
      this.prisma.order.count({ where })
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

  async findOne(id: number, tenantId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  async create(createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    return this.prisma.order.create({
      data: {
        ...orderData,
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async update(id: number, tenantId: number, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id, tenantId);

    const { items, ...orderData } = updateOrderDto;

    return this.prisma.order.update({
      where: { id },
      data: {
        ...orderData,
        updatedAt: new Date(),
        ...(items && {
          orderItems: {
            deleteMany: {},
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice
            }))
          }
        })
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async updateStatus(id: number, tenantId: number, status: string) {
    await this.findOne(id, tenantId);

    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date()
      }
    });
  }

  async updatePaymentStatus(id: number, tenantId: number, paymentStatus: string) {
    await this.findOne(id, tenantId);

    return this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        updatedAt: new Date()
      }
    });
  }

  async remove(id: number, tenantId: number) {
    await this.findOne(id, tenantId);

    return this.prisma.order.delete({
      where: { id }
    });
  }

  async getOrdersByStatus(tenantId: number, status: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        status
      },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async getOrderStatistics(tenantId: number) {
    const [totalOrders, totalRevenue, pendingOrders, completedOrders] = await Promise.all([
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.order.aggregate({
        where: { tenantId, paymentStatus: 'paid' },
        _sum: { totalAmount: true }
      }),
      this.prisma.order.count({ where: { tenantId, status: 'pending' } }),
      this.prisma.order.count({ where: { tenantId, status: 'delivered' } })
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingOrders,
      completedOrders
    };
  }
}