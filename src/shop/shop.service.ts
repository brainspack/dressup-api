import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, ownerId: string) {
    try {
      if (!data.name) {
        throw new Error('Shop name is required');
      }
      if (!data.phone) {
        throw new Error('Phone number is required');
      }
      if (!data.address) {
        throw new Error('Address is required');
      }
      
      return await this.prisma.shop.create({
        data: { 
          name: data.name,
          phone: data.phone,
          address: data.address,
          isActive: data.isActive ?? true,
          ownerId 
        },
      });
    } catch (error) {
      console.error('Shop creation error:', error);
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('A shop with this phone number already exists');
      }
      if (error.code === 'P2003') {
        throw new InternalServerErrorException('Invalid owner ID');
      }
      throw new InternalServerErrorException(error.message || 'Failed to create shop');
    }
  }

  async findByOwner(ownerId: string) {
    try {
      console.log(`Fetching shops for ownerId: ${ownerId}`);
      const shops = await this.prisma.shop.findMany({
        where: { ownerId, deletedAt: null },
        include: {
          customers: true,
          tailors: true,
          orders: true,
          owner: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
              role: true
            }
          }
        },
      });
      console.log(`Found ${shops.length} shops for ownerId: ${ownerId}`);
      return shops;
    } catch (error) {
      console.error('Find shops error:', error);
      throw new InternalServerErrorException('Failed to fetch shops');
    }
  }

  // New method to find shop by ID
  async findById(id: string) {
    try {
      const shop = await this.prisma.shop.findUnique({
        where: { id, deletedAt: null }, // Exclude soft-deleted shops
        include: {
          customers: {
            where: { deletedAt: null }, // Include only active customers
          },
          tailors: {
            where: { deletedAt: null }, // Include only active tailors
          },
          orders: {
            where: { deletedAt: null }, // Include only active orders
          },
          owner: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
              role: true,
            },
          },
        },
      });

      if (!shop) {
        return null;
      }

      // Calculate metrics
      const totalActiveCustomers = shop.customers.length;
      const totalActiveTailors = shop.tailors.length;
      const totalOrders = shop.orders.length;
      const deliveredOrders = shop.orders.filter(order => order.status === 'DELIVERED').length;
      const pendingOrders = shop.orders.filter(order => order.status === 'PENDING' || order.status === 'IN_PROGRESS').length;

      return {
        ...shop,
        totalActiveCustomers,
        totalActiveTailors,
        totalOrders,
        deliveredOrders,
        pendingOrders,
        // Remove the direct nested arrays to avoid sending too much data to frontend
        customers: undefined, 
        tailors: undefined, 
        orders: undefined,
      };
    } catch (error) {
      console.error('Find shop by ID error:', error);
      throw new InternalServerErrorException('Failed to fetch shop');
    }
  }

  async findAll() {
    try {
      return await this.prisma.shop.findMany({
        where: { deletedAt: null },
        include: {
          customers: true,
          tailors: true,
          orders: true,
          owner: {
            select: {
              id: true,
              name: true,
              mobileNumber: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Find all shops error:', error);
      throw new InternalServerErrorException('Failed to fetch all shops');
    }
  }

  async softDelete(id: string) {
    try {
      // Soft delete the shop itself
      const shop = await this.prisma.shop.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Soft delete related customers
      await this.prisma.customer.updateMany({
        where: { shopId: id },
        data: { deletedAt: new Date() },
      });

      // Soft delete related tailors
      await this.prisma.tailor.updateMany({
        where: { shopId: id },
        data: { deletedAt: new Date() },
      });

      return shop;
    } catch (error) {
      console.error('Soft delete shop error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to soft delete shop');
    }
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.shop.update({
        where: { id },
        data: {
          name: data.name,
          phone: data.phone,
          address: data.address,
          isActive: data.isActive,
          // Don't update ownerId as it shouldn't change
        },
      });
    } catch (error) {
      console.error('Update shop error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to update shop');
    }
  }
}
