import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Measurement } from '@prisma/client';

@Controller('measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  @Post('add')
  async addMeasurement(@Body() data: Partial<Measurement>, @Request() req) {
    console.log('Received measurement data:', data);
    return this.measurementService.create(data, req.user.id);
  }

  @Get('customer/:customerId')
  async getMeasurements(@Param('customerId') customerId: string, @Request() req) {
    console.log('Fetching measurements for customer:', customerId);
    const measurements = await this.measurementService.findByCustomer(customerId);
    console.log('Found measurements:', measurements);
    return measurements;
  }

  @Get('order/:orderId')
  async getOrderMeasurements(@Param('orderId') orderId: string) {
    console.log('Fetching measurements for order:', orderId);
    const measurements = await this.measurementService.findByOrder(orderId);
    console.log('Found order measurements:', measurements);
    return measurements;
  }
}
