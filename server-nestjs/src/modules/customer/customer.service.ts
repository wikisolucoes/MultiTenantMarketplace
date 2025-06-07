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

    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomer(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async createCustomer(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        isActive: true
      }
    });
  }

  async updateCustomer(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.getCustomer(id);
    
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...updateCustomerDto,
        updatedAt: new Date()
      }
    });
  }

  async deleteCustomer(id: number) {
    const customer = await this.getCustomer(id);
    
    return this.prisma.customer.delete({
      where: { id }
    });
  }
}