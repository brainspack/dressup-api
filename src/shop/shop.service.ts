import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, ownerId: string) {
    try {
      return await this.prisma.shop.create({
        data: { ...data, ownerId },
      });
    } catch (error) {
      throw new Error('Failed to create shop');
    }
  }

  async findByOwner(ownerId: string) {
    return this.prisma.shop.findMany({
      where: { ownerId },
      include: { customers: true, tailors: true, orders: true },
    });
  }
}
