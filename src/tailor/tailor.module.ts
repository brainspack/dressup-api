import { Module } from '@nestjs/common';
import { TailorService } from './tailor.service';
import { TailorController } from './tailor.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [PrismaModule, AuthModule, ConfigModule, ShopModule],
  controllers: [TailorController],
  providers: [TailorService],
})
export class TailorModule {}
