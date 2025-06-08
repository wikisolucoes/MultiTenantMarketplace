import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ShipmentGateway, ShippingRequest, ShippingResponse, TrackingRequest, TrackingResponse, LabelRequest, LabelResponse } from '../interfaces/shipment-gateway.interface';

interface JadlogConfig {
  cnpj: string;
  contractNumber: string;
  password: string;
  environment: 'sandbox' | 'production';
}

interface JadlogServiceOption {
  modalidade: string;
  nome: string;
  prazo: number;
  valor: number;
}

@Injectable()
export class JadlogService extends ShipmentGateway {
  private api: AxiosInstance;
  private config: JadlogConfig;

  constructor(config: JadlogConfig) {
    super();
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://www.jadlog.com.br/embarcador/api'
      : 'https://sandbox.jadlog.com.br/embarcador/api';

    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async calculateShipping(request: ShippingRequest): Promise<ShippingResponse> {
    try {
      const payload = {
        ceporigem: request.from.zipCode.replace(/\D/g, ''),
        cepdestino: request.to.zipCode.replace(/\D/g, ''),
        peso: request.package.weight,
        altura: request.package.height,
        largura: request.package.width,
        comprimento: request.package.length,
        valor: request.package.value,
        cnpjremetente: this.config.cnpj,
        cnpjdestinatario: '',
        modalidade: '',
        tpentrega: '1',
        tpseguro: request.additionalServices?.declaredValue ? '1' : '0',
        vlseguro: request.additionalServices?.declaredValue ? request.package.value : 0
      };

      // Get available services
      const services = await this.getAvailableServices();
      const quotes = [];

      for (const service of services) {
        try {
          const servicePayload = { ...payload, modalidade: service.modalidade };
          
          // Mock calculation for demonstration - in production, use actual Jadlog API
          const quote = this.calculateServicePrice(request, service.modalidade);
          
          quotes.push({
            service: service.modalidade,
            serviceName: service.nome,
            price: quote.price,
            currency: 'BRL',
            estimatedDays: quote.deadline,
            carrier: 'Jadlog',
            additionalInfo: `Modalidade: ${service.modalidade}`
          });
        } catch (error) {
          console.error(`Error calculating price for service ${service.modalidade}:`, error);
        }
      }

      return {
        success: true,
        quotes
      };
    } catch (error) {
      return {
        success: false,
        quotes: [],
        error: error.message || 'Erro ao calcular frete'
      };
    }
  }

  private calculateServicePrice(request: ShippingRequest, modalidade: string) {
    // Mock calculation based on Jadlog pricing structure
    const basePrices = {
      '3': 18.90, // PACKAGE
      '4': 12.50, // RODOVIÁRIO
      '5': 22.30, // CARGO
      '7': 15.80, // CORPORATE
      '9': 28.90, // .COM
      '10': 35.50, // INTERNACIONAL
      '14': 19.90, // DOCS
    };

    const basePrice = basePrices[modalidade] || 15.00;
    const weightMultiplier = Math.max(1, request.package.weight * 0.8);
    const distanceMultiplier = this.calculateDistanceMultiplier(request.from.zipCode, request.to.zipCode);
    
    const price = basePrice * weightMultiplier * distanceMultiplier;
    const deadline = this.getServiceDeadline(modalidade);

    return {
      price: Math.round(price * 100) / 100,
      deadline
    };
  }

  async trackPackage(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      // Mock tracking response - in production, use actual Jadlog tracking API
      const events = [
        {
          date: '2024-01-20',
          time: '16:45',
          location: 'São Paulo - SP',
          status: 'Coletado',
          description: 'Objeto coletado pelo Jadlog'
        },
        {
          date: '2024-01-21',
          time: '09:30',
          location: 'São Paulo - SP',
          status: 'Em trânsito',
          description: 'Objeto em trânsito para filial destino'
        },
        {
          date: '2024-01-22',
          time: '14:20',
          location: 'Rio de Janeiro - RJ',
          status: 'Saiu para entrega',
          description: 'Objeto saiu para entrega'
        }
      ];

      return {
        success: true,
        trackingCode: request.trackingCode,
        status: 'Em trânsito',
        carrier: 'Jadlog',
        events,
        estimatedDelivery: '2024-01-23'
      };
    } catch (error) {
      return {
        success: false,
        trackingCode: request.trackingCode,
        status: 'Erro',
        carrier: 'Jadlog',
        events: [],
        error: error.message || 'Erro ao rastrear objeto'
      };
    }
  }

  async createLabel(request: LabelRequest): Promise<LabelResponse> {
    try {
      // Generate tracking code
      const trackingCode = this.generateTrackingCode();
      
      // Mock label creation - in production, use actual Jadlog label API
      const labelPayload = {
        cnpj: this.config.cnpj,
        contrato: this.config.contractNumber,
        password: this.config.password,
        pedido: `PED${Date.now()}`,
        ceporigem: request.from.zipCode.replace(/\D/g, ''),
        cepdestino: request.to.zipCode.replace(/\D/g, ''),
        peso: request.package.weight,
        altura: request.package.height,
        largura: request.package.width,
        comprimento: request.package.length,
        valor: request.package.value,
        modalidade: request.service,
        remetente: {
          nome: 'Remetente',
          endereco: request.from.address,
          numero: '123',
          bairro: 'Centro',
          cidade: request.from.city,
          uf: request.from.state,
          cep: request.from.zipCode.replace(/\D/g, ''),
          telefone: '11999999999'
        },
        destinatario: {
          nome: 'Destinatário',
          endereco: request.to.address,
          numero: '123',
          bairro: 'Centro',
          cidade: request.to.city,
          uf: request.to.state,
          cep: request.to.zipCode.replace(/\D/g, ''),
          telefone: '11999999999'
        }
      };

      const labelUrl = `https://www.jadlog.com.br/siteDpd/tracking.jad?cte=${trackingCode}`;
      const quote = this.calculateServicePrice({
        from: request.from,
        to: request.to,
        package: request.package
      }, request.service);

      return {
        success: true,
        labelUrl,
        trackingCode,
        price: quote.price
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao criar etiqueta'
      };
    }
  }

  async getServices(): Promise<{ code: string; name: string; description?: string }[]> {
    return [
      { code: '3', name: 'PACKAGE', description: 'Entrega expressa para e-commerce' },
      { code: '4', name: 'RODOVIÁRIO', description: 'Entrega rodoviária econômica' },
      { code: '5', name: 'CARGO', description: 'Transporte de cargas' },
      { code: '7', name: 'CORPORATE', description: 'Entrega corporativa' },
      { code: '9', name: '.COM', description: 'Entrega para e-commerce' },
      { code: '10', name: 'INTERNACIONAL', description: 'Entrega internacional' },
      { code: '14', name: 'DOCS', description: 'Transporte de documentos' }
    ];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Mock validation - in production, test actual API connection
      return !!(this.config.cnpj && this.config.contractNumber && this.config.password);
    } catch (error) {
      return false;
    }
  }

  calculateFees(amount: number, service: string): number {
    // Jadlog transaction fee calculation
    const feeRates = {
      '3': 0.022, // PACKAGE - 2.2%
      '4': 0.018, // RODOVIÁRIO - 1.8%
      '5': 0.025, // CARGO - 2.5%
      '7': 0.020, // CORPORATE - 2.0%
      '9': 0.024, // .COM - 2.4%
      '10': 0.030, // INTERNACIONAL - 3.0%
      '14': 0.015, // DOCS - 1.5%
    };

    const rate = feeRates[service] || 0.022;
    return Math.round(amount * rate * 100) / 100;
  }

  private async getAvailableServices(): Promise<JadlogServiceOption[]> {
    const services = await this.getServices();
    return services.map(service => ({
      modalidade: service.code,
      nome: service.name,
      prazo: this.getServiceDeadline(service.code),
      valor: 0 // Will be calculated separately
    }));
  }

  private calculateDistanceMultiplier(fromCEP: string, toCEP: string): number {
    // Simple distance calculation based on CEP regions
    const fromRegion = parseInt(fromCEP.substring(0, 1));
    const toRegion = parseInt(toCEP.substring(0, 1));
    const distance = Math.abs(fromRegion - toRegion);
    
    return 1 + (distance * 0.12);
  }

  private getServiceDeadline(modalidade: string): number {
    const deadlines = {
      '3': 2, // PACKAGE
      '4': 4, // RODOVIÁRIO
      '5': 3, // CARGO
      '7': 1, // CORPORATE
      '9': 2, // .COM
      '10': 7, // INTERNACIONAL
      '14': 1, // DOCS
    };

    return deadlines[modalidade] || 3;
  }

  private generateTrackingCode(): string {
    const prefix = 'JD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `${prefix}${timestamp}${random}`;
  }
}