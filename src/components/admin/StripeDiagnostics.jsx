import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { setupStripePortal } from '@/api/functions';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';

export default function StripeDiagnostics() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSetup = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const { data } = await setupStripePortal();
            setResult({ success: true, message: data.message });
        } catch (error) {
            setResult({ success: false, message: error.response?.data?.error || error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Stripe Klantenportaal Configuratie</CardTitle>
                <CardDescription>
                    Repareer problemen met de abonnementsbeheer pagina.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-gray-600">
                    Als gebruikers een foutmelding krijgen bij het openen van hun abonnement, kan het zijn dat de Stripe klantenportaal niet is ingesteld. Klik op de knop hieronder om een standaard configuratie aan te maken. Dit is een eenmalige actie.
                </p>
                <Button onClick={handleSetup} disabled={isLoading}>
                    {isLoading ? <InlineSpinner className="mr-2" /> : null}
                    Stel Standaard Portaal In
                </Button>
                {result && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        <span>{result.message}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}