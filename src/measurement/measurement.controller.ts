import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementController {
  constructor(private readonly measurementService: MeasurementService) {}

  @Post('add')
  async addMeasurement(@Body() data: any, @Request() req) {
    return this.measurementService.create(data, req.user.id);
  }

  @Get('customer/:customerId')
  async getMeasurements(@Request() req) {
    return this.measurementService.findByCustomer(req.params.customerId);
  }
}
