import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CelcoinService } from './celcoin.service';
import { CelcoinController } from './celcoin.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CelcoinController],
  providers: [CelcoinService],
  exports: [CelcoinService],
})
export class CelcoinModule {}