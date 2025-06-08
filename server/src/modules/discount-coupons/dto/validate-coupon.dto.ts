import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  orderTotal: number;

  @IsArray()
  @IsOptional()
  productIds?: number[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  customerId?: number;
}

export class CouponValidationResult {
  isValid: boolean;
  coupon?: {
    id: number;
    code: string;
    name: string;
    type: string;
    value: number;
    discountAmount: number;
    finalAmount: number;
  };
  error?: string;
}