import type { UserRole } from '../../modules/profiles/profiles.types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
