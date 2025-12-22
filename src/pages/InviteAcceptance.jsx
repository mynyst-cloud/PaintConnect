import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, CheckCircle, AlertTriangle, Users, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';
import { getInviteDetailsByToken, acceptInvitation } from '@/api/functions';
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
    
    // States
    const [isLoading, setIsLoading] = useState(true);
    const [inviteData, setInviteData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    // Registration form state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationError, setRegistrationError] = useState('');

    const logoUrl = resolvedTheme === 'dark' ? logoDarkUrl : logoLightUrl;
    
    // Extract token from URL
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');

    // Load invite data and check user
    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            
            if (!token) {
                setError('Geen geldige uitnodigingstoken gevonden.');
                setIsLoading(false);
                return;
            }

            try {
                // Load invite details
                const { data } = await getInviteDetailsByToken({ token });
                
                if (data && data.success) {
                    setInviteData(data.invite);
                } else {
                    setError(data?.error || 'Uitnodiging niet gevonden of verlopen.');
                    setIsLoading(false);
                    return;
                }

                // Check if user is already logged in
                try {
                    const user = await User.me();
                    setCurrentUser(user);
                } catch {
                    // Not logged in - that's fine
                    setCurrentUser(null);
                }
            } catch (err) {
                console.error('Error loading invite:', err);
                setError('Er is een fout opgetreden bij het laden van de uitnodiging.');
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, [token]);

    // Handle registration with password
    const handleRegister = async (e) => {
        e.preventDefault();
        setRegistrationError('');

        // Validation
        if (!password) {
            setRegistrationError('Voer een wachtwoord in.');
            return;
        }
        if (password.length < 8) {
            setRegistrationError('Wachtwoord moet minimaal 8 tekens bevatten.');
            return;
        }
        if (password !== confirmPassword) {
            setRegistrationError('Wachtwoorden komen niet overeen.');
            return;
        }

        setIsRegistering(true);

        try {
            // Step 1: Create user with Supabase Auth (email + password)
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: inviteData.email,
                password: password,
                options: {
                    data: {
                        full_name: inviteData.full_name || inviteData.email.split('@')[0]
                    }
                }
            });

            if (signUpError) {
                // Check if user already exists
                if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
                    // Try to sign in instead
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: inviteData.email,
                        password: password
                    });

                    if (signInError) {
                        if (signInError.message.includes('Invalid login credentials')) {
                            setRegistrationError('Dit e-mailadres is al geregistreerd. Log in met uw bestaande wachtwoord of gebruik "Wachtwoord vergeten".');
                        } else {
                            setRegistrationError(signInError.message);
                        }
                        setIsRegistering(false);
                        return;
                    }
                } else {
                    setRegistrationError(signUpError.message);
                    setIsRegistering(false);
                    return;
                }
            }

            // Step 2: Accept invitation to link user to company
            const { data: acceptData } = await acceptInvitation({ token });

            if (!acceptData?.success) {
                setRegistrationError(acceptData?.error || 'Kon uitnodiging niet accepteren.');
                setIsRegistering(false);
                return;
            }

            // Step 3: Success!
            setSuccess(true);
            setTimeout(() => {
                window.location.href = createPageUrl('Dashboard');
            }, 2000);

        } catch (err) {
            console.error('Registration error:', err);
            setRegistrationError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
        } finally {
            setIsRegistering(false);
        }
    };

    // Handle Google login
    const handleGoogleLogin = async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.href
                }
            });
        } catch (error) {
            console.error('Google login error:', error);
            setRegistrationError('Google login mislukt. Probeer het opnieuw.');
        }
    };

    // Handle accepting invitation for logged-in users
    const handleAcceptInvitation = async () => {
        setIsRegistering(true);
        setRegistrationError('');

        try {
            const { data } = await acceptInvitation({ token });
            
            if (data && data.success) {
                setSuccess(true);
                setTimeout(() => {
                    window.location.href = createPageUrl('Dashboard');
                }, 2000);
            } else {
                setRegistrationError(data?.error || 'Er is een fout opgetreden bij het accepteren van de uitnodiging.');
            }
        } catch (err) {
            console.error('Accept invitation error:', err);
            setRegistrationError('Er is een onverwachte fout opgetreden.');
        } finally {
            setIsRegistering(false);
        }
    };

    // Success screen
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
                                Uw account is succesvol aangemaakt en u bent toegevoegd aan het team van <strong>{inviteData?.company_name}</strong>.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                U wordt automatisch doorgestuurd naar uw dashboard...
                            </p>
                            <div className="flex items-center justify-center">
                                <LoadingSpinner size="sm" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Loading screen
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <LoadingSpinner size="lg" text="Uitnodiging laden..." />
            </div>
        );
    }

    // Error screen
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

    // Main registration form
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <CardHeader className="text-center space-y-4">
                        <img src={logoUrl} alt="PaintConnect" className="h-12 mx-auto" />
                        <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <CardTitle>Maak uw account aan</CardTitle>
                        <CardDescription>
                            U bent uitgenodigd voor het team van <strong className="text-emerald-600">{inviteData?.company_name}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Company info */}
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                                {inviteData?.company_name}
                            </h3>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Rol: {inviteData?.company_role === 'admin' ? 'Administrator' : 'Schilder'}
                            </p>
                        </div>

                        {/* If user is already logged in, just show accept button */}
                        {currentUser ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Ingelogd als: <strong>{currentUser.full_name || currentUser.email}</strong>
                                    </p>
                                </div>
                                
                                {registrationError && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>{registrationError}</AlertDescription>
                                    </Alert>
                                )}

                                <Button 
                                    onClick={handleAcceptInvitation}
                                    disabled={isRegistering}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
                                >
                                    {isRegistering ? (
                                        <>
                                            <InlineSpinner className="mr-2" />
                                            Accepteren...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5 mr-2" />
                                            Uitnodiging Accepteren
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Registration form */}
                                <form onSubmit={handleRegister} className="space-y-4">
                                    {/* Email (readonly) */}
                                    <div>
                                        <Label className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            E-mailadres
                                        </Label>
                                        <Input
                                            type="email"
                                            value={inviteData?.email || ''}
                                            disabled
                                            className="bg-gray-100 dark:bg-gray-700 mt-1"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <Label className="flex items-center gap-2">
                                            <Lock className="w-4 h-4" />
                                            Wachtwoord *
                                        </Label>
                                        <div className="relative mt-1">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Minimaal 8 tekens"
                                                className="pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <Label className="flex items-center gap-2">
                                            <Lock className="w-4 h-4" />
                                            Bevestig wachtwoord *
                                        </Label>
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Herhaal wachtwoord"
                                            className="mt-1"
                                            required
                                        />
                                    </div>

                                    {/* Error message */}
                                    {registrationError && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>{registrationError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Submit button */}
                                    <Button 
                                        type="submit"
                                        disabled={isRegistering}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
                                    >
                                        {isRegistering ? (
                                            <>
                                                <InlineSpinner className="mr-2" />
                                                Account aanmaken...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5 mr-2" />
                                                Account Aanmaken & Uitnodiging Accepteren
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">of</span>
                                    </div>
                                </div>

                                {/* Google Login Alternative */}
                                <Button 
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={isRegistering}
                                    variant="outline"
                                    className="w-full flex items-center justify-center gap-3 py-6"
                                >
                                    <GoogleLogo />
                                    <span>Doorgaan met Google</span>
                                </Button>

                                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    Door te registreren gaat u akkoord met onze voorwaarden en privacybeleid.
                                </p>
                            </>
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
