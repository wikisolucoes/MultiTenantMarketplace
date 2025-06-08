import { IsString, IsNumber, IsEmail, IsOptional, ValidateNested, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class OrderItemDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}

export class OrderDto {
  @IsString()
  id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(['pix', 'credit_card', 'debit_card', 'boleto'])
  paymentMethod: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ValidateNested()
  @Type(() => OrderDto)
  order: OrderDto;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  installments?: number;

  @IsOptional()
  @IsString()
  cardToken?: string;
}

export class ConfigureGatewayDto {
  @IsEnum(['mercadopago', 'pagseguro', 'cielo'])
  gatewayType: string;

  @IsEnum(['sandbox', 'production'])
  environment: string;

  credentials: Record<string, any>;

  @IsArray()
  supportedMethods: string[];

  @IsOptional()
  fees?: Record<string, number>;

  @IsOptional()
  priority?: number;
}