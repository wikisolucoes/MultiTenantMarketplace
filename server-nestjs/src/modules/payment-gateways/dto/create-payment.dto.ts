import { IsString, IsNumber, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PayerDto {
  @ApiProperty({ description: 'Payer name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Payer email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Payer document (CPF/CNPJ)' })
  @IsString()
  document: string;

  @ApiProperty({ description: 'Payer phone', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: ['pix', 'credit_card', 'debit_card', 'boleto'] })
  @IsEnum(['pix', 'credit_card', 'debit_card', 'boleto'])
  paymentMethod: string;

  @ApiProperty({ description: 'Preferred gateway type', required: false })
  @IsOptional()
  @IsString()
  gatewayType?: string;

  @ApiProperty({ description: 'Payer information' })
  @ValidateNested()
  @Type(() => PayerDto)
  payer: PayerDto;

  @ApiProperty({ description: 'Payment description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Payment expiration in minutes', required: false })
  @IsOptional()
  @IsNumber()
  expirationMinutes?: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}