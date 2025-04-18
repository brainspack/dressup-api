import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MeasurementService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    try {
      return await this.prisma.measurement.create({
        data,
      });
    } catch (error) {
      throw new Error('Failed to add measurement');
    }
  }

  async findByCustomer(customerId: string) {
    return this.prisma.measurement.findMany({
      where: { customerId },
    });
  }
}
