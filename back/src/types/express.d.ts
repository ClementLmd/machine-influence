import type { User as SupabaseUser } from '@supabase/supabase-js';

export type AuthUser = Pick<SupabaseUser, 'id' | 'email'>;

declare global {
  namespace Express {
    interface Request {
      user?: {
        supabaseId: AuthUser['id'];
        email: AuthUser['email'];
      };
    }
  }
}

export {};
