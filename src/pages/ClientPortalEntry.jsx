import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {  } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { clientPortalAuth, activateClientAccess, notifyClientLogin } from '@/api/functions';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function ClientPortalEntry() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invitationData, setInvitationData] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    useEffect(() => {
        checkAuthAndValidateToken();
    }, []);

    const checkAuthAndValidateToken = async () => {
        if (!token) {
            setError('Geen geldige uitnodigingslink. Controleer uw e-mail.');
            setIsLoading(false);
            return;
        }

        try {
            // Check if user is already logged in
            let currentUser = null;
            try {
                currentUser = await User.me();
                setUser(currentUser);
            } catch (err) {
                // User not logged in, that's okay
                console.log('User not logged in yet');
            }

            // Validate token and get invitation data
            const { data } = await clientPortalAuth({ token });
            
            if (data.success) {
                setInvitationData(data.invitation);

                // If user is logged in, automatically activate access
                if (currentUser) {
                    await activateAccess(currentUser);
                }
            } else {
                setError('Ongeldige of verlopen uitnodiging.');
            }
        } catch (err) {
            console.error('Error validating token:', err);
            setError('Fout bij valideren van uitnodiging.');
        } finally {
            setIsLoading(false);
        }
    };

    const activateAccess = async (currentUser) => {
        try {
            setIsLoading(true);
            const { data } = await activateClientAccess({ token });
            
            if (data.success) {
                // Notify admins that client logged in (fire and forget)
                if (invitationData) {
                    notifyClientLogin({
                        company_id: invitationData.company_id,
                        project_id: invitationData.project_id || data.project_id,
                        project_name: invitationData.project_name,
                        client_name: invitationData.client_name || currentUser?.full_name || currentUser?.email || 'Klant'
                    }).catch(err => console.warn('Client login notification failed:', err));
                }
                
                // Redirect to client portal dashboard
                navigate(`/ClientPortalDashboard?project_id=${data.project_id}`);
            } else {
                setError('Kon toegang niet activeren. Neem contact op met uw schildersbedrijf.');
            }
        } catch (err) {
            console.error('Error activating access:', err);
            setError('Fout bij activeren van toegang. Controleer of u het juiste e-mailadres gebruikt.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            await User.loginWithRedirect(`${window.location.origin}/ClientPortalEntry?token=${token}`);
        } catch (err) {
            console.error('Login error:', err);
            setError('Fout bij inloggen.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600">Uitnodiging valideren...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <img src={paintConnectLogoUrl} alt="PaintConnect" className="h-16 mx-auto mb-6" />
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oeps!</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={() => window.location.href = '/'} className="bg-emerald-600 hover:bg-emerald-700">
                        Terug naar home
                    </Button>
                </div>
            </div>
        );
    }

    if (!user && invitationData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <img src={paintConnectLogoUrl} alt="PaintConnect" className="h-16 mx-auto mb-6" />
                    
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom!</h2>
                        <p className="text-gray-600 mb-4">
                            U bent uitgenodigd om het project <strong>{invitationData.project_name}</strong> te bekijken.
                        </p>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-emerald-800 mb-3">
                            Log in of maak een account aan om toegang te krijgen tot:
                        </p>
                        <ul className="space-y-2 text-sm text-emerald-700">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Real-time projectvoortgang
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Foto's en updates
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Directe communicatie met het team
                            </li>
                        </ul>
                    </div>

                    <Button 
                        onClick={handleLogin}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg"
                    >
                        Inloggen / Account aanmaken
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        U wordt doorgeleid naar een veilige inlogpagina
                    </p>
                </div>
            </div>
        );
    }

    return null;
}