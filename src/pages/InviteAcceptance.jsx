import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle, AlertTriangle, Users, Mail } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';
import { getInviteDetailsByToken } from '@/api/functions';
import { acceptInvitation } from '@/api/functions';
import { createPageUrl } from '@/components/utils';

// Google Logo SVG
const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const logoLightUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const logoDarkUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";

function InviteAcceptanceContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { resolvedTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [inviteData, setInviteData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [autoAcceptAttempted, setAutoAcceptAttempted] = useState(false);

    const logoUrl = resolvedTheme === 'dark' ? logoDarkUrl : logoLightUrl;
    
    // Extract token from URL
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');

    useEffect(() => {
        const loadInviteData = async () => {
            if (!token) {
                setError('Geen geldige uitnodigingstoken gevonden.');
                return;
            }

            try {
                const { data } = await getInviteDetailsByToken({ token });
                if (data && data.success) {
                    setInviteData(data.invite);
                } else {
                    setError(data.error || 'Uitnodiging niet gevonden of verlopen.');
                }
            } catch (err) {
                setError('Er is een fout opgetreden bij het laden van de uitnodiging.');
            }
        };

        const checkCurrentUser = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
            } catch (err) {
                // User not logged in, will need to login/register
                setCurrentUser(null);
            }
        };

        loadInviteData();
        checkCurrentUser();
    }, [token]);

    // AUTO-ACCEPT: When user is logged in and invite is valid, automatically accept
    useEffect(() => {
        const autoAccept = async () => {
            // Only auto-accept if:
            // 1. User is logged in
            // 2. Invite data is loaded
            // 3. We haven't already tried
            // 4. Not already in loading/success state
            if (currentUser && inviteData && !autoAcceptAttempted && !isLoading && !success && !error) {
                console.log('[AUTO-ACCEPT] User is logged in, automatically accepting invitation...');
                setAutoAcceptAttempted(true);
                setIsLoading(true);

                try {
                    const { data } = await acceptInvitation({ token });
                    if (data && data.success) {
                        console.log('[AUTO-ACCEPT] Success! Redirecting to Dashboard...');
                        setSuccess(true);
                        setTimeout(() => {
                            window.location.href = createPageUrl('Dashboard');
                        }, 2000);
                    } else {
                        console.log('[AUTO-ACCEPT] Failed:', data?.error);
                        setError(data.error || 'Er is een fout opgetreden bij het accepteren van de uitnodiging.');
                    }
                } catch (err) {
                    console.error('[AUTO-ACCEPT] Error:', err);
                    setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        autoAccept();
    }, [currentUser, inviteData, autoAcceptAttempted, isLoading, success, error, token]);

    const handleAcceptInvitation = async () => {
        if (!currentUser) {
            // User not logged in - should not happen as we show login buttons
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data } = await acceptInvitation({ token });
            if (data && data.success) {
                setSuccess(true);
                // BELANGRIJKE FIX: Na succesvolle acceptatie direct naar Dashboard zonder setupComplete parameter
                // Dit voorkomt dat de uitgenodigde schilder naar bedrijfsregistratie wordt geleid
                setTimeout(() => {
                    window.location.href = createPageUrl('Dashboard'); // Hard redirect om user data te refreshen
                }, 2000);
            } else {
                setError(data.error || 'Er is een fout opgetreden bij het accepteren van de uitnodiging.');
            }
        } catch (err) {
            setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google login - redirects back to this page after auth
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.href // Come back to this invite page
                }
            });
        } catch (error) {
            console.error('Google login error:', error);
            setError('Google login mislukt. Probeer het opnieuw.');
            setIsLoading(false);
        }
    };

    // Handle Magic Link login
    const handleMagicLink = async () => {
        // #region agent log
        console.log('[DEBUG] handleMagicLink called, inviteData:', { email: inviteData?.email, hasInviteData: !!inviteData });
        // #endregion
        
        if (!inviteData?.email) {
            console.log('[DEBUG] No email in inviteData, returning early');
            return;
        }
        
        setIsLoading(true);
        try {
            console.log('[DEBUG] Calling sendMagicLink with email:', inviteData.email);
            const { data, error } = await supabase.functions.invoke('sendMagicLink', {
                body: {
                    email: inviteData.email,
                    redirectTo: window.location.pathname + window.location.search
                }
            });
            console.log('[DEBUG] sendMagicLink response:', { data, error: error?.message });
            
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            
            setError(null);
            alert(`Login link verstuurd naar ${inviteData.email}. Controleer uw inbox!`);
        } catch (error) {
            console.error('Magic link error:', error);
            setError(error.message || 'Kon login link niet versturen.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Card className="shadow-lg border-emerald-200 dark:border-emerald-800">
                        <CardHeader className="text-center space-y-4">
                            <img src={logoUrl} alt="PaintConnect" className="h-12 mx-auto" />
                            <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <CardTitle className="text-emerald-700 dark:text-emerald-300">Welkom in het team!</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                U bent succesvol toegevoegd aan het team van <strong>{inviteData?.company_name}</strong>.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                U wordt automatisch doorgestuurd naar uw dashboard...
                            </p>
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!inviteData && !error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Uitnodiging laden...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Card className="shadow-lg border-red-200 dark:border-red-800">
                        <CardHeader className="text-center space-y-4">
                            <img src={logoUrl} alt="PaintConnect" className="h-12 mx-auto" />
                            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-red-700 dark:text-red-300">Uitnodiging probleem</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                            <Button 
                                onClick={() => navigate('/')} 
                                className="w-full"
                                variant="outline"
                            >
                                Naar Login
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <CardHeader className="text-center space-y-4">
                        <img src={logoUrl} alt="PaintConnect" className="h-12 mx-auto" />
                        <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <CardTitle>Uitnodiging voor team</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center space-y-2">
                            <p className="text-gray-600 dark:text-gray-300">
                                U bent uitgenodigd om deel uit te maken van het team van:
                            </p>
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 text-lg">
                                    {inviteData?.company_name}
                                </h3>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                    Rol: Schilder
                                </p>
                            </div>
                        </div>

                        {/* Show auto-accepting state when logged in and processing */}
                        {currentUser && isLoading && (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
                                    <p className="text-emerald-800 dark:text-emerald-200 font-medium">
                                        Uitnodiging wordt geaccepteerd...
                                    </p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                        Even geduld, u wordt zo doorgestuurd.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!currentUser ? (
                            <div className="space-y-4">
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        Log in om deze uitnodiging te accepteren.
                                    </AlertDescription>
                                </Alert>
                                
                                {/* Google Login */}
                                <Button 
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="w-full flex items-center justify-center gap-3 py-6"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <GoogleLogo />
                                            <span>Doorgaan met Google</span>
                                        </>
                                    )}
                                </Button>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">of</span>
                                    </div>
                                </div>

                                {/* Magic Link */}
                                <Button 
                                    onClick={handleMagicLink}
                                    disabled={isLoading || !inviteData?.email}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Mail className="w-5 h-5 mr-2" />
                                            <span>Login link naar {inviteData?.email}</span>
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    We sturen een login link naar het e-mailadres waarop u bent uitgenodigd.
                                </p>
                            </div>
                        ) : !isLoading && (
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Ingelogd als: <strong>{currentUser.full_name || currentUser.email}</strong>
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleAcceptInvitation}
                                    disabled={isLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Accepteren...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Uitnodiging Accepteren
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function InviteAcceptance() {
    return (
        <ThemeProvider>
            <InviteAcceptanceContent />
        </ThemeProvider>
    );
}