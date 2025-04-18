import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(dto: any) {
    try {
      const order = await this.prisma.order.create({
        data: {
          customerId: dto.customerId,
          shopId: dto.shopId,
          tailorName: dto.tailorName,
          tailorNumber: dto.tailorNumber,
          status: dto.status,
          clothes: {
            create: dto.clothes || [],
          },
          costs: {
            create: dto.costs || [],
          },
        },
      });
      return order;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderById(id: string) {
    try {
      return await this.prisma.order.findUnique({
        where: { id },
        include: {
          clothes: true,
          costs: true,
          customer: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  async getAllOrders() {
    try {
      return await this.prisma.order.findMany({
        include: {
          clothes: true,
          costs: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async updateOrder(id: string, dto: any) {
    try {
      return await this.prisma.order.update({
        where: { id },
        data: {
          tailorName: dto.tailorName,
          tailorNumber: dto.tailorNumber,
          status: dto.status,
        },
      });
    } catch (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }
  }

  async deleteOrder(id: string) {
    try {
      return await this.prisma.order.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(`Failed to delete order: ${error.message}`);
    }
  }
}
