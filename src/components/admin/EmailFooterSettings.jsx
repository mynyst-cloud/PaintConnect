import React, { useState, useEffect } from 'react';
import { GlobalSettings } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EmailFooterSettings() {
    const [footerSettings, setFooterSettings] = useState({
        copyright: '© {year} PaintConnect. Alle rechten voorbehouden.',
        address: 'PaintConnect, Voorbeeldstraat 1, 1000 Brussel, België'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const settings = await GlobalSettings.filter({ setting_key: 'email_footer' });
            if (settings.length > 0) {
                const footerData = settings[0].setting_value;
                setFooterSettings({
                    copyright: footerData.copyright || '© {year} PaintConnect. Alle rechten voorbehouden.',
                    address: footerData.address || 'PaintConnect, Voorbeeldstraat 1, 1000 Brussel, België'
                });
            }
        } catch (error) {
            console.error('Error loading footer settings:', error);
            setMessage({ type: 'error', text: 'Kon de footer instellingen niet laden.' });
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        setIsSaving(true);
        setMessage(null);
        
        try {
            // Check if settings already exist
            const existingSettings = await GlobalSettings.filter({ setting_key: 'email_footer' });
            
            const settingData = {
                setting_key: 'email_footer',
                setting_value: {
                    copyright: footerSettings.copyright,
                    address: footerSettings.address
                },
                description: 'Footer instellingen voor alle e-mails in het systeem'
            };

            if (existingSettings.length > 0) {
                await GlobalSettings.update(existingSettings[0].id, settingData);
            } else {
                await GlobalSettings.create(settingData);
            }

            setMessage({ type: 'success', text: 'E-mail footer instellingen succesvol opgeslagen!' });
        } catch (error) {
            console.error('Error saving footer settings:', error);
            setMessage({ type: 'error', text: 'Fout bij het opslaan van de instellingen.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
                    <p>Footer instellingen laden...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    E-mail Footer Instellingen
                </CardTitle>
                <p className="text-sm text-gray-600">
                    Beheer de footer tekst die onderaan alle e-mails wordt getoond. 
                    Deze instellingen gelden voor het hele platform.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {message && (
                    <Alert className={message.type === 'error' ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
                        <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="copyright">Copyright Tekst</Label>
                    <Input
                        id="copyright"
                        value={footerSettings.copyright}
                        onChange={(e) => setFooterSettings({...footerSettings, copyright: e.target.value})}
                        placeholder="© {year} PaintConnect. Alle rechten voorbehouden."
                    />
                    <p className="text-xs text-gray-500">
                        Gebruik {'{year}'} voor het huidige jaar. Dit wordt automatisch vervangen.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Adres Informatie</Label>
                    <Textarea
                        id="address"
                        value={footerSettings.address}
                        onChange={(e) => setFooterSettings({...footerSettings, address: e.target.value})}
                        placeholder="PaintConnect, Voorbeeldstraat 1, 1000 Brussel, België"
                        rows={3}
                    />
                    <p className="text-xs text-gray-500">
                        Het bedrijfsadres dat onderaan alle e-mails wordt getoond.
                    </p>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Voorbeeld:</h3>
                    <div className="bg-gray-50 p-4 rounded-md text-center text-sm text-gray-600">
                        <p className="mb-1">{footerSettings.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
                        <p>{footerSettings.address}</p>
                    </div>
                </div>

                <Button 
                    onClick={saveSettings} 
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Opslaan...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Instellingen Opslaan
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}