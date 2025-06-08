import { IsString, IsEnum, IsObject, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfigureGatewayDto {
  @ApiProperty({ description: 'Gateway type', enum: ['mercadopago', 'pagseguro', 'cielo'] })
  @IsEnum(['mercadopago', 'pagseguro', 'cielo'])
  gatewayType: string;

  @ApiProperty({ description: 'Environment', enum: ['sandbox', 'production'] })
  @IsEnum(['sandbox', 'production'])
  environment: string;

  @ApiProperty({ description: 'Gateway credentials (will be encrypted)' })
  @IsObject()
  credentials: Record<string, any>;

  @ApiProperty({ description: 'Supported payment methods', type: [String] })
  @IsArray()
  @IsString({ each: true })
  supportedMethods: string[];

  @ApiProperty({ description: 'Gateway priority (1 = highest)', required: false })
  @IsOptional()
  priority?: number;
}