import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UserController {
//      /**
//    * 🔐 Protected Route: Example - Get Profile
//    * This route requires JWT authentication.
//    */
//   @UseGuards(JwtAuthGuard)
//   @Get('profile')
//   async getProfile(@Body('mobileNumber') mobileNumber: string) {
//     return { message: 'Protected route accessed', mobileNumber };
//   }
}
