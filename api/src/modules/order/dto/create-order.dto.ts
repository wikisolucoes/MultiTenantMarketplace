import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  customerEmail: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  customerAddress: string;

  @IsString()
  customerCity: string;

  @IsString()
  customerState: string;

  @IsString()
  customerZipCode: string;

  @IsOptional()
  @IsString()
  customerCountry?: string;

  @IsOptional()
  @IsString()
  customerDocument?: string;

  @IsEnum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
  status: string = 'pending';

  @IsEnum(['pending', 'paid', 'failed', 'refunded'])
  paymentStatus: string = 'pending';

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  shippingAmount?: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsNumber()
  tenantId: number;
}