import { forwardRef, Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [PrismaModule, ConfigModule, forwardRef(() => AuthModule)], 
  providers: [OtpService, AuthService],
  exports: [OtpService], // ✅ Export OtpService so AuthModule can use it
})
export class OtpModule {}
