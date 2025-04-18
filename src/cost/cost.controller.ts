import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { CostService } from './cost.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('costs')
@UseGuards(JwtAuthGuard)
export class CostController {
  constructor(private readonly costService: CostService) {}

  @Post('add')
  async addCost(@Body() data: any, @Request() req) {
    return this.costService.create(data);
  }

  @Get('order/:orderId')
  async getCosts(@Request() req) {
    return this.costService.findByOrder(req.params.orderId);
  }
}
