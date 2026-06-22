import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthUser } from '../types/auth-user';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as AuthUser | undefined;

    if (user?.id) {
      return Promise.resolve(user.id);
    }

    const ip = req.ip;
    return Promise.resolve(typeof ip === 'string' ? ip : 'anonymous');
  }
}
