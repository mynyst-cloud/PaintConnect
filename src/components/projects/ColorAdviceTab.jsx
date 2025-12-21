import React, { useState, useEffect } from 'react';
import { ColorAdvice } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Palette, UploadCloud,  } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import ColorAdviceCard from './ColorAdviceCard';
import ColorAdviceForm from './ColorAdviceForm';


export default function ColorAdviceTab({ project, colorAdvices, onRefresh, isAdmin }) {
    const [showForm, setShowForm] = useState(false);
    const [editingAdvice, setEditingAdvice] = useState(null);
    const [showPdfUpload, setShowPdfUpload] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        async function loadUser() {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (error) {
                console.error('Failed to load user:', error);
            }
        }
        loadUser();
    }, []);

    // Debug logging
    useEffect(() => {
        console.log('ColorAdviceTab: Received colorAdvices:', colorAdvices);
        console.log('ColorAdviceTab: Is array?', Array.isArray(colorAdvices));
        console.log('ColorAdviceTab: Length:', colorAdvices?.length);
    }, [colorAdvices]);

    const advices = Array.isArray(colorAdvices) ? colorAdvices : [];

    const handleSubmit = async (adviceData) => {
        try {
            console.log('ColorAdviceTab: Submitting form data:', adviceData);
            if (editingAdvice) {
                await ColorAdvice.update(editingAdvice.id, adviceData);
            } else {
                await ColorAdvice.create(adviceData);
            }
            
            // AANGEPAST: Eerst refresh aanroepen, dan form sluiten
            setShowForm(false);
            setEditingAdvice(null);
            
            // Refresh de parent component om nieuwe data te laden
            if (onRefresh) {
                await onRefresh();
            }
        } catch (error) {
            console.error('[ColorAdviceTab] Error saving color advice:', error);
            throw error;
        }
    };

    const handleEdit = (advice) => {
        setEditingAdvice(advice);
        setShowForm(true);
    };

    const handleDelete = async (adviceId) => {
        if (!confirm('Weet je zeker dat je dit kleuradvies wilt verwijderen?')) return;

        try {
            await ColorAdvice.delete(adviceId);
        } catch (error) {
            // Ignore 404 errors - item already deleted
            if (!error.message?.includes('404') && !error.message?.includes('not found')) {
                console.error('Error deleting color advice:', error);
            }
        } finally {
            // Always refresh to update the list
            if (onRefresh) await onRefresh();
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.includes('pdf')) {
            alert('Upload alleen PDF bestanden');
            return;
        }

        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            await ColorAdvice.create({
                project_id: project.id,
                company_id: project.company_id,
                room_name: 'PDF Kleuradvies',
                color_code: 'Zie PDF',
                color_type: 'RAL',
                paint_brand: 'Zie PDF',
                color_hex: '#FFFFFF',
                advice_pdf_url: file_url,
                status: 'concept',
                created_by: currentUser?.email || 'unknown'
            });

            setShowPdfUpload(false);
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Error uploading PDF:', error);
            alert('Fout bij uploaden PDF: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Kleuradviezen
                        <span className="ml-2 px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                            {advices.length}
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Beheer kleuradviezen en PDF documenten voor dit project
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowPdfUpload(true)}
                        variant="outline"
                        size="sm"
                        className="h-10"
                    >
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Upload PDF
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingAdvice(null);
                            setShowForm(true);
                        }}
                        size="sm"
                        className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nieuw advies
                    </Button>
                </div>
            </div>

            {/* Content */}
            {advices.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Palette className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Nog geen kleuradviezen
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Voeg kleuradviezen toe om kleuren, verfmerken en PDF documenten te beheren.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={() => setShowPdfUpload(true)}
                            variant="outline"
                            className="h-10"
                        >
                            <UploadCloud className="w-4 h-4 mr-2" />
                            Upload PDF
                        </Button>
                        <Button
                            onClick={() => setShowForm(true)}
                            className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Eerste advies toevoegen
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {advices.map((advice) => (
                        <ColorAdviceCard
                            key={advice.id}
                            advice={advice}
                            onEdit={() => handleEdit(advice)}
                            onDelete={() => handleDelete(advice.id)}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}

            {/* Color Advice Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent 
                    className="max-w-3xl w-[95vw] max-h-[95vh] p-0 flex flex-col"
                    style={{ zIndex: 100000 }}
                >
                    <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle className="text-xl font-bold">
                            {editingAdvice ? 'Kleuradvies bewerken' : 'Kleur toevoegen'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto"> 
                        <ColorAdviceForm
                            advice={editingAdvice}
                            project={project}
                            onSubmit={handleSubmit}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingAdvice(null);
                            }}
                            currentUser={currentUser}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* PDF Upload Dialog */}
            <Dialog open={showPdfUpload} onOpenChange={setShowPdfUpload}>
                <DialogContent 
                    className="max-w-md w-[95vw] p-0 dialog-content-high-z"
                    style={{ zIndex: 100000 }}
                >
                    <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle className="text-xl font-bold">Upload kleuradvies (PDF)</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-4 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            Upload een PDF met het kleuradvies voor dit project.
                        </p>
                        <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                disabled={isUploading}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label
                                htmlFor="pdf-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                {isUploading ? (
                                    <>
                                        <LoadingSpinner size="lg" />
                                        <p className="text-sm text-gray-600 dark:text-slate-400">Uploaden...</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                            Klik om PDF te selecteren
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                            Alleen PDF bestanden
                                        </p>
                                    </>
                                )}
                            </label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowPdfUpload(false)}
                                disabled={isUploading}
                            >
                                Annuleren
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}