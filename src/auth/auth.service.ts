import { Injectable, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Language, User, $Enums } from '@prisma/client';
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
  async validateOrCreateUser(mobileNumber: string, role: string = 'SHOP_OWNER', language: Language = Language.HI): Promise<User> {
    try {
      await this.ensureRolesExist();
      let user = await this.prisma['user'].findUnique({ where: { mobileNumber } });
      if (!user) {
        // Find the role by name to get its id
        const roleRecord = await this.prisma['role'].findUnique({ where: { name: role as any } });
        if (!roleRecord) throw new Error('Role not found');
        user = await this.prisma['user'].create({
          data: { mobileNumber, role: { connect: { id: roleRecord.id } }, language },
        });
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Error while creating or validating user');
    }
  }

  // New method to create a user with a specific role directly (bypassing OTP for initial setup)
  async createNormalUser(mobileNumber: string, role: string, name?: string): Promise<User> {
    try {
      await this.ensureRolesExist();
      const existingUser = await this.prisma['user'].findUnique({ where: { mobileNumber } });
      if (existingUser) {
        throw new BadRequestException('User with this mobile number already exists.');
      }
      // Find the role by name to get its id
      const roleRecord = await this.prisma['role'].findUnique({ where: { name: role as any } });
      if (!roleRecord) throw new Error('Role not found');
      const newUser = await this.prisma['user'].create({
        data: { mobileNumber, role: { connect: { id: roleRecord.id } }, name: name || null },
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
  async verifyOtp(mobileNumber: string, enteredOtp: string): Promise<{ message: string; accessToken: string; refreshToken: string; user: any }> {
    try {
      // Find user first to get role
      const user = await this.prisma['user'].findUnique({ 
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
      await this.prisma['user'].update({
        where: { mobileNumber },
        data: { otp: null, otpExpiresAt: null },
      });

      // Generate JWT tokens with role
      const roleString = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
      const payload = { 
        userId: user.id, 
        mobileNumber: user.mobileNumber, 
        role: roleString
      };
      const { accessToken, refreshToken } = await this.generateTokens(payload);
      await this.updateRefreshToken(user.id, refreshToken);
      console.log('New refresh token in DB:', refreshToken);

      // Fetch shopId for this user (assuming 1:1 mapping)
      let shop = await this.prisma['shop'].findFirst({
        where: { ownerId: user.id },
        select: { id: true }
      });
      if (!shop) {
        shop = await this.prisma['shop'].findFirst({
          where: { phone: user.mobileNumber },
          select: { id: true }
        });
      }

      return { 
        message: 'Login successful', 
        accessToken,
        refreshToken,
        user: {
          phone: user.mobileNumber,
          role: roleString,
          shopId: shop ? shop.id : null
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('OTP verification failed. Please try again.');
    }
  }

  async ensureRolesExist() {
    const rolesCount = await this.prisma.role.count();
    if (rolesCount === 0) {
      await this.prisma.role.createMany({
        data: [
          { name: 'SUPER_ADMIN', permissions: { all: true } },
          { name: 'SHOP_OWNER', permissions: { all: false } },
        ],
        skipDuplicates: true,
      });
    }
  }

  // Store refresh token as plain text in DB
  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  // Validate refresh token (plain text)
  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) return false;
    return user.refreshToken === refreshToken;
  }

  // Generate access and refresh tokens
  async generateTokens(payload: any) {
    const secret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '7d', // 7 days for access token
    });
    // Add a unique value to the refresh token payload
    const refreshPayload = { ...payload, tokenType: 'refresh', jti: Date.now() + Math.random() };
    const refreshToken = this.jwtService.sign(refreshPayload, { secret, expiresIn: '10d' }); // 10 days for refresh token
    return { accessToken, refreshToken };
  }

  // Refresh tokens logic
  async refreshTokens(userId: string, refreshToken: string) {
    console.log('\x1b[36m[AuthService] /auth/refresh-token called for user:', userId, '\x1b[0m');
    const isValid = await this.validateRefreshToken(userId, refreshToken);
    if (!isValid) {
      console.log('\x1b[31m[AuthService] Invalid refresh token for user:', userId, '\x1b[0m');
      throw new BadRequestException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
    if (!user) throw new BadRequestException('User not found');
    const roleString = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
    const payload = {
      userId: user.id,
      mobileNumber: user.mobileNumber,
      role: roleString
    };
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(payload);
    await this.updateRefreshToken(user.id, newRefreshToken);
    console.log('\x1b[32m[AuthService] New tokens issued for user:', userId, '\x1b[0m');
    return { accessToken, refreshToken: newRefreshToken };
  }
}
