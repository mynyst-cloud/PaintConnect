import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { authVerifyEmail } from '@/api/functions';
import { resendVerificationEmail } from '@/api/functions';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createPageUrl } from '@/components/utils';

const logoLightUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const logoDarkUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, verified, error, idle
    const [error, setError] = useState(null);
    const { resolvedTheme } = useTheme();
    const logoUrl = resolvedTheme === 'dark' ? logoDarkUrl : logoLightUrl;
    
    const [emailForResend, setEmailForResend] = useState('');
    const [resendStatus, setResendStatus] = useState({ loading: false, message: '', error: '' });
    const [canResend, setCanResend] = useState(true);

    const token = searchParams.get('token');

    const verifyToken = useCallback(async (tokenToVerify) => {
        setStatus('verifying');
        try {
            const { data } = await authVerifyEmail({ token: tokenToVerify });
            if (data.success) {
                setStatus('verified');
                setTimeout(() => navigate(createPageUrl('RegistratieSetup')), 3000);
            } else {
                setStatus('error');
                setError(data.error || 'Verificatie mislukt.');
            }
        } catch (err) {
            setStatus('error');
            setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
        }
    }, [navigate]);

    useEffect(() => {
        if (token) {
            verifyToken(token);
        } else {
            setStatus('idle'); // No token, show resend form
        }
    }, [token, verifyToken]);

    const handleResendEmail = async (e) => {
        e.preventDefault();
        if (!emailForResend) {
            setResendStatus({ ...resendStatus, error: 'Voer een e-mailadres in.' });
            return;
        }
        setResendStatus({ loading: true, message: '', error: '' });
        setCanResend(false);

        try {
            const { data } = await resendVerificationEmail({ email: emailForResend });
            setResendStatus({ loading: false, message: data.message || 'Verificatie-e-mail is opnieuw verzonden.', error: '' });
        } catch (err) {
            setResendStatus({ loading: false, message: '', error: 'Er is een fout opgetreden. Probeer het later opnieuw.' });
        }

        const timer = setTimeout(() => setCanResend(true), 60000); // 60 seconds cooldown
        return () => clearTimeout(timer);
    };

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <h2 className="text-xl font-semibold">Account verifiëren...</h2>
                        <p className="text-gray-500">Een ogenblik geduld.</p>
                    </div>
                );
            case 'verified':
                return (
                    <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold">Account Geverifieerd!</h2>
                        <p className="text-gray-500">U wordt doorgestuurd om uw account in te stellen.</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold">Verificatie Mislukt</h2>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <p className="text-sm">De link is mogelijk verlopen of ongeldig. Vraag een nieuwe aan.</p>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <>
                        <div className="flex flex-col items-center text-center">
                           <Mail className="w-12 h-12 text-emerald-600 mb-4"/>
                           <h2 className="text-xl font-bold">Controleer uw e-mail</h2>
                           <p className="text-gray-600 dark:text-gray-300">We hebben een verificatielink naar uw e-mailadres gestuurd. Klik op de link in de e-mail om uw account te activeren.</p>
                        </div>
                        <div className="mt-6 pt-6 border-t dark:border-gray-700">
                             <form onSubmit={handleResendEmail} className="space-y-4">
                                <p className="text-center font-semibold">Niks ontvangen?</p>
                                {resendStatus.message && <Alert variant="default" className="bg-emerald-50 border-emerald-200 text-emerald-800"><AlertDescription>{resendStatus.message}</AlertDescription></Alert>}
                                {resendStatus.error && <Alert variant="destructive"><AlertDescription>{resendStatus.error}</AlertDescription></Alert>}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="sr-only">E-mailadres</Label>
                                    <Input id="email" type="email" value={emailForResend} onChange={(e) => setEmailForResend(e.target.value)} required placeholder="uw@email.com" disabled={!canResend} />
                                </div>
                                <Button type="submit" className="w-full" disabled={resendStatus.loading || !canResend}>
                                    {resendStatus.loading ? <InlineSpinner /> : null}
                                    {!canResend ? 'Verzonden, wacht 1 min' : 'Verstuur opnieuw'}
                                </Button>
                            </form>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <img src={logoUrl} alt="PaintConnect Logo" className="w-40 mx-auto mb-4"/>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                    <div className="mt-6 text-center text-sm">
                       <Link to={createPageUrl("PasswordLogin")} className="text-emerald-600 hover:underline">
                           Terug naar inloggen
                       </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}