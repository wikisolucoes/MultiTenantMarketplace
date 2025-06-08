import { Module } from '@nestjs/common';
import { NfeController } from './nfe.controller';
import { NfeService } from './nfe.service';
import { SefazService } from './sefaz.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [NfeController],
  providers: [NfeService, SefazService],
  exports: [NfeService, SefazService],
})
export class NfeModule {}