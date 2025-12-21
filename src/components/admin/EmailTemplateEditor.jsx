
import React, { useState, useEffect, useCallback } from 'react';
import { EmailTemplate } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { Save, Info, Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const QuillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link', 'image'],
    ['clean']
  ],
};

export default function EmailTemplateEditor() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Functie om de geselecteerde template te laden in de editor
    const selectTemplate = useCallback((templateId, templateList) => {
        const selected = templateList.find(t => t.id === templateId);
        if (selected) {
            setSelectedTemplateId(selected.id);
            setCurrentTemplate(selected);
            setSubject(selected.subject);
            setBodyHtml(selected.body_html);
        }
    }, []); // Deze functie heeft geen dependencies en is stabiel

    // Functie om de templates te laden, alleen bij de eerste render
    const loadTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await EmailTemplate.list();
            const templateList = data || [];
            setTemplates(templateList);
            if (templateList.length > 0) {
                // Selecteer de eerste template als standaard
                selectTemplate(templateList[0].id, templateList);
            } else {
                // Clear selection if no templates are found
                setSelectedTemplateId('');
                setCurrentTemplate(null);
                setSubject('');
                setBodyHtml('');
            }
        } catch (error) {
            console.error("Failed to load email templates:", error);
            toast({
                variant: "destructive",
                title: "Fout bij laden",
                description: `Kon de e-mail templates niet ophalen: ${error.message}`,
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, selectTemplate]); // `toast` en `selectTemplate` zijn stabiel

    const createDefaultTemplates = async () => {
        setIsSaving(true);
        try {
            const defaultTemplates = [
                {
                    identifier: "client_invitation",
                    name: "Uitnodiging Klantenportaal",
                    description: "Deze e-mail wordt verstuurd naar een klant om hen uit te nodigen voor het klantenportaal van hun project.",
                    subject: "Uitnodiging om uw project te volgen: {{project_name}}",
                    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f7f7f7; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                            <h1 style="color: #EF6C00; font-size: 24px; margin: 0;">PaintConnect</h1>
                        </div>
                        <div style="padding: 24px;">
                            <h2 style="color: #1a202c; font-size: 22px;">Beste {{client_name}},</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">U heeft een uitnodiging ontvangen van <strong>{{company_name}}</strong> om de voortgang van uw project '{{project_name}}' te volgen via ons klantenportaal.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{portal_link}}" style="background-color: #EF6C00; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Naar Klantenportaal</a>
                            </div>
                            <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">Via het portaal kunt u de projectvoortgang bekijken, updates ontvangen en communiceren met het team.</p>
                        </div>
                    </div>`,
                    available_variables: ["client_name", "company_name", "project_name", "portal_link"]
                },
                {
                    identifier: "painter_invitation",
                    name: "Uitnodiging Nieuwe Schilder",
                    description: "Deze e-mail wordt verstuurd naar een nieuwe schilder om lid te worden van een bedrijfsteam op PaintConnect.",
                    subject: "U bent uitgenodigd om lid te worden van {{company_name}} op PaintConnect",
                    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="padding: 24px; text-align: center; background: #f7f7f7; border-bottom: 1px solid #e2e8f0;">
                            <h1 style="color: #EF6C00; font-size: 24px; margin: 0;">PaintConnect</h1>
                        </div>
                        <div style="padding: 24px;">
                            <h2 style="color: #1a202c; font-size: 22px;">Uitnodiging voor PaintConnect</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Hallo {{full_name}},<br/><br/>U bent door <strong>{{company_name}}</strong> uitgenodigd om lid te worden van hun team op PaintConnect.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{registration_link}}" style="background-color: #EF6C00; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accepteer Uitnodiging</a>
                            </div>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Met vriendelijke groet,<br/>Het PaintConnect Team</p>
                        </div>
                    </div>`,
                    available_variables: ["full_name", "company_name", "registration_link"]
                },
                {
                    identifier: "company_activation",
                    name: "Bedrijfsactivatie",
                    description: "Deze e-mail wordt verstuurd naar de eigenaar van een bedrijf nadat hun bedrijf is goedgekeurd door een admin.",
                    subject: "Uw PaintConnect account is actief! Welkom {{company_name}}",
                    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="padding: 24px; text-align: center; background: #f7f7f7; border-bottom: 1px solid #e2e8f0;">
                            <h1 style="color: #EF6C00; font-size: 24px; margin: 0;">PaintConnect</h1>
                        </div>
                        <div style="padding: 24px;">
                            <h2 style="color: #1a202c; font-size: 22px;">Welkom bij PaintConnect!</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Beste {{owner_name}},<br/><br/>Goed nieuws! Uw bedrijf <strong>{{company_name}}</strong> is succesvol geactiveerd op PaintConnect.</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{dashboard_link}}" style="background-color: #EF6C00; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Start met PaintConnect</a>
                            </div>
                            <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">U kunt nu projecten aanmaken, uw team beheren en van alle functies gebruik maken.</p>
                        </div>
                    </div>`,
                    available_variables: ["owner_name", "company_name", "dashboard_link"]
                },
                {
                    identifier: "notification_email",
                    name: "Algemene Notificatie",
                    description: "Deze template wordt gebruikt voor algemene notificatie-e-mails aan gebruikers.",
                    subject: "{{notification_subject}}",
                    body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="padding: 24px; text-align: center; background: #f7f7f7; border-bottom: 1px solid #e2e8f0;">
                            <h1 style="color: #EF6C00; font-size: 24px; margin: 0;">PaintConnect</h1>
                        </div>
                        <div style="padding: 24px;">
                            <h2 style="color: #1a202c; font-size: 22px;">{{notification_title}}</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Beste {{user_name}},</p>
                            <div style="padding: 16px; background: #f8f9fa; border-radius: 6px; margin: 20px 0;">
                                {{notification_content}}
                            </div>
                            <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">Met vriendelijke groet,<br/>Het PaintConnect Team</p>
                        </div>
                    </div>`,
                    available_variables: ["user_name", "notification_subject", "notification_title", "notification_content"]
                }
            ];

            // Create templates one by one
            for (const template of defaultTemplates) {
                await EmailTemplate.create(template);
            }

            toast({
                title: "Standaard templates aangemaakt",
                description: "Alle standaard e-mail templates zijn succesvol toegevoegd.",
            });

            // Reload templates
            await loadTemplates();
        } catch (error) {
            console.error("Failed to create default templates:", error);
            toast({
                variant: "destructive",
                title: "Fout bij aanmaken",
                description: "Kon de standaard templates niet aanmaken.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Deze useEffect wordt nu maar één keer uitgevoerd
    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleSave = async () => {
        if (!currentTemplate) return;
        setIsSaving(true);
        try {
            await EmailTemplate.update(currentTemplate.id, {
                subject,
                body_html: bodyHtml,
            });
            toast({
                title: "Succesvol opgeslagen",
                description: `Template '${currentTemplate.name}' is bijgewerkt.`,
            });
            // Herlaad de templates om de wijzigingen te zien
            await loadTemplates();
        } catch (error) {
            console.error("Failed to save email template:", error);
            toast({
                variant: "destructive",
                title: "Opslaan mislukt",
                description: "Kon de wijzigingen niet opslaan.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner text="E-mail templates laden..." />;
    }

    if (templates.length === 0 && !isLoading) {
        return (
            <div className="text-center p-8">
                <h3 className="text-lg font-semibold mb-4">Geen E-mail Templates Gevonden</h3>
                <p className="text-gray-600 mb-6">Er zijn nog geen e-mail templates aangemaakt. Maak eerst de standaard templates aan.</p>
                <Button onClick={createDefaultTemplates} disabled={isSaving}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isSaving ? 'Bezig...' : 'Standaard Templates Aanmaken'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex-1">
                    <Label htmlFor="template-select">Selecteer een template</Label>
                    <Select value={selectedTemplateId} onValueChange={(value) => selectTemplate(value, templates)}>
                        <SelectTrigger id="template-select">
                            <SelectValue placeholder="Kies een e-mail om te bewerken..." />
                        </SelectTrigger>
                        <SelectContent>
                            {templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                    {template.name} ({template.identifier})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="self-end">
                     <Button onClick={handleSave} disabled={isSaving || !currentTemplate}>
                        {isSaving ? (
                            <><InlineSpinner /> Bezig met opslaan...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Template Opslaan</>
                        )}
                    </Button>
                </div>
            </div>

            {currentTemplate && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div>
                            <Label htmlFor="email-subject">Onderwerp</Label>
                            <Input
                                id="email-subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Inhoud</Label>
                            <div className="bg-white">
                                <ReactQuill
                                    theme="snow"
                                    value={bodyHtml}
                                    onChange={setBodyHtml}
                                    modules={QuillModules}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>{currentTemplate.name}</AlertTitle>
                            <AlertDescription>
                                {currentTemplate.description}
                            </AlertDescription>
                        </Alert>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Beschikbare Variabelen</h4>
                            <div className="flex flex-wrap gap-2">
                                {currentTemplate.available_variables?.map(variable => (
                                    <Badge key={variable} variant="secondary">{`{{${variable}}}`}</Badge>
                                ))}
                            </div>
                             <p className="text-xs text-gray-500 mt-3">Gebruik deze variabelen in het onderwerp en de inhoud. Ze worden automatisch vervangen door de juiste data.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
