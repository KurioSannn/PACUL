import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../modules/profiles/profiles.types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../types/auth-user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        error: 'Authenticated user is required for this action',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        error: `Role '${user.role}' is not allowed to access this resource`,
        code: 'INSUFFICIENT_ROLE',
      });
    }

    return true;
  }
}
