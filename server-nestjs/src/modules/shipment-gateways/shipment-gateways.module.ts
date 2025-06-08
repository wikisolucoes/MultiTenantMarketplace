import { Module } from '@nestjs/common';
import { ShipmentGatewaysController } from './shipment-gateways.controller';
import { ShipmentGatewaysService } from './shipment-gateways.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShipmentGatewaysController],
  providers: [ShipmentGatewaysService],
  exports: [ShipmentGatewaysService],
})
export class ShipmentGatewaysModule {}