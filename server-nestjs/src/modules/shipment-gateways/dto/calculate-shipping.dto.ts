import { IsString, IsNumber, IsOptional, ValidateNested, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  zipCode: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class PackageDto {
  @IsNumber()
  weight: number;

  @IsNumber()
  height: number;

  @IsNumber()
  width: number;

  @IsNumber()
  length: number;

  @IsNumber()
  value: number;
}

export class AdditionalServicesDto {
  @IsOptional()
  @IsBoolean()
  declaredValue?: boolean;

  @IsOptional()
  @IsBoolean()
  receipt?: boolean;

  @IsOptional()
  @IsBoolean()
  ownHand?: boolean;

  @IsOptional()
  @IsBoolean()
  collectOnDelivery?: boolean;
}

export class CalculateShippingDto {
  @ValidateNested()
  @Type(() => AddressDto)
  from: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  to: AddressDto;

  @ValidateNested()
  @Type(() => PackageDto)
  package: PackageDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AdditionalServicesDto)
  additionalServices?: AdditionalServicesDto;
}