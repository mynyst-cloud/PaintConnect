
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Package, Save, Loader2, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { MaterialUsage, Material } from '@/api/entities';
import { notifyMaterialsConfirmed } from '@/api/functions';
import PlaceholderLogo from "@/components/ui/PlaceholderLogo";

export default function MaterialsConfirmationForm({ project, currentUser, onSubmit, onClose }) {
    const [materials, setMaterials] = useState([]); // State to hold materials fetched from the API
    const [usedMaterials, setUsedMaterials] = useState([{ // Renamed from materialUsages
        material_id: '',
        quantity: '',
        notes: '' // Kept notes as it's used in the UI
    }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadMaterials() {
            try {
                // Fetch materials based on the project's company ID
                const materialsList = await Material.filter({ company_id: project.company_id });
                setMaterials(materialsList || []);
            } catch (error) {
                console.error('Error loading materials:', error);
                setError('Kon materialen niet laden.');
            }
        }
        loadMaterials();
    }, [project.company_id]); // Re-fetch materials if company_id changes

    const addMaterialUsage = () => {
        setUsedMaterials(prev => [...prev, { material_id: '', quantity: '', notes: '' }]);
    };

    const removeMaterialUsage = (index) => {
        setUsedMaterials(prev => prev.filter((_, i) => i !== index));
    };

    const updateMaterialUsage = (index, field, value) => {
        setUsedMaterials(prev => prev.map((usage, i) => 
            i === index ? { ...usage, [field]: value } : usage
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validate all material usages before attempting submission
        // Ensure that for every entered material usage, a material is selected
        // and a quantity is provided, and that the quantity is a positive number.
        if (usedMaterials.some(usage => !usage.material_id || !usage.quantity || parseFloat(usage.quantity) <= 0)) {
            setError('Selecteer een materiaal en vul een geldige hoeveelheid in voor elke rij.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Map over ALL `usedMaterials` as they are now validated by the check above
            const usagePromises = usedMaterials.map(usage => {
                // Use the `materials` state to find material details
                const materialDetails = materials.find(m => m.id === usage.material_id);
                const quantity = parseFloat(usage.quantity);
                const unitPrice = materialDetails?.price_excl_vat || 0; // Use materialDetails for price
                const totalCost = quantity * unitPrice;

                return MaterialUsage.create({
                    company_id: project.company_id,
                    project_id: project.id,
                    painter_id: currentUser.id,
                    material_id: usage.material_id,
                    quantity: quantity,
                    date_used: new Date().toISOString().split('T')[0],
                    notes: usage.notes || null,
                    confirmed_by_painter: true,
                    confirmed_at: new Date().toISOString(),
                    unit_price_snapshot: unitPrice,
                    cost_total: totalCost
                });
            });

            const createdUsages = await Promise.all(usagePromises);

            // GEFIXED: Maak een samenvatting van de materialen voor de notificatie
            const materialsSummary = createdUsages.map(usage => {
                const materialDetails = materials.find(m => m.id === usage.material_id);
                return `${usage.quantity}x ${materialDetails?.name || 'Onbekend materiaal'}`;
            }).join(', ');

            // Send notification using the new backend function
            try {
                await notifyMaterialsConfirmed({
                    company_id: project.company_id,
                    project_id: project.id,
                    painter_name: currentUser.full_name,
                    project_name: project.project_name,
                    materials_summary: materialsSummary
                });
            } catch (notifyError) {
                console.error('Failed to send materials confirmation notification:', notifyError);
            }

            // NIEUW: Geef de created usages en summary terug aan de parent
            const materialsData = {
                usages: createdUsages,
                items: createdUsages.map(usage => {
                    const materialDetails = materials.find(m => m.id === usage.material_id);
                    return {
                        name: materialDetails?.name || 'Onbekend materiaal',
                        quantity: usage.quantity,
                        unit: materialDetails?.unit || 'stuks', // Default to 'stuks' if unit is not found
                        notes: usage.notes
                    };
                }),
                summary: materialsSummary
            };

            onSubmit(materialsData); // Pass data to parent callback
        } catch (err) {
            console.error('Error confirming materials:', err);
            setError(err.message || 'Er ging iets mis bij het bevestigen van materialen.');
        } finally {
            setIsSubmitting(false); // Reset submitting state
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
                className="w-full max-w-2xl max-h-[90vh]" // Removed overflow-y-auto here
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}> {/* Form now wraps the Card */}
                    <Card className="shadow-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-4">
                            <div className="flex items-center gap-3">
                                <PlaceholderLogo />
                                <CardTitle className="text-lg">Materiaalverbruik Bevestigen</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" type="button" onClick={onClose}>
                                <X className="w-4 h-4"/>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto"> {/* Added max-height and overflow here */}
                            <div className="text-sm"> {/* Wrapped project info and error in a div */}
                                <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                    <p className="font-semibold text-sm">{project.project_name}</p>
                                    <p className="text-xs text-gray-600 dark:text-slate-400">{project.client_name}</p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}
                            </div>

                            {usedMaterials.map((usage, index) => ( // Renamed materialUsages to usedMaterials
                                <div key={index} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-sm font-medium">Materiaal {index + 1}</Label>
                                        {usedMaterials.length > 1 && ( // Renamed materialUsages to usedMaterials
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => removeMaterialUsage(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor={`material_${index}`}>Materiaal</Label>
                                            <Select 
                                                value={usage.material_id} 
                                                onValueChange={(value) => updateMaterialUsage(index, 'material_id', value)}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Kies materiaal..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Use the `materials` state */}
                                                    {materials.map(material => (
                                                        <SelectItem key={material.id} value={material.id}>
                                                            {material.name} ({material.unit})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor={`quantity_${index}`}>Hoeveelheid</Label>
                                            <Input
                                                id={`quantity_${index}`}
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                placeholder="1.0"
                                                value={usage.quantity}
                                                onChange={(e) => updateMaterialUsage(index, 'quantity', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor={`notes_${index}`}>Notities (optioneel)</Label>
                                        <Textarea
                                            id={`notes_${index}`}
                                            placeholder="Extra opmerkingen..."
                                            value={usage.notes}
                                            onChange={(e) => updateMaterialUsage(index, 'notes', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button type="button" variant="outline" onClick={addMaterialUsage} className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Materiaal Toevoegen
                            </Button>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Annuleren
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Bevestigen...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Materialen Bevestigen
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
