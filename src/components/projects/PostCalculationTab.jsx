import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TimeEntry, MaterialUsage, ExtraCost, Material, User, Project, Company } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
    PlusCircle, Trash2, Edit, CheckCircle, Clock, Package, Euro, 
    Download, AlertTriangle, Loader2, Save, FileText, Calendar as CalendarIcon, X, Car
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { generatePostCalculationPDF } from '@/api/functions';
import { finalizeProject } from '@/api/functions';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from "@/components/ui/use-toast";

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

export default function PostCalculationTab({ 
    project, 
    materialUsages = [], 
    timeEntries = [], 
    updates = [], 
    extraCosts = [], 
    materialsList = [], 
    costTotals = {}, 
    assignedPainters = [], 
    teamMembers = [],
    loadProjectData 
}) {
    // Gebruik teamMembers als die beschikbaar zijn, anders fallback naar assignedPainters
    // Dit zorgt ervoor dat we ook uren van niet-toegewezen schilders correct kunnen weergeven
    const availablePainters = teamMembers.length > 0 ? teamMembers : assignedPainters;
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isFinalizingProject, setIsFinalizingProject] = useState(false);
    const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
    const [showMaterialUsageForm, setShowMaterialUsageForm] = useState(false);
    const [showExtraCostForm, setShowExtraCostForm] = useState(false);
    const [editingTimeEntry, setEditingTimeEntry] = useState(null);
    const [editingMaterialUsage, setEditingMaterialUsage] = useState(null);
    const [editingExtraCost, setEditingExtraCost] = useState(null);
    const { toast } = useToast();

    // Form states
    const [timeEntryForm, setTimeEntryForm] = useState({
        painter_id: '',
        date_worked: format(new Date(), 'yyyy-MM-dd'),
        hours: '',
        notes: '',
        hourly_rate: null
    });

    const [materialUsageForm, setMaterialUsageForm] = useState({
        material_id: '',
        painter_id: '',
        quantity: '',
        date_used: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    const [extraCostForm, setExtraCostForm] = useState({
        description: '',
        amount: '',
        date_incurred: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    const resetForms = () => {
        setTimeEntryForm({
            painter_id: '',
            date_worked: format(new Date(), 'yyyy-MM-dd'),
            hours: '',
            notes: '',
            hourly_rate: null
        });
        setMaterialUsageForm({
            material_id: '',
            painter_id: '',
            quantity: '',
            date_used: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
        setExtraCostForm({
            description: '',
            amount: '',
            date_incurred: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
    };

    const handleGeneratePDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const response = await generatePostCalculationPDF({ project_id: project.id });
            
            if (response.data) {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `na-calculatie-${project.project_name.replace(/\s+/g, '-')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();

                toast({
                    title: "PDF gegenereerd",
                    description: "Na-calculatie PDF is gedownload."
                });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({
                variant: "destructive",
                title: "PDF generatie mislukt",
                description: "Er is een fout opgetreden bij het genereren van de PDF."
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleFinalizeProject = async () => {
        if (!window.confirm('Weet u zeker dat u dit project wilt afronden? Dit maakt een definitieve snapshot van alle kosten.')) {
            return;
        }

        setIsFinalizingProject(true);
        try {
            await finalizeProject({ project_id: project.id });
            toast({
                title: "Project afgerond",
                description: "Project is succesvol afgerond en kosten-snapshot is aangemaakt."
            });
            if (loadProjectData) {
                loadProjectData();
            }
        } catch (error) {
            console.error('Error finalizing project:', error);
            toast({
                variant: "destructive",
                title: "Project afronden mislukt",
                description: "Er is een fout opgetreden bij het afronden van het project."
            });
        } finally {
            setIsFinalizingProject(false);
        }
    };

    // Time Entry Functions
    const handleSaveTimeEntry = async () => {
        const parsedHours = parseFloat(timeEntryForm.hours);
        if (!timeEntryForm.painter_id) {
            toast({ variant: "destructive", title: "Fout", description: "Selecteer een schilder." });
            return;
        }
        if (isNaN(parsedHours) || parsedHours <= 0) {
            toast({ variant: "destructive", title: "Fout", description: "Voer een geldig aantal uren in." });
            return;
        }

        try {
            const painter = availablePainters.find(p => p.id === timeEntryForm.painter_id);
            const hourlyRate = timeEntryForm.hourly_rate !== null && timeEntryForm.hourly_rate !== '' 
                ? parseFloat(timeEntryForm.hourly_rate) 
                : (parseFloat(painter?.hourly_rate) || 0);
            const costTotal = parsedHours * hourlyRate;

            const timeEntryData = {
                company_id: project.company_id,
                project_id: project.id,
                painter_id: timeEntryForm.painter_id,
                date_worked: timeEntryForm.date_worked,
                hours: parsedHours,
                notes: timeEntryForm.notes,
                confirmed_by_painter: false, // Admin added
                approved_by_admin: true,
                approved_at: new Date().toISOString(),
                hourly_rate_snapshot: hourlyRate,
                cost_total: costTotal
            };

            if (editingTimeEntry) {
                await TimeEntry.update(editingTimeEntry.id, timeEntryData);
                toast({ title: "Uren bijgewerkt", description: "Urenregistratie is succesvol bijgewerkt." });
            } else {
                await TimeEntry.create(timeEntryData);
                toast({ title: "Uren toegevoegd", description: "Nieuwe urenregistratie is toegevoegd." });
            }

            setShowTimeEntryForm(false);
            setEditingTimeEntry(null);
            resetForms();
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error saving time entry:', error);
            toast({
                variant: "destructive",
                title: "Fout bij opslaan",
                description: "Kon urenregistratie niet opslaan."
            });
        }
    };

    const handleEditTimeEntry = (entry) => {
        setEditingTimeEntry(entry);
        setTimeEntryForm({
            painter_id: entry.painter_id,
            date_worked: entry.date_worked,
            hours: entry.hours.toString(),
            notes: entry.notes || '',
            hourly_rate: entry.hourly_rate_snapshot || null
        });
        setShowTimeEntryForm(true);
    };

    const handleDeleteTimeEntry = async (entryId) => {
        if (!window.confirm('Weet u zeker dat u deze urenregistratie wilt verwijderen?')) return;
        
        try {
            await TimeEntry.delete(entryId);
            toast({ title: "Verwijderd", description: "Urenregistratie is verwijderd." });
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error deleting time entry:', error);
            toast({
                variant: "destructive",
                title: "Fout bij verwijderen",
                description: "Kon urenregistratie niet verwijderen."
            });
        }
    };

    const handleApproveTimeEntry = async (entryId) => {
        try {
            await TimeEntry.update(entryId, {
                approved_by_admin: true,
                approved_at: new Date().toISOString()
            });
            toast({ title: "Goedgekeurd", description: "Urenregistratie is goedgekeurd." });
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error approving time entry:', error);
            toast({
                variant: "destructive",
                title: "Fout bij goedkeuren",
                description: "Kon urenregistratie niet goedkeuren."
            });
        }
    };

    // Material Usage Functions
    const handleSaveMaterialUsage = async () => {
        const parsedQuantity = parseFloat(materialUsageForm.quantity);
        if (!materialUsageForm.material_id) {
            toast({ variant: "destructive", title: "Fout", description: "Selecteer een materiaal." });
            return;
        }
        if (!materialUsageForm.painter_id) {
            toast({ variant: "destructive", title: "Fout", description: "Selecteer een schilder." });
            return;
        }
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            toast({ variant: "destructive", title: "Fout", description: "Voer een geldige hoeveelheid in." });
            return;
        }

        try {
            const material = materialsList.find(m => m.id === materialUsageForm.material_id);
            const costTotal = parsedQuantity * (material?.price_excl_vat || 0);

            const materialUsageData = {
                company_id: project.company_id,
                project_id: project.id,
                material_id: materialUsageForm.material_id,
                painter_id: materialUsageForm.painter_id,
                quantity: parsedQuantity,
                date_used: materialUsageForm.date_used,
                notes: materialUsageForm.notes,
                confirmed_by_painter: false, // Admin added
                approved_by_admin: true,
                approved_at: new Date().toISOString(),
                unit_price_snapshot: material?.price_excl_vat || 0,
                cost_total: costTotal
            };

            if (editingMaterialUsage) {
                await MaterialUsage.update(editingMaterialUsage.id, materialUsageData);
                toast({ title: "Materiaalgebruik bijgewerkt", description: "Materiaalgebruik is succesvol bijgewerkt." });
            } else {
                await MaterialUsage.create(materialUsageData);
                toast({ title: "Materiaalgebruik toegevoegd", description: "Nieuw materiaalgebruik is toegevoegd." });
            }

            setShowMaterialUsageForm(false);
            setEditingMaterialUsage(null);
            resetForms();
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error saving material usage:', error);
            toast({
                variant: "destructive",
                title: "Fout bij opslaan",
                description: "Kon materiaalgebruik niet opslaan."
            });
        }
    };

    const handleEditMaterialUsage = (usage) => {
        setEditingMaterialUsage(usage);
        setMaterialUsageForm({
            material_id: usage.material_id,
            painter_id: usage.painter_id,
            quantity: usage.quantity.toString(),
            date_used: usage.date_used,
            notes: usage.notes || ''
        });
        setShowMaterialUsageForm(true);
    };

    const handleDeleteMaterialUsage = async (usageId) => {
        if (!window.confirm('Weet u zeker dat u dit materiaalgebruik wilt verwijderen?')) return;
        
        try {
            await MaterialUsage.delete(usageId);
            toast({ title: "Verwijderd", description: "Materiaalgebruik is verwijderd." });
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error deleting material usage:', error);
            toast({
                variant: "destructive",
                title: "Fout bij verwijderen",
                description: "Kon materiaalgebruik niet verwijderen."
            });
        }
    };

    const handleApproveMaterialUsage = async (usageId) => {
        try {
            await MaterialUsage.update(usageId, {
                approved_by_admin: true,
                approved_at: new Date().toISOString()
            });
            toast({ title: "Goedgekeurd", description: "Materiaalgebruik is goedgekeurd." });
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error approving material usage:', error);
            toast({
                variant: "destructive",
                title: "Fout bij goedkeuren",
                description: "Kon materiaalgebruik niet goedkeuren."
            });
        }
    };

    // Extra Cost Functions
    const handleSaveExtraCost = async () => {
        const parsedAmount = parseFloat(extraCostForm.amount);
        if (!extraCostForm.description.trim()) {
            toast({ variant: "destructive", title: "Fout", description: "Voer een omschrijving in." });
            return;
        }
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast({ variant: "destructive", title: "Fout", description: "Voer een geldig bedrag in." });
            return;
        }

        try {
            const extraCostData = {
                company_id: project.company_id,
                project_id: project.id,
                description: extraCostForm.description,
                amount: parsedAmount,
                date_incurred: extraCostForm.date_incurred,
                notes: extraCostForm.notes,
                added_by: 'admin' // We'd get this from current user in real app
            };

            if (editingExtraCost) {
                await ExtraCost.update(editingExtraCost.id, extraCostData);
                toast({ title: "Bijkomende kost bijgewerkt", description: "Bijkomende kost is succesvol bijgewerkt." });
            } else {
                await ExtraCost.create(extraCostData);
                toast({ title: "Bijkomende kost toegevoegd", description: "Nieuwe bijkomende kost is toegevoegd." });
            }

            setShowExtraCostForm(false);
            setEditingExtraCost(null);
            resetForms();
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error saving extra cost:', error);
            toast({
                variant: "destructive",
                title: "Fout bij opslaan",
                description: "Kon bijkomende kost niet opslaan."
            });
        }
    };

    const handleEditExtraCost = (cost) => {
        setEditingExtraCost(cost);
        setExtraCostForm({
            description: cost.description,
            amount: cost.amount.toString(),
            date_incurred: cost.date_incurred,
            notes: cost.notes || ''
        });
        setShowExtraCostForm(true);
    };

    const handleDeleteExtraCost = async (costId) => {
        if (!window.confirm('Weet u zeker dat u deze bijkomende kost wilt verwijderen?')) return;
        
        try {
            await ExtraCost.delete(costId);
            toast({ title: "Verwijderd", description: "Bijkomende kost is verwijderd." });
            if (loadProjectData) loadProjectData();
        } catch (error) {
            console.error('Error deleting extra cost:', error);
            toast({
                variant: "destructive",
                title: "Fout bij verwijderen",
                description: "Kon bijkomende kost niet verwijderen."
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* KPI Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Kosten Uren</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(costTotals.hours_cost || 0)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-600">Kosten Materialen</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(costTotals.materials_cost || 0)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Euro className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-gray-600">Bijkomende Kosten</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(costTotals.extra_costs || 0)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Car className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-gray-600">Reiskosten</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{formatCurrency(costTotals.travel_cost || 0)}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-4 border-t-2 border-t-purple-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="w-5 h-5 text-purple-600" />
                                    <span className="text-base font-semibold text-gray-700">Totaal Projectkosten</span>
                                </div>
                                <p className="text-3xl font-bold text-purple-600">{formatCurrency(costTotals.total_cost || 0)}</p>
                            </div>
                            {project.quote_price !== undefined && project.quote_price !== null && (
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 mb-1">Offertebedrag: <span className="font-semibold text-gray-700">{formatCurrency(project.quote_price)}</span></div>
                                    <div className={`text-lg font-bold flex items-center justify-end gap-2 ${project.quote_price - (costTotals.total_cost || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>Marge:</span>
                                        <span>{formatCurrency(project.quote_price - (costTotals.total_cost || 0))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF} variant="outline">
                    {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    Genereer PDF
                </Button>
                <Button 
                    onClick={handleFinalizeProject} 
                    disabled={isFinalizingProject || project.status === 'afgerond'} 
                    className="bg-green-600 hover:bg-green-700"
                >
                    {isFinalizingProject ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    {project.status === 'afgerond' ? 'Project Afgerond' : 'Project Afronden'}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="materials" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="materials">Materialen ({materialUsages.length})</TabsTrigger>
                    <TabsTrigger value="hours">Uren ({timeEntries.length + updates.length})</TabsTrigger>
                    <TabsTrigger value="extra">Bijkomende Kosten ({extraCosts.length})</TabsTrigger>
                </TabsList>

                {/* Materials Tab */}
                <TabsContent value="materials">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Gebruikte Materialen</CardTitle>
                                <Button onClick={() => setShowMaterialUsageForm(true)} size="sm" type="button">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Materiaal Toevoegen
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {materialUsages.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">Nog geen materialen gebruikt</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Materiaal</TableHead>
                                                <TableHead>Schilder</TableHead>
                                                <TableHead>Aantal</TableHead>
                                                <TableHead>Datum</TableHead>
                                                <TableHead>Prijs/Eenheid</TableHead>
                                                <TableHead>Totaal</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Acties</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {materialUsages.map((usage) => {
                                                const material = materialsList.find(m => m.id === usage.material_id);
                                                const painter = availablePainters.find(p => p.id === usage.painter_id);
                                                return (
                                                    <TableRow key={usage.id}>
                                                        <TableCell>
                                                            {material?.name || 'Onbekend materiaal'}
                                                            {material && (
                                                                <div className="text-sm text-gray-500">
                                                                    {material.category} • {material.unit}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{painter?.full_name || 'Onbekend'}</TableCell>
                                                        <TableCell>{usage.quantity}</TableCell>
                                                        <TableCell>{format(parseISO(usage.date_used), 'dd-MM-yyyy')}</TableCell>
                                                        <TableCell>{formatCurrency(usage.unit_price_snapshot || 0)}</TableCell>
                                                        <TableCell className="font-medium">{formatCurrency(usage.cost_total || 0)}</TableCell>
                                                        <TableCell>
                                                            {usage.approved_by_admin ? (
                                                                <Badge className="bg-green-100 text-green-800">Goedgekeurd</Badge>
                                                            ) : (
                                                                <Badge className="bg-yellow-100 text-yellow-800">Wacht op goedkeuring</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline" 
                                                                    onClick={() => handleEditMaterialUsage(usage)}
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </Button>
                                                                {!usage.approved_by_admin && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => handleApproveMaterialUsage(usage.id)}
                                                                    >
                                                                        <CheckCircle className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="destructive"
                                                                    onClick={() => handleDeleteMaterialUsage(usage.id)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Hours Tab */}
                <TabsContent value="hours">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Gewerkte Uren</CardTitle>
                                <Button onClick={() => setShowTimeEntryForm(true)} size="sm" type="button">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Uren Toevoegen
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {timeEntries.length === 0 && updates.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">Nog geen uren geregistreerd</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Schilder</TableHead>
                                                <TableHead>Datum</TableHead>
                                                <TableHead>Uren</TableHead>
                                                <TableHead>Uurtarief</TableHead>
                                                <TableHead>Totaal</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Acties</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Display Daily Updates (Team Activity) */}
                                            {updates.map((update) => {
                                                const painter = availablePainters.find(p => (p.email || '').toLowerCase() === (update.painter_email || '').toLowerCase());
                                                const rate = painter?.hourly_rate ? parseFloat(painter.hourly_rate) : 0;
                                                const total = (update.hours_worked || 0) * rate;

                                                return (
                                                    <TableRow key={`update-${update.id}`} className="bg-gray-50/50">
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                Team Activiteit
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{update.painter_name || 'Onbekend'}</TableCell>
                                                        <TableCell>{format(parseISO(update.work_date), 'dd-MM-yyyy')}</TableCell>
                                                        <TableCell>{update.hours_worked}u</TableCell>
                                                        <TableCell>{formatCurrency(rate)}</TableCell>
                                                        <TableCell className="font-medium">{formatCurrency(total)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                                                                Geregistreerd
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-xs text-gray-400 italic">Automatisch</span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}

                                            {/* Display Manual Time Entries */}
                                            {timeEntries.map((entry) => {
                                                const painter = availablePainters.find(p => p.id === entry.painter_id);
                                                return (
                                                    <TableRow key={`entry-${entry.id}`}>
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                Handmatig
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{painter?.full_name || 'Onbekend'}</TableCell>
                                                        <TableCell>{format(parseISO(entry.date_worked), 'dd-MM-yyyy')}</TableCell>
                                                        <TableCell>{entry.hours}u</TableCell>
                                                        <TableCell>{formatCurrency(entry.hourly_rate_snapshot || 0)}</TableCell>
                                                        <TableCell className="font-medium">{formatCurrency(entry.cost_total || 0)}</TableCell>
                                                        <TableCell>
                                                            {entry.approved_by_admin ? (
                                                                <Badge className="bg-green-100 text-green-800">Goedgekeurd</Badge>
                                                            ) : (
                                                                <Badge className="bg-yellow-100 text-yellow-800">Wacht op goedkeuring</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline" 
                                                                    onClick={() => handleEditTimeEntry(entry)}
                                                                    type="button"
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </Button>
                                                                {!entry.approved_by_admin && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => handleApproveTimeEntry(entry.id)}
                                                                        type="button"
                                                                    >
                                                                        <CheckCircle className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="destructive"
                                                                    onClick={() => handleDeleteTimeEntry(entry.id)}
                                                                    type="button"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Extra Costs Tab */}
                <TabsContent value="extra">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Bijkomende Kosten</CardTitle>
                                <Button onClick={() => setShowExtraCostForm(true)} size="sm" type="button">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Kost Toevoegen
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {extraCosts.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">Nog geen bijkomende kosten</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Omschrijving</TableHead>
                                                <TableHead>Bedrag</TableHead>
                                                <TableHead>Datum</TableHead>
                                                <TableHead>Notities</TableHead>
                                                <TableHead>Acties</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {extraCosts.map((cost) => (
                                                <TableRow key={cost.id}>
                                                    <TableCell className="font-medium">{cost.description}</TableCell>
                                                    <TableCell className="font-medium">{formatCurrency(cost.amount)}</TableCell>
                                                    <TableCell>{format(parseISO(cost.date_incurred), 'dd-MM-yyyy')}</TableCell>
                                                    <TableCell>{cost.notes || '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                onClick={() => handleEditExtraCost(cost)}
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="destructive"
                                                                onClick={() => handleDeleteExtraCost(cost.id)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Time Entry Form Dialog */}
            <Dialog open={showTimeEntryForm} onOpenChange={setShowTimeEntryForm}>
                <DialogContent className="max-w-md z-[100005]">
                    <DialogHeader>
                        <DialogTitle>{editingTimeEntry ? 'Uren Bewerken' : 'Uren Toevoegen'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Schilder</Label>
                            <Select value={timeEntryForm.painter_id} onValueChange={(value) => setTimeEntryForm({...timeEntryForm, painter_id: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecteer schilder" />
                                </SelectTrigger>
                                <SelectContent className="z-[100005]">
                                    {availablePainters.map(painter => (
                                        <SelectItem key={painter.id} value={painter.id}>{painter.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {timeEntryForm.painter_id && ( 
                                <div className="text-xs text-gray-500 mt-1">
                                    Standaard tarief: {availablePainters.find(p => p.id === timeEntryForm.painter_id)?.hourly_rate ? formatCurrency(availablePainters.find(p => p.id === timeEntryForm.painter_id)?.hourly_rate) : 'Niet ingesteld'}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Datum</Label>
                            <Input 
                                type="date" 
                                value={timeEntryForm.date_worked}
                                onChange={(e) => setTimeEntryForm({...timeEntryForm, date_worked: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Uren</Label>
                            <Input 
                                type="number" 
                                step="0.5"
                                placeholder="8" 
                                value={timeEntryForm.hours}
                                onChange={(e) => setTimeEntryForm({...timeEntryForm, hours: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Uurtarief (€)</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                placeholder={timeEntryForm.painter_id && availablePainters.find(p => p.id === timeEntryForm.painter_id)?.hourly_rate ? `${availablePainters.find(p => p.id === timeEntryForm.painter_id)?.hourly_rate}` : "35.00"}
                                value={timeEntryForm.hourly_rate !== null ? timeEntryForm.hourly_rate : ''}
                                onChange={(e) => setTimeEntryForm({...timeEntryForm, hourly_rate: e.target.value === '' ? null : parseFloat(e.target.value)})}
                            />
                            <p className="text-xs text-gray-400 mt-1">Laat leeg om standaard tarief van schilder te gebruiken</p>
                        </div>
                        <div>
                            <Label>Notities</Label>
                            <Textarea 
                                placeholder="Optionele notities..."
                                value={timeEntryForm.notes}
                                onChange={(e) => setTimeEntryForm({...timeEntryForm, notes: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowTimeEntryForm(false)}>Annuleren</Button>
                            <Button onClick={handleSaveTimeEntry}>
                                <Save className="w-4 h-4 mr-2" />
                                {editingTimeEntry ? 'Bijwerken' : 'Toevoegen'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Material Usage Form Dialog */}
            <Dialog open={showMaterialUsageForm} onOpenChange={setShowMaterialUsageForm}>
                <DialogContent className="max-w-md z-[100005]">
                    <DialogHeader>
                        <DialogTitle>{editingMaterialUsage ? 'Materiaalgebruik Bewerken' : 'Materiaalgebruik Toevoegen'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Materiaal</Label>
                            <Select value={materialUsageForm.material_id} onValueChange={(value) => setMaterialUsageForm({...materialUsageForm, material_id: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecteer materiaal" />
                                </SelectTrigger>
                                <SelectContent className="z-[100005]">
                                    {materialsList.map(material => (
                                        <SelectItem key={material.id} value={material.id}>
                                            {material.name} ({material.unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Schilder</Label>
                            <Select value={materialUsageForm.painter_id} onValueChange={(value) => setMaterialUsageForm({...materialUsageForm, painter_id: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecteer schilder" />
                                </SelectTrigger>
                                <SelectContent className="z-[100005]">
                                    {availablePainters.map(painter => (
                                        <SelectItem key={painter.id} value={painter.id}>{painter.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Aantal</Label>
                            <Input 
                                type="number" 
                                step="0.1"
                                placeholder="1" 
                                value={materialUsageForm.quantity}
                                onChange={(e) => setMaterialUsageForm({...materialUsageForm, quantity: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Datum</Label>
                            <Input 
                                type="date" 
                                value={materialUsageForm.date_used}
                                onChange={(e) => setMaterialUsageForm({...materialUsageForm, date_used: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Notities</Label>
                            <Textarea 
                                placeholder="Optionele notities..."
                                value={materialUsageForm.notes}
                                onChange={(e) => setMaterialUsageForm({...materialUsageForm, notes: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowMaterialUsageForm(false)}>Annuleren</Button>
                            <Button onClick={handleSaveMaterialUsage}>
                                <Save className="w-4 h-4 mr-2" />
                                {editingMaterialUsage ? 'Bijwerken' : 'Toevoegen'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Extra Cost Form Dialog */}
            <Dialog open={showExtraCostForm} onOpenChange={setShowExtraCostForm}>
                <DialogContent className="max-w-md z-[100005]">
                    <DialogHeader>
                        <DialogTitle>{editingExtraCost ? 'Bijkomende Kost Bewerken' : 'Bijkomende Kost Toevoegen'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Omschrijving</Label>
                            <Input 
                                placeholder="Beschrijving van de kost"
                                value={extraCostForm.description}
                                onChange={(e) => setExtraCostForm({...extraCostForm, description: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Bedrag (€)</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                value={extraCostForm.amount}
                                onChange={(e) => setExtraCostForm({...extraCostForm, amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Datum</Label>
                            <Input 
                                type="date" 
                                value={extraCostForm.date_incurred}
                                onChange={(e) => setExtraCostForm({...extraCostForm, date_incurred: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Notities</Label>
                            <Textarea 
                                placeholder="Optionele notities..."
                                value={extraCostForm.notes}
                                onChange={(e) => setExtraCostForm({...extraCostForm, notes: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowExtraCostForm(false)}>Annuleren</Button>
                            <Button onClick={handleSaveExtraCost}>
                                <Save className="w-4 h-4 mr-2" />
                                {editingExtraCost ? 'Bijwerken' : 'Toevoegen'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}