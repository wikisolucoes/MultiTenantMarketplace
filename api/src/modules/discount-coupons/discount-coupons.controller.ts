import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DiscountCouponsService } from './discount-coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Tenant } from '../../shared/decorators/tenant.decorator';
import { User } from '../../shared/decorators/user.decorator';

@Controller('discount-coupons')
@UseGuards(JwtAuthGuard)
export class DiscountCouponsController {
  constructor(private readonly discountCouponsService: DiscountCouponsService) {}

  @Post()
  create(
    @Tenant() tenantId: number,
    @User() user: any,
    @Body() createCouponDto: CreateCouponDto,
  ) {
    return this.discountCouponsService.create(tenantId, user.userId, createCouponDto);
  }

  @Get()
  findAll(
    @Tenant() tenantId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.discountCouponsService.findAll(tenantId, page, limit);
  }

  @Get(':id')
  findOne(
    @Tenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountCouponsService.findOne(tenantId, id);
  }

  @Get(':id/stats')
  getCouponStats(
    @Tenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountCouponsService.getCouponStats(tenantId, id);
  }

  @Post('validate')
  validateCoupon(
    @Tenant() tenantId: number,
    @Body() validateCouponDto: ValidateCouponDto,
  ) {
    return this.discountCouponsService.validateCoupon(tenantId, validateCouponDto);
  }

  @Patch(':id')
  update(
    @Tenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.discountCouponsService.update(tenantId, id, updateCouponDto);
  }

  @Delete(':id')
  remove(
    @Tenant() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.discountCouponsService.remove(tenantId, id);
  }
}