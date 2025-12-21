import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { , UserPlus, X, Copy, Check, Mail } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { invitePainter } from '@/api/functions';
import { User } from '@/api/entities';

export default function InviteUserForm({ onInviteSent }) {
    const [formData, setFormData] = useState({ 
        fullName: '', 
        email: '', 
        companyRole: 'painter', 
        isPainter: true 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [inviteResult, setInviteResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInviteResult(null);
        
        // Validatie
        if (!formData.fullName.trim() || !formData.email.trim()) {
            setError('Naam en e-mailadres zijn verplicht.');
            return;
        }

        if (!formData.email.includes('@')) {
            setError('Voer een geldig e-mailadres in.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const currentUser = await User.me();
            const { data } = await invitePainter({ 
                ...formData, 
                companyId: currentUser.company_id 
            });
            
            setInviteResult(data);
            setFormData({ fullName: '', email: '', companyRole: 'painter', isPainter: true });
            
            if (onInviteSent) onInviteSent();
        } catch (err) {
            console.error('Invite error:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Uitnodiging versturen mislukt';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const copyToClipboard = () => {
        if (inviteResult?.registrationLink) {
            navigator.clipboard.writeText(inviteResult.registrationLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const sendEmailInvite = () => {
        if (inviteResult?.registrationLink && formData.email) {
            const subject = `Uitnodiging voor PaintConnect - ${inviteResult.invite?.company_name || 'Uw bedrijf'}`;
            const body = `Hallo ${inviteResult.invite?.full_name || 'daar'},

U bent uitgenodigd om deel te nemen aan het PaintConnect platform.

Klik op de volgende link om uw account aan te maken:
${inviteResult.registrationLink}

Met vriendelijke groet,
Het PaintConnect Team`;
            
            const mailtoUrl = `mailto:${formData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailtoUrl, '_blank');
        }
    };

    if (inviteResult) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-center text-emerald-700 flex items-center gap-2 justify-center">
                        <Check className="w-5 h-5" />
                        Uitnodiging Aangemaakt!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-sm text-gray-600">
                        Deel de volgende link met <strong>{inviteResult.invite?.full_name}</strong> om de registratie te voltooien.
                    </p>
                    
                    <div className="p-3 border rounded-lg bg-gray-50 flex items-center gap-2">
                        <Input 
                            readOnly 
                            value={inviteResult.registrationLink} 
                            className="flex-grow bg-white text-xs"
                            onClick={(e) => e.target.select()}
                        />
                        <Button size="icon" onClick={copyToClipboard} variant="ghost">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={sendEmailInvite} className="flex-1" variant="outline">
                            <Mail className="w-4 h-4 mr-2" />
                            E-mail Versturen
                        </Button>
                        <Button 
                            onClick={() => {
                                setInviteResult(null);
                                setFormData({ fullName: '', email: '', companyRole: 'painter', isPainter: true });
                            }} 
                            className="flex-1"
                        >
                            Nieuwe Uitnodiging
                        </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                        <strong>Instructies voor de schilder:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>Klik op de uitnodigingslink</li>
                            <li>Log in met Google (met het e-mailadres: {inviteResult.invite?.email})</li>
                            <li>Het account wordt automatisch gekoppeld aan uw bedrijf</li>
                            <li>De schilder heeft direct toegang tot het dashboard</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Schilder Uitnodigen
                </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Volledige Naam *</Label>
                        <Input
                            id="fullName"
                            placeholder="Voor- en achternaam"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-mailadres *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="schilder@voorbeeld.nl"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="companyRole">Rol in Bedrijf</Label>
                        <Select 
                            value={formData.companyRole} 
                            onValueChange={(value) => handleChange('companyRole', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="painter">Schilder</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isPainter"
                            checked={formData.isPainter}
                            onCheckedChange={(checked) => handleChange('isPainter', checked)}
                        />
                        <Label htmlFor="isPainter" className="text-sm font-normal">
                            Deze persoon is een actieve schilder
                        </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <InlineSpinner className="mr-2" />
                                Uitnodiging Versturen...
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2" />
                                Verstuur Uitnodiging
                            </>
                        )}
                    </Button>
                    
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <strong>Hoe het werkt:</strong> Na het versturen krijgt u een unieke link die u deelt met de schilder. 
                        Wanneer de schilder zich registreert met dit e-mailadres, wordt het account automatisch gekoppeld aan uw bedrijf.
                    </div>
                </CardContent>
            </form>
        </Card>
    );
}