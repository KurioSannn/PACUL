import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase/supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let supabaseService: {
    getUserFromToken: jest.Mock;
    getAdminClient: jest.Mock;
  };

  const createContext = (authorization?: string) => {
    const request: {
      headers: { authorization?: string };
      user?: { id: string; email: string; role: string };
    } = {
      headers: authorization ? { authorization } : {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    return { context, request };
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    supabaseService = {
      getUserFromToken: jest.fn(),
      getAdminClient: jest.fn(),
    };

    guard = new SupabaseAuthGuard(
      reflector,
      supabaseService as unknown as SupabaseService,
    );
  });

  it('returns 401 when token is missing', async () => {
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: {
        error: 'Authorization token is required',
        code: 'AUTH_REQUIRED',
      },
    });
    await expect(
      guard.canActivate(createContext().context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns 401 when token is invalid', async () => {
    const { context } = createContext('Bearer invalid-token');
    supabaseService.getUserFromToken.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: {
        error: 'Invalid or expired authorization token',
        code: 'AUTH_REQUIRED',
      },
    });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches user when token and profile are valid', async () => {
    const { context, request } = createContext('Bearer valid-token');

    supabaseService.getUserFromToken.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    const single = jest.fn().mockResolvedValue({
      data: { role: 'household' },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    supabaseService.getAdminClient.mockReturnValue({ from });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      role: 'household',
    });
    expect(from).toHaveBeenCalledWith('user_profiles');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('returns 403 when profile is missing', async () => {
    const { context } = createContext('Bearer valid-token');

    supabaseService.getUserFromToken.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    const single = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });

    supabaseService.getAdminClient.mockReturnValue({ from });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: {
        error: 'User profile not found. Complete profile setup first.',
        code: 'PROFILE_MISSING',
      },
    });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('skips auth for @Public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const { context } = createContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(supabaseService.getUserFromToken).not.toHaveBeenCalled();
  });
});
