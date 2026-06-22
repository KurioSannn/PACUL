import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../modules/profiles/profiles.types';
import { SupabaseService } from '../../supabase/supabase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthUser } from '../types/auth-user';

interface UserProfileRow {
  role: UserRole;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException({
        error: 'Authorization token is required',
        code: 'AUTH_REQUIRED',
      });
    }

    const user = await this.supabaseService.getUserFromToken(token);

    if (!user) {
      throw new UnauthorizedException({
        error: 'Invalid or expired authorization token',
        code: 'AUTH_REQUIRED',
      });
    }

    const profile = await this.fetchUserProfile(user.id);

    if (!profile) {
      throw new ForbiddenException({
        error: 'User profile not found. Complete profile setup first.',
        code: 'PROFILE_MISSING',
      });
    }

    request.user = {
      id: user.id,
      email: user.email ?? '',
      role: profile.role,
    };

    return true;
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }

  private async fetchUserProfile(
    userId: string,
  ): Promise<UserProfileRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single<UserProfileRow>();

    if (error || !data) {
      return null;
    }

    return data;
  }
}
