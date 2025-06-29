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
    @Inject(forwardRef(() => OtpService)) private readonly otpService: OtpService,

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

  // New method to create a user with a specific role directly (bypassing OTP for initial setup)
  async createNormalUser(mobileNumber: string, role: Role, name?: string): Promise<User> {
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { mobileNumber } });
      if (existingUser) {
        throw new BadRequestException('User with this mobile number already exists.');
      }

      const newUser = await this.prisma.user.create({
        data: { mobileNumber, role, name: name || null },
      });
      return newUser;
    } catch (error) {
      console.error('Error creating normal user:', error);
      throw new InternalServerErrorException(error.message || 'Failed to create user with specified role');
    }
  }

  // Send OTP to user
  async sendOtp(mobileNumber: string) {
    try {
      const otp = await this.otpService.generateOtp();
      await this.otpService.saveOtp(mobileNumber, otp);
      await this.otpService.sendOtp(mobileNumber, otp);
      
      return { 
        message: 'OTP sent successfully',
        otp: otp // Only for development/testing
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP and generate JWT token
  async verifyOtp(mobileNumber: string, enteredOtp: string): Promise<{ message: string; accessToken: string }> {
    try {
      // Find user first to get role
      const user = await this.prisma.user.findUnique({ 
        where: { mobileNumber },
        select: {
          id: true,
          mobileNumber: true,
          role: true,
          otp: true,
          otpExpiresAt: true
        }
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        throw new BadRequestException('OTP expired. Request a new one.');
      }

      if (user.otp !== enteredOtp) {
        throw new BadRequestException('Invalid OTP. Please enter the correct OTP.');
      }

      // Clear OTP after successful verification
      await this.prisma.user.update({
        where: { mobileNumber },
        data: { otp: null, otpExpiresAt: null },
      });

      // Generate JWT token with role
      const secret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
      const payload = { 
        userId: user.id, 
        mobileNumber: user.mobileNumber, 
        role: user.role  // Make sure role is included
      };
      const accessToken = this.jwtService.sign(payload, { secret });

      return { 
        message: 'Login successful', 
        accessToken
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('OTP verification failed. Please try again.');
    }
  }
}
