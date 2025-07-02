import { Controller, Post, Get, Body, UseGuards, Request, InternalServerErrorException, Query, Delete, Param, Patch } from '@nestjs/common';
import { TailorService } from './tailor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleGuard } from '../auth/role.guard';

@Controller('tailors')
@UseGuards(JwtAuthGuard, RoleGuard)
export class TailorController {
  constructor(private readonly tailorService: TailorService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  async createTailor(@Body() tailorData: any) {
    try {
      if (!tailorData.name || !tailorData.mobileNumber || !tailorData.shopId) {
        throw new Error('Name, mobile number, and shop ID are required');
      }
      return await this.tailorService.create(tailorData);
    } catch (error) {
      console.error('Tailor creation error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to add tailor');
    }
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  async softDeleteTailor(@Param('id') id: string) {
    try {
      await this.tailorService.softDelete(id);
      return { message: 'Tailor soft-deleted successfully' };
    } catch (error) {
      console.error('Soft delete tailor error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to soft delete tailor');
    }
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  async updateTailor(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.tailorService.update(id, data);
    } catch (error) {
      console.error('Update tailor error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to update tailor');
    }
  }

  @Get(':id')
  async getTailorById(@Param('id') id: string) {
    try {
      return await this.tailorService.findById(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to fetch tailor');
    }
  }

  @Get()
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  async getAllTailors() {
    return this.tailorService.findAll();
  }

  @Get('by-shop/:shopId')
  async getTailorsByShop(@Param('shopId') shopId: string) {
    try {
      return await this.tailorService.findByShop(shopId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch tailors for shop');
    }
  }
}
