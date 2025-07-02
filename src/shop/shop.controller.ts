import { Controller, Post, Get, Body, UseGuards, Request, Param, Delete, Patch } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { SetMetadata } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('shops')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService, private readonly prisma: PrismaService) {}

  @Post('create')
  @SetMetadata('roles', ['SUPER_ADMIN', 'SHOP_OWNER'])
  async createShop(@Body() shopData: any, @Request() req) {
    return this.shopService.create(shopData, req.user.userId);
  }

  @Get('my-shops')
  @SetMetadata('roles', ['SUPER_ADMIN', 'SHOP_OWNER'])
  async getShops(@Request() req) {
    // Find by ownerId
    let shops = await this.shopService.findByOwner(req.user.userId);
    // If no shops found, try by phone
    if (!shops || shops.length === 0) {
      const user = await this.prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user) {
        shops = await this.prisma.shop.findMany({
          where: { phone: user.mobileNumber, deletedAt: null },
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
          }
        });
      }
    }
    return shops;
  }

  // New API to get single shop by ID
  @Get(':id')
  @SetMetadata('roles', ['SUPER_ADMIN', 'SHOP_OWNER'])
  async getShopById(@Param('id') id: string, @Request() req) {
    return this.shopService.findById(id);
  }

  // New API to get all shops
  @Get()
  @SetMetadata('roles', ['SUPER_ADMIN']) // Only SUPER_ADMIN can view all shops
  async getAllShops() {
    return this.shopService.findAll();
  }

  @Delete(':id') // New DELETE endpoint for soft delete
  @SetMetadata('roles', ['SUPER_ADMIN', 'SHOP_OWNER']) // Only SUPER_ADMIN and SHOP_OWNER can soft delete shops
  async softDeleteShop(@Param('id') id: string) {
    return this.shopService.softDelete(id);
  }

  @Patch(':id')
  @SetMetadata('roles', ['SUPER_ADMIN', 'SHOP_OWNER'])
  async updateShop(@Param('id') id: string, @Body() data: any) {
    return this.shopService.update(id, data);
  }
}
