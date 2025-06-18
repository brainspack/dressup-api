import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(JwtAuthGuard)
    @Get('/')
    async getAllUsers() {
        return this.userService.findAll();
    }

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
