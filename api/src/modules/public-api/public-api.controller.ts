import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('public-api')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('public/api/v1')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('info')
  @ApiOperation({ summary: 'Informações da API' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  @ApiResponse({ status: 200, description: 'Informações da API e permissões' })
  async getApiInfo(@Headers('x-api-key') apiKey: string) {
    return this.publicApiService.getApiInfo(apiKey);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar produtos' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filtrar por marca' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  async getProducts(
    @Headers('x-api-key') apiKey: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string,
    @Query('category') category?: number,
    @Query('brand') brand?: number,
    @Query('status') status?: string
  ) {
    return this.publicApiService.getProducts(apiKey, {
      page: parseInt(String(page)),
      limit: parseInt(String(limit)),
      search,
      category,
      brand,
      status
    });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Obter produto por ID' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async getProduct(
    @Headers('x-api-key') apiKey: string,
    @Param('id') id: string
  ) {
    return this.publicApiService.getProduct(apiKey, parseInt(id));
  }

  @Post('products')
  @ApiOperation({ summary: 'Criar produto' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async createProduct(
    @Headers('x-api-key') apiKey: string,
    @Body() productData: any
  ) {
    return this.publicApiService.createProduct(apiKey, productData);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async updateProduct(
    @Headers('x-api-key') apiKey: string,
    @Param('id') id: string,
    @Body() productData: any
  ) {
    return this.publicApiService.updateProduct(apiKey, parseInt(id), productData);
  }

  @Put('products/:id/stock')
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async updateProductStock(
    @Headers('x-api-key') apiKey: string,
    @Param('id') id: string,
    @Body() stockData: { quantity: number; operation: 'set' | 'add' | 'subtract' }
  ) {
    return this.publicApiService.updateProductStock(apiKey, parseInt(id), stockData);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'customer', required: false, description: 'Filtrar por cliente' })
  async getOrders(
    @Headers('x-api-key') apiKey: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('status') status?: string,
    @Query('customer') customer?: string
  ) {
    return this.publicApiService.getOrders(apiKey, {
      page: parseInt(String(page)),
      limit: parseInt(String(limit)),
      status,
      customer
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Obter pedido por ID' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async getOrder(
    @Headers('x-api-key') apiKey: string,
    @Param('id') id: string
  ) {
    return this.publicApiService.getOrder(apiKey, parseInt(id));
  }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async updateOrderStatus(
    @Headers('x-api-key') apiKey: string,
    @Param('id') id: string,
    @Body() statusData: { status: string; notes?: string }
  ) {
    return this.publicApiService.updateOrderStatus(apiKey, parseInt(id), statusData);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar clientes' })
  async getCustomers(
    @Headers('x-api-key') apiKey: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string
  ) {
    return this.publicApiService.getCustomers(apiKey, {
      page: parseInt(String(page)),
      limit: parseInt(String(limit)),
      search
    });
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Obter cliente por ID' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async getCustomer(
    @Headers('x-api-key') apiKey: string,
    @Param('id') id: string
  ) {
    return this.publicApiService.getCustomer(apiKey, parseInt(id));
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async getCategories(@Headers('x-api-key') apiKey: string) {
    return this.publicApiService.getCategories(apiKey);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Listar marcas' })
  @ApiHeader({ name: 'X-API-Key', description: 'Chave da API', required: true })
  async getBrands(@Headers('x-api-key') apiKey: string) {
    return this.publicApiService.getBrands(apiKey);
  }
}