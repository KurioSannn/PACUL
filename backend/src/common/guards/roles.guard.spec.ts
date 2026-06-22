import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createContext = (user?: {
    id: string;
    email: string;
    role: string;
  }) => {
    const request: {
      user?: { id: string; email: string; role: string };
    } = {};

    if (user) {
      request.user = user;
    }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks access when user role is not allowed', () => {
    reflector.getAllAndOverride.mockReturnValue(['collector']);
    const context = createContext({
      id: 'user-1',
      email: 'user@example.com',
      role: 'household',
    });

    try {
      guard.canActivate(context);
      fail('Expected ForbiddenException');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: 'INSUFFICIENT_ROLE',
      });
    }
  });

  it('allows access when user role matches required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['collector']);
    const context = createContext({
      id: 'user-1',
      email: 'collector@example.com',
      role: 'collector',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when user role is one of multiple allowed roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['collector', 'industry']);
    const context = createContext({
      id: 'user-1',
      email: 'industry@example.com',
      role: 'industry',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks access when user is missing but roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(['household']);
    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
