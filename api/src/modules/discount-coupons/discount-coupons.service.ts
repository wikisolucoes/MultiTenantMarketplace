import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto, CouponValidationResult } from './dto/validate-coupon.dto';

@Injectable()
export class DiscountCouponsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: number, userId: number, createCouponDto: CreateCouponDto) {
    // Check if coupon code already exists for this tenant
    const existingCoupon = await this.prisma.discountCoupon.findFirst({
      where: {
        tenantId,
        code: createCouponDto.code.toUpperCase(),
      },
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // Validate dates
    const startDate = new Date(createCouponDto.startDate);
    const endDate = createCouponDto.endDate ? new Date(createCouponDto.endDate) : null;

    if (endDate && endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate percentage value
    if (createCouponDto.type === 'percentage' && createCouponDto.value > 100) {
      throw new BadRequestException('Percentage value cannot exceed 100%');
    }

    return this.prisma.discountCoupon.create({
      data: {
        ...createCouponDto,
        tenantId,
        createdBy: userId,
        code: createCouponDto.code.toUpperCase(),
        startDate,
        endDate,
      },
    });
  }

  async findAll(tenantId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      this.prisma.discountCoupon.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { couponUsages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.discountCoupon.count({
        where: { tenantId },
      }),
    ]);

    return {
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: number, id: number) {
    const coupon = await this.prisma.discountCoupon.findFirst({
      where: { tenantId, id },
      include: {
        _count: {
          select: { couponUsages: true },
        },
        couponUsages: {
          include: {
            customer: {
              select: { id: true, email: true, fullName: true },
            },
            order: {
              select: { id: true, orderNumber: true, createdAt: true },
            },
          },
          orderBy: { usedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async update(tenantId: number, id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.prisma.discountCoupon.findFirst({
      where: { tenantId, id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Check if updating code and it conflicts with existing
    if (updateCouponDto.code && updateCouponDto.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await this.prisma.discountCoupon.findFirst({
        where: {
          tenantId,
          code: updateCouponDto.code.toUpperCase(),
          id: { not: id },
        },
      });

      if (existingCoupon) {
        throw new ConflictException('Coupon code already exists');
      }
    }

    // Validate dates if provided
    if (updateCouponDto.startDate || updateCouponDto.endDate) {
      const startDate = updateCouponDto.startDate 
        ? new Date(updateCouponDto.startDate) 
        : coupon.startDate;
      const endDate = updateCouponDto.endDate 
        ? new Date(updateCouponDto.endDate) 
        : coupon.endDate;

      if (endDate && endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate percentage value
    if (updateCouponDto.type === 'percentage' && updateCouponDto.value && updateCouponDto.value > 100) {
      throw new BadRequestException('Percentage value cannot exceed 100%');
    }

    return this.prisma.discountCoupon.update({
      where: { id },
      data: {
        ...updateCouponDto,
        code: updateCouponDto.code ? updateCouponDto.code.toUpperCase() : undefined,
        startDate: updateCouponDto.startDate ? new Date(updateCouponDto.startDate) : undefined,
        endDate: updateCouponDto.endDate ? new Date(updateCouponDto.endDate) : undefined,
      },
    });
  }

  async remove(tenantId: number, id: number) {
    const coupon = await this.prisma.discountCoupon.findFirst({
      where: { tenantId, id },
      include: {
        _count: {
          select: { couponUsages: true },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Don't allow deletion if coupon has been used
    if (coupon._count.couponUsages > 0) {
      throw new BadRequestException('Cannot delete coupon that has been used. Deactivate it instead.');
    }

    return this.prisma.discountCoupon.delete({
      where: { id },
    });
  }

  async validateCoupon(tenantId: number, validateCouponDto: ValidateCouponDto): Promise<CouponValidationResult> {
    const { code, orderTotal, productIds, customerId } = validateCouponDto;

    // Find the coupon
    const coupon = await this.prisma.discountCoupon.findFirst({
      where: {
        tenantId,
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      return {
        isValid: false,
        error: 'Cupom inválido ou não encontrado',
      };
    }

    // Check if coupon is within valid date range
    const now = new Date();
    if (now < coupon.startDate) {
      return {
        isValid: false,
        error: 'Cupom ainda não está válido',
      };
    }

    if (coupon.endDate && now > coupon.endDate) {
      return {
        isValid: false,
        error: 'Cupom expirado',
      };
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.currentUsageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        error: 'Cupom esgotado',
      };
    }

    // Check customer usage limit
    if (customerId && coupon.usageLimitPerCustomer) {
      const customerUsageCount = await this.prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          customerId,
        },
      });

      if (customerUsageCount >= coupon.usageLimitPerCustomer) {
        return {
          isValid: false,
          error: 'Limite de uso por cliente excedido',
        };
      }
    }

    // Check first order only restriction
    if (coupon.isFirstOrderOnly && customerId) {
      const customerOrderCount = await this.prisma.order.count({
        where: {
          customerId,
          status: { not: 'cancelled' },
        },
      });

      if (customerOrderCount > 0) {
        return {
          isValid: false,
          error: 'Cupom válido apenas para primeira compra',
        };
      }
    }

    // Check minimum order value
    if (coupon.minimumOrderValue && orderTotal < Number(coupon.minimumOrderValue)) {
      return {
        isValid: false,
        error: `Pedido mínimo de R$ ${coupon.minimumOrderValue} para usar este cupom`,
      };
    }

    // Check product restrictions
    if (productIds && productIds.length > 0) {
      // If specific products are set, check if any order products are included
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some(id => 
          coupon.applicableProducts.includes(id)
        );
        if (!hasApplicableProduct) {
          return {
            isValid: false,
            error: 'Cupom não válido para os produtos selecionados',
          };
        }
      }

      // Check if any products are excluded
      if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
        const hasExcludedProduct = productIds.some(id => 
          coupon.excludedProducts.includes(id)
        );
        if (hasExcludedProduct) {
          return {
            isValid: false,
            error: 'Cupom não válido para alguns produtos no carrinho',
          };
        }
      }

      // Check category restrictions (would need to fetch product categories)
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
        const products = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { categoryId: true },
        });

        const hasApplicableCategory = products.some(product => 
          product.categoryId && coupon.applicableCategories.includes(product.categoryId)
        );

        if (!hasApplicableCategory) {
          return {
            isValid: false,
            error: 'Cupom não válido para as categorias dos produtos selecionados',
          };
        }
      }

      if (coupon.excludedCategories && coupon.excludedCategories.length > 0) {
        const products = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { categoryId: true },
        });

        const hasExcludedCategory = products.some(product => 
          product.categoryId && coupon.excludedCategories.includes(product.categoryId)
        );

        if (hasExcludedCategory) {
          return {
            isValid: false,
            error: 'Cupom não válido para algumas categorias no carrinho',
          };
        }
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (orderTotal * Number(coupon.value)) / 100;
      
      // Apply maximum discount limit if set
      if (coupon.maximumDiscountAmount && discountAmount > Number(coupon.maximumDiscountAmount)) {
        discountAmount = Number(coupon.maximumDiscountAmount);
      }
    } else {
      discountAmount = Number(coupon.value);
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);
    
    const finalAmount = orderTotal - discountAmount;

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: Number(coupon.value),
        discountAmount,
        finalAmount,
      },
    };
  }

  async applyCoupon(
    tenantId: number,
    couponId: number,
    orderId: number,
    customerId: number,
    discountAmount: number,
    originalAmount: number,
  ) {
    // Record coupon usage
    await this.prisma.couponUsage.create({
      data: {
        couponId,
        orderId,
        customerId,
        discountAmount,
        originalAmount,
        finalAmount: originalAmount - discountAmount,
      },
    });

    // Increment coupon usage count
    await this.prisma.discountCoupon.update({
      where: { id: couponId },
      data: {
        currentUsageCount: {
          increment: 1,
        },
      },
    });
  }

  async getCouponStats(tenantId: number, couponId: number) {
    const coupon = await this.prisma.discountCoupon.findFirst({
      where: { tenantId, id: couponId },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const stats = await this.prisma.couponUsage.aggregate({
      where: { couponId },
      _count: { id: true },
      _sum: { discountAmount: true, originalAmount: true },
      _avg: { discountAmount: true },
    });

    const uniqueCustomers = await this.prisma.couponUsage.groupBy({
      by: ['customerId'],
      where: { couponId },
    });

    return {
      totalUsages: stats._count.id,
      totalDiscountGiven: stats._sum.discountAmount || 0,
      totalOrderValue: stats._sum.originalAmount || 0,
      averageDiscount: stats._avg.discountAmount || 0,
      uniqueCustomers: uniqueCustomers.length,
      usageRate: coupon.usageLimit 
        ? (coupon.currentUsageCount / coupon.usageLimit) * 100 
        : null,
    };
  }
}