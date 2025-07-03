import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService, private configService: ConfigService) {
    super();
  }

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
      request.user = decoded;
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Optionally log less or handle differently
        console.warn('\x1b[33m[JwtAuthGuard] Access token expired for request:', request.url, '\x1b[0m');
      } else {
        console.error('\x1b[31m[JwtAuthGuard] JWT verification error for request:', request.url, error, '\x1b[0m');
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      // Add debug log here
      console.log('JWT error or no user:', info?.message);
      throw err || new UnauthorizedException(info?.message);
    }
    return user;
  }
}
