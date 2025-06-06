import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ description: 'ID do tenant' })
  @IsNumber()
  tenantId: number;

  @ApiProperty({ description: 'Nome da marca' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição da marca', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Logo da marca', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: 'Website da marca', required: false })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateBrandDto {
  @ApiProperty({ description: 'Nome da marca', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Descrição da marca', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Logo da marca', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ description: 'Website da marca', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Status ativo da marca', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BrandResponseDto {
  @ApiProperty({ description: 'ID da marca' })
  id: number;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: number;

  @ApiProperty({ description: 'Nome da marca' })
  name: string;

  @ApiProperty({ description: 'Descrição da marca' })
  description?: string;

  @ApiProperty({ description: 'Logo da marca' })
  logoUrl?: string;

  @ApiProperty({ description: 'Website da marca' })
  website?: string;

  @ApiProperty({ description: 'Status ativo da marca' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}