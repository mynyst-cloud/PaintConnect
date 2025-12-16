import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { sendNewsletter } from '@/api/functions';
import { Loader2, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


export default function NewsletterManager() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState({
        companies: false,
        painters: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSendNewsletter = async (e) => {
        e.preventDefault();
        if (!subject || !message || (!targetAudience.companies && !targetAudience.painters)) {
            alert('Vul een onderwerp, bericht en doelgroep in.');
            return;
        }

        if (!confirm(`Weet u zeker dat u deze nieuwsbrief wilt versturen?`)) {
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const { data } = await sendNewsletter({
                subject,
                message,
                recipients: targetAudience
            });
            
            if (data.error) throw new Error(data.error);

            // Detailed result processing
            const { sentCount = 0, failedCount = 0, failures = [], message: responseMessage } = data;
            
            let resultParts = [];
            if (responseMessage) {
                 resultParts.push(responseMessage);
            } else {
                if (sentCount > 0) resultParts.push(`Succesvol verzonden naar ${sentCount} ontvanger(s).`);
                if (failedCount > 0) resultParts.push(`Mislukt voor ${failedCount} ontvanger(s).`);
                if (sentCount === 0 && failedCount === 0) resultParts.push('Geen ontvangers gevonden voor de geselecteerde doelgroep.');
            }

            setResult({ 
                success: failedCount === 0, 
                message: resultParts.join(' '),
                failures: failures
            });

            if (failedCount === 0) {
              setSubject('');
              setMessage('');
            }
        } catch (error) {
            setResult({ success: false, message: `Versturen mislukt: ${error.message}`, failures: [] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAudienceChange = (key) => {
        setTargetAudience(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Nieuwsbrief Beheer</CardTitle>
                <CardDescription>Verstuur een nieuwsbrief naar alle gebruikers of specifieke groepen.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSendNewsletter} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Onderwerp</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Belangrijke update over PaintConnect"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Bericht (ondersteunt basis HTML)</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Beste gebruiker,&#10;&#10;Hierbij een belangrijke update..."
                            rows={10}
                            required
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Doelgroep</Label>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="companies"
                                    checked={targetAudience.companies}
                                    onCheckedChange={() => handleAudienceChange('companies')}
                                />
                                <Label htmlFor="companies">Alle Bedrijfseigenaren</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="painters"
                                    checked={targetAudience.painters}
                                    onCheckedChange={() => handleAudienceChange('painters')}
                                />
                                <Label htmlFor="painters">Alle Schilders</Label>
                            </div>
                        </div>
                    </div>
                    
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Verstuur Nieuwsbrief
                    </Button>

                    {result && (
                        <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                           {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                           <AlertTitle>{result.success ? 'Verzending voltooid' : 'Verzending deels of volledig mislukt'}</AlertTitle>
                           <AlertDescription>
                                {result.message}
                                {result.failures && result.failures.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold">Details van mislukte verzendingen:</h4>
                                        <ul className="list-disc pl-5 mt-2 text-xs">
                                            {result.failures.map((failure, index) => (
                                                <li key={index}>
                                                    <strong>{failure.email}:</strong> {failure.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                           </AlertDescription>
                        </Alert>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}