import { Controller, Post, Get, Body, UseGuards, Request, Param, Delete, Patch } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

@Controller('shops')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('create')
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.SHOP_OWNER])
  async createShop(@Body() shopData: any, @Request() req) {
    return this.shopService.create(shopData, req.user.userId);
  }

  @Get('my-shops')
  @SetMetadata('roles', [Role.SHOP_OWNER])
  async getShops(@Request() req) {
    return this.shopService.findByOwner(req.user.userId);
  }

  // New API to get single shop by ID
  @Get(':id')
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.SHOP_OWNER])
  async getShopById(@Param('id') id: string, @Request() req) {
    return this.shopService.findById(id);
  }

  // New API to get all shops
  @Get()
  @SetMetadata('roles', [Role.SUPER_ADMIN]) // Only SUPER_ADMIN can view all shops
  async getAllShops() {
    return this.shopService.findAll();
  }

  @Delete(':id') // New DELETE endpoint for soft delete
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.SHOP_OWNER]) // Only SUPER_ADMIN and SHOP_OWNER can soft delete shops
  async softDeleteShop(@Param('id') id: string) {
    return this.shopService.softDelete(id);
  }

  @Patch(':id')
  @SetMetadata('roles', [Role.SUPER_ADMIN, Role.SHOP_OWNER])
  async updateShop(@Param('id') id: string, @Body() data: any) {
    return this.shopService.update(id, data);
  }
}
