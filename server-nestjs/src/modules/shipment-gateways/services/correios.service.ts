import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ShipmentGateway, ShippingRequest, ShippingResponse, TrackingRequest, TrackingResponse, LabelRequest, LabelResponse } from '../interfaces/shipment-gateway.interface';

interface CorreiosConfig {
  username: string;
  password: string;
  contractCode: string;
  cardNumber: string;
  environment: 'sandbox' | 'production';
}

interface CorreiosService {
  code: string;
  name: string;
  price: number;
  deadline: number;
}

@Injectable()
export class CorreiosService extends ShipmentGateway {
  private api: AxiosInstance;
  private config: CorreiosConfig;

  constructor(config: CorreiosConfig) {
    super();
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente'
      : 'https://apphom.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente';

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
      // Correios CEP validation
      if (!this.validateCEP(request.from.zipCode) || !this.validateCEP(request.to.zipCode)) {
        return {
          success: false,
          quotes: [],
          error: 'CEP inválido'
        };
      }

      const services = await this.getAvailableServices();
      const quotes = [];

      for (const service of services) {
        try {
          const quote = await this.calculateServicePrice(request, service.code);
          if (quote) {
            quotes.push({
              service: service.code,
              serviceName: service.name,
              price: quote.price,
              currency: 'BRL',
              estimatedDays: quote.deadline,
              carrier: 'Correios',
              additionalInfo: quote.additionalInfo
            });
          }
        } catch (error) {
          console.error(`Error calculating price for service ${service.code}:`, error);
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

  private async calculateServicePrice(request: ShippingRequest, serviceCode: string) {
    // Calculate using Correios price calculation API
    const params = {
      nCdEmpresa: this.config.contractCode,
      sDsSenha: this.config.password,
      nCdServico: serviceCode,
      sCepOrigem: request.from.zipCode.replace(/\D/g, ''),
      sCepDestino: request.to.zipCode.replace(/\D/g, ''),
      nVlPeso: request.package.weight,
      nCdFormato: '1', // Box format
      nVlComprimento: request.package.length,
      nVlAltura: request.package.height,
      nVlLargura: request.package.width,
      nVlDiametro: '0',
      sCdMaoPropria: request.additionalServices?.ownHand ? 'S' : 'N',
      nVlValorDeclarado: request.additionalServices?.declaredValue ? request.package.value : 0,
      sCdAvisoRecebimento: request.additionalServices?.receipt ? 'S' : 'N'
    };

    // Mock calculation for demonstration - in production, use actual Correios API
    const basePrices = {
      '04014': 15.50, // SEDEX
      '04510': 12.30, // PAC
      '04782': 8.90,  // SEDEX 10
      '04790': 18.70, // SEDEX Hoje
    };

    const basePrice = basePrices[serviceCode] || 10.00;
    const weightMultiplier = Math.max(1, request.package.weight);
    const distanceMultiplier = this.calculateDistanceMultiplier(request.from.zipCode, request.to.zipCode);
    
    const price = basePrice * weightMultiplier * distanceMultiplier;
    const deadline = this.getServiceDeadline(serviceCode);

    return {
      price: Math.round(price * 100) / 100,
      deadline,
      additionalInfo: `Peso: ${request.package.weight}kg`
    };
  }

  async trackPackage(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      // Mock tracking response - in production, use actual Correios tracking API
      const events = [
        {
          date: '2024-01-20',
          time: '14:30',
          location: 'São Paulo - SP',
          status: 'Objeto postado',
          description: 'Objeto postado nos Correios'
        },
        {
          date: '2024-01-21',
          time: '08:15',
          location: 'São Paulo - SP',
          status: 'Em trânsito',
          description: 'Objeto em trânsito - por favor aguarde'
        },
        {
          date: '2024-01-22',
          time: '10:45',
          location: 'Rio de Janeiro - RJ',
          status: 'Saiu para entrega',
          description: 'Objeto saiu para entrega ao destinatário'
        }
      ];

      return {
        success: true,
        trackingCode: request.trackingCode,
        status: 'Em trânsito',
        carrier: 'Correios',
        events,
        estimatedDelivery: '2024-01-23'
      };
    } catch (error) {
      return {
        success: false,
        trackingCode: request.trackingCode,
        status: 'Erro',
        carrier: 'Correios',
        events: [],
        error: error.message || 'Erro ao rastrear objeto'
      };
    }
  }

  async createLabel(request: LabelRequest): Promise<LabelResponse> {
    try {
      // Generate mock tracking code
      const trackingCode = this.generateTrackingCode();
      
      // Mock label creation - in production, use actual Correios label API
      const labelUrl = `https://www2.correios.com.br/sistemas/rastreamento/ctrl/ctrlRastreamento.cfm?codigo=${trackingCode}`;
      
      const quote = await this.calculateServicePrice({
        from: request.from,
        to: request.to,
        package: request.package,
        additionalServices: request.additionalServices
      }, request.service);

      return {
        success: true,
        labelUrl,
        trackingCode,
        price: quote?.price || 0
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
      { code: '04014', name: 'SEDEX', description: 'Entrega expressa' },
      { code: '04510', name: 'PAC', description: 'Entrega econômica' },
      { code: '04782', name: 'SEDEX 10', description: 'Entrega até 10h' },
      { code: '04790', name: 'SEDEX Hoje', description: 'Entrega no mesmo dia' }
    ];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Mock validation - in production, test actual API connection
      return !!(this.config.username && this.config.password && this.config.contractCode);
    } catch (error) {
      return false;
    }
  }

  calculateFees(amount: number, service: string): number {
    // Correios transaction fee calculation
    const feeRates = {
      '04014': 0.015, // SEDEX - 1.5%
      '04510': 0.012, // PAC - 1.2%
      '04782': 0.018, // SEDEX 10 - 1.8%
      '04790': 0.025, // SEDEX Hoje - 2.5%
    };

    const rate = feeRates[service] || 0.015;
    return Math.round(amount * rate * 100) / 100;
  }

  private async getAvailableServices() {
    return await this.getServices();
  }

  private validateCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.length === 8 && /^\d+$/.test(cleanCEP);
  }

  private calculateDistanceMultiplier(fromCEP: string, toCEP: string): number {
    // Simple distance calculation based on CEP regions
    const fromRegion = parseInt(fromCEP.substring(0, 1));
    const toRegion = parseInt(toCEP.substring(0, 1));
    const distance = Math.abs(fromRegion - toRegion);
    
    return 1 + (distance * 0.1);
  }

  private getServiceDeadline(serviceCode: string): number {
    const deadlines = {
      '04014': 1, // SEDEX
      '04510': 3, // PAC
      '04782': 1, // SEDEX 10
      '04790': 0, // SEDEX Hoje
    };

    return deadlines[serviceCode] || 3;
  }

  private generateTrackingCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let code = '';
    
    // Format: AA123456789BR
    code += letters.charAt(Math.floor(Math.random() * letters.length));
    code += letters.charAt(Math.floor(Math.random() * letters.length));
    
    for (let i = 0; i < 9; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    code += 'BR';
    
    return code;
  }
}