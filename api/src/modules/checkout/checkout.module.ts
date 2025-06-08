import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CelcoinModule } from '../celcoin/celcoin.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, CelcoinModule, EmailModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}