import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
        imports: [ConfigModule], 
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
            const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
            return {
              secret,
              signOptions: { expiresIn: '7d' },
            };
          },
    }),
    // forwardRef(() => OtpModule), // ✅ Import OtpModule correctly
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}