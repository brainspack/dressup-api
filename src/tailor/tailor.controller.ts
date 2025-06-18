import { Controller, Post, Get, Body, UseGuards, Request, InternalServerErrorException, Query, Delete, Param, Patch } from '@nestjs/common';
import { TailorService } from './tailor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RoleGuard } from '../auth/role.guard';

@Controller('tailors')
@UseGuards(JwtAuthGuard, RoleGuard)
export class TailorController {
  constructor(private readonly tailorService: TailorService) {}

  @Post()
  @Roles(Role.SHOP_OWNER)
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

  @Get()
  @Roles(Role.SHOP_OWNER)
  async getTailors(@Request() req, @Query('shopId') shopId?: string) {
    try {
      if (shopId) {
        const tailors = await this.tailorService.findByShop(shopId);
        console.log('Found tailors:', tailors);
        return tailors;
      } else {
        const userShop = await this.tailorService.getShopByOwner(req.user.userId);
        if (!userShop) {
          throw new Error('No shop found for this user');
        }
        const tailors = await this.tailorService.findByShop(userShop.id);
        console.log('Found tailors:', tailors);
        return tailors;
      }
    } catch (error) {
      console.error('Get tailors error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to fetch tailors');
    }
  }

  @Delete(':id')
  @Roles(Role.SHOP_OWNER)
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
  @Roles(Role.SHOP_OWNER)
  async updateTailor(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.tailorService.update(id, data);
    } catch (error) {
      console.error('Update tailor error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to update tailor');
    }
  }
}
