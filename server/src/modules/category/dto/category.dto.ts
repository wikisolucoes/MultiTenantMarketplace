import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'ID do tenant' })
  @IsNumber()
  tenantId: number;

  @ApiProperty({ description: 'Nome da categoria' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição da categoria', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Slug da categoria', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Categoria pai', required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;
}

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Nome da categoria', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Descrição da categoria', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Slug da categoria', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Categoria pai', required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: 'Status ativo da categoria', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryResponseDto {
  @ApiProperty({ description: 'ID da categoria' })
  id: number;

  @ApiProperty({ description: 'ID do tenant' })
  tenantId: number;

  @ApiProperty({ description: 'Nome da categoria' })
  name: string;

  @ApiProperty({ description: 'Descrição da categoria' })
  description?: string;

  @ApiProperty({ description: 'Slug da categoria' })
  slug?: string;

  @ApiProperty({ description: 'ID da categoria pai' })
  parentId?: number;

  @ApiProperty({ description: 'Status ativo da categoria' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}