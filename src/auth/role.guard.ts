// Use it like:
// import { SetMetadata, UseGuards } from '@nestjs/common';
// import { RoleGuard } from '../auth/role.guard';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { Role } from '@prisma/client';

// @UseGuards(JwtAuthGuard, RoleGuard)
// @SetMetadata('roles', [Role.SHOP_OWNER, Role.SUPER_ADMIN])


import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required for this route
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found.');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied for role: ${user.role}`);
    }

    return hasRole;
  }
}
