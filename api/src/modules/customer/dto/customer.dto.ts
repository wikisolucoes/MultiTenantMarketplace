import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'ID do tenant' })
  @IsNumber()
  tenantId: number;

  @ApiProperty({ description: 'Nome completo do cliente' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Email do cliente' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Telefone do cliente', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'CPF/CNPJ do cliente', required: false })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ description: 'Endereço do cliente', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Cidade do cliente', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Estado do cliente', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'CEP do cliente', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ description: 'País do cliente', required: false })
  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateCustomerDto {
  @ApiProperty({ description: 'Nome completo do cliente', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ description: 'Email do cliente', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Telefone do cliente', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'CPF/CNPJ do cliente', required: false })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ description: 'Endereço do cliente', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Cidade do cliente', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Estado do cliente', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'CEP do cliente', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ description: 'País do cliente', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Status ativo do cliente', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CustomerResponseDto {
  @ApiProperty({ description: 'ID do cliente' })
  id: number;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: number;

  @ApiProperty({ description: 'Nome completo do cliente' })
  fullName: string;

  @ApiProperty({ description: 'Email do cliente' })
  email: string;

  @ApiProperty({ description: 'Telefone do cliente' })
  phone?: string;

  @ApiProperty({ description: 'CPF/CNPJ do cliente' })
  document?: string;

  @ApiProperty({ description: 'Endereço do cliente' })
  address?: string;

  @ApiProperty({ description: 'Cidade do cliente' })
  city?: string;

  @ApiProperty({ description: 'Estado do cliente' })
  state?: string;

  @ApiProperty({ description: 'CEP do cliente' })
  zipCode?: string;

  @ApiProperty({ description: 'País do cliente' })
  country?: string;

  @ApiProperty({ description: 'Status ativo do cliente' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}