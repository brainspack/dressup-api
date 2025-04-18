import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
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
    return this.shopService.create(shopData, req.user.id);
  }

  @Get('my-shops')
  @SetMetadata('roles', [Role.SHOP_OWNER])
  async getShops(@Request() req) {
    return this.shopService.findByOwner(req.user.id);
  }
}
