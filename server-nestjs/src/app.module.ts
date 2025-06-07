import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CategoryModule } from './modules/category/category.module';
import { BrandModule } from './modules/brand/brand.module';
import { EmailModule } from './modules/email/email.module';
import { SupportModule } from './modules/support/support.module';
import { SecurityModule } from './modules/security/security.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { CelcoinModule } from './modules/celcoin/celcoin.module';
import { NfeModule } from './modules/nfe/nfe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    ProductModule,
    OrderModule,
    CustomerModule,
    CategoryModule,
    BrandModule,
    EmailModule,
    SupportModule,
    SecurityModule,
    PublicApiModule,
    CelcoinModule,
    NfeModule,
  ],
})
export class AppModule {}