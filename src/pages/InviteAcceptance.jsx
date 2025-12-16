import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';
import { getInviteDetailsByToken } from '@/api/functions';
import { acceptInvitation } from '@/api/functions';
import { createPageUrl } from '@/components/utils';

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

    const handleAcceptInvitation = async () => {
        if (!currentUser) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.href);
            navigate(`${createPageUrl('PasswordLogin')}?returnUrl=${returnUrl}`);
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
                                onClick={() => navigate(createPageUrl('PasswordLogin'))} 
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

                        {!currentUser ? (
                            <div className="space-y-3">
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        U moet ingelogd zijn om deze uitnodiging te accepteren.
                                    </AlertDescription>
                                </Alert>
                                <Button 
                                    onClick={handleAcceptInvitation}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Inloggen om Uitnodiging te Accepteren
                                </Button>
                            </div>
                        ) : (
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