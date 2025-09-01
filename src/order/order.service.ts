import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(dto: any) {
    try {
      console.log('=== BACKEND: Creating order ===');
      console.log('Received DTO:', JSON.stringify(dto, null, 2));
      console.log('Clothes data:', dto.clothes);
      console.log('🚀 Clothes imageUrls & imageData:', dto.clothes?.map((c: any, index: number) => ({ 
        index, 
        type: c.type, 
        imageUrls: c.imageUrls, 
        imageData: c.imageData,
        imageUrlsLength: c.imageUrls?.length || 0,
        imageDataLength: c.imageData?.length || 0,
        hasImageData: !!(c.imageData && c.imageData.length > 0)
      })));
      
      // 🚀 Detailed imageData logging
      dto.clothes?.forEach((cloth: any, index: number) => {
        if (cloth.imageData && cloth.imageData.length > 0) {
          console.log(`🚀 BACKEND: Cloth ${index} imageData samples:`);
          cloth.imageData.forEach((img: string, imgIndex: number) => {
            console.log(`  Image ${imgIndex}: ${img.substring(0, 50)}...`);
          });
        } else {
          console.log(`❌ BACKEND: Cloth ${index} has NO imageData`);
        }
      });
      
      // Convert date strings to Date objects for Prisma
      const orderDate = new Date(dto.orderDate);
      const deliveryDate = dto.deliveryDate ? new Date(dto.deliveryDate) : null;

      // Calculate total amount as Items + Cloth cost
      // Each cloth may represent either an item (stored with price) or a cloth (stored with materialCost)
      // We add BOTH fields when present to ensure combined total is saved
      const totalAmount = (dto.clothes || []).reduce((sum: number, cloth: any) => {
        const price = typeof cloth.price === 'number' && !isNaN(cloth.price) ? cloth.price : 0;
        const materialCost = typeof cloth.materialCost === 'number' && !isNaN(cloth.materialCost) ? cloth.materialCost : 0;
        return sum + price + materialCost;
      }, 0);

      const order = await this.prisma.order.create({
        data: {
          customerId: dto.customerId,
          shopId: dto.shopId,
          tailorName: dto.tailorName,
          tailorNumber: dto.tailorNumber,
          status: dto.status,
          orderType: dto.orderType || 'STITCHING', // Add orderType field
          notes: dto.notes || null, // Add notes field
          alterationPrice: dto.alterationPrice || null, // Add alteration price
          orderDate: orderDate, // Use the converted Date object
          deliveryDate: deliveryDate, // Use the converted Date object or null
          totalAmount: totalAmount, // Add calculated total amount
          clothes: {
            create: (dto.clothes || []).map((clothData: any) => {
              // Ensure materialCost is a valid number
              const materialCost = typeof clothData.materialCost === 'number' && !isNaN(clothData.materialCost)
                ? clothData.materialCost
                : 0;

              // Ensure price is a valid number
              const price = typeof clothData.price === 'number' && !isNaN(clothData.price)
                ? clothData.price
                : 0;

              return {
                type: clothData.type,
                materialCost: materialCost,
                price: price, // Add price field
                designNotes: clothData.designNotes || '',
                color: clothData.color || null,
                fabric: clothData.fabric || null,
                imageUrls: clothData.imageUrls || [],
                imageData: clothData.imageData || [], // Add imageData field
                videoUrls: clothData.videoUrls || [],
              };
            }),
          },
          
          costs: {
            create: dto.costs || [],
          },
        },
        include: {
          clothes: true, // Include clothes to get their IDs
        },
      });

      // Create measurements separately if they exist, linking each to its corresponding cloth
      if (dto.measurements && dto.measurements.length > 0) {
        // Always save all measurements, even if they have all null values
        for (let i = 0; i < dto.measurements.length; i++) {
          const measurement = dto.measurements[i];
          const correspondingCloth = order.clothes[i]; // Link to the cloth at the same index
          
          if (correspondingCloth) {
            await this.prisma.measurement.create({
              data: {
                customerId: dto.customerId,
                orderId: order.id,
                clothId: correspondingCloth.id, // Link to the specific cloth
                height: measurement.height !== undefined ? measurement.height : null,
                chest: measurement.chest !== undefined ? measurement.chest : null,
                waist: measurement.waist !== undefined ? measurement.waist : null,
                hip: measurement.hip !== undefined ? measurement.hip : null,
                shoulder: measurement.shoulder !== undefined ? measurement.shoulder : null,
                sleeveLength: measurement.sleeveLength !== undefined ? measurement.sleeveLength : null,
                inseam: measurement.inseam !== undefined ? measurement.inseam : null,
                neck: measurement.neck !== undefined ? measurement.neck : null,
                armhole: measurement.armhole !== undefined ? measurement.armhole : null,
                bicep: measurement.bicep !== undefined ? measurement.bicep : null,
                wrist: measurement.wrist !== undefined ? measurement.wrist : null,
                outseam: measurement.outseam !== undefined ? measurement.outseam : null,
                thigh: measurement.thigh !== undefined ? measurement.thigh : null,
                knee: measurement.knee !== undefined ? measurement.knee : null,
                calf: measurement.calf !== undefined ? measurement.calf : null,
                ankle: measurement.ankle !== undefined ? measurement.ankle : null,
              } as any,
            });
          }
        }
      }
      // If order is created directly in DELIVERED state, create a payment entry
      if (dto.status === 'DELIVERED') {
        try {
          const costs = await this.prisma.cost.findMany({ where: { orderId: order.id } });
          const amount = costs.reduce((sum, c) => sum + (c.totalCost ?? 0), 0);
          await (this.prisma as any).payment.create({
            data: {
              shopId: order.shopId,
              orderId: order.id,
              amount,
              paidAt: order.deliveryDate ?? new Date(),
            },
          });
        } catch (err) {
          console.error('Failed to create payment on createOrder:', err);
        }
      }
      return order;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderById(id: string) {
    try {
      console.log('=== BACKEND: Fetching order ===');
      console.log('Order ID:', id);
      
      const order = await this.prisma.order.findUnique({
        where: { id, deletedAt: null },
        include: {
          clothes: true,
          costs: true,
          customer: true,
          measurements: true, // Keep this for backward compatibility
        },
      });

      console.log('=== BACKEND: Raw order data ===');
      console.log('Order:', order);
      console.log('Order clothes:', order?.clothes);
      console.log('Order clothes imageUrls:', order?.clothes?.map((c: any) => ({
        type: c.type,
        imageUrls: c.imageUrls,
        imageData: c.imageData,
        imageUrlsLength: c.imageUrls?.length || 0,
        imageDataLength: c.imageData?.length || 0
      })));

      // Manually fetch measurements and link them to clothes
      if (order) {
        const measurements = await this.prisma.measurement.findMany({
          where: { orderId: id },
        });


        // Group measurements by clothId
        const measurementsByClothId = measurements.reduce((acc, measurement) => {
          const clothId = (measurement as any).clothId;
          if (clothId) {
            if (!acc[clothId]) {
              acc[clothId] = [];
            }
            acc[clothId].push(measurement);
          }
          return acc;
        }, {} as Record<string, any[]>);

      

        // Transform the data to nest measurements within clothes
        const result = {
          ...order,
          clothes: order.clothes.map(cloth => ({
            ...cloth,
            measurements: measurementsByClothId[cloth.id] || [],
          })),
        };

    
        return result;
      }
      return order;
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  async getAllOrders(status?: string) {
    try {
      const whereClause: any = { deletedAt: null };
      if (status && status !== 'all') {
        whereClause.status = status.toUpperCase();
      }

      const orders = await this.prisma.order.findMany({
        where: whereClause,
        include: {
          clothes: true,
          costs: true,
          customer: true,
          measurements: true, // Keep this for backward compatibility
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the data to nest measurements within clothes for each order
      return Promise.all(orders.map(async (order) => {
        const measurements = await this.prisma.measurement.findMany({
          where: { orderId: order.id },
        });

        // Group measurements by clothId
        const measurementsByClothId = measurements.reduce((acc, measurement) => {
          const clothId = (measurement as any).clothId;
          if (clothId) {
            if (!acc[clothId]) {
              acc[clothId] = [];
            }
            acc[clothId].push(measurement);
          }
          return acc;
        }, {} as Record<string, any[]>);

        return {
          ...order,
          clothes: (order as any).clothes.map((cloth: any) => ({
            ...cloth,
            measurements: measurementsByClothId[cloth.id] || [],
          })),
        };
      }));
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  async getAllOrdersByShop(shopId: string, status?: string) {
    try {
      const whereClause: any = { deletedAt: null, shopId };
      if (status && status !== 'all') {
        whereClause.status = status.toUpperCase();
      }

      const orders = await this.prisma.order.findMany({
        where: whereClause,
        include: {
          clothes: true,
          costs: true,
          customer: true,
          measurements: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return Promise.all(orders.map(async (order) => {
        const measurements = await this.prisma.measurement.findMany({ where: { orderId: order.id } });
        const measurementsByClothId = measurements.reduce((acc, measurement) => {
          const clothId = (measurement as any).clothId;
          if (clothId) {
            if (!acc[clothId]) acc[clothId] = [];
            acc[clothId].push(measurement);
          }
          return acc;
        }, {} as Record<string, any[]>);

        return {
          ...order,
          clothes: (order as any).clothes.map((cloth: any) => ({
            ...cloth,
            measurements: measurementsByClothId[cloth.id] || [],
          })),
        };
      }));
    } catch (error) {
      throw new Error(`Failed to fetch orders by shop: ${error.message}`);
    }
  }

  async updateOrder(id: string, dto: any) {
    try {
      // Start a Prisma transaction to ensure atomicity
      const updatedOrder = await this.prisma.$transaction(async (prisma) => {
        // 1. Convert date strings to Date objects for Prisma
        const orderDate = dto.orderDate ? new Date(dto.orderDate) : undefined;
        const deliveryDate = dto.deliveryDate ? new Date(dto.deliveryDate) : undefined;

        // 2. Update the main Order record (only update provided fields)
        const order = await prisma.order.update({
          where: { id },
          data: {
            ...(dto.tailorName !== undefined && { tailorName: dto.tailorName }),
            ...(dto.tailorNumber !== undefined && { tailorNumber: dto.tailorNumber }),
            ...(dto.status !== undefined && { status: dto.status }),
            ...(dto.orderType !== undefined && { orderType: dto.orderType }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
            ...(dto.alterationPrice !== undefined && { alterationPrice: dto.alterationPrice }),
            ...(orderDate !== undefined && { orderDate }),
            ...(deliveryDate !== undefined && { deliveryDate }),
            // customerId and shopId are not updated here as they are typically set once
          },
        });

        // 3. Handle Measurements updates ONLY if provided
        if (dto.measurements) {
          await prisma.measurement.deleteMany({ where: { orderId: id } });
        }

        // 4. Handle Clothes updates ONLY if provided
        if (dto.clothes) {
          await prisma.cloth.deleteMany({ where: { orderId: id } });
          for (const cloth of dto.clothes) {
            const { measurements, ...clothData } = cloth;
            await prisma.cloth.create({
              data: {
                ...clothData,
                orderId: order.id,
              },
            });
          }
        }

        // 5. Handle Costs updates ONLY if provided
        if (dto.costs) {
          await prisma.cost.deleteMany({ where: { orderId: id } });
          if (dto.costs.length > 0) {
            await prisma.cost.createMany({
              data: dto.costs.map((cost: any) => ({
                ...cost,
                orderId: order.id,
              })),
            });
          }
        }

        // 6. Create new measurements after clothes are created ONLY if provided
        if (dto.measurements && dto.measurements.length > 0) {
          const createdClothes = await prisma.cloth.findMany({
            where: { orderId: order.id },
            orderBy: { createdAt: 'asc' },
          });
          for (let i = 0; i < dto.measurements.length; i++) {
            const measurement = dto.measurements[i];
            const correspondingCloth = createdClothes[i];
            if (correspondingCloth) {
              await prisma.measurement.create({
                data: {
                  customerId: order.customerId,
                  orderId: order.id,
                  clothId: correspondingCloth.id,
                  height: measurement.height !== undefined ? measurement.height : null,
                  chest: measurement.chest !== undefined ? measurement.chest : null,
                  waist: measurement.waist !== undefined ? measurement.waist : null,
                  hip: measurement.hip !== undefined ? measurement.hip : null,
                  shoulder: measurement.shoulder !== undefined ? measurement.shoulder : null,
                  sleeveLength: measurement.sleeveLength !== undefined ? measurement.sleeveLength : null,
                  inseam: measurement.inseam !== undefined ? measurement.inseam : null,
                  neck: measurement.neck !== undefined ? measurement.neck : null,
                  armhole: measurement.armhole !== undefined ? measurement.armhole : null,
                  bicep: measurement.bicep !== undefined ? measurement.bicep : null,
                  wrist: measurement.wrist !== undefined ? measurement.wrist : null,
                  outseam: measurement.outseam !== undefined ? measurement.outseam : null,
                  thigh: measurement.thigh !== undefined ? measurement.thigh : null,
                  knee: measurement.knee !== undefined ? measurement.knee : null,
                  calf: measurement.calf !== undefined ? measurement.calf : null,
                  ankle: measurement.ankle !== undefined ? measurement.ankle : null,
                } as any,
              });
            }
          }
        }

        // 7. If status moved to DELIVERED, create a Payment entry for analytics
        if (dto.status === 'DELIVERED') {
          try {
            const finalOrder = await prisma.order.findUnique({ where: { id } });
            if (finalOrder) {
              // Sum costs for amount
              const costs = await prisma.cost.findMany({ where: { orderId: id } });
              const amount = costs.reduce((sum, c) => sum + (c.totalCost ?? 0), 0);
              const exists = await (prisma as any).payment.findFirst({ where: { orderId: finalOrder.id } });
              if (!exists) {
                await (prisma as any).payment.create({
                  data: {
                    shopId: finalOrder.shopId,
                    orderId: finalOrder.id,
                    amount: amount,
                    paidAt: deliveryDate ?? new Date(),
                  },
                });
              } else {
                await (prisma as any).payment.update({ where: { id: exists.id }, data: { amount, paidAt: deliveryDate ?? new Date() } });
              }
            }
          } catch (err) {
            console.error('Failed to create payment record:', err);
          }
        }

        return order;
      });
      return updatedOrder;
    } catch (error: any) {
      console.error('Error in updateOrder:', error);
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

  async softDeleteOrder(id: string) {
    try {
      console.log(`⚠️  EXPLICIT ORDER DELETION: Order ${id} being deleted by user action`);
      return await this.prisma.order.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Failed to soft delete order: ${error.message}`);
    }
  }

  async assignOrderToTailor(orderId: string, tailorId: string) {
    try {
      // Get tailor details
      const tailor = await this.prisma.tailor.findUnique({
        where: { id: tailorId },
      });

      if (!tailor) {
        throw new Error('Tailor not found');
      }

      // Update order with assignment
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          assignedTo: tailorId,
          assignedAt: new Date(),
          tailorName: tailor.name,
          tailorNumber: tailor.mobileNumber,
        },
      });

      // Activate tailor if this is their first order assignment
      if (tailor.status === 'INACTIVE') {
        await this.prisma.tailor.update({
          where: { id: tailorId },
          data: { status: 'ACTIVE' },
        });
        console.log(`Tailor ${tailor.name} activated after first order assignment`);
      }

      return order;
    } catch (error) {
      throw new Error(`Failed to assign order: ${error.message}`);
    }
  }

  async unassignOrder(orderId: string) {
    try {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          assignedTo: null,
          assignedAt: null,
          tailorName: null,
          tailorNumber: null,
        },
      });
      return order;
    } catch (error) {
      throw new Error(`Failed to unassign order: ${error.message}`);
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      console.log(`🚀 Updating order ${orderId} status to ${status}`);
      
      // Validate and convert status to enum
      const statusMapping: Record<string, OrderStatus> = {
        'PENDING': OrderStatus.PENDING,
        'IN_PROGRESS': OrderStatus.IN_PROGRESS,
        'DELIVERED': OrderStatus.DELIVERED,
        'CANCELLED': OrderStatus.CANCELLED,
      };
      
      const upperStatus = status.toUpperCase();
      const orderStatus = statusMapping[upperStatus];
      
      if (!orderStatus) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${Object.keys(statusMapping).join(', ')}`);
      }
      
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: orderStatus,
        },
        include: {
          clothes: true,
          costs: true,
          customer: true,
        },
      });
      
      console.log(`✅ Order status updated successfully`);
      return order;
    } catch (error) {
      console.error(`❌ Failed to update order status:`, error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  async getAssignedOrdersForTailor(tailorId: string) {
    try {
      console.log(`🚀 Fetching assigned orders for tailor: ${tailorId}`);
      
      const orders = await this.prisma.order.findMany({
        where: {
          assignedTo: tailorId,
          deletedAt: null,
          status: {
            notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
          }
        },
        include: {
          clothes: true,
          costs: true,
          customer: true,
          measurements: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`✅ Found ${orders.length} assigned orders for tailor ${tailorId}`);
      return orders;
    } catch (error) {
      console.error(`❌ Failed to fetch assigned orders:`, error);
      throw new Error(`Failed to fetch assigned orders: ${error.message}`);
    }
  }

  // 🚀 ANALYTICS METHODS

  async getOrderTypeAnalytics(shopId?: string, dateRange?: string) {
    try {
      let whereClause: any = { deletedAt: null };
      
      if (shopId) {
        whereClause.shopId = shopId;
      }

      // Add date filtering if provided
      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        whereClause.createdAt = {
          gte: startDate
        };
      }

      const orders = await this.prisma.order.findMany({
        where: whereClause,
        select: {
          orderType: true,
          status: true,
          totalAmount: true,
          alterationPrice: true,
          createdAt: true
        }
      });

      const analytics = {
        total: orders.length,
        stitching: {
          count: orders.filter(o => o.orderType === 'STITCHING').length,
          revenue: orders
            .filter(o => o.orderType === 'STITCHING')
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        },
        alteration: {
          count: orders.filter(o => o.orderType === 'ALTERATION').length,
          revenue: orders
            .filter(o => o.orderType === 'ALTERATION')
            .reduce((sum, o) => sum + (o.alterationPrice || 0), 0)
        },
        byStatus: {
          pending: orders.filter(o => o.status === 'PENDING').length,
          inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
          delivered: orders.filter(o => o.status === 'DELIVERED').length,
          cancelled: orders.filter(o => o.status === 'CANCELLED').length
        }
      };

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get order type analytics: ${error.message}`);
    }
  }

  async getOrderStatusAnalytics(shopId?: string, dateRange?: string) {
    try {
      let whereClause: any = { deletedAt: null };
      
      if (shopId) {
        whereClause.shopId = shopId;
      }

      const orders = await this.prisma.order.findMany({
        where: whereClause,
        select: {
          status: true,
          orderType: true,
          totalAmount: true,
          alterationPrice: true
        }
      });

      const statusAnalytics = orders.reduce((acc: any, order) => {
        const status = order.status;
        if (!acc[status]) {
          acc[status] = { count: 0, revenue: 0 };
        }
        acc[status].count++;
        
        if (order.orderType === 'STITCHING') {
          acc[status].revenue += order.totalAmount || 0;
        } else {
          acc[status].revenue += order.alterationPrice || 0;
        }
        
        return acc;
      }, {});

      return statusAnalytics;
    } catch (error) {
      throw new Error(`Failed to get order status analytics: ${error.message}`);
    }
  }

  async getMonthlyRevenue(shopId?: string, year?: string) {
    try {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      
      let whereClause: any = {
        deletedAt: null,
        createdAt: {
          gte: new Date(targetYear, 0, 1),
          lt: new Date(targetYear + 1, 0, 1)
        }
      };
      
      if (shopId) {
        whereClause.shopId = shopId;
      }

      const orders = await this.prisma.order.findMany({
        where: whereClause,
        select: {
          createdAt: true,
          orderType: true,
          totalAmount: true,
          alterationPrice: true,
          status: true
        }
      });

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        stitching: { count: 0, revenue: 0 },
        alteration: { count: 0, revenue: 0 },
        total: { count: 0, revenue: 0 }
      }));

      orders.forEach(order => {
        const month = order.createdAt.getMonth();
        const revenue = order.orderType === 'STITCHING' 
          ? (order.totalAmount || 0) 
          : (order.alterationPrice || 0);

        if (order.orderType === 'STITCHING') {
          monthlyData[month].stitching.count++;
          monthlyData[month].stitching.revenue += revenue;
        } else {
          monthlyData[month].alteration.count++;
          monthlyData[month].alteration.revenue += revenue;
        }

        monthlyData[month].total.count++;
        monthlyData[month].total.revenue += revenue;
      });

      return {
        year: targetYear,
        data: monthlyData
      };
    } catch (error) {
      throw new Error(`Failed to get monthly revenue: ${error.message}`);
    }
  }
}
