import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Patch,
    Delete,
    Put,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { OrderService } from './order.service';
  import { OutfitService } from './outfit.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { Roles } from '../auth/roles.decorator';
  import { RoleGuard } from '../auth/role.guard';
  
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Controller('orders')
  export class OrderController {
    constructor(
      private readonly orderService: OrderService,
      private readonly outfitService: OutfitService
    ) {}
  
    @Post()
    @Roles('SUPER_ADMIN', 'SHOP_OWNER')
    create(@Body() dto: any) {
      return this.orderService.createOrder(dto);
    }

    // Outfit-related endpoints
    @Get('outfits/all')
    @Roles('SUPER_ADMIN', 'SHOP_OWNER')
    getAllOutfits() {
      return this.outfitService.getAllOutfitTypes();
    }

    @Get('outfits/gender/:gender')
    @Roles('SUPER_ADMIN', 'SHOP_OWNER')
    getOutfitsByGender(@Param('gender') gender: 'female' | 'male') {
      return this.outfitService.getOutfitTypesByGender(gender);
    }

    @Get('outfits/name/:name')
    @Roles('SUPER_ADMIN', 'SHOP_OWNER')
    getOutfitByName(@Param('name') name: string) {
      return this.outfitService.getOutfitTypeByName(name);
    }
  
    @Get(':id')
    @Roles('SUPER_ADMIN', 'SHOP_OWNER', 'CUSTOMER')
    getById(@Param('id') id: string) {
      return this.orderService.getOrderById(id);
    }
  
      @Get()
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  getAll(@Query('shopId') shopId?: string, @Query('status') status?: string) {
    if (shopId) {
      return this.orderService.getAllOrdersByShop(shopId, status);
    }
    return this.orderService.getAllOrders(status);
  }
  
    @Patch(':id')
    @Roles('SUPER_ADMIN', 'SHOP_OWNER')
    update(@Param('id') id: string, @Body() dto: any) {
      return this.orderService.updateOrder(id, dto);
    }
  
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  softDelete(@Param('id') id: string) {
    return this.orderService.softDeleteOrder(id);
  }

  @Post(':id/assign')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  assignOrder(@Param('id') id: string, @Body() dto: { tailorId: string }) {
    return this.orderService.assignOrderToTailor(id, dto.tailorId);
  }

  @Post(':id/unassign')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  unassignOrder(@Param('id') id: string) {
    return this.orderService.unassignOrder(id);
  }

  @Put(':id/status')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  updateOrderStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.orderService.updateOrderStatus(id, dto.status);
  }

  @Get('assigned/:tailorId')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  getAssignedOrders(@Param('tailorId') tailorId: string) {
    return this.orderService.getAssignedOrdersForTailor(tailorId);
  }
}
  