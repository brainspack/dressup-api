import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Measurement, Prisma } from '@prisma/client';

@Injectable()
export class MeasurementService {
  constructor(private prisma: PrismaService) {}

  async create(data: Partial<Measurement>, userId: string) {
    try {
      // Validate required fields
      if (!data.customerId) {
        throw new BadRequestException('Customer ID is required');
      }

      if (!data.clothId) {
        throw new BadRequestException('Cloth ID is required');
      }

      // Create properly typed measurement data using unchecked input
      const measurementData: Prisma.MeasurementUncheckedCreateInput = {
        customerId: data.customerId,
        orderId: data.orderId || null,
        clothId: data.clothId, // ✅ Required field added
        height: data.height ? Number(data.height) : null,
        chest: data.chest ? Number(data.chest) : null,
        waist: data.waist ? Number(data.waist) : null,
        hip: data.hip ? Number(data.hip) : null,
        shoulder: data.shoulder ? Number(data.shoulder) : null,
        sleeveLength: data.sleeveLength ? Number(data.sleeveLength) : null,
        inseam: data.inseam ? Number(data.inseam) : null,
        neck: data.neck ? Number(data.neck) : null,
        armhole: data.armhole ? Number(data.armhole) : null,
        bicep: data.bicep ? Number(data.bicep) : null,
        wrist: data.wrist ? Number(data.wrist) : null,
        outseam: data.outseam ? Number(data.outseam) : null,
        thigh: data.thigh ? Number(data.thigh) : null,
        knee: data.knee ? Number(data.knee) : null,
        calf: data.calf ? Number(data.calf) : null,
        ankle: data.ankle ? Number(data.ankle) : null,
      };

      console.log('Creating measurement with data:', measurementData);

      return await this.prisma.measurement.create({
        data: measurementData,
      });
    } catch (error) {
      console.error('Error creating measurement:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Database error: ' + error.message);
      }
      throw error;
    }
  }

  async findByCustomer(customerId: string) {
    try {
      console.log('Finding measurements for customer:', customerId);
      const measurements = await this.prisma.measurement.findMany({
        where: {
          customerId,
          deletedAt: null, // Only get non-deleted measurements
        },
        orderBy: {
          createdAt: 'desc', // Get most recent first
        },
      });
      console.log('Found measurements:', measurements);
      return measurements;
    } catch (error) {
      console.error('Error finding measurements:', error);
      throw error;
    }
  }

  async findByOrder(orderId: string) {
    try {
      console.log('Finding measurements for order:', orderId);
      const measurements = await this.prisma.measurement.findMany({
        where: {
          orderId,
          deletedAt: null, // Only get non-deleted measurements
        },
      });
      console.log('Found order measurements:', measurements);
      return measurements;
    } catch (error) {
      console.error('Error finding order measurements:', error);
      throw error;
    }
  }
}
