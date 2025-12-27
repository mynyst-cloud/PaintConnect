import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoginPage from '@/components/auth/LoginPage';

export const AuthContext = React.createContext({});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshAttemptsRef = useRef(0);
  const maxRefreshAttempts = 3;

  useEffect(() => {
    let mounted = true;

    // Helper to refresh session with retry logic
    const refreshSessionWithRetry = async (attempt = 0) => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.warn(`[AuthProvider] Session refresh attempt ${attempt + 1} failed:`, error.message);
          
          // Only retry for certain errors
          if (attempt < maxRefreshAttempts && (
            error.message?.includes('network') || 
            error.message?.includes('fetch') ||
            error.message?.includes('timeout')
          )) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            return refreshSessionWithRetry(attempt + 1);
          }
          
          // If refresh truly failed, check if we have a valid session
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user && mounted) {
            console.log('[AuthProvider] Session refresh failed but valid session exists, keeping user logged in');
            setUser(currentSession.user);
            setLoading(false);
            return;
          }
        } else if (session?.user && mounted) {
          console.log('[AuthProvider] Session refreshed successfully');
          refreshAttemptsRef.current = 0;
          setUser(session.user);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('[AuthProvider] Error during session refresh:', err);
      }
    };

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
        } else {
          // No session found, try to refresh once
          console.log('[AuthProvider] No session found on mount, attempting refresh');
          refreshSessionWithRetry();
        }
        setLoading(false);
      }
    });

    // Listen for auth state changes with better error handling
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state change:', event, session ? 'session exists' : 'no session');
      
      if (!mounted) return;

      // Handle different auth events appropriately
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          // User is authenticated, update state
          if (session?.user) {
            console.log('[AuthProvider] User authenticated:', session.user.email);
            refreshAttemptsRef.current = 0;
            setUser(session.user);
          }
          setLoading(false);
          break;

        case 'SIGNED_OUT':
          // Only clear user on explicit sign out or if session is truly invalid
          console.log('[AuthProvider] User signed out');
          refreshAttemptsRef.current = 0;
          setUser(null);
          setLoading(false);
          break;

        case 'SIGNED_OUT_ERROR':
        case 'TOKEN_REFRESHED_ERROR':
          // Token refresh error - try to refresh session manually
          console.warn('[AuthProvider] Auth error event:', event);
          refreshAttemptsRef.current++;
          
          if (refreshAttemptsRef.current < maxRefreshAttempts) {
            console.log(`[AuthProvider] Attempting manual session refresh (attempt ${refreshAttemptsRef.current})`);
            await refreshSessionWithRetry(refreshAttemptsRef.current - 1);
          } else {
            // After max attempts, check if we still have a valid session
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession?.user && mounted) {
              console.log('[AuthProvider] Max refresh attempts reached but valid session exists');
              setUser(currentSession.user);
            } else {
              console.error('[AuthProvider] Session refresh failed after max attempts');
              setUser(null);
            }
            refreshAttemptsRef.current = 0;
            setLoading(false);
          }
          break;

        default:
          // For other events, update based on session existence
          if (session?.user) {
            setUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
          setLoading(false);
          break;
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/Dashboard'
      }
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Laden..." size="lg" />;
  }

  // Publieke routes die geen auth nodig hebben
  const publicRoutes = [
    '/auth/verify',
    '/InviteAcceptance', 
    '/ActivateAccount', 
    '/Privacy', 
    '/Terms', 
    '/PrivacyPolicy', 
    '/TermsOfService',
    '/ClientPortalEntry',
    '/ClientPortalDashboard'
  ];
  const currentPath = window.location.pathname;
  const isPublicRoute = publicRoutes.some(route => 
    currentPath.toLowerCase().startsWith(route.toLowerCase())
  );

  // Laat publieke routes door zonder login
  if (!user && isPublicRoute) {
    return (
      <AuthContext.Provider value={{ user: null, login }}>
        {children}
      </AuthContext.Provider>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
}