import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { TailorService } from './tailor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tailors')
@UseGuards(JwtAuthGuard)
export class TailorController {
  constructor(private readonly tailorService: TailorService) {}

  @Post('add')
  async addTailor(@Body() tailorData: any, @Request() req) {
    return this.tailorService.create(tailorData, req.user.shopId);
  }

  @Get('my-tailors')
  async getTailors(@Request() req) {
    return this.tailorService.findByShop(req.user.shopId);
  }
}
