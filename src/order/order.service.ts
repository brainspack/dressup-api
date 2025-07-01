import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(dto: any) {
    try {
      // Convert date strings to Date objects for Prisma
      const orderDate = new Date(dto.orderDate);
      const deliveryDate = dto.deliveryDate ? new Date(dto.deliveryDate) : null;

      const order = await this.prisma.order.create({
        data: {
          customerId: dto.customerId,
          shopId: dto.shopId,
          tailorName: dto.tailorName,
          tailorNumber: dto.tailorNumber,
          status: dto.status,
          orderDate: orderDate, // Use the converted Date object
          deliveryDate: deliveryDate, // Use the converted Date object or null
          clothes: {
            create: (dto.clothes || []).map(({ materialCost, measurements, ...cloth }: any) => cloth),
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
      return order;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderById(id: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id, deletedAt: null },
        include: {
          clothes: true,
          costs: true,
          customer: true,
          measurements: true, // Keep this for backward compatibility
        },
      });

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

  async getAllOrders() {
    try {
      const orders = await this.prisma.order.findMany({
        where: { deletedAt: null },
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
      return await this.prisma.order.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new Error(`Failed to soft delete order: ${error.message}`);
    }
  }
}
