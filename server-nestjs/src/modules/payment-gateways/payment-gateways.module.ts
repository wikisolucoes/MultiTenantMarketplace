import { Module } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { MercadoPagoService } from './services/mercadopago.service';
import { PagSeguroService } from './services/pagseguro.service';
import { CieloService } from './services/cielo.service';
import { PaymentGatewayFactory } from './services/payment-gateway.factory';

@Module({
  controllers: [PaymentGatewaysController],
  providers: [
    PaymentGatewaysService,
    MercadoPagoService,
    PagSeguroService,
    CieloService,
    PaymentGatewayFactory,
  ],
  exports: [
    PaymentGatewaysService,
    PaymentGatewayFactory,
  ],
})
export class PaymentGatewaysModule {}