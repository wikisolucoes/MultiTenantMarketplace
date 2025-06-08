import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentGateway, PaymentGatewayConfig } from '../interfaces/payment-gateway.interface';
import { MercadoPagoService } from './mercadopago.service';
import { PagSeguroService } from './pagseguro.service';
import { CieloService } from './cielo.service';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private mercadopagoService: MercadoPagoService,
    private pagseguroService: PagSeguroService,
    private cieloService: CieloService,
  ) {}

  createGateway(config: any): PaymentGateway {
    switch (config.gatewayType) {
      case 'mercadopago':
        return this.mercadopagoService.createInstance(config);
      case 'pagseguro':
        return this.pagseguroService.createInstance(config);
      case 'cielo':
        return this.cieloService.createInstance(config);
      default:
        throw new BadRequestException(`Gateway não suportado: ${config.gatewayType}`);
    }
  }
}