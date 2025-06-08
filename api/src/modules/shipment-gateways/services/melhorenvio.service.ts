import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ShipmentGateway, ShippingRequest, ShippingResponse, TrackingRequest, TrackingResponse, LabelRequest, LabelResponse } from '../interfaces/shipment-gateway.interface';

interface MelhorEnvioConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  environment: 'sandbox' | 'production';
}

interface MelhorEnvioService {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company: {
    id: number;
    name: string;
    picture: string;
  };
}

@Injectable()
export class MelhorEnvioService extends ShipmentGateway {
  private api: AxiosInstance;
  private config: MelhorEnvioConfig;

  constructor(config: MelhorEnvioConfig) {
    super();
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://melhorenvio.com.br/api/v2'
      : 'https://sandbox.melhorenvio.com.br/api/v2';

    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Aplicação aplicacao@email.com',
      },
    });

    if (config.accessToken) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${config.accessToken}`;
    }
  }

  async calculateShipping(request: ShippingRequest): Promise<ShippingResponse> {
    try {
      await this.ensureAuthenticated();

      const payload = {
        from: {
          postal_code: request.from.zipCode.replace(/\D/g, ''),
        },
        to: {
          postal_code: request.to.zipCode.replace(/\D/g, ''),
        },
        package: {
          height: request.package.height,
          width: request.package.width,
          length: request.package.length,
          weight: request.package.weight,
        },
        options: {
          insurance_value: request.additionalServices?.declaredValue ? request.package.value : 0,
          receipt: request.additionalServices?.receipt || false,
          own_hand: request.additionalServices?.ownHand || false,
        },
        services: request.services?.join(',') || undefined,
      };

      const response = await this.api.post('/me/shipment/calculate', payload);
      const services: MelhorEnvioService[] = response.data;

      const quotes = services.map(service => ({
        service: service.id.toString(),
        serviceName: `${service.company.name} - ${service.name}`,
        price: parseFloat(service.price),
        currency: 'BRL',
        estimatedDays: service.delivery_time,
        carrier: service.company.name,
        additionalInfo: `Serviço: ${service.name}`
      }));

      return {
        success: true,
        quotes
      };
    } catch (error) {
      return {
        success: false,
        quotes: [],
        error: error.response?.data?.message || error.message || 'Erro ao calcular frete'
      };
    }
  }

  async trackPackage(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      await this.ensureAuthenticated();

      const response = await this.api.get(`/me/shipment/tracking?code=${request.trackingCode}`);
      const tracking = response.data;

      const events = tracking.tracking?.map(event => ({
        date: event.date?.split(' ')[0] || '',
        time: event.date?.split(' ')[1] || '',
        location: `${event.location?.city || ''} - ${event.location?.state || ''}`,
        status: event.status || '',
        description: event.description || ''
      })) || [];

      return {
        success: true,
        trackingCode: request.trackingCode,
        status: tracking.status || 'unknown',
        carrier: 'MelhorEnvio',
        events,
        estimatedDelivery: tracking.estimated_delivery
      };
    } catch (error) {
      return {
        success: false,
        trackingCode: request.trackingCode,
        status: 'Erro',
        carrier: 'MelhorEnvio',
        events: [],
        error: error.response?.data?.message || error.message || 'Erro ao rastrear objeto'
      };
    }
  }

  async createLabel(request: LabelRequest): Promise<LabelResponse> {
    try {
      await this.ensureAuthenticated();

      // First, create the shipment
      const shipmentPayload = {
        service: parseInt(request.service),
        from: {
          name: 'Remetente',
          document: '12345678901',
          email: 'remetente@email.com',
          phone: '11999999999',
          address: request.from.address,
          number: '123',
          complement: '',
          district: 'Centro',
          city: request.from.city,
          state_abbr: request.from.state,
          country_id: 'BR',
          postal_code: request.from.zipCode.replace(/\D/g, ''),
        },
        to: {
          name: 'Destinatário',
          document: '12345678901',
          email: 'destinatario@email.com',
          phone: '11999999999',
          address: request.to.address,
          number: '123',
          complement: '',
          district: 'Centro',
          city: request.to.city,
          state_abbr: request.to.state,
          country_id: 'BR',
          postal_code: request.to.zipCode.replace(/\D/g, ''),
        },
        package: {
          height: request.package.height,
          width: request.package.width,
          length: request.package.length,
          weight: request.package.weight,
        },
        options: {
          insurance_value: request.declaredValue || 0,
          receipt: request.additionalServices?.receipt || false,
          own_hand: request.additionalServices?.ownHand || false,
        }
      };

      const shipmentResponse = await this.api.post('/me/cart', shipmentPayload);
      const shipmentId = shipmentResponse.data.id;

      // Generate the label
      const labelResponse = await this.api.post(`/me/shipment/generate`, {
        orders: [shipmentId]
      });

      const trackingCode = labelResponse.data[0]?.tracking || this.generateTrackingCode();
      const labelUrl = labelResponse.data[0]?.print || '';

      return {
        success: true,
        labelUrl,
        trackingCode,
        price: parseFloat(shipmentResponse.data.price || '0')
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar etiqueta'
      };
    }
  }

  async getServices(): Promise<{ code: string; name: string; description?: string }[]> {
    try {
      await this.ensureAuthenticated();

      const response = await this.api.get('/me/shipment/services');
      const services = response.data;

      return services.map(service => ({
        code: service.id.toString(),
        name: `${service.company.name} - ${service.name}`,
        description: service.description || ''
      }));
    } catch (error) {
      // Fallback services
      return [
        { code: '1', name: 'Correios - PAC', description: 'Entrega econômica' },
        { code: '2', name: 'Correios - SEDEX', description: 'Entrega expressa' },
        { code: '3', name: 'Jadlog - Package', description: 'Entrega Jadlog' },
        { code: '4', name: 'Total Express', description: 'Entrega Total Express' }
      ];
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      const response = await this.api.get('/me');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  calculateFees(amount: number, service: string): number {
    // MelhorEnvio transaction fee
    const baseFee = 0.0299; // 2.99%
    const fixedFee = 0.49; // R$ 0.49

    return Math.round((amount * baseFee + fixedFee) * 100) / 100;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.config.accessToken) {
      await this.authenticate();
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        `${this.api.defaults.baseURL}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read products-read products-write purchases-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read users-read users-write webhooks-read webhooks-write'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Aplicação aplicacao@email.com'
          }
        }
      );

      this.config.accessToken = response.data.access_token;
      this.config.refreshToken = response.data.refresh_token;
      
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.config.accessToken}`;
    } catch (error) {
      throw new Error(`Falha na autenticação MelhorEnvio: ${error.message}`);
    }
  }

  private generateTrackingCode(): string {
    return 'ME' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
}