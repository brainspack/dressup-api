import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TailorService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, shopId: string) {
    try {
      return await this.prisma.tailor.create({
        data: { ...data, shopId },
      });
    } catch (error) {
      throw new Error('Failed to add tailor');
    }
  }

  async findByShop(shopId: string) {
    return this.prisma.tailor.findMany({
      where: { shopId },
    });
  }
}
