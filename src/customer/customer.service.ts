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
      console.log(`[CustomerService] Finding customers for user: ${userId}`);
      // First, get all shops owned by the user
      const shops = await this.prisma.shop.findMany({
        where: { ownerId: userId },
        select: { id: true }
      });

      console.log(`[CustomerService] Found ${shops?.length || 0} shops for user: ${userId}`);

      if (!shops || shops.length === 0) {
        console.log(`No shops found for user ${userId}, returning empty customer list`);
        return [];
      }

      // Get all shop IDs
      const shopIds = shops.map(shop => shop.id);
      console.log(`[CustomerService] Shop IDs: ${shopIds.join(', ')}`);

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

      console.log(`[CustomerService] Found ${customers.length} customers for user: ${userId}`);
      return customers;
    } catch (error) {
      console.error('[CustomerService] Find customers error:', error);
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

      // ❌ REMOVED: Do NOT automatically delete related orders
      // Orders should only be deleted explicitly by user action
      // await this.prisma.order.updateMany({
      //   where: { customerId: id },
      //   data: { deletedAt: new Date() },
      // });

      console.log(`Customer ${id} soft-deleted, but orders preserved`);
      return customer;
    } catch (error) {
      console.error('Soft delete customer error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to soft delete customer');
    }
  }

  async update(id: string, data: { name?: string; mobileNumber?: string; address?: string }) {
    try {
      console.log(`[CustomerService] Updating customer ${id} with data:`, data);
      const result = await this.prisma.customer.update({
        where: { id },
        data: {
          name: data.name,
          mobileNumber: data.mobileNumber,
          address: data.address,
        },
      });
      console.log(`[CustomerService] Customer update result:`, result);
      return result;
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

  async checkUserShopStatus(userId: string) {
    try {
      const shops = await this.prisma.shop.findMany({
        where: { ownerId: userId },
        select: { 
          id: true, 
          name: true, 
          phone: true, 
          address: true,
          isActive: true 
        }
      });

      return {
        hasShops: shops.length > 0,
        shopCount: shops.length,
        shops: shops,
        message: shops.length > 0 
          ? `User has ${shops.length} shop(s)` 
          : 'No shops found. Please create a shop first to manage customers.'
      };
    } catch (error) {
      console.error('[CustomerService] Check user shop status error:', error);
      throw new InternalServerErrorException('Failed to check user shop status');
    }
  }
}
