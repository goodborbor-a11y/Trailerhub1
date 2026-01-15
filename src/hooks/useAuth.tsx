import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  roles?: string[];
  is_suspended?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: { user: User | null } | null;
  loading: boolean;
  isSuspended: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    const checkUser = async () => {
      try {
        const result = await api.getCurrentUser();
        if (result.data?.user) {
          const userData = result.data.user;
          setUser(userData);
          setSession({ user: userData });
          setIsSuspended(userData.is_suspended || false);
        } else {
          setUser(null);
          setSession(null);
          setIsSuspended(false);
        }
      } catch (error) {
        setUser(null);
        setSession(null);
        setIsSuspended(false);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await api.signUp(email, password, displayName);
      if (result.error) {
        return { error: new Error(result.error) };
      }
      if (result.data?.user) {
        setUser(result.data.user);
        setSession({ user: result.data.user });
        setIsSuspended(false);
      }
      return { error: null };
    } catch (error: any) {
      return { error: error instanceof Error ? error : new Error(error?.message || 'Sign up failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await api.signIn(email, password);
      if (result.error) {
        return { error: new Error(result.error) };
      }
      
      // After successful login, fetch full user data with roles
      if (result.data) {
        const currentUserResult = await api.getCurrentUser();
        if (currentUserResult.data?.user) {
          const userData = currentUserResult.data.user;
          setUser(userData);
          setSession({ user: userData });
          setIsSuspended(userData.is_suspended || false);
          
          if (userData.is_suspended) {
            toast({
              title: 'Account Suspended',
              description: 'Your account has been suspended. Contact support for more information.',
              variant: 'destructive',
            });
            return { error: new Error('Account suspended') };
          }
        } else if (currentUserResult.error) {
          // If getCurrentUser fails, still try to use basic user data from login
          const userData = (result.data as any).user;
          if (userData) {
            setUser(userData);
            setSession({ user: userData });
            setIsSuspended(false);
          }
        }
      }
      return { error: null };
    } catch (error: any) {
      return { error: error instanceof Error ? error : new Error(error?.message || 'Sign in failed') };
    }
  };

  const signOut = async () => {
    try {
      await api.signOut();
      setUser(null);
      setSession(null);
      setIsSuspended(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isSuspended, signUp, signIn, signOut }}>
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
