import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { getInviteDetailsByToken } from '@/api/functions';
import { acceptInvitation } from '@/api/functions';
import { createPageUrl } from '@/components/utils';

export default function ActivateAccount() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [inviteDetails, setInviteDetails] = useState(null);
    const [user, setUser] = useState(null);

    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    // Check if user is logged in
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (err) {
                // User is not logged in
                setUser(null);
            }
        };
        
        checkAuthStatus();
    }, []);

    // Load invite details
    useEffect(() => {
        const loadInviteDetails = async () => {
            if (!token) {
                setError('Geen geldig activatietoken gevonden.');
                setLoading(false);
                return;
            }

            try {
                const { data } = await getInviteDetailsByToken({ token });
                
                if (data.error) {
                    setError(data.error);
                } else {
                    setInviteDetails(data.invite);
                }
            } catch (err) {
                console.error('Error loading invite details:', err);
                setError('Fout bij het laden van uitnodigingsgegevens.');
            } finally {
                setLoading(false);
            }
        };

        loadInviteDetails();
    }, [token]);

    // Process invitation if user is logged in
    useEffect(() => {
        const processInvitation = async () => {
            if (!user || !inviteDetails || success || error) return;

            // Check if the logged-in user's email matches the invited email
            if (user.email !== inviteDetails.email) {
                setError(`U bent ingelogd als ${user.email}, maar de uitnodiging is voor ${inviteDetails.email}. Log uit en log in met het juiste account.`);
                return;
            }

            try {
                setLoading(true);
                const { data } = await acceptInvitation({ token });
                
                if (data.error) {
                    setError(data.error);
                } else {
                    setSuccess(true);
                    // Redirect to dashboard after successful activation
                    setTimeout(() => {
                        navigate(createPageUrl('Dashboard'));
                    }, 2000);
                }
            } catch (err) {
                console.error('Error accepting invitation:', err);
                setError('Fout bij het accepteren van de uitnodiging.');
            } finally {
                setLoading(false);
            }
        };

        processInvitation();
    }, [user, inviteDetails, token, navigate, success, error]);

    const handleLoginRedirect = () => {
        // Redirect to registration/login with the token as a parameter
        const loginUrl = `${createPageUrl('Registreren')}?invite_token=${token}`;
        window.location.href = loginUrl;
    };

    const handleLogout = async () => {
        try {
            await User.logout();
            window.location.reload();
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <InlineSpinner />
                            Uitnodiging Verwerken
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-gray-600">Even geduld, we verwerken uw uitnodiging...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Fout
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600">{error}</p>
                        {user && user.email !== inviteDetails?.email && (
                            <Button onClick={handleLogout} variant="outline">
                                Uitloggen en opnieuw proberen
                            </Button>
                        )}
                        <Button onClick={() => navigate(createPageUrl('Dashboard'))} variant="outline">
                            Terug naar Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            Uitnodiging Geaccepteerd!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600">
                            Welkom bij {inviteDetails?.company_name}! U wordt doorgestuurd naar het dashboard.
                        </p>
                        <div className="flex justify-center">
                            <InlineSpinner />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // User is not logged in, show login prompt
    if (!user && inviteDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <LogIn className="w-5 h-5" />
                            Uitnodiging van {inviteDetails.company_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="space-y-2">
                            <p className="text-gray-800 font-medium">
                                Hallo {inviteDetails.full_name || inviteDetails.email}!
                            </p>
                            <p className="text-gray-600">
                                U bent uitgenodigd om deel te nemen aan <strong>{inviteDetails.company_name}</strong> op PaintConnect.
                            </p>
                            <p className="text-sm text-gray-500">
                                Om uw uitnodiging te accepteren, moet u eerst inloggen of een account aanmaken met het e-mailadres: <strong>{inviteDetails.email}</strong>
                            </p>
                        </div>
                        
                        <Button 
                            onClick={handleLoginRedirect}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            Inloggen / Account Aanmaken
                        </Button>
                        
                        <p className="text-xs text-gray-400">
                            Na het inloggen wordt u automatisch toegevoegd aan het team.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}