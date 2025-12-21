import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoginPage from '@/components/auth/LoginPage';

export const AuthContext = React.createContext({});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
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