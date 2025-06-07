import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('tenant')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get tenant overview statistics' })
  async getOverviewStats(@Query('tenantId', ParseIntPipe) tenantId: number) {
    return this.tenantService.getStats(tenantId);
  }

  @Get('coupons')
  @ApiOperation({ summary: 'Get tenant coupons' })
  async getCoupons(@Query('tenantId', ParseIntPipe) tenantId: number) {
    return this.tenantService.getCoupons(tenantId);
  }

  @Post('coupons')
  @ApiOperation({ summary: 'Create a new coupon' })
  async createCoupon(
    @Query('tenantId', ParseIntPipe) tenantId: number,
    @Body() createCouponDto: any,
  ) {
    return this.tenantService.createCoupon(tenantId, createCouponDto);
  }

  @Get('gift-cards')
  @ApiOperation({ summary: 'Get tenant gift cards' })
  async getGiftCards(@Query('tenantId', ParseIntPipe) tenantId: number) {
    return this.tenantService.getGiftCards(tenantId);
  }

  @Post('gift-cards')
  @ApiOperation({ summary: 'Create a new gift card' })
  async createGiftCard(
    @Query('tenantId', ParseIntPipe) tenantId: number,
    @Body() createGiftCardDto: any,
  ) {
    return this.tenantService.createGiftCard(tenantId, createGiftCardDto);
  }

  @Get('affiliates')
  @ApiOperation({ summary: 'Get tenant affiliates' })
  async getAffiliates(@Query('tenantId', ParseIntPipe) tenantId: number) {
    return this.tenantService.getAffiliates(tenantId);
  }

  @Post('affiliates')
  @ApiOperation({ summary: 'Create a new affiliate' })
  async createAffiliate(
    @Query('tenantId', ParseIntPipe) tenantId: number,
    @Body() createAffiliateDto: any,
  ) {
    return this.tenantService.createAffiliate(tenantId, createAffiliateDto);
  }

  @Get('shipping-methods')
  @ApiOperation({ summary: 'Get tenant shipping methods' })
  async getShippingMethods(@Query('tenantId', ParseIntPipe) tenantId: number) {
    return this.tenantService.getShippingMethods(tenantId);
  }

  @Post('shipping-methods')
  @ApiOperation({ summary: 'Create a new shipping method' })
  async createShippingMethod(
    @Query('tenantId', ParseIntPipe) tenantId: number,
    @Body() createShippingMethodDto: any,
  ) {
    return this.tenantService.createShippingMethod(tenantId, createShippingMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  async findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@Body() createTenantDto: any) {
    return this.tenantService.create(createTenantDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: any,
  ) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tenant' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.remove(id);
  }
}