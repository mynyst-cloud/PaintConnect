
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Clock, Save,  } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { TimeEntry } from '@/api/entities';
import { notifyHoursConfirmed } from '@/api/functions';
import PlaceholderLogo from "@/components/ui/PlaceholderLogo"; // New import

// const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85d_Colorlogo-nobackground.png'; // Removed

export default function HoursConfirmationForm({ project, currentUser, onSubmit, onClose }) {
    const [hoursData, setHoursData] = useState({
        date_worked: new Date().toISOString().split('T')[0],
        hours: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!hoursData.hours || parseFloat(hoursData.hours) <= 0) {
                throw new Error('Voer een geldig aantal uren in.');
            }

            const timeEntryData = {
                company_id: project.company_id,
                project_id: project.id,
                painter_id: currentUser.id,
                date_worked: hoursData.date_worked,
                hours: parseFloat(hoursData.hours),
                notes: hoursData.notes || null,
                confirmed_by_painter: true,
                confirmed_at: new Date().toISOString(),
                hourly_rate_snapshot: currentUser.hourly_rate || 35,
                cost_total: (parseFloat(hoursData.hours) * (currentUser.hourly_rate || 35))
            };

            await TimeEntry.create(timeEntryData);

            // Send notification using new system
            try {
                await notifyHoursConfirmed({ // Using the new imported function
                    company_id: project.company_id,
                    project_id: project.id,
                    painter_name: currentUser.full_name,
                    hours: hoursData.hours,
                    project_name: project.project_name
                });
            } catch (notifyError) {
                console.error('Failed to send hours confirmation notification:', notifyError);
            }

            onSubmit();
        } catch (err) {
            console.error('Error confirming hours:', err);
            setError(err.message || 'Er ging iets mis bij het bevestigen van uren.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <Card className="shadow-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-4">
                            <div className="flex items-center gap-3">
                                <PlaceholderLogo /> {/* Replaced img tag with PlaceholderLogo component */}
                                <CardTitle className="text-lg">Uren Bevestigen</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" type="button" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                <p className="font-semibold text-sm">{project.project_name}</p>
                                <p className="text-xs text-gray-600 dark:text-slate-400">{project.client_name}</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="date_worked">Werkdatum</Label>
                                <Input
                                    id="date_worked"
                                    type="date"
                                    value={hoursData.date_worked}
                                    onChange={(e) => setHoursData(prev => ({ ...prev, date_worked: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="hours">Aantal uren</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="12"
                                    placeholder="8.0"
                                    value={hoursData.hours}
                                    onChange={(e) => setHoursData(prev => ({ ...prev, hours: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Notities (optioneel)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Beschrijf kort wat je hebt gedaan..."
                                    value={hoursData.notes}
                                    onChange={(e) => setHoursData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Annuleren
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <InlineSpinner />
                                            Bevestigen...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Uren Bevestigen
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </motion.div>
        </motion.div>
    );
}
