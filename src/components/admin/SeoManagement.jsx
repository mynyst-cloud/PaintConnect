import React, { useState, useEffect } from 'react';
import { SeoSettings } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Globe, Save, Plus } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SeoManagement() {
    const [settings, setSettings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const data = await SeoSettings.list();
            setSettings(data || []);
        } catch (error) {
            console.error("Failed to fetch SEO settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (id, field, value) => {
        setSettings(prev =>
            prev.map(setting =>
                setting.id === id ? { ...setting, [field]: value } : setting
            )
        );
    };

    const handleSave = async (settingToSave) => {
        setIsSaving(true);
        try {
            const { id, ...data } = settingToSave;
            await SeoSettings.update(id, data);
            alert(`Instellingen voor '${settingToSave.page_identifier}' opgeslagen!`);
        } catch (error) {
            console.error("Failed to save SEO settings:", error);
            alert("Opslaan mislukt. Probeer het opnieuw.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCreateDefaultSettings = async () => {
        setIsSaving(true);
        try {
            const defaultSettings = [
              {
                "page_identifier": "default",
                "meta_title": "PaintConnect | Professioneel Schildersbeheer",
                "meta_description": "Beheer uw schilderprojecten, teams en materialen efficiënt met PaintConnect.",
                "meta_keywords": "paintconnect, schilders, projectmanagement",
                "og_image_url": "https://storage.googleapis.com/base44-public/paintpro/paintpro_social_card.png"
              },
              {
                "page_identifier": "landing",
                "meta_title": "PaintConnect | De #1 Software voor de Moderne Verfindustrie",
                "meta_description": "Centraliseer al uw werkprocessen, van planning tot facturatie. Verhoog efficiëntie en verlaag faalkosten met PaintConnect. Start uw gratis proefperiode.",
                "meta_keywords": "schildersoftware, projectmanagement, planning, facturatie, materiaalbeheer, klantportaal, schildersbedrijf, verfindustrie",
                "og_image_url": "https://storage.googleapis.com/base44-public/paintpro/paintpro_social_card.png"
              }
            ];
            await SeoSettings.bulkCreate(defaultSettings);
            alert("Standaard instellingen succesvol aangemaakt!");
            fetchSettings();
        } catch (error) {
            console.error("Failed to create default SEO settings:", error);
            alert("Aanmaken mislukt. Probeer het opnieuw.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner text="SEO instellingen laden..." />;
    }

    if (settings.length === 0 && !isLoading) {
        return (
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" /> SEO Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-10">
                    <p className="text-gray-500 mb-4">Geen SEO-instellingen gevonden.</p>
                    <Button onClick={handleCreateDefaultSettings} disabled={isSaving}>
                        <Plus className="w-4 h-4 mr-2" /> 
                        {isSaving ? 'Bezig...' : 'Standaard Instellingen Aanmaken'}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" /> SEO Management
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {settings.map(setting => (
                    <div key={setting.id} className="p-4 border rounded-lg space-y-4 dark:border-slate-700">
                        <h3 className="font-semibold text-lg capitalize">{setting.page_identifier.replace('_', ' ')} Pagina</h3>
                        <div className="space-y-2">
                            <Label htmlFor={`title-${setting.id}`}>Meta Titel</Label>
                            <Input
                                id={`title-${setting.id}`}
                                value={setting.meta_title || ''}
                                onChange={(e) => handleInputChange(setting.id, 'meta_title', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`desc-${setting.id}`}>Meta Beschrijving</Label>
                            <Textarea
                                id={`desc-${setting.id}`}
                                value={setting.meta_description || ''}
                                onChange={(e) => handleInputChange(setting.id, 'meta_description', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`keywords-${setting.id}`}>Keywords (komma-gescheiden)</Label>
                            <Input
                                id={`keywords-${setting.id}`}
                                value={setting.meta_keywords || ''}
                                onChange={(e) => handleInputChange(setting.id, 'meta_keywords', e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor={`ogimage-${setting.id}`}>Social Media Afbeelding URL</Label>
                            <Input
                                id={`ogimage-${setting.id}`}
                                value={setting.og_image_url || ''}
                                onChange={(e) => handleInputChange(setting.id, 'og_image_url', e.target.value)}
                            />
                        </div>
                        <Button onClick={() => handleSave(setting)} disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Opslaan...' : 'Opslaan'}
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}