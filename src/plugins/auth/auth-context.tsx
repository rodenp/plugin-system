import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthSession, AuthProvider, SignInCredentials, SignUpCredentials } from './types';
import { eventBus } from '@core/event-bus';

interface AuthContextType {
  // State
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;

  // Methods
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  signInWithProvider?: (provider: 'google' | 'github' | 'discord') => Promise<void>;

  // Helpers
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  authProvider: AuthProvider;
}

export function AuthProvider({ children, authProvider }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        const currentSession = await authProvider.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Emit sign-in event
          eventBus.emit({
            type: 'user:signedIn',
            payload: { user: currentSession.user },
            timestamp: new Date()
          });
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [authProvider]);

  // Auto-refresh session
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(async () => {
      try {
        const refreshedSession = await authProvider.refreshSession();
        if (refreshedSession) {
          setSession(refreshedSession);
          setUser(refreshedSession.user);
          
          eventBus.emit({
            type: 'session:refreshed',
            payload: { session: refreshedSession },
            timestamp: new Date()
          });
        }
      } catch (err) {
        console.error('Failed to refresh session:', err);
        // Session expired, sign out
        await signOut();
        
        eventBus.emit({
          type: 'session:expired',
          payload: { userId: user?.id || '' },
          timestamp: new Date()
        });
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [session, authProvider]);

  const signIn = async (credentials: SignInCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const newSession = await authProvider.signIn(credentials);
      setSession(newSession);
      setUser(newSession.user);

      eventBus.emit({
        type: 'user:signedIn',
        payload: { user: newSession.user },
        timestamp: new Date()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: SignUpCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const newSession = await authProvider.signUp(credentials);
      setSession(newSession);
      setUser(newSession.user);

      eventBus.emit({
        type: 'user:signedUp',
        payload: { user: newSession.user },
        timestamp: new Date()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = user?.id || '';
      
      await authProvider.signOut();
      setSession(null);
      setUser(null);

      eventBus.emit({
        type: 'user:signedOut',
        payload: { userId },
        timestamp: new Date()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      setLoading(true);
      setError(null);

      const updatedUser = await authProvider.updateUser(user.id, updates);
      setUser(updatedUser);

      if (session) {
        setSession({ ...session, user: updatedUser });
      }

      eventBus.emit({
        type: 'user:updated',
        payload: { user: updatedUser },
        timestamp: new Date()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      await authProvider.resetPassword(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      setLoading(true);
      setError(null);

      await authProvider.updatePassword(user.id, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in');

    try {
      setLoading(true);
      setError(null);

      await authProvider.sendVerificationEmail(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      await authProvider.verifyEmail(token);
      
      // Refresh user data
      const currentUser = await authProvider.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        if (session) {
          setSession({ ...session, user: currentUser });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = authProvider.signInWithProvider ? async (provider: 'google' | 'github' | 'discord') => {
    try {
      setLoading(true);
      setError(null);

      const newSession = await authProvider.signInWithProvider!(provider);
      setSession(newSession);
      setUser(newSession.user);

      eventBus.emit({
        type: 'user:signedIn',
        payload: { user: newSession.user },
        timestamp: new Date()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  } : undefined;

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateUser,
    resetPassword,
    updatePassword,
    sendVerificationEmail,
    verifyEmail,
    signInWithProvider,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isInstructor: user?.role === 'instructor' || user?.role === 'admin'
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