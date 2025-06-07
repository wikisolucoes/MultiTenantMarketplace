import { IsString, IsNumber, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CelcoinAddressDto {
  @IsString()
  street: string;

  @IsString()
  number: string;

  @IsString()
  neighborhood: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;
}

export class CelcoinBoletoPayerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  cpf: string;

  @ValidateNested()
  @Type(() => CelcoinAddressDto)
  address: CelcoinAddressDto;
}

export class CreateBoletoDto {
  @ValidateNested()
  @Type(() => CelcoinMerchantDto)
  merchant: CelcoinMerchantDto;

  @IsNumber()
  amount: number;

  @IsString()
  correlationID: string;

  @IsString()
  expiresDate: string;

  @ValidateNested()
  @Type(() => CelcoinBoletoPayerDto)
  payer: CelcoinBoletoPayerDto;
}

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