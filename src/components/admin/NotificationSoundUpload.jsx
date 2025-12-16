import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { GlobalSettings } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Volume2, Trash2, Loader2, CheckCircle, Play } from 'lucide-react';

export default function NotificationSoundUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [currentSoundUrl, setCurrentSoundUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [audio, setAudio] = useState(null);

    useEffect(() => {
        loadCurrentSound();
    }, []);

    const loadCurrentSound = async () => {
        try {
            setIsLoading(true);
            const settings = await GlobalSettings.filter({}, '', 1);
            if (settings && settings.length > 0 && settings[0].notification_sound_url) {
                setCurrentSoundUrl(settings[0].notification_sound_url);
            }
        } catch (error) {
            console.error('Error loading notification sound:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('audio/')) {
            setMessage({ type: 'error', text: 'Selecteer een geldig audiobestand.' });
            return;
        }

        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            setMessage({ type: 'error', text: 'Bestand is te groot. Maximaal 1MB toegestaan.' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            // Upload file using Base44 integration
            const response = await base44.integrations.Core.UploadFile({ file });
            const uploadedUrl = response.file_url;

            // Save to GlobalSettings
            const settings = await GlobalSettings.filter({}, '', 1);
            if (settings && settings.length > 0) {
                await GlobalSettings.update(settings[0].id, {
                    notification_sound_url: uploadedUrl
                });
            } else {
                await GlobalSettings.create({
                    notification_sound_url: uploadedUrl
                });
            }

            setCurrentSoundUrl(uploadedUrl);
            setMessage({ type: 'success', text: 'Notificatiegeluid succesvol geüpload!' });
        } catch (error) {
            console.error('Error uploading notification sound:', error);
            setMessage({ type: 'error', text: 'Fout bij uploaden: ' + error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteSound = async () => {
        if (!window.confirm('Weet je zeker dat je het notificatiegeluid wilt verwijderen?')) {
            return;
        }

        try {
            const settings = await GlobalSettings.filter({}, '', 1);
            if (settings && settings.length > 0) {
                await GlobalSettings.update(settings[0].id, {
                    notification_sound_url: null
                });
            }
            setCurrentSoundUrl('');
            setMessage({ type: 'success', text: 'Notificatiegeluid verwijderd.' });
            if (audio) {
                audio.pause();
                setAudio(null);
            }
        } catch (error) {
            console.error('Error deleting notification sound:', error);
            setMessage({ type: 'error', text: 'Fout bij verwijderen: ' + error.message });
        }
    };

    const handleTestSound = () => {
        if (!currentSoundUrl) return;

        if (audio) {
            audio.pause();
            setAudio(null);
        }

        const newAudio = new Audio(currentSoundUrl);
        newAudio.play().catch(error => {
            console.error('Error playing sound:', error);
            setMessage({ type: 'error', text: 'Kon geluid niet afspelen.' });
        });
        setAudio(newAudio);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5" />
                        Notificatie Geluid
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload een kort audiobestand dat wordt afgespeeld bij nieuwe notificaties.
                        Ondersteunde formaten: MP3, WAV, OGG. Maximale grootte: 1MB.
                    </p>

                    {message && (
                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                            {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {currentSoundUrl ? (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Huidig notificatiegeluid
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleTestSound}
                                    >
                                        <Play className="w-4 h-4 mr-1" />
                                        Test
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDeleteSound}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Verwijderen
                                    </Button>
                                </div>
                            </div>
                            <audio controls className="w-full">
                                <source src={currentSoundUrl} />
                                Je browser ondersteunt geen audio afspelen.
                            </audio>
                        </div>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                            <Volume2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Geen notificatiegeluid ingesteld
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block">
                            <Input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="hidden"
                                id="sound-upload"
                            />
                            <Button
                                asChild
                                disabled={isUploading}
                                className="w-full"
                            >
                                <label htmlFor="sound-upload" className="cursor-pointer">
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Uploaden...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            {currentSoundUrl ? 'Nieuw geluid uploaden' : 'Geluid uploaden'}
                                        </>
                                    )}
                                </label>
                            </Button>
                        </label>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}