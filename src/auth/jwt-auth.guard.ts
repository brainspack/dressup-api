import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token is required');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
      const decoded = this.jwtService.verify(token, { secret });
      console.log('Decoded JWT token:', decoded);
      request.user = decoded;
      console.log('Request user after decoding:', request.user);
      return true;
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
