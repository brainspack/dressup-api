import { Controller, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';

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
      throw new InternalServerErrorException('OTP verification failed. Please try again.');
    }
  }
}
