import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ShipmentGatewaysService } from './shipment-gateways.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { TrackPackageDto } from './dto/track-package.dto';
import { CreateLabelDto } from './dto/create-label.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Tenant } from '../../shared/decorators/tenant.decorator';

@Controller('shipment-gateways')
@UseGuards(JwtAuthGuard)
export class ShipmentGatewaysController {
  constructor(private readonly shipmentGatewaysService: ShipmentGatewaysService) {}

  @Get('available')
  async getAvailableGateways(@Tenant() tenantId: number) {
    return this.shipmentGatewaysService.getAvailableGateways();
  }

  @Post('subscribe/:gatewayName')
  async subscribeToGateway(
    @Tenant() tenantId: number,
    @Param('gatewayName') gatewayName: string
  ) {
    await this.shipmentGatewaysService.subscribeToGateway(tenantId, gatewayName);
    return { message: 'Assinatura criada com sucesso' };
  }

  @Delete('unsubscribe/:gatewayName')
  async unsubscribeFromGateway(
    @Tenant() tenantId: number,
    @Param('gatewayName') gatewayName: string
  ) {
    await this.shipmentGatewaysService.unsubscribeFromGateway(tenantId, gatewayName);
    return { message: 'Assinatura cancelada com sucesso' };
  }

  @Put('configure/:gatewayName')
  async configureGateway(
    @Tenant() tenantId: number,
    @Param('gatewayName') gatewayName: string,
    @Body() config: Record<string, any>
  ) {
    await this.shipmentGatewaysService.configureGateway(tenantId, gatewayName, config);
    return { message: 'Gateway configurado com sucesso' };
  }

  @Post('calculate')
  async calculateShipping(
    @Tenant() tenantId: number,
    @Body() calculateShippingDto: CalculateShippingDto
  ) {
    return this.shipmentGatewaysService.calculateShipping(tenantId, calculateShippingDto);
  }

  @Post('track')
  async trackPackage(
    @Tenant() tenantId: number,
    @Body() trackPackageDto: TrackPackageDto
  ) {
    return this.shipmentGatewaysService.trackPackage(tenantId, trackPackageDto);
  }

  @Post('label/:gatewayName')
  async createLabel(
    @Tenant() tenantId: number,
    @Param('gatewayName') gatewayName: string,
    @Body() createLabelDto: CreateLabelDto
  ) {
    return this.shipmentGatewaysService.createLabel(tenantId, gatewayName, createLabelDto);
  }

  @Get('services/:gatewayName')
  async getGatewayServices(
    @Tenant() tenantId: number,
    @Param('gatewayName') gatewayName: string
  ) {
    return this.shipmentGatewaysService.getGatewayServices(tenantId, gatewayName);
  }
}