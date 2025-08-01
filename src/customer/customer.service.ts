import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string, shopId?: string | null) {
    try {
      let targetShopId = shopId; // Start with the provided shopId

      // If no shopId is provided, find the user's default shop
      if (!targetShopId) {
        const shop = await this.prisma.shop.findFirst({
          where: { ownerId: userId },
        });

        if (!shop) {
          throw new Error('No shop found for this user');
        }
        targetShopId = shop.id;
      }

      if (!targetShopId) {
        throw new Error('Valid shop ID could not be determined');
      }

      // Filter out invalid fields and only keep valid Customer model fields
      const { email, measurements, ...validCustomerData } = data;
      
      // Create customer with only valid fields
      const customer = await this.prisma.customer.create({
        data: {
          ...validCustomerData,
          shopId: targetShopId,
        },
      });

      // TODO: Handle measurements separately if needed
      // For now, we'll just create the customer without measurements
      // Measurements can be added later when creating orders/clothes
      
      return customer;
    } catch (error) {
      console.error('Customer service error:', error);
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('A customer with this mobile number already exists');
      }
      throw new InternalServerErrorException(error.message || 'Failed to create customer');
    }
  }

  async findByUser(userId: string) {
    try {
      // First, get all shops owned by the user
      const shops = await this.prisma.shop.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });

      if (!shops || shops.length === 0) {
        throw new Error('No shops found for this user');
      }

      // Get all shop IDs
      const shopIds = shops.map(shop => shop.id);

      // Find all customers from all shops owned by the user, excluding soft-deleted ones
      const customers = await this.prisma.customer.findMany({
        where: {
          shopId: {
            in: shopIds
          },
          deletedAt: null, // Exclude soft-deleted customers
        },
        include: {
          measurements: true,
          orders: true,
          shop: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

    
      return customers;
    } catch (error) {
      console.error('Find customers error:', error);
      throw new InternalServerErrorException('Failed to fetch customers');
    }
  }

  async findById(id: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id, deletedAt: null }, // Exclude soft-deleted customers
        include: {
          measurements: true,
          orders: true,
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    } catch (error) {
      console.error('Find customer by ID error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to fetch customer');
    }
  }

  async softDelete(id: string) {
    try {
      // Soft delete the customer itself
      const customer = await this.prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete related orders of this customer
      await this.prisma.order.updateMany({
        where: { customerId: id },
        data: { deletedAt: new Date() },
      });

      return customer;
    } catch (error) {
      console.error('Soft delete customer error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to soft delete customer');
    }
  }

  async update(id: string, data: { name?: string; mobileNumber?: string; address?: string }) {
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          name: data.name,
          mobileNumber: data.mobileNumber,
          address: data.address,
        },
      });
    } catch (error) {
      console.error('Update customer error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to update customer');
    }
  }

  async findAll() {
    try {
      // Return all customers, excluding soft-deleted ones
      return await this.prisma.customer.findMany({
        where: { deletedAt: null },
        include: {
          measurements: true,
          orders: true,
          shop: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Find all customers error:', error);
      throw new InternalServerErrorException('Failed to fetch all customers');
    }
  }

  async findByShop(shopId: string) {
    try {
      return await this.prisma.customer.findMany({
        where: { shopId, deletedAt: null },
        include: {
          measurements: true,
          orders: true,
          shop: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch customers for shop');
    }
  }
}
