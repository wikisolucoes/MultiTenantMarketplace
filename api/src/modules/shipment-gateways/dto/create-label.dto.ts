import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto, PackageDto, AdditionalServicesDto } from './calculate-shipping.dto';

export class CreateLabelDto {
  @ValidateNested()
  @Type(() => AddressDto)
  from: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  to: AddressDto;

  @ValidateNested()
  @Type(() => PackageDto)
  package: PackageDto;

  @IsString()
  service: string;

  @IsOptional()
  @IsNumber()
  declaredValue?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdditionalServicesDto)
  additionalServices?: AdditionalServicesDto;
}