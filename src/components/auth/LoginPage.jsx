import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Paintbrush, 
  Shield, 
  Clock, 
  Users, 
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Mail
} from 'lucide-react';
import { InlineSpinner } from '@/components/ui/LoadingSpinner';

// PaintConnect Logo URLs
const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";
const LOGO_FAVICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png";

// Google Logo SVG
const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const features = [
  { icon: Clock, text: 'Check-in/out met GPS tracking' },
  { icon: Users, text: 'Team management & planning' },
  { icon: Smartphone, text: 'Werkt op alle apparaten' },
  { icon: Shield, text: 'Veilig & AVG-proof' },
];

const stats = [
  { value: '500+', label: 'Schildersbedrijven' },
  { value: '10.000+', label: 'Projecten beheerd' },
  { value: '99.9%', label: 'Uptime' },
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/Dashboard'
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      // Use custom magic link via Resend (bypasses Supabase SMTP)
      const { data, error } = await supabase.functions.invoke('sendMagicLink', {
        body: {
          email: email.trim().toLowerCase(),
          redirectTo: '/Dashboard'
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setEmailSent(true);
    } catch (error) {
      console.error('Magic link error:', error);
      alert(error.message || 'Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-emerald-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div>
            <img 
              src={LOGO_DARK} 
              alt="PaintConnect" 
              className="h-12 w-auto"
            />
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                De complete oplossing voor{' '}
                <span className="text-emerald-200">schildersbedrijven</span>
              </h1>
              <p className="mt-4 text-lg text-white/80 max-w-lg">
                Beheer uw projecten, team en materialen in één overzichtelijk platform. 
                Klaar voor de nieuwe wetgeving van 2027.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transition-transform hover:scale-105"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src={LOGO_FAVICON} 
              alt="PaintConnect" 
              className="h-16 w-16"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welkom bij PaintConnect
            </h2>
            <p className="mt-2 text-gray-600">
              Log in om toegang te krijgen tot uw dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {!emailSent ? (
              <>
                {/* Google Login Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <InlineSpinner />
                  ) : (
                    <>
                      <GoogleLogo />
                      <span>Doorgaan met Google</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">of</span>
                  </div>
                </div>

                {/* Email Form Toggle */}
                {!showEmailForm ? (
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition-all duration-200"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Doorgaan met e-mail</span>
                  </button>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mailadres
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="naam@bedrijf.nl"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                    >
                      {isLoading ? (
                        <InlineSpinner />
                      ) : (
                        <>
                          <span>Stuur login link</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="w-full text-sm text-gray-500 hover:text-gray-700"
                    >
                      Terug naar andere opties
                    </button>
                  </form>
                )}
              </>
            ) : (
              /* Email Sent Confirmation */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Check je inbox!
                </h3>
                <p className="text-gray-600 mb-4">
                  We hebben een login link gestuurd naar<br />
                  <span className="font-medium text-gray-900">{email}</span>
                </p>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Ander e-mailadres gebruiken
                </button>
              </div>
            )}
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Nog geen account?{' '}
              <a 
                href="https://paintconnect.be/#pricing" 
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Bekijk onze pakketten
              </a>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>AVG-proof</span>
            </div>
          </div>

          {/* Mobile Features (visible only on mobile) */}
          <div className="lg:hidden mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              {features.slice(0, 4).map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <feature.icon className="w-4 h-4 text-emerald-600" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

