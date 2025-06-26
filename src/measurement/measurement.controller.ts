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
 
    return this.measurementService.create(data, req.user.id);
  }

  @Get('customer/:customerId')
  async getMeasurements(@Param('customerId') customerId: string, @Request() req) {
  
    const measurements = await this.measurementService.findByCustomer(customerId);

    return measurements;
  }

  @Get('order/:orderId')
  async getOrderMeasurements(@Param('orderId') orderId: string) {
   
    const measurements = await this.measurementService.findByOrder(orderId);
  
    return measurements;
  }
}
