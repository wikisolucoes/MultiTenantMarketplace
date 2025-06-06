import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto } from './dto/customer.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get(':tenantId')
  @ApiOperation({ summary: 'Listar clientes do tenant' })
  @ApiResponse({ status: 200, description: 'Lista de clientes', type: [CustomerResponseDto] })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome ou email' })
  async getCustomersByTenant(
    @Param('tenantId') tenantId: string,
    @Query('search') search?: string
  ) {
    return this.customerService.getCustomersByTenant(parseInt(tenantId), search);
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'Obter detalhes do cliente' })
  @ApiResponse({ status: 200, description: 'Detalhes do cliente', type: CustomerResponseDto })
  async getCustomer(@Param('id') id: string) {
    return this.customerService.getCustomer(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado', type: CustomerResponseDto })
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado', type: CustomerResponseDto })
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto
  ) {
    return this.customerService.updateCustomer(parseInt(id), updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir cliente' })
  @ApiResponse({ status: 200, description: 'Cliente excluído' })
  async deleteCustomer(@Param('id') id: string) {
    return this.customerService.deleteCustomer(parseInt(id));
  }
}