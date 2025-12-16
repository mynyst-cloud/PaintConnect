import React, { useState, useEffect } from 'react';
import { PlatformUpdate } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Star, Zap, Wrench, Megaphone, Gift, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifyCompaniesOfUpdate } from '@/api/functions';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const iconMap = {
    star: { icon: Star, label: 'Star (Nieuwe functies)' },
    zap: { icon: Zap, label: 'Zap (Verbeteringen)' },
    wrench: { icon: Wrench, label: 'Wrench (Onderhoud)' },
    megaphone: { icon: Megaphone, label: 'Megaphone (Aankondigingen)' },
    gift: { icon: Gift, label: 'Gift (Speciale acties)' }
};

const typeColors = {
    feature: "bg-green-100 text-green-800",
    improvement: "bg-blue-100 text-blue-800",
    maintenance: "bg-orange-100 text-orange-800",
    announcement: "bg-purple-100 text-purple-800"
};

// Rich Text Editor configuratie
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link'],
        ['clean']
    ]
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
];

export default function PlatformUpdateManagement() {
    const [updates, setUpdates] = useState([]);
    const [editingUpdate, setEditingUpdate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [isNotifying, setIsNotifying] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'announcement',
        icon: 'megaphone',
        is_active: true,
        priority: 1
    });

    useEffect(() => {
        loadUpdates();
    }, []);

    const loadUpdates = async () => {
        setIsLoading(true);
        try {
            const fetchedUpdates = await PlatformUpdate.filter({ deleted: { $ne: true } }, '-created_date');
            setUpdates(fetchedUpdates || []);
        } catch (error) {
            console.error('Error loading platform updates:', error);
            setError('Fout bij laden van updates: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (update) => {
        setEditingUpdate(update);
        setFormData({
            title: update.title || '',
            message: update.message || '',
            type: update.type || 'announcement',
            icon: update.icon || 'megaphone',
            is_active: update.is_active !== false,
            priority: update.priority || 1
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || isNotifying) return;

        if (!formData.title.trim() || !formData.message.trim()) {
            setError('Titel en bericht zijn verplicht');
            return;
        }
        
        setIsSubmitting(true);
        setError('');

        try {
            const updateData = {
                title: formData.title.trim(),
                message: formData.message.trim(),
                type: formData.type,
                icon: formData.icon,
                priority: parseInt(formData.priority),
                is_active: formData.is_active
            };

            let savedUpdate;
            if (editingUpdate) {
                savedUpdate = await PlatformUpdate.update(editingUpdate.id, updateData);
            } else {
                savedUpdate = await PlatformUpdate.create(updateData);
                
                if (savedUpdate && formData.is_active) {
                    setIsNotifying(true);
                    try {
                        console.log('[PlatformUpdateManagement] Sending notifications for update:', savedUpdate.id);
                        const { data } = await notifyCompaniesOfUpdate({ updateId: savedUpdate.id });
                        
                        if (data?.success) {
                            console.log(`[PlatformUpdateManagement] Notificaties succesvol verstuurd naar ${data.emails_sent} bedrijfsadmins`);
                        } else {
                            console.warn('[PlatformUpdateManagement] Failed to send some notifications:', data?.error || 'Unknown error');
                        }
                    } catch (notifyError) {
                        console.error('[PlatformUpdateManagement] Fout bij versturen notificaties:', notifyError.message);
                    } finally {
                        setIsNotifying(false);
                    }
                }
            }

            // Reset form
            setFormData({
                title: '',
                message: '',
                type: 'announcement',
                icon: 'megaphone',
                priority: 1,
                is_active: true
            });
            setEditingUpdate(null);
            
            await loadUpdates();
            
        } catch (err) {
            console.error('Fout bij opslaan update:', err);
            setError('Kon update niet opslaan: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (updateId) => {
        if (processingId) return;
        if (!confirm('Weet je zeker dat je deze platform update wilt verwijderen?')) return;

        setProcessingId(updateId);

        try {
            await PlatformUpdate.update(updateId, { deleted: true, deleted_at: new Date().toISOString() });
            setUpdates(prev => prev.filter(u => u.id !== updateId));
            alert('Platform update succesvol verwijderd.');
        } catch (error) {
            console.error('Error deleting platform update:', error);
            alert(`Fout bij verwijderen: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    // Helper functie om HTML te strippen voor preview
    const stripHtml = (html) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Platform Updates Beheer</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Beheer aankondigingen en updates die op het dashboard worden getoond.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {updates.length === 0 && !isLoading && (
                            <p className="text-center text-gray-500 py-8">Geen platform updates gevonden.</p>
                        )}
                        {isLoading && (
                            <p className="text-center text-gray-500 py-8">Updates laden...</p>
                        )}
                        {!isLoading && updates.map(update => {
                            const IconComponent = iconMap[update.icon]?.icon || Megaphone;
                            const plainText = stripHtml(update.message);
                            const isLong = plainText.length > 150;
                            
                            return (
                                <motion.div 
                                    key={update.id}
                                    layout
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-start justify-between p-4 border rounded-lg bg-white dark:bg-slate-800"
                                >
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold">{update.title}</p>
                                            <div 
                                                className="text-sm text-gray-600 dark:text-gray-400 mt-1 prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: isLong ? plainText.substring(0, 150) + '...' : update.message 
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <Badge className={typeColors[update.type] || 'bg-gray-100 text-gray-800'}>{update.type}</Badge>
                                        <Badge variant={update.is_active ? "default" : "outline"}>
                                            {update.is_active ? 'Actief' : 'Inactief'}
                                        </Badge>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(update)} disabled={!!processingId}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => handleDelete(update.id)} 
                                            disabled={!!processingId}
                                        >
                                            {processingId === update.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{editingUpdate ? 'Platform Update Bewerken' : 'Nieuwe Platform Update'}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Gebruik de editor om de update visueel aantrekkelijk te maken met koppen, vetgedrukte tekst en lijsten.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                                {error}
                            </div>
                        )}
                        <div>
                            <Label htmlFor="title">Titel</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="Bijv. Nieuwe functie gelanceerd"
                            />
                        </div>

                        <div>
                            <Label htmlFor="message">Bericht (Rich Text)</Label>
                            <div className="mt-2 border rounded-md overflow-hidden bg-white">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.message}
                                    onChange={value => setFormData(prev => ({ ...prev, message: value }))}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Beschrijf de update met opmaak..."
                                    className="min-h-[200px]"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Tip: Gebruik koppen (H1, H2, H3), vetgedrukte tekst en lijsten om de update overzichtelijk te maken.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="type">Type</Label>
                                <Select 
                                    value={formData.type}
                                    onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="feature">Nieuwe Functie</SelectItem>
                                        <SelectItem value="improvement">Verbetering</SelectItem>
                                        <SelectItem value="maintenance">Onderhoud</SelectItem>
                                        <SelectItem value="announcement">Aankondiging</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="icon">Icoon</Label>
                                <Select 
                                    value={formData.icon}
                                    onValueChange={value => setFormData(prev => ({ ...prev, icon: value }))}
                                >
                                    <SelectTrigger id="icon">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(iconMap).map(([key, { label }]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="priority">Prioriteit (1-10)</Label>
                            <Input
                                id="priority"
                                type="number"
                                min="1"
                                max="10"
                                value={formData.priority}
                                onChange={e => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                            />
                            <Label htmlFor="is_active">Update is actief</Label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            {editingUpdate && (
                                <Button type="button" variant="outline" onClick={() => {
                                    setEditingUpdate(null);
                                    setFormData({
                                        title: '',
                                        message: '',
                                        type: 'announcement',
                                        icon: 'megaphone',
                                        priority: 1,
                                        is_active: true
                                    });
                                }}>
                                    Annuleren
                                </Button>
                            )}
                            <Button type="submit" disabled={isSubmitting || isNotifying}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {editingUpdate ? 'Bijwerken...' : 'Aanmaken...'}
                                    </>
                                ) : isNotifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Notificaties versturen...
                                    </>
                                ) : (
                                    editingUpdate ? 'Update Bijwerken' : 'Update Aanmaken'
                                )}
                            </Button>
                        </div>
                    </form>
                    
                    {isNotifying && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Notificaties worden verstuurd naar alle schildersbedrijven...
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}