import { Module } from '@nestjs/common';
import { DiscountCouponsController } from './discount-coupons.controller';
import { DiscountCouponsService } from './discount-coupons.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscountCouponsController],
  providers: [DiscountCouponsService],
  exports: [DiscountCouponsService],
})
export class DiscountCouponsModule {}