import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribePluginDto {
  @ApiProperty({ description: 'Plugin name', enum: ['mercadopago', 'pagseguro', 'cielo'] })
  @IsEnum(['mercadopago', 'pagseguro', 'cielo'])
  pluginName: string;
}