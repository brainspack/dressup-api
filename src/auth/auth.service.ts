import { Injectable, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Language, Role, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    // @Inject(forwardRef(() => OtpService)) private readonly otpService: OtpService,
  ) {}

  // Validate or create a new user
  async validateOrCreateUser(mobileNumber: string, role: Role = Role.SHOP_OWNER, language: Language = Language.HI): Promise<User> {
    try {
      let user = await this.prisma.user.findUnique({ where: { mobileNumber } });
      if (!user) {
        user = await this.prisma.user.create({
          data: { mobileNumber, role, language },
        });
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Error while creating or validating user');
    }
  }

  // Send OTP to user
  async sendOtp(mobileNumber: string) {
    try {
      // const otp = await this.otpService.generateOtp();
      // await this.otpService.saveOtp(mobileNumber, otp);
      // await this.otpService.sendOtp(mobileNumber, otp);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP and generate JWT token
  async verifyOtp(mobileNumber: string, enteredOtp: string): Promise<{ message: string; accessToken: string }> {
    try {
      // const user = await this.otpService.verifyOtp(mobileNumber, enteredOtp);
      // if (!user) throw new BadRequestException('Invalid or expired OTP');

      // // Generate JWT token
      // const secret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
      // const payload = { userId: user.id, mobileNumber: user.mobileNumber, role: user.role };
      // const accessToken = this.jwtService.sign(payload, { secret });

      return { message: 'Login successful', accessToken:"token" };
    } catch (error) {
      throw new BadRequestException(error.message || 'OTP verification failed');
    }
  }
}
