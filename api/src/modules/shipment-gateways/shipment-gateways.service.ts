import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ShipmentGateway, ShippingRequest, ShippingResponse, TrackingRequest, TrackingResponse, LabelRequest, LabelResponse } from './interfaces/shipment-gateway.interface';
import { CorreiosService } from './services/correios.service';
import { MelhorEnvioService } from './services/melhorenvio.service';
import { JadlogService } from './services/jadlog.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { TrackPackageDto } from './dto/track-package.dto';
import { CreateLabelDto } from './dto/create-label.dto';

@Injectable()
export class ShipmentGatewaysService {
  private gateways: Map<string, ShipmentGateway> = new Map();

  constructor(private prisma: PrismaService) {}

  async initializeGateways(tenantId: number): Promise<void> {
    // Get active shipment gateway subscriptions for tenant
    const subscriptions = await this.prisma.pluginSubscription.findMany({
      where: {
        tenantId,
        pluginType: 'shipment_gateway',
        status: 'active'
      },
      include: {
        configurations: true
      }
    });

    // Clear existing gateways
    this.gateways.clear();

    // Initialize each subscribed gateway
    for (const subscription of subscriptions) {
      try {
        const config = this.parseGatewayConfig(subscription.configurations);
        const gateway = this.createGatewayInstance(subscription.pluginName, config);
        
        if (gateway && await gateway.validateCredentials()) {
          this.gateways.set(subscription.pluginName, gateway);
        }
      } catch (error) {
        console.error(`Failed to initialize ${subscription.pluginName} gateway:`, error);
      }
    }
  }

  async getAvailableGateways(): Promise<{ 
    name: string; 
    displayName: string; 
    description: string; 
    monthlyPrice: number;
    isActive: boolean;
  }[]> {
    return [
      {
        name: 'correios',
        displayName: 'Correios',
        description: 'Integração completa com os Correios para envio nacional',
        monthlyPrice: 19.90,
        isActive: this.gateways.has('correios')
      },
      {
        name: 'melhorenvio',
        displayName: 'MelhorEnvio',
        description: 'Plataforma de logística com múltiplas transportadoras',
        monthlyPrice: 27.90,
        isActive: this.gateways.has('melhorenvio')
      },
      {
        name: 'jadlog',
        displayName: 'Jadlog',
        description: 'Transportadora especializada em e-commerce',
        monthlyPrice: 24.90,
        isActive: this.gateways.has('jadlog')
      }
    ];
  }

  async subscribeToGateway(tenantId: number, gatewayName: string): Promise<void> {
    const gatewayPrices = {
      correios: 19.90,
      melhorenvio: 27.90,
      jadlog: 24.90
    };

    if (!gatewayPrices[gatewayName]) {
      throw new BadRequestException('Gateway de envio inválido');
    }

    // Check if already subscribed
    const existingSubscription = await this.prisma.pluginSubscription.findFirst({
      where: {
        tenantId,
        pluginName: gatewayName,
        pluginType: 'shipment_gateway'
      }
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      throw new BadRequestException('Já existe uma assinatura ativa para este gateway');
    }

    // Create or update subscription
    await this.prisma.pluginSubscription.upsert({
      where: {
        tenantId_pluginName_pluginType: {
          tenantId,
          pluginName: gatewayName,
          pluginType: 'shipment_gateway'
        }
      },
      update: {
        status: 'active',
        monthlyPrice: gatewayPrices[gatewayName],
        subscribedAt: new Date()
      },
      create: {
        tenantId,
        pluginName: gatewayName,
        pluginType: 'shipment_gateway',
        status: 'active',
        monthlyPrice: gatewayPrices[gatewayName],
        subscribedAt: new Date()
      }
    });
  }

  async unsubscribeFromGateway(tenantId: number, gatewayName: string): Promise<void> {
    await this.prisma.pluginSubscription.updateMany({
      where: {
        tenantId,
        pluginName: gatewayName,
        pluginType: 'shipment_gateway'
      },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });

    // Remove from active gateways
    this.gateways.delete(gatewayName);
  }

  async configureGateway(
    tenantId: number, 
    gatewayName: string, 
    config: Record<string, any>
  ): Promise<void> {
    // Verify subscription exists
    const subscription = await this.prisma.pluginSubscription.findFirst({
      where: {
        tenantId,
        pluginName: gatewayName,
        pluginType: 'shipment_gateway',
        status: 'active'
      }
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada ou inativa');
    }

    // Delete existing configurations
    await this.prisma.pluginConfiguration.deleteMany({
      where: { subscriptionId: subscription.id }
    });

    // Create new configurations
    const configData = Object.entries(config).map(([key, value]) => ({
      subscriptionId: subscription.id,
      configKey: key,
      configValue: typeof value === 'string' ? value : JSON.stringify(value)
    }));

    await this.prisma.pluginConfiguration.createMany({
      data: configData
    });

    // Reinitialize gateway with new config
    try {
      const gateway = this.createGatewayInstance(gatewayName, config);
      if (gateway && await gateway.validateCredentials()) {
        this.gateways.set(gatewayName, gateway);
      } else {
        throw new BadRequestException('Credenciais inválidas');
      }
    } catch (error) {
      throw new BadRequestException(`Erro na configuração: ${error.message}`);
    }
  }

  async calculateShipping(tenantId: number, request: CalculateShippingDto): Promise<ShippingResponse> {
    await this.initializeGateways(tenantId);

    if (this.gateways.size === 0) {
      throw new BadRequestException('Nenhum gateway de envio configurado');
    }

    const allQuotes = [];
    const errors = [];

    // Get quotes from all active gateways
    for (const [gatewayName, gateway] of this.gateways) {
      try {
        const response = await gateway.calculateShipping(request);
        if (response.success) {
          allQuotes.push(...response.quotes);
        } else {
          errors.push(`${gatewayName}: ${response.error}`);
        }
      } catch (error) {
        errors.push(`${gatewayName}: ${error.message}`);
      }
    }

    return {
      success: allQuotes.length > 0,
      quotes: allQuotes.sort((a, b) => a.price - b.price), // Sort by price
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  }

  async trackPackage(tenantId: number, request: TrackPackageDto): Promise<TrackingResponse> {
    await this.initializeGateways(tenantId);

    // Try to determine carrier from tracking code or use provided carrier
    let targetGateway: ShipmentGateway | null = null;
    
    if (request.carrier) {
      targetGateway = this.gateways.get(request.carrier.toLowerCase());
    } else {
      // Try to identify carrier from tracking code format
      const carrierName = this.identifyCarrierFromTrackingCode(request.trackingCode);
      if (carrierName) {
        targetGateway = this.gateways.get(carrierName);
      }
    }

    if (!targetGateway) {
      // Try all gateways
      for (const gateway of this.gateways.values()) {
        try {
          const response = await gateway.trackPackage(request);
          if (response.success) {
            return response;
          }
        } catch (error) {
          continue;
        }
      }
      
      throw new NotFoundException('Código de rastreamento não encontrado');
    }

    return await targetGateway.trackPackage(request);
  }

  async createLabel(tenantId: number, gatewayName: string, request: CreateLabelDto): Promise<LabelResponse> {
    await this.initializeGateways(tenantId);

    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      throw new BadRequestException(`Gateway ${gatewayName} não configurado ou inativo`);
    }

    return await gateway.createLabel(request);
  }

  async getGatewayServices(tenantId: number, gatewayName: string): Promise<{ code: string; name: string; description?: string }[]> {
    await this.initializeGateways(tenantId);

    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      throw new BadRequestException(`Gateway ${gatewayName} não configurado ou inativo`);
    }

    return await gateway.getServices();
  }

  private createGatewayInstance(gatewayName: string, config: any): ShipmentGateway | null {
    switch (gatewayName) {
      case 'correios':
        return new CorreiosService({
          username: config.username,
          password: config.password,
          contractCode: config.contractCode,
          cardNumber: config.cardNumber,
          environment: config.environment || 'sandbox'
        });
      
      case 'melhorenvio':
        return new MelhorEnvioService({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          accessToken: config.accessToken,
          refreshToken: config.refreshToken,
          environment: config.environment || 'sandbox'
        });
      
      case 'jadlog':
        return new JadlogService({
          cnpj: config.cnpj,
          contractNumber: config.contractNumber,
          password: config.password,
          environment: config.environment || 'sandbox'
        });
      
      default:
        return null;
    }
  }

  private parseGatewayConfig(configurations: any[]): Record<string, any> {
    const config: Record<string, any> = {};
    
    for (const conf of configurations) {
      try {
        config[conf.configKey] = JSON.parse(conf.configValue);
      } catch {
        config[conf.configKey] = conf.configValue;
      }
    }
    
    return config;
  }

  private identifyCarrierFromTrackingCode(trackingCode: string): string | null {
    // Correios: AA123456789BR format
    if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(trackingCode)) {
      return 'correios';
    }
    
    // MelhorEnvio: ME prefix
    if (trackingCode.startsWith('ME')) {
      return 'melhorenvio';
    }
    
    // Jadlog: JD prefix
    if (trackingCode.startsWith('JD')) {
      return 'jadlog';
    }
    
    return null;
  }
}