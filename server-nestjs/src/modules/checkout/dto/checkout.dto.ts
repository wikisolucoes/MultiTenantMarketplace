import { IsArray, IsEmail, IsNumber, IsOptional, IsString, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CustomerDataDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  cpf: string;

  @IsString()
  phone: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  neighborhood: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;
}

export class CreateCheckoutDto {
  @IsNumber()
  tenantId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ValidateNested()
  @Type(() => CustomerDataDto)
  customerData: CustomerDataDto;

  @IsEnum(['pix', 'boleto', 'credit_card'])
  paymentMethod: 'pix' | 'boleto' | 'credit_card';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class ProcessPaymentDto {
  @IsNumber()
  orderId: number;

  @IsEnum(['pix', 'boleto', 'credit_card'])
  paymentMethod: 'pix' | 'boleto' | 'credit_card';

  @IsOptional()
  @IsString()
  paymentData?: string; // For credit card token or additional payment data
}

export class PaymentCallbackDto {
  @IsString()
  transactionId: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}