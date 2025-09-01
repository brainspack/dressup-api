import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AnalyticsController } from './analytics.controller';
import { OutfitService } from './outfit.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, AuthModule, ConfigModule],
  controllers: [OrderController, AnalyticsController],
  providers: [OrderService, OutfitService],
  exports: [OutfitService],
})
export class OrderModule {}
