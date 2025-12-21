
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Mail } from "lucide-react";
import { upgradeEmailTemplates } from '@/api/functions';
import { sendTestBrandedEmail } from '@/api/functions';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmailManagement() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [testEmail, setTestEmail] = useState('');
    const [testTemplate, setTestTemplate] = useState('user_verification');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState(null);

    const handleUpgrade = async () => {
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const { data, error: functionError } = await upgradeEmailTemplates();
            if (functionError) {
                throw new Error(functionError.message || "Er is een onbekende fout opgetreden.");
            }
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail) {
            setTestError("Voer een geldig e-mailadres in.");
            return;
        }
        setIsSendingTest(true);
        setTestResult(null);
        setTestError(null);
        try {
            const { data, error: functionError } = await sendTestBrandedEmail({
                recipientEmail: testEmail,
                templateIdentifier: testTemplate,
            });
            if (functionError) {
                throw new Error(functionError.message || "Er is een onbekende fout opgetreden bij het verzenden.");
            }
            setTestResult(data);
        } catch (err) {
            setTestError(err.message);
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Beheer E-mail Sjablonen</CardTitle>
                <CardDescription>
                    Update alle e-mailsjablonen naar de nieuwste versie met de correcte branding en lay-out.
                </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="pb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Klik op de knop hieronder om alle standaard e-mails (zoals verificatie-, uitnodigings- en notificatie-mails) te voorzien van het nieuwste professionele ontwerp. Dit proces overschrijft de bestaande sjablonen.
                    </p>
                    <Button onClick={handleUpgrade} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <InlineSpinner />
                                Bezig met upgraden...
                            </>
                        ) : (
                             <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Upgrade Alle Sjablonen Nu
                            </>
                        )}
                    </Button>
                    
                    {error && (
                         <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 w-full">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div>
                                    <h4 className="font-semibold text-red-800 dark:text-red-300">Upgrade Mislukt</h4>
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {result && (
                         <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 w-full">
                            <h4 className="font-semibold text-green-800 dark:text-green-300">Upgrade Succesvol</h4>
                            <p className="text-sm text-green-600 dark:text-green-400">{result.message}</p>
                            <ul className="text-xs list-disc list-inside mt-1">
                                <li>{result.created} sjablonen aangemaakt.</li>
                                <li>{result.updated} sjablonen bijgewerkt.</li>
                            </ul>
                        </div>
                    )}
                </div>
                <div className="pt-6">
                    <h3 className="text-md font-semibold mb-2">Test de Sjablonen</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Verstuur een test-e-mail om te controleren hoe de nieuwe sjablonen eruit zien in een mailbox.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            type="email"
                            placeholder="Jouw e-mailadres"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                        />
                        <Select value={testTemplate} onValueChange={setTestTemplate}>
                            <SelectTrigger className="sm:w-[250px]">
                                <SelectValue placeholder="Kies sjabloon" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user_verification">E-mail Verificatie</SelectItem>
                                <SelectItem value="user_invitation">Uitnodiging Teamlid</SelectItem>
                                <SelectItem value="client_invitation">Uitnodiging Klantportaal</SelectItem>
                                <SelectItem value="password_reset">Wachtwoord Herstel</SelectItem>
                                <SelectItem value="generic_notification">Algemene Notificatie</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSendTest} disabled={isSendingTest} className="sm:w-auto">
                             {isSendingTest ? (
                                <>
                                    <InlineSpinner />
                                    Bezig...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Verstuur Test
                                </>
                            )}
                        </Button>
                    </div>

                    {testError && (
                         <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 w-full">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div>
                                    <h4 className="font-semibold text-red-800 dark:text-red-300">Test Mislukt</h4>
                                    <p className="text-sm text-red-600 dark:text-red-400">{testError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {testResult && testResult.success && (
                         <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 w-full">
                            <h4 className="font-semibold text-green-800 dark:text-green-300">Testmail Verzonden!</h4>
                            <p className="text-sm text-green-600 dark:text-green-400">De e-mail is succesvol verzonden naar {testEmail}. Controleer je inbox.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
