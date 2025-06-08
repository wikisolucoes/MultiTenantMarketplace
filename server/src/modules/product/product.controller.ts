import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: any) {
    return this.productService.create({
      ...createProductDto,
      tenantId: user.tenantId
    });
  }

  @Get()
  findAll(@Query() query: ProductQueryDto, @GetUser() user: any) {
    return this.productService.findAll(user.tenantId, query);
  }

  @Get('featured')
  getFeatured(@Query('limit') limit: number = 10, @GetUser() user: any) {
    return this.productService.getFeaturedProducts(user.tenantId, limit);
  }

  @Get('low-stock')
  getLowStock(@GetUser() user: any) {
    return this.productService.getLowStockProducts(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.productService.findOne(+id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @GetUser() user: any) {
    return this.productService.update(+id, user.tenantId, updateProductDto);
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; operation: 'add' | 'subtract' | 'set' },
    @GetUser() user: any
  ) {
    return this.productService.updateStock(+id, user.tenantId, body.quantity, body.operation);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.productService.remove(+id, user.tenantId);
  }
}