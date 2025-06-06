import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async getCustomersByTenant(tenantId: number, search?: string) {
    const where: any = { tenantId };
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.customers.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomer(id: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async createCustomer(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customers.create({
      data: {
        ...createCustomerDto,
        isActive: true
      }
    });
  }

  async updateCustomer(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.getCustomer(id);
    
    return this.prisma.customers.update({
      where: { id },
      data: {
        ...updateCustomerDto,
        updatedAt: new Date()
      }
    });
  }

  async deleteCustomer(id: number) {
    const customer = await this.getCustomer(id);
    
    return this.prisma.customers.delete({
      where: { id }
    });
  }
}