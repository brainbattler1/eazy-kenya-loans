import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  resendOtp: (email: string) => Promise<{ error: AuthError | null }>;
  isAdmin: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  systemAccess: 'granted' | 'maintenance';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [systemAccess, setSystemAccess] = useState<'granted' | 'maintenance'>('granted');

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up maintenance mode subscription
    const maintenanceChannel = supabase
      .channel('maintenance-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_maintenance'
      }, () => {
        checkMaintenanceStatus();
      })
      .subscribe();

    // Initial maintenance check
    checkMaintenanceStatus();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(maintenanceChannel);
    };
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      // First check system access status
      const { data: accessData, error: accessError } = await supabase
        .from('system_access')
        .select('*')
        .single();

      if (accessError) {
        console.error('Error checking system access:', accessError);
        return;
      }

      if (accessData) {
        setSystemAccess(accessData.access_status as 'granted' | 'maintenance');
        setMaintenanceMessage(accessData.maintenance_message || '');
      }

      // Then get maintenance details
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('system_maintenance')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (maintenanceError) {
        console.error('Error checking maintenance status:', maintenanceError);
        return;
      }

      if (maintenanceData) {
        setMaintenanceMode(maintenanceData.is_enabled);
        if (maintenanceData.message) {
          setMaintenanceMessage(maintenanceData.message);
        }
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    }
  };

  // Check admin status whenever user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['superadmin', 'admin'])
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    };

    checkAdminStatus();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local state
      setUser(null);
      setIsAdmin(false);
      setMaintenanceMode(false);
      setMaintenanceMessage('');
      setSystemAccess('granted');
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
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

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    verifyOtp,
    resendOtp,
    isAdmin,
    maintenanceMode,
    maintenanceMessage,
    systemAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
