import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define base types
interface AuthError {
  message: string;
  name: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  maintenanceMode: boolean;
}

interface AuthContext extends AuthState {
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  resendOtp: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Memoize the signOut function to avoid recreating it on every render
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  // Function to check if user is admin
  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'superadmin'])
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin role:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }, []);

  // Function to check maintenance mode
  const checkMaintenanceMode = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_mode')
        .select('is_enabled')
        .single();

      if (error) {
        console.error('Error checking maintenance mode:', error);
        return false;
      }
      return data?.is_enabled ?? false;
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      return false;
    }
  }, []);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      const [isAdminUser, maintenanceModeEnabled] = await Promise.all([
        checkAdminRole(session.user.id),
        checkMaintenanceMode()
      ]);
      
      setIsAdmin(isAdminUser);
      setMaintenanceMode(maintenanceModeEnabled);

      // Handle maintenance mode access
      if (maintenanceModeEnabled) {
        if (isAdminUser) {
          console.log('👑 Admin user authenticated during maintenance mode');
        } else {
          console.log('🚫 Non-admin user denied access during maintenance mode');
          await handleSignOut();
          return;
        }
      }
    } else {
      setIsAdmin(false);
      const maintenanceModeEnabled = await checkMaintenanceMode();
      setMaintenanceMode(maintenanceModeEnabled);
    }
    
    setLoading(false);
  }, [checkAdminRole, checkMaintenanceMode, handleSignOut]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleAuthStateChange(session);
        console.log('🔄 Auth state change:', { event, userId: session?.user?.id });
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    // Set up maintenance mode listener
    const maintenanceChannel = supabase.channel('maintenance_changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE',
          schema: 'public',
          table: 'maintenance_mode'
        },
        async (payload: { new: { is_enabled: boolean } | null }) => {
          const isEnabled = payload.new?.is_enabled ?? false;
          setMaintenanceMode(isEnabled);
          
          // Only sign out non-admin users when maintenance mode is enabled
          if (isEnabled && user?.id) {
            const isAdminUser = await checkAdminRole(user.id);
            if (!isAdminUser) {
              await handleSignOut();
              console.log('👋 Non-admin user signed out due to maintenance mode');
            } else {
              console.log('👑 Admin user allowed during maintenance mode');
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      maintenanceChannel.unsubscribe();
    };
  }, [handleAuthStateChange, handleSignOut, checkAdminRole, user?.id]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('🚀 Starting signup process...', { email, fullName, redirectUrl });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      console.log('📋 Signup response:', { data, error });

      if (error) {
        console.error('❌ Signup error details:', {
          message: error.message,
          status: error.status,
          code: error.code || 'NO_CODE',
          details: error
        });
      } else {
        console.log('✅ Signup successful:', data);
      }

      return { error };
    } catch (networkError) {
      console.error('🌐 Network/Unexpected error during signup:', networkError);
      return { error: networkError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // First attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { error };

      // Check if email is not confirmed
      if (data.user && !data.user.email_confirmed_at) {
        console.log('🚫 User email not confirmed, signing out');
        await supabase.auth.signOut();
        return { 
          error: { 
            message: 'Email not confirmed. Please check your email and click the confirmation link before signing in.',
            name: 'EmailNotConfirmed'
          } 
        };
      }

      // Check maintenance mode and admin status
      const maintenanceModeEnabled = await checkMaintenanceMode();
      if (maintenanceModeEnabled) {
        // Check if the user is an admin
        const isAdminUser = await checkAdminRole(data.user.id);
        
        if (!isAdminUser) {
          // If not admin during maintenance, sign out and return error
          await supabase.auth.signOut();
          return {
            error: {
              message: 'System is currently under maintenance. Only administrators can access the system at this time.',
              name: 'MaintenanceMode'
            }
          };
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return {
        error: {
          message: 'An unexpected error occurred during sign in.',
          name: 'UnexpectedError'
        }
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    return { error };
  };

  const resendOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    return { error };
  };

  const contextValue: AuthContext = {
    user,
    session,
    loading,
    isAdmin,
    maintenanceMode,
    signUp,
    signIn,
    signOut,
    verifyOtp,
    resendOtp,
    resetPassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};