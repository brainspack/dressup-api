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
  import { Role } from '@prisma/client';
  import { Roles } from '../auth/roles.decorator';
  import { RoleGuard } from 'src/auth/role.guard';
  
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Controller('orders')
  export class OrderController {
    constructor(private readonly orderService: OrderService) {}
  
    @Post()
    @Roles(Role.SHOP_OWNER)
    create(@Body() dto: any) {
      return this.orderService.createOrder(dto);
    }
  
    @Get(':id')
    @Roles(Role.SHOP_OWNER, Role.CUSTOMER)
    getById(@Param('id') id: string) {
      return this.orderService.getOrderById(id);
    }
  
    @Get()
    @Roles(Role.SHOP_OWNER)
    getAll() {
      return this.orderService.getAllOrders();
    }
  
    @Patch(':id')
    @Roles(Role.SHOP_OWNER)
    update(@Param('id') id: string, @Body() dto: any) {
      return this.orderService.updateOrder(id, dto);
    }
  
    @Delete(':id')
    @Roles(Role.SHOP_OWNER)
    delete(@Param('id') id: string) {
      return this.orderService.deleteOrder(id);
    }
  }
  