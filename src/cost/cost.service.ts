import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CostService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      return await this.prisma.cost.create({
        data,
      });
    } catch (error) {
      throw new Error('Failed to add cost');
    }
  }

  async findByOrder(orderId: string) {
    return this.prisma.cost.findMany({
      where: { orderId },
    });
  }
}
