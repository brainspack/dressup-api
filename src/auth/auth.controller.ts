import { Controller, Post, Body, BadRequestException, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RoleGuard } from './role.guard';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @Roles(Role.SUPER_ADMIN) // Only SUPER_ADMIN can create users with specific roles
  async createNewUser(
    @Body('mobileNumber') mobileNumber: string,
    @Body('role') roleString: string, // Receive as string first
    @Body('name') name?: string,
  ) {
    if (!mobileNumber || !roleString) {
      throw new BadRequestException('Mobile number and role are required.');
    }

    // Ensure the received role string is a valid Role enum member
    const role: Role = roleString as Role; // Explicitly cast to Role enum

    if (!Object.values(Role).includes(role)) {
      throw new BadRequestException(`Invalid role: ${roleString}. Must be one of ${Object.values(Role).join(', ')}`);
    }

    try {
      return await this.authService.createNormalUser(mobileNumber, role, name);
    } catch (error) {
      console.error('Error in createNewUser controller:', error);
      throw new InternalServerErrorException(error.message || 'Failed to create user.');
    }
  }
}
