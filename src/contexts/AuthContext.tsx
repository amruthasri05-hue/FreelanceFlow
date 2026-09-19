import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { db } from '../lib/supabase/db';
import { supabase, isSupabaseConfigured, getAuthRedirectUrl } from '../lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { email: string; password?: string; fullName: string; role: UserRole; companyName?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
  isSupabaseLive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isSupabaseLive = isSupabaseConfigured();

  // Initialize session on mount and listen to auth state changes
  useEffect(() => {
    async function initSession() {
      try {
        if (isSupabaseLive && supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession error:', error);
          }
          if (session?.user) {
            let profile = await db.getProfileById(session.user.id);
            if (!profile) {
              profile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Freelancer',
                role: (session.user.user_metadata?.role as UserRole) || 'freelancer',
                company_name: session.user.user_metadata?.company_name || 'Freelance Studio',
                currency: 'USD',
                created_at: session.user.created_at || new Date().toISOString(),
              };
            }
            setUser(profile);
            localStorage.setItem('freelanceflow_active_user_id', profile.id);
            setLoading(false);
            return;
          } else {
            // Live Supabase is configured: strictly require an authenticated Supabase session
            setUser(null);
            localStorage.removeItem('freelanceflow_active_user_id');
            setLoading(false);
            return;
          }
        }

        // Restore local simulated session ONLY when live Supabase is not configured (demo mode)
        const savedUserId = localStorage.getItem('freelanceflow_active_user_id');
        if (savedUserId) {
          const profile = await db.getProfileById(savedUserId);
          if (profile) {
            setUser(profile);
            setLoading(false);
            return;
          }
        }

        // Default to demo freelancer user for instant usability in demo mode
        const defaultProfile = await db.getProfileById('usr-freelancer-1');
        setUser(defaultProfile);
        if (defaultProfile) {
          localStorage.setItem('freelanceflow_active_user_id', defaultProfile.id);
        }
      } catch (err) {
        console.warn('Auth session initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes (including PASSWORD_RECOVERY and SIGNED_IN)
    if (isSupabaseLive && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Redirect the user to the reset password view if not already there
          if (typeof window !== 'undefined' && window.location.pathname !== '/reset-password') {
            window.history.pushState({}, '', '/reset-password');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        } else if (session?.user) {
          let profile = await db.getProfileById(session.user.id);
          if (!profile) {
            profile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Freelancer',
              role: (session.user.user_metadata?.role as UserRole) || 'freelancer',
              company_name: session.user.user_metadata?.company_name || 'Freelance Studio',
              currency: 'USD',
              created_at: session.user.created_at || new Date().toISOString(),
            };
          }
          setUser(profile);
          localStorage.setItem('freelanceflow_active_user_id', profile.id);
        } else if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          localStorage.removeItem('freelanceflow_active_user_id');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isSupabaseLive]);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseLive && supabase) {
        if (!password) {
          return { success: false, error: 'Password is required to sign in to Supabase.' };
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          let profile = await db.getProfileById(data.user.id);
          if (!profile) {
            profile = {
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Freelancer',
              role: (data.user.user_metadata?.role as UserRole) || 'freelancer',
              company_name: data.user.user_metadata?.company_name || 'Freelance Studio',
              currency: 'USD',
              created_at: data.user.created_at || new Date().toISOString(),
            };
          }
          setUser(profile);
          localStorage.setItem('freelanceflow_active_user_id', profile.id);
          return { success: true };
        }
        return { success: false, error: 'Failed to authenticate user session.' };
      }

      // Match demo profiles (demo mode only)
      const profiles = await db.getProfiles();
      const matched = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setUser(matched);
        localStorage.setItem('freelanceflow_active_user_id', matched.id);
        return { success: true };
      }

      // If not matched, create new freelancer profile session
      const newProfile: Profile = {
        id: 'usr-' + Date.now(),
        email,
        full_name: email.split('@')[0],
        role: 'freelancer',
        company_name: 'Freelance Studio',
        hourly_rate: 100,
        currency: 'USD',
        created_at: new Date().toISOString(),
      };
      const created = await db.updateProfile(newProfile.id, newProfile).catch(() => newProfile);
      setUser(created);
      localStorage.setItem('freelanceflow_active_user_id', created.id);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const signup = async (data: {
    email: string;
    password?: string;
    fullName: string;
    role: UserRole;
    companyName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseLive && supabase) {
        if (!data.password) {
          return { success: false, error: 'Password is required to create a Supabase account.' };
        }
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: data.role,
              company_name: data.companyName,
            }
          }
        });
        if (error) return { success: false, error: error.message };
        if (authData.user) {
          const newProfile: Profile = {
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            role: data.role,
            company_name: data.companyName,
            currency: 'USD',
            created_at: new Date().toISOString(),
          };
          await db.updateProfile(newProfile.id, newProfile);
          setUser(newProfile);
          localStorage.setItem('freelanceflow_active_user_id', newProfile.id);
          return { success: true };
        }
        return { success: false, error: 'Sign up failed to return user.' };
      }

      const newProfile: Profile = {
        id: 'usr-' + Date.now(),
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        company_name: data.companyName,
        currency: 'USD',
        created_at: new Date().toISOString(),
      };
      db.profiles.push(newProfile);
      setUser(newProfile);
      localStorage.setItem('freelanceflow_active_user_id', newProfile.id);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  };

  const logout = async (): Promise<void> => {
    if (isSupabaseLive && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('freelanceflow_active_user_id');
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseLive && supabase) {
        const redirectTo = getAuthRedirectUrl('/reset-password');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      // Demo mode simulated response
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send reset link' };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseLive && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      }

      // Demo mode simulated success
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update password' };
    }
  };

  const switchRoleDemo = async (targetRole: UserRole): Promise<void> => {
    const profiles = await db.getProfiles();
    let target = profiles.find(p => p.role === targetRole);
    if (!target) {
      target = profiles[0];
    }
    setUser(target);
    localStorage.setItem('freelanceflow_active_user_id', target.id);
  };

  const updateUserProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) return;
    const updated = await db.updateProfile(user.id, updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        resetPassword,
        updatePassword,
        switchRoleDemo,
        updateUserProfile,
        isSupabaseLive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
