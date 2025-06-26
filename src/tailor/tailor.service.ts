import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShopService } from '../shop/shop.service';

@Injectable()
export class TailorService {
  constructor(
    private prisma: PrismaService,
    private shopService: ShopService
  ) {}

  async create(data: { name: string; mobileNumber: string; shopId: string }) {
    try {
      // No need to find the shop by userId; shopId is provided directly
      return await this.prisma.tailor.create({
        data: {
          name: data.name,
          mobileNumber: data.mobileNumber,
          shopId: data.shopId, // Use the provided shopId directly
        },
      });
    } catch (error) {
      console.error('Tailor service error:', error);
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('A tailor with this mobile number already exists');
      }
      throw new InternalServerErrorException(error.message || 'Failed to add tailor');
    }
  }

  async findByShop(shopId: string) {
    try {
      // Directly use the provided shopId to find tailors, excluding soft-deleted ones
      return await this.prisma.tailor.findMany({
        where: { shopId: shopId, deletedAt: null }, // Exclude soft-deleted tailors
      });
    } catch (error) {
      console.error('Find tailors error:', error);
      throw new InternalServerErrorException('Failed to fetch tailors');
    }
  }

  async softDelete(id: string) {
    try {
      return await this.prisma.tailor.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      console.error('Soft delete tailor error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to soft delete tailor');
    }
  }

  async update(id: string, data: { name?: string; mobileNumber?: string }) {
    try {
      return await this.prisma.tailor.update({
        where: { id },
        data: {
          name: data.name,
          mobileNumber: data.mobileNumber,
        },
      });
    } catch (error) {
      console.error('Update tailor error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to update tailor');
    }
  }

  async getShopByOwner(ownerId: string) {
    const shops = await this.shopService.findByOwner(ownerId);
    return shops.length > 0 ? shops[0] : null;
  }

  async findById(id: string) {
    return this.prisma.tailor.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findAll() {
    try {
      // Return all tailors, excluding soft-deleted ones
      return await this.prisma.tailor.findMany({
        where: { deletedAt: null }
        // No orderBy, as createdAt may not exist
      });
    } catch (error) {
      console.error('Find all tailors error:', error);
      throw new InternalServerErrorException('Failed to fetch all tailors');
    }
  }
}
