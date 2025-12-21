import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';

const LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";

export default function MagicLinkVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Geen geldige link. Probeer opnieuw in te loggen.');
        return;
      }

      try {
        // Verify the magic link token
        const { data, error } = await supabase.functions.invoke('verifyMagicLink', {
          body: { token }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Verificatie mislukt');

        setEmail(data.email || '');

        // If we got an action link, use it to log in
        if (data.actionLink) {
          // Extract the token parts from the action link and use them
          const url = new URL(data.actionLink);
          const accessToken = url.hash?.match(/access_token=([^&]+)/)?.[1];
          const refreshToken = url.hash?.match(/refresh_token=([^&]+)/)?.[1];

          if (accessToken && refreshToken) {
            // Set the session directly
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (!sessionError) {
              setStatus('success');
              setMessage('Inloggen geslaagd! U wordt doorgestuurd...');
              
              // Redirect to dashboard
              setTimeout(() => {
                navigate(data.redirectTo || '/Dashboard');
              }, 1500);
              return;
            }
          }
        }

        // If action link didn't work, show success with Google login option
        if (data.requiresGoogleLogin) {
          setStatus('success');
          setMessage('E-mail geverifieerd! Log in via Google om door te gaan.');
        } else {
          setStatus('success');
          setMessage('Verificatie geslaagd! U wordt doorgestuurd...');
          setTimeout(() => {
            navigate(data.redirectTo || '/Dashboard');
          }, 1500);
        }

      } catch (error) {
        console.error('Verify error:', error);
        setStatus('error');
        setMessage(error.message || 'Er is een fout opgetreden. Probeer opnieuw in te loggen.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/Dashboard'
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleRetry = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <img 
          src={LOGO} 
          alt="PaintConnect" 
          className="h-12 mx-auto mb-8"
        />

        {/* Status Icons */}
        {status === 'verifying' && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Link verifiëren...
            </h2>
            <p className="text-gray-600">
              Even geduld terwijl we uw login link controleren.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificatie geslaagd!
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            {message.includes('Google') && (
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Doorgaan met Google</span>
              </button>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificatie mislukt
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
            >
              <Mail className="w-5 h-5" />
              <span>Opnieuw proberen</span>
            </button>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Problemen met inloggen?{' '}
            <a href="mailto:support@paintconnect.be" className="text-emerald-600 hover:underline">
              Neem contact op
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

