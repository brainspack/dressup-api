import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    try {
      return await this.prisma.customer.create({
        data: { ...data, shopId: userId },
      });
    } catch (error) {
      throw new Error('Failed to create customer');
    }
  }

  async findByUser(userId: string) {
    return this.prisma.customer.findMany({
      where: { shop: { ownerId: userId } },
      include: { measurements: true, orders: true },
    });
  }
}
