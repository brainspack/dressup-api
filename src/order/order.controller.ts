import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Patch,
    Delete,
    UseGuards,
  } from '@nestjs/common';
  import { OrderService } from './order.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { Roles } from '../auth/roles.decorator';
  import { RoleGuard } from 'src/auth/role.guard';
  
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Controller('orders')
  export class OrderController {
    constructor(private readonly orderService: OrderService) {}
  
    @Post()
    @Roles('SUPER_ADMIN', 'SHOP_OWNER')
    create(@Body() dto: any) {
      return this.orderService.createOrder(dto);
    }
  
    @Get(':id')
    @Roles('SUPER_ADMIN', 'SHOP_OWNER', 'CUSTOMER')
    getById(@Param('id') id: string) {
      return this.orderService.getOrderById(id);
    }
  
    @Get()
    @Roles('SUPER_ADMIN', 'SHOP_OWNER')
    getAll() {
      return this.orderService.getAllOrders();
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
  }
  