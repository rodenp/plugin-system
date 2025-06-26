import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { eventBus } from '@core/event-bus';
const AuthContext = createContext(undefined);
export function AuthProvider({ children, authProvider }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            }
            catch (err) {
                console.error('Failed to initialize auth:', err);
                setError(err instanceof Error ? err.message : 'Authentication failed');
            }
            finally {
                setLoading(false);
            }
        };
        initializeAuth();
    }, [authProvider]);
    // Auto-refresh session
    useEffect(() => {
        if (!session)
            return;
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
            }
            catch (err) {
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
    const signIn = async (credentials) => {
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
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
            setError(errorMessage);
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const signUp = async (credentials) => {
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
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
            setError(errorMessage);
            throw err;
        }
        finally {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign out failed');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const updateUser = async (updates) => {
        if (!user)
            throw new Error('No user logged in');
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const resetPassword = async (email) => {
        try {
            setLoading(true);
            setError(null);
            await authProvider.resetPassword(email);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const updatePassword = async (newPassword) => {
        if (!user)
            throw new Error('No user logged in');
        try {
            setLoading(true);
            setError(null);
            await authProvider.updatePassword(user.id, newPassword);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update password');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const sendVerificationEmail = async () => {
        if (!user)
            throw new Error('No user logged in');
        try {
            setLoading(true);
            setError(null);
            await authProvider.sendVerificationEmail(user.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send verification email');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const verifyEmail = async (token) => {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify email');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const signInWithProvider = authProvider.signInWithProvider ? async (provider) => {
        try {
            setLoading(true);
            setError(null);
            const newSession = await authProvider.signInWithProvider(provider);
            setSession(newSession);
            setUser(newSession.user);
            eventBus.emit({
                type: 'user:signedIn',
                payload: { user: newSession.user },
                timestamp: new Date()
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'OAuth sign in failed');
            throw err;
        }
        finally {
            setLoading(false);
        }
    } : undefined;
    const value = {
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
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
