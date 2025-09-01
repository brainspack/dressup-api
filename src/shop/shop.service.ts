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
      // Map owner.role to string if it's an object
      const mappedShops = shops.map(shop => ({
        ...shop,
        owner: shop.owner ? {
          ...shop.owner,
          role: typeof shop.owner.role === 'object' && shop.owner.role !== null ? shop.owner.role.name : shop.owner.role
        } : null
      }));
      console.log(`Found ${mappedShops.length} shops for ownerId: ${ownerId}`);
      return mappedShops;
    } catch (error) {
      console.error('Find shops error:', error);
      throw new InternalServerErrorException('Failed to fetch shops');
    }
  }

  // New method to find shop by ID
  async findById(id: string) {
    try {
      const shop = await this.prisma.shop.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          isActive: true,
          createdAt: true,
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

      // Calculate metrics via counts to avoid sending large arrays
      const [
        totalTailors,
        totalActiveTailors,
        totalInactiveTailors,
        totalCustomers,
        deliveredCustomers,
        inProgressCustomers,
        pendingCustomers,
        totalOrders,
        deliveredOrders,
        totalActiveOrders,
      ] = await Promise.all([
        this.prisma.tailor.count({ where: { shopId: id, deletedAt: null } }),
        this.prisma.tailor.count({ where: { shopId: id, deletedAt: null, status: 'ACTIVE' } }),
        this.prisma.tailor.count({ where: { shopId: id, deletedAt: null, status: 'INACTIVE' } }),
        this.prisma.customer.count({ where: { shopId: id, deletedAt: null } }),
        // Count customers with delivered orders
        this.prisma.customer.count({ 
          where: { 
            shopId: id, 
            deletedAt: null,
            orders: {
              some: {
                status: 'DELIVERED',
                deletedAt: null
              }
            }
          } 
        }),
        // Count customers with in-progress orders
        this.prisma.customer.count({ 
          where: { 
            shopId: id, 
            deletedAt: null,
            orders: {
              some: {
                status: 'IN_PROGRESS',
                deletedAt: null
              }
            }
          } 
        }),
        // Count customers with pending orders
        this.prisma.customer.count({ 
          where: { 
            shopId: id, 
            deletedAt: null,
            orders: {
              some: {
                status: 'PENDING',
                deletedAt: null
              }
            }
          } 
        }),
        this.prisma.order.count({ where: { shopId: id, deletedAt: null } }),
        this.prisma.order.count({ where: { shopId: id, deletedAt: null, status: 'DELIVERED' } }),
        this.prisma.order.count({ where: { shopId: id, deletedAt: null, OR: [{ status: 'PENDING' }, { status: 'IN_PROGRESS' }] } }),
      ]);

      const inactiveTailors = totalInactiveTailors;
      // Active customers are those with in-progress orders
      const totalActiveCustomers = inProgressCustomers;
      // Inactive customers are those with pending orders  
      const inactiveCustomers = pendingCustomers;
      const pendingOrders = totalActiveOrders; // synonymous in our definition

      // Map owner.role to string if it's an object
      const mappedOwner = shop.owner ? {
        ...shop.owner,
        role: typeof shop.owner.role === 'object' && shop.owner.role !== null ? shop.owner.role.name : shop.owner.role
      } : null;

      return {
        ...shop,
        totalTailors,
        totalActiveTailors,
        inactiveTailors,
        totalCustomers,
        totalActiveCustomers,
        inactiveCustomers,
        deliveredCustomers,
        inProgressCustomers,
        pendingCustomers,
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalActiveOrders,
        owner: mappedOwner,
      };
    } catch (error) {
      console.error('Find shop by ID error:', error);
      throw new InternalServerErrorException('Failed to fetch shop');
    }
  }

  async findAll() {
    try {
      const shops = await this.prisma.shop.findMany({
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
      // Map owner.role to string if it's an object
      return shops.map(shop => ({
        ...shop,
        owner: shop.owner ? {
          ...shop.owner,
          role: typeof shop.owner.role === 'object' && shop.owner.role !== null ? shop.owner.role.name : shop.owner.role
        } : null
      }));
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

      // ❌ REMOVED: Do NOT automatically delete related entities
      // This was causing cascade deletions that deleted orders unintentionally
      // Only delete the shop itself, not related customers/tailors/orders
      
      // // Soft delete related customers
      // await this.prisma.customer.updateMany({
      //   where: { shopId: id },
      //   data: { deletedAt: new Date() },
      // });

      // // Soft delete related tailors
      // await this.prisma.tailor.updateMany({
      //   where: { shopId: id },
      //   data: { deletedAt: new Date() },
      // });

      console.log(`Shop ${id} soft-deleted, but customers/tailors/orders preserved`);
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
