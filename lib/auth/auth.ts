'use client';

import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { User } from '@/types';

export interface AuthError {
  message: string;
  status?: number;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export async function signInWithGoogle(): Promise<true | AuthError> {
  try {
    if (!supabase) {
      return { message: 'Supabase configuration is missing' };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('database error saving new user')) {
        return {
          message:
            'Account could not be created due to a database bootstrap issue. Please try again in a few moments.',
          status: error.status,
        };
      }
      return { message: error.message, status: error.status };
    }

    return true;
  } catch (error) {
    console.error('Google sign in error:', error);
    return { message: 'An error occurred during Google sign in' };
  }
}

export async function signUp(data: SignUpData): Promise<User | AuthError> {
  try {
    if (!supabase) {
      return { message: 'Supabase configuration is missing' };
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          username: data.username,
        },
      },
    });

    if (error) {
      return { message: error.message, status: error.status };
    }

    if (!authData.user) {
      return { message: 'Registration failed' };
    }

    return {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: data.full_name,
      created_at: authData.user.created_at,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('SignUp error:', error);
    return { message: 'An error occurred' };
  }
}

export async function signIn(data: SignInData): Promise<User | AuthError> {
  try {
    if (!supabase) {
      return { message: 'Supabase configuration is missing' };
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { message: 'Please verify your email address before signing in.', status: error.status };
      }
      return { message: error.message, status: error.status };
    }

    if (!authData.user) {
      return { message: 'Sign in failed' };
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single() as { data: { full_name?: string; avatar_url?: string; username?: string; updated_at?: string } | null };

    return {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url,
      username: profile?.username,
      created_at: authData.user.created_at,
      updated_at: profile?.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('SignIn error:', error);
    return { message: 'An error occurred' };
  }
}

export async function signOut(): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.error('SignOut error:', error);
  }

  if (typeof window !== 'undefined') {
    try {
      const clearSupabaseKeys = (storage: Storage) => {
        const keysToRemove: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => storage.removeItem(key));
      };

      clearSupabaseKeys(window.localStorage);
      clearSupabaseKeys(window.sessionStorage);
    } catch (error) {
      console.error('Failed to clear Supabase storage keys:', error);
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    if (!supabase) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: { full_name?: string; avatar_url?: string; username?: string; updated_at?: string } | null };

    return {
      id: user.id,
      email: user.email!,
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url,
      username: profile?.username,
      created_at: user.created_at,
      updated_at: profile?.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function resetPassword(email: string): Promise<boolean | AuthError> {
  try {
    if (!supabase) {
      return { message: 'Supabase configuration is missing' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { message: error.message };
    }

    return true;
  } catch (error) {
    console.error('Reset password error:', error);
    return { message: 'An error occurred' };
  }
}

export async function updatePassword(newPassword: string): Promise<boolean | AuthError> {
  try {
    if (!supabase) {
      return { message: 'Supabase configuration is missing' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { message: error.message };
    }

    return true;
  } catch (error) {
    console.error('Update password error:', error);
    return { message: 'An error occurred' };
  }
}
