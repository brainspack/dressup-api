import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleGuard } from '../auth/role.guard';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly orderService: OrderService) {}

  @Get('order-types')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  async getOrderTypeAnalytics(@Query('shopId') shopId?: string, @Query('dateRange') dateRange?: string) {
    return this.orderService.getOrderTypeAnalytics(shopId, dateRange);
  }

  @Get('order-status')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  async getOrderStatusAnalytics(@Query('shopId') shopId?: string, @Query('dateRange') dateRange?: string) {
    return this.orderService.getOrderStatusAnalytics(shopId, dateRange);
  }

  @Get('monthly-revenue')
  @Roles('SUPER_ADMIN', 'SHOP_OWNER')
  async getMonthlyRevenue(@Query('shopId') shopId?: string, @Query('year') year?: string) {
    return this.orderService.getMonthlyRevenue(shopId, year);
  }
}
