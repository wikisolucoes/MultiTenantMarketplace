import { IsString, IsNumber, IsOptional, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CelcoinMerchantDto {
  @IsString()
  postalCode: string;

  @IsString()
  city: string;

  @IsString()
  merchantCategoryCode: string;

  @IsString()
  name: string;
}

export class CelcoinPayerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  cpf?: string;
}

export class CreatePixPaymentDto {
  @ValidateNested()
  @Type(() => CelcoinMerchantDto)
  merchant: CelcoinMerchantDto;

  @IsNumber()
  amount: number;

  @IsString()
  correlationID: string;

  @IsOptional()
  @IsString()
  expiresDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CelcoinPayerDto)
  payer?: CelcoinPayerDto;
}