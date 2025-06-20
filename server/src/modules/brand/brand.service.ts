import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  async getBrandsByTenant(tenantId: number) {
    return this.prisma.brand.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
  }

  async getBrand(id: number) {
    const brand = await this.prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

    return brand;
  }

  async createBrand(createBrandDto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        ...createBrandDto,
        isActive: true
      }
    });
  }

  async updateBrand(id: number, updateBrandDto: UpdateBrandDto) {
    await this.getBrand(id);
    
    return this.prisma.brand.update({
      where: { id },
      data: {
        ...updateBrandDto,
        updatedAt: new Date()
      }
    });
  }

  async deleteBrand(id: number) {
    await this.getBrand(id);
    
    return this.prisma.brand.delete({
      where: { id }
    });
  }
}