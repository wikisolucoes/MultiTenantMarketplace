import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getCategoriesByTenant(tenantId: number) {
    return this.prisma.categories.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
  }

  async getCategory(id: number) {
    const category = await this.prisma.categories.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const slug = createCategoryDto.slug || 
      createCategoryDto.name.toLowerCase().replace(/\s+/g, '-');

    return this.prisma.categories.create({
      data: {
        ...createCategoryDto,
        slug,
        isActive: true
      }
    });
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.getCategory(id);
    
    return this.prisma.categories.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        updatedAt: new Date()
      }
    });
  }

  async deleteCategory(id: number) {
    await this.getCategory(id);
    
    return this.prisma.categories.delete({
      where: { id }
    });
  }
}