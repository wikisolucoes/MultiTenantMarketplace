import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto, UpdateBrandDto, BrandResponseDto } from './dto/brand.dto';

@ApiTags('brands')
@ApiBearerAuth()
@Controller('api/brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get(':tenantId')
  @ApiOperation({ summary: 'Listar marcas do tenant' })
  @ApiResponse({ status: 200, description: 'Lista de marcas', type: [BrandResponseDto] })
  async getBrandsByTenant(@Param('tenantId') tenantId: string) {
    return this.brandService.getBrandsByTenant(parseInt(tenantId));
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'Obter detalhes da marca' })
  @ApiResponse({ status: 200, description: 'Detalhes da marca', type: BrandResponseDto })
  async getBrand(@Param('id') id: string) {
    return this.brandService.getBrand(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova marca' })
  @ApiResponse({ status: 201, description: 'Marca criada', type: BrandResponseDto })
  async createBrand(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.createBrand(createBrandDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar marca' })
  @ApiResponse({ status: 200, description: 'Marca atualizada', type: BrandResponseDto })
  async updateBrand(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto
  ) {
    return this.brandService.updateBrand(parseInt(id), updateBrandDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir marca' })
  @ApiResponse({ status: 200, description: 'Marca excluída' })
  async deleteBrand(@Param('id') id: string) {
    return this.brandService.deleteBrand(parseInt(id));
  }
}