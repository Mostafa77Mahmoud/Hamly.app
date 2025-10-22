import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Database } from '@/utils/supabase';
import { traceRequest } from '@/utils/networkTracer';
import { traceEvent } from '@/utils/deepTracer';
import { captureSessionSnapshot } from '@/utils/sessionDebugger';
import { logSupabaseRequest } from '@/utils/logCollector';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    let mounted = true;
    let sessionCheckTimeout: ReturnType<typeof setTimeout> | undefined;

    const initAuth = async () => {
      try {
        // استخدم timeout قصير لاكتشاف الـ freeze
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          sessionCheckTimeout = setTimeout(() => reject(new Error('Session check timeout')), 2000);
        });

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        clearTimeout(sessionCheckTimeout);

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('[AUTH_CONTEXT] Error getting session:', error);
        clearTimeout(sessionCheckTimeout);

        // حاول استعادة من AsyncStorage مباشرة
        try {
          const storedSession = await AsyncStorage.getItem('hamlymd-auth-token');
          if (storedSession && mounted) {
            try {
              const parsedSession = JSON.parse(storedSession);
              if (parsedSession.currentSession && parsedSession.currentSession.user) {
                console.log('[AUTH_CONTEXT] Restored session from storage');
                setSession(parsedSession.currentSession);
                setUser(parsedSession.currentSession.user);
              } else {
                // Session data is corrupted, clear it
                console.warn('[AUTH_CONTEXT] Session data corrupted, clearing...');
                await AsyncStorage.removeItem('hamlymd-auth-token');
              }
            } catch (parseError) {
              // JSON parsing failed, session is corrupted
              console.error('[AUTH_CONTEXT] Session data corrupted (parse failed), clearing:', parseError);
              await AsyncStorage.removeItem('hamlymd-auth-token');
            }
          }
        } catch (storageError) {
          console.error('[AUTH_CONTEXT] Storage recovery failed:', storageError);
          // Clear corrupted storage to prevent persistent crashes
          try {
            await AsyncStorage.removeItem('hamlymd-auth-token');
            console.log('[AUTH_CONTEXT] Cleared potentially corrupted session');
          } catch (clearError) {
            console.error('[AUTH_CONTEXT] Failed to clear corrupted session:', clearError);
          }
        }

        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        console.log('[AUTH_CONTEXT] Auth state changed:', _event);
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(sessionCheckTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const createOrUpdateProfile = async (user: User): Promise<boolean> => {
    try {
      // Check for existing profile with longer timeout and retry logic
      let existingProfile = null;
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts && existingProfile === null) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .eq('id', user.id)
            .single();

          if (!error) {
            existingProfile = data;
          } else if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
            // No rows found - profile doesn't exist
            break;
          } else {
            console.warn(`Profile check attempt ${attempts + 1} failed:`, error);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        } catch (networkError) {
          console.warn(`Network error on attempt ${attempts + 1}:`, networkError);
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds on network error
          }
        }
      }

      if (!existingProfile) {
        // Create new profile
        const profileData: ProfileInsert = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        };
        const { error } = await (supabase.from('profiles') as any).insert(profileData);

        if (error) {
          console.error('Error creating profile:', error);
          return false;
        }

        console.log('Created new user profile');
        setIsNewUser(true);
        return true; // New user
      } else {
        // Update existing profile
        const updateData: ProfileUpdate = {
          email: user.email!,
          updated_at: new Date().toISOString(),
        };
        const { error } = await (supabase
          .from('profiles') as any)
          .update(updateData)
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
        }

        return false; // Existing user
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const start = Date.now();
    try {
      traceRequest('auth.signUp', {
        phase: 'send',
        payload: { email: email.trim().toLowerCase(), hasPassword: !!password, fullName: fullName.trim() },
      });
    } catch (traceError) {
      console.warn('Trace error (non-critical):', traceError);
    }

    try {
      console.log('Attempting signup with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      const latencyMs = Date.now() - start;

      if (data) {
        console.log('Signup response data:', data);
      }

      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          code: error.code || 'NO_CODE',
          status: error.status || 'NO_STATUS'
        });
        try {
          traceRequest('auth.signUp', {
            phase: 'error',
            error,
            latencyMs,
          });
        } catch (traceError) {
          console.warn('Trace error (non-critical):', traceError);
        }
      } else {
        try {
          traceRequest('auth.signUp', {
            phase: 'response',
            response: { success: true, hasUser: !!data.user, hasSession: !!data.session },
            latencyMs,
          });
        } catch (traceError) {
          console.warn('Trace error (non-critical):', traceError);
        }

        // Create profile for new user (non-blocking)
        if (data.user) {
          console.log('Creating profile for new user...');
          setIsNewUser(true);
          try {
            await createOrUpdateProfile(data.user);
            console.log('New user created, isNewUser flag set to:', true);
          } catch (profileError) {
            console.warn('Profile creation failed (non-critical):', profileError);
          }
        }
      }

      return { error };
    } catch (error) {
      const latencyMs = Date.now() - start;
      console.error('Signup exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      try {
        traceRequest('auth.signUp', {
          phase: 'error',
          error,
          latencyMs,
        });
      } catch (traceError) {
        console.warn('Trace error (non-critical):', traceError);
      }
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const start = Date.now();
    try {
      traceRequest('auth.signIn', {
        phase: 'send',
        payload: { email: email.trim().toLowerCase(), hasPassword: !!password },
      });
    } catch (traceError) {
      console.warn('Trace error (non-critical):', traceError);
    }

    try {
      console.log('Attempting signin with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      const latencyMs = Date.now() - start;

      if (data) {
        console.log('Signin response data:', data);
      }

      if (error) {
        console.error('Signin error details:', {
          message: error.message,
          code: error.code || 'NO_CODE',
          status: error.status || 'NO_STATUS'
        });
        try {
          traceRequest('auth.signIn', {
            phase: 'error',
            error,
            latencyMs,
          });
        } catch (traceError) {
          console.warn('Trace error (non-critical):', traceError);
        }
      } else {
        try {
          traceRequest('auth.signIn', {
            phase: 'response',
            response: { success: true, hasUser: !!data.user, hasSession: !!data.session },
            latencyMs,
          });
        } catch (traceError) {
          console.warn('Trace error (non-critical):', traceError);
        }

        // Create or update profile for signed in user (non-blocking)
        if (data.user) {
          console.log('Checking/creating profile for signed in user...');
          try {
            const isNew = await createOrUpdateProfile(data.user);
            if (isNew) {
              console.log('First time login detected, setting isNewUser flag');
              setIsNewUser(true);
            }
          } catch (profileError) {
            console.warn('Profile creation/update failed (non-critical):', profileError);
          }
        }
      }

      return { error };
    } catch (error) {
      const latencyMs = Date.now() - start;
      console.error('Signin exception details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      });
      try {
        traceRequest('auth.signIn', {
          phase: 'error',
          error,
          latencyMs,
        });
      } catch (traceError) {
        console.warn('Trace error (non-critical):', traceError);
      }
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Clear any potentially corrupted session data from local storage on sign out
      await AsyncStorage.removeItem('hamlymd-auth-token');
      console.log('[AUTH_CONTEXT] Cleared local session data on sign out.');
      return { error };
    } catch (error) {
      console.error('[AUTH_CONTEXT] Error during sign out:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    session,
    user,
    loading,
    isNewUser,
    setIsNewUser,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}