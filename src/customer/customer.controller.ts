import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('create')
  async createCustomer(@Body() customerDto: any, @Request() req) {
    return this.customerService.create(customerDto, req.user.id);
  }

  @Get('my-customers')
  async getCustomers(@Request() req) {
    return this.customerService.findByUser(req.user.id);
  }
}
