import { Controller, Get, Query, Session, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TenantService } from './tenant.service';

@ApiTags('tenants')
@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('financial-stats')
  @ApiOperation({ summary: 'Get tenant financial statistics' })
  @ApiResponse({ status: 200, description: 'Financial statistics retrieved successfully' })
  async getFinancialStats(@Session() session: any) {
    if (!session.user?.tenantId) {
      throw new UnauthorizedException('Tenant access required');
    }
    
    return this.tenantService.getFinancialStats(session.user.tenantId);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get tenant products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProducts(
    @Session() session: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    if (!session.user?.tenantId) {
      throw new UnauthorizedException('Tenant access required');
    }
    
    return this.tenantService.getProducts(
      session.user.tenantId,
      page || 1,
      limit || 50
    );
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get tenant orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getOrders(
    @Session() session: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    if (!session.user?.tenantId) {
      throw new UnauthorizedException('Tenant access required');
    }
    
    return this.tenantService.getOrders(
      session.user.tenantId,
      page || 1,
      limit || 50
    );
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get tenant withdrawals' })
  async getWithdrawals(@Session() session: any) {
    if (!session.user?.tenantId) {
      throw new UnauthorizedException('Tenant access required');
    }
    
    return this.tenantService.getWithdrawals(session.user.tenantId);
  }
}