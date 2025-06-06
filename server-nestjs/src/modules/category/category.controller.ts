import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':tenantId')
  @ApiOperation({ summary: 'Listar categorias do tenant' })
  @ApiResponse({ status: 200, description: 'Lista de categorias', type: [CategoryResponseDto] })
  async getCategoriesByTenant(@Param('tenantId') tenantId: string) {
    return this.categoryService.getCategoriesByTenant(parseInt(tenantId));
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'Obter detalhes da categoria' })
  @ApiResponse({ status: 200, description: 'Detalhes da categoria', type: CategoryResponseDto })
  async getCategory(@Param('id') id: string) {
    return this.categoryService.getCategory(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada', type: CategoryResponseDto })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada', type: CategoryResponseDto })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoryService.updateCategory(parseInt(id), updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir categoria' })
  @ApiResponse({ status: 200, description: 'Categoria excluída' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(parseInt(id));
  }
}