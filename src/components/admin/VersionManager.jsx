
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
    Save, 
    Download, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    Plus,
    FileText,
    Trash2,
    History // Added History icon
} from 'lucide-react';
import { AppVersion } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';

export default function VersionManager() {
    const [versions, setVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newVersion, setNewVersion] = useState({
        version_name: '',
        description: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadVersions();
    }, []);

    const loadVersions = async () => {
        setIsLoading(true);
        try {
            const versionsList = await AppVersion.list('-timestamp');
            setVersions(versionsList || []);
            setError(null);
        } catch (err) {
            console.error('Error loading versions:', err);
            setError('Kon versies niet laden. Probeer het opnieuw.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateVersion = async () => {
        if (!newVersion.version_name.trim()) {
            setError('Versionaam is verplicht');
            return;
        }

        setIsLoading(true);
        try {
            const versionData = {
                version_name: newVersion.version_name.trim(),
                description: newVersion.description.trim() || `Versie opgeslagen op ${new Date().toLocaleString('nl-NL')}`,
                timestamp: new Date().toISOString()
            };

            await AppVersion.create(versionData);
            
            setSuccess('Versie succesvol opgeslagen!');
            setNewVersion({ version_name: '', description: '' });
            setShowCreateForm(false);
            await loadVersions();
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error creating version:', err);
            setError(`Kon versie niet opslaan: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVersion = async (versionId) => {
        if (!window.confirm('Weet u zeker dat u deze versie wilt verwijderen?')) {
            return;
        }

        try {
            await AppVersion.delete(versionId);
            setSuccess('Versie verwijderd');
            await loadVersions();
            setTimeout(() => setSuccess(null), 2000);
        } catch (err) {
            console.error('Error deleting version:', err);
            setError(`Kon versie niet verwijderen: ${err.message}`);
        }
    };
    
    const handleRestoreClick = (version) => {
        alert(
            `Herstel Functionaliteit (Handmatig)\n\n` +
            `Een automatische herstel-actie is niet beschikbaar.\n\n` +
            `Om de applicatie te herstellen naar versie "${version.version_name}", ` +
            `neem contact op met support en geef de volgende informatie door:\n\n` +
            `Versienaam: ${version.version_name}\n` +
            `Tijdstip: ${formatDate(version.timestamp)}`
        );
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('nl-NL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Ongeldig datum';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Versiebeheer</h2>
                    <p className="text-gray-600">Beheer app-versies en herstel naar eerdere states</p>
                </div>
                <Button 
                    onClick={() => setShowCreateForm(!showCreateForm)} 
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Huidige Versie Opslaan
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}

            <AnimatePresence>
                {showCreateForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="border-2 border-emerald-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Save className="w-5 h-5 text-emerald-600" />
                                    Nieuwe Versie Opslaan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Versienaam *</label>
                                    <Input
                                        value={newVersion.version_name}
                                        onChange={(e) => setNewVersion({...newVersion, version_name: e.target.value})}
                                        placeholder="bijv. PaintConnect BETA 1.3"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Beschrijving</label>
                                    <Textarea
                                        value={newVersion.description}
                                        onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
                                        placeholder="Beschrijf wat er in deze versie is veranderd..."
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button 
                                        onClick={handleCreateVersion} 
                                        disabled={isLoading}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {isLoading ? 'Opslaan...' : 'Versie Opslaan'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowCreateForm(false)}
                                    >
                                        Annuleren
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-4">
                {isLoading && versions.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-gray-500">
                            Versies laden...
                        </CardContent>
                    </Card>
                ) : versions.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen versies opgeslagen</h3>
                            <p className="text-gray-600 mb-4">Sla uw eerste app-versie op om later naar terug te kunnen keren.</p>
                            <Button onClick={() => setShowCreateForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Eerste Versie Opslaan
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    versions.map((version, index) => (
                        <motion.div
                            key={version.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {version.version_name}
                                                </h3>
                                                {index === 0 && (
                                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                        Nieuwste
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-gray-600 mb-3">
                                                {version.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-4 h-4" />
                                                {formatDate(version.timestamp)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleRestoreClick(version)}
                                            >
                                                <History className="w-4 h-4 mr-1" />
                                                Herstellen
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleDeleteVersion(version.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {versions.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900">Let op: Handmatig Herstel</h4>
                            <p className="text-sm text-blue-800 mt-1">
                                De 'Herstellen' knop is informatief. Het herstellen van een versie is een handmatig proces. 
                                Neem contact op met support en geef de versienaam en het tijdstip door om een herstel-actie aan te vragen.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
