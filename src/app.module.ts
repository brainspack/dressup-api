import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CustomerModule } from './customer/customer.module';
import { CostModule } from './cost/cost.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ShopModule } from './shop/shop.module';
import { OrderModule } from './order/order.module';
import { MeasurementModule } from './measurement/measurement.module';
import { TailorModule } from './tailor/tailor.module';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot(),
    UserModule,
    AuthModule,
    OtpModule,
    ShopModule,
    TailorModule,
    CustomerModule,
    MeasurementModule,
    OrderModule,
    CostModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
