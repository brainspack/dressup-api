import { Controller, Post, Body, BadRequestException, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RoleGuard } from './role.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 📌 Send OTP to user's mobile number
   */
  @Post('send-otp')
  async sendOtp(@Body('mobileNumber') mobileNumber: string) {
    if (!mobileNumber) {
      throw new BadRequestException('Mobile number is required.');
    }

    try {
      return await this.authService.sendOtp(mobileNumber);
    } catch (error) {
      throw new InternalServerErrorException('Failed to send OTP. Please try again later.');
    }
  }

  /**
   * 📌 Verify OTP and login user
   */
  @Post('verify-otp')
  async verifyOtp(
    @Body('mobileNumber') mobileNumber: string,
    @Body('otp') otp: string
  ) {
    if (!mobileNumber || !otp) {
      throw new BadRequestException('Mobile number and OTP are required.');
    }

    try {
      return await this.authService.verifyOtp(mobileNumber, otp);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('OTP verification failed. Please try again.');
    }
  }

  /**
   * 📌 Create a new user with a specific role (for SUPER_ADMIN only)
   */
  @Post('create-user')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('SUPER_ADMIN') // Only SUPER_ADMIN can create users with specific roles
  async createNewUser(
    @Body('mobileNumber') mobileNumber: string,
    @Body('role') roleString: string, // Receive as string first
    @Body('name') name?: string,
  ) {
    if (!mobileNumber || !roleString) {
      throw new BadRequestException('Mobile number and role are required.');
    }

    const allowedRoles = ['SUPER_ADMIN', 'SHOP_OWNER'];
    if (!allowedRoles.includes(roleString)) {
      throw new BadRequestException(`Invalid role: ${roleString}. Must be one of ${allowedRoles.join(', ')}`);
    }
    const role = roleString;

    try {
      return await this.authService.createNormalUser(mobileNumber, role, name);
    } catch (error) {
      console.error('Error in createNewUser controller:', error);
      throw new InternalServerErrorException(error.message || 'Failed to create user.');
    }
  }

  @Post('refresh-token')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('Refresh token is required');
    try {
      // Decode to get userId from payload
      const decoded: any = this.jwtService.verify(refreshToken, { secret: this.configService.get<string>('JWT_SECRET') || 'default_secret' });
      const userId = decoded.userId;
      return await this.authService.refreshTokens(userId, refreshToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
