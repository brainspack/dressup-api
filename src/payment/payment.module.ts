import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';

@Module({
  imports: [PrismaModule, AuthModule, ConfigModule],
  providers: [PaymentService, JwtAuthGuard, RoleGuard],
  controllers: [PaymentController],
})
export class PaymentModule {}


