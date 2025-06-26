import { Injectable, InternalServerErrorException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class OtpService {
  private twilioClient;

  constructor(private prisma: PrismaService, private config: ConfigService,  @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,) {
    // @Inject(forwardRef(() => AuthService)) 
    // Uncomment and configure Twilio client if needed
    // this.twilioClient = twilio(
    //   this.config.get('TWILIO_SID'),
    //   this.config.get('TWILIO_AUTH_TOKEN')
    // );
  }

  // Generate a 6-digit OTP
  async generateOtp(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP in DB
  async saveOtp(mobileNumber: string, otp: string) {
    try {
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 5); // OTP expires in 5 minutes

      await this.prisma.user.upsert({
        where: { mobileNumber },
        update: { otp, otpExpiresAt: expiry },
        create: {
          mobileNumber,
          role: 'SHOP_OWNER',
          language: 'HI',
          otp,
          otpExpiresAt: expiry,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to store OTP. Please try again.');
    }
  }

  // Send OTP via Twilio (SMS/WhatsApp)
  async sendOtp(mobileNumber: string, otp: string) {
    try {
      // Uncomment this if using Twilio
      // await this.twilioClient.messages.create({
      //   body: `Your OTP is: ${otp}`,
      //   from: this.config.get('TWILIO_PHONE_NUMBER'),
      //   to: mobileNumber,
      // });
  
      
    } catch (error) {
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP
  async verifyOtp(mobileNumber: string, enteredOtp: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { mobileNumber } });

      if (!user || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
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
    
      return user;
    } catch (error) {
      throw new BadRequestException(error.message || 'OTP verification failed');
    }
  }
}


// OTP Service with watsapp API
// import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';
// import { ConfigService } from '@nestjs/config';
// import axios from 'axios';

// @Injectable()
// export class OtpService {
//   private readonly whatsappApiUrl: string;
//   private readonly whatsappAccessToken: string;
//   private readonly whatsappPhoneNumberId: string;

//   constructor(private prisma: PrismaService, private config: ConfigService) {
//     this.whatsappApiUrl = 'https://graph.facebook.com/v17.0'; // Update based on API version
//     this.whatsappAccessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
//     this.whatsappPhoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
//   }

//   // Generate a 6-digit OTP
//   async generateOtp(): Promise<string> {
//     return Math.floor(100000 + Math.random() * 900000).toString();
//   }

//   // Store OTP in DB
//   async saveOtp(mobileNumber: string, otp: string) {
//     try {
//       const expiry = new Date();
//       expiry.setMinutes(expiry.getMinutes() + 5); // OTP expires in 5 minutes

//       await this.prisma.user.upsert({
//         where: { mobileNumber },
//         update: { otp, otpExpiresAt: expiry },
//         create: {
//           mobileNumber,
//           role: 'SHOP_OWNER',
//           language: 'HI',
//           otp,
//           otpExpiresAt: expiry,
//         },
//       });
//     } catch (error) {
//       throw new InternalServerErrorException('Failed to store OTP. Please try again.');
//     }
//   }

//   // Send OTP via WhatsApp
//   async sendOtp(mobileNumber: string, otp: string) {
//     try {
//       const payload = {
//         messaging_product: 'whatsapp',
//         to: mobileNumber,
//         type: 'template',
//         template: {
//           name: 'otp_verification', // Your pre-approved WhatsApp template name
//           language: { code: 'en_US' },
//           components: [
//             {
//               type: 'body',
//               parameters: [{ type: 'text', text: otp }],
//             },
//           ],
//         },
//       };

//       const response = await axios.post(
//         `${this.whatsappApiUrl}/${this.whatsappPhoneNumberId}/messages`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${this.whatsappAccessToken}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//    
//     } catch (error) {
//       console.error('WhatsApp API Error:', error.response?.data || error.message);
//       throw new InternalServerErrorException('Failed to send OTP via WhatsApp.');
//     }
//   }

//   // Verify OTP
//   async verifyOtp(mobileNumber: string, enteredOtp: string) {
//     try {
//       const user = await this.prisma.user.findUnique({ where: { mobileNumber } });

//       if (!user || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
//         throw new BadRequestException('OTP expired. Request a new one.');
//       }

//       if (user.otp !== enteredOtp) {
//         throw new BadRequestException('Invalid OTP. Please enter the correct OTP.');
//       }

//       // Clear OTP after successful verification
//       await this.prisma.user.update({
//         where: { mobileNumber },
//         data: { otp: null, otpExpiresAt: null },
//       });

//       return user;
//     } catch (error) {
//       throw new BadRequestException(error.message || 'OTP verification failed');
//     }
//   }
// }
