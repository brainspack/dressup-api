import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  InternalServerErrorException,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('create')
  async createCustomer(@Body() customerDto: any, @Request() req) {
    try {
      if (!customerDto.name || !customerDto.mobileNumber) {
        throw new Error('Name and mobile number are required');
      }
      const { shopId, ...customerDetails } = customerDto;
      return await this.customerService.create(customerDetails, req.user.userId, shopId);
    } catch (error) {
      console.error('Customer creation error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to create customer');
    }
  }

  @Get('my-customers')
  async getCustomers(@Request() req) {
    try {
      return await this.customerService.findByUser(req.user.userId);
    } catch (error) {
      console.error('Get customers error:', error);
      throw new InternalServerErrorException('Failed to fetch customers');
    }
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    try {
      return await this.customerService.findById(id);
    } catch (error) {
      console.error('Get customer by ID error:', error);
      throw new InternalServerErrorException('Failed to fetch customer');
    }
  }

  @Delete(':id')
  async softDeleteCustomer(@Param('id') id: string) {
    try {
      await this.customerService.softDelete(id);
      return { message: 'Customer soft-deleted successfully' };
    } catch (error) {
      console.error('Soft delete customer error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to soft delete customer');
    }
  }

  @Patch(':id')
  async updateCustomer(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.customerService.update(id, data);
    } catch (error) {
      console.error('Update customer error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to update customer');
    }
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async getAllCustomers() {
    return this.customerService.findAll();
  }

  @Get('by-shop/:shopId')
  async getCustomersByShop(@Param('shopId') shopId: string) {
    try {
      return await this.customerService.findByShop(shopId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch customers for shop');
    }
  }
}
