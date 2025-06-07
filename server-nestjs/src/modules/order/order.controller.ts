import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() user: any) {
    return this.orderService.create({
      ...createOrderDto,
      tenantId: user.tenantId
    });
  }

  @Get()
  findAll(@Query() query: OrderQueryDto, @GetUser() user: any) {
    return this.orderService.findAll(user.tenantId, query);
  }

  @Get('statistics')
  getStatistics(@GetUser() user: any) {
    return this.orderService.getOrderStatistics(user.tenantId);
  }

  @Get('by-status/:status')
  getByStatus(@Param('status') status: string, @GetUser() user: any) {
    return this.orderService.getOrdersByStatus(user.tenantId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.orderService.findOne(+id, user.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @GetUser() user: any) {
    return this.orderService.update(+id, user.tenantId, updateOrderDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @GetUser() user: any
  ) {
    return this.orderService.updateStatus(+id, user.tenantId, body.status);
  }

  @Patch(':id/payment-status')
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() body: { paymentStatus: string },
    @GetUser() user: any
  ) {
    return this.orderService.updatePaymentStatus(+id, user.tenantId, body.paymentStatus);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.orderService.remove(+id, user.tenantId);
  }
}