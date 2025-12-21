import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

      // #region agent log
      console.log('[DEBUG HYP-B] Token from URL:', { token: token ? token.substring(0, 8) + '...' : null, hasToken: !!token });
      // #endregion

      if (!token) {
        setStatus('error');
        setMessage('Geen geldige link. Probeer opnieuw in te loggen.');
        return;
      }

      let responseData = null;
      try {
        // #region agent log
        console.log('[DEBUG HYP-A] Calling verifyMagicLink with token:', token.substring(0, 8));
        // #endregion

        // Verify the magic link token
        const { data, error } = await supabase.functions.invoke('verifyMagicLink', {
          body: { token }
        });
        responseData = data;

        // #region agent log
        console.log('[DEBUG HYP-A/C/D/E] verifyMagicLink response:', { hasData: !!data, success: data?.success, error: error?.message || data?.error, hasActionLink: !!data?.actionLink, requiresGoogle: data?.requiresGoogleLogin, fullData: data });
        console.log('[DEBUG AUTO-LINK] Company linking debug:', data?.autoLinkDebug);
        console.log('[DEBUG AUTO-LINK] Company linked?', data?.companyLinked, 'Company name:', data?.companyName);
        // #endregion

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Verificatie mislukt');

        setEmail(data.email || '');

        // If we got an action link, redirect to it to establish a Supabase session
        // The actionLink is a Supabase magic link URL that will:
        // 1. Verify the token
        // 2. Create a session cookie
        // 3. Redirect to the redirect_to URL (InviteAcceptance or Dashboard)
        if (data.actionLink) {
          // #region agent log
          console.log('[DEBUG FIX] Got actionLink, redirecting to Supabase to establish session');
          console.log('[DEBUG FIX] actionLink:', data.actionLink?.substring(0, 80) + '...');
          // #endregion

          setStatus('success');
          setMessage('Inloggen geslaagd! U wordt doorgestuurd...');
          
          // Redirect to Supabase's magic link URL
          // This is the FIX - we redirect instead of trying to parse tokens
          setTimeout(() => {
            window.location.href = data.actionLink;
          }, 500);
          return;
        }

        // If no action link (requires Google login)
        if (data.requiresGoogleLogin) {
          // #region agent log
          console.log('[DEBUG] No actionLink, requires Google login');
          // #endregion
          setStatus('success');
          setMessage('E-mail geverifieerd! Log in via Google om door te gaan.');
        } else {
          // Fallback - shouldn't normally happen
          setStatus('success');
          setMessage('Verificatie geslaagd! U wordt doorgestuurd...');
          setTimeout(() => {
            navigate(data.redirectTo || '/Dashboard');
          }, 1500);
        }

      } catch (error) {
        // #region agent log
        console.log('[DEBUG HYP-A] Verification FAILED:', { 
          errorMessage: error?.message, 
          errorName: error?.name,
          responseData: responseData
        });
        // #endregion

        console.error('Verify error:', error);
        setStatus('error');
        
        // Show more detailed error message
        let errorMsg = error.message || 'Er is een fout opgetreden. Probeer opnieuw in te loggen.';
        if (responseData?.debug) {
          console.log('[DEBUG] Error debug info:', responseData.debug);
          if (responseData.debug.alreadyUsed) {
            errorMsg = 'Deze link is al gebruikt. Vraag een nieuwe uitnodiging aan.';
          }
        }
        setMessage(errorMsg);
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
            <LoadingSpinner size="lg" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 mt-6">
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

