import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppError, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, CheckCircle2, AlertTriangle, Eye, RefreshCw, X, Trash2 } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createPageUrl } from '@/components/utils';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { errorTracker } from '@/components/utils/errorTracker';
import { debounce } from 'lodash';

export default function SuperAdminErrorLog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedError, setSelectedError] = useState(null);
    const [generatingSolution, setGeneratingSolution] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    
    // Bulk actions state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Filter state derived from URL
    const filters = useMemo(() => ({
        status: searchParams.get('status') || 'all',
        severity: searchParams.get('severity') || 'all',
        search: searchParams.get('search') || ''
    }), [searchParams]);

    const isSuperAdmin = currentUser?.role === 'admin';

    const loadErrors = useCallback(async (currentFilters) => {
        setLoading(true);
        try {
            // Auth check inside load to ensure fresh state
            const user = await User.me().catch(() => null);
            if (!user || user.role !== 'admin') {
                setCurrentUser(user);
                setLoading(false);
                return;
            }
            setCurrentUser(user);

            const query = {};
            if (currentFilters.status !== 'all') query.status = currentFilters.status;
            if (currentFilters.severity !== 'all') query.severity = currentFilters.severity;
            if (currentFilters.search) {
                query.$or = [
                    { error_message: { $regex: currentFilters.search, $options: 'i' } },
                    { user_email: { $regex: currentFilters.search, $options: 'i' } },
                    { component_page: { $regex: currentFilters.search, $options: 'i' } }
                ];
            }

            const fetchedErrors = await AppError.filter(query, '-timestamp', 100);
            setErrors(Array.isArray(fetchedErrors) ? fetchedErrors.filter(Boolean) : []);
            // Reset selection on reload
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Failed to load errors:", err);
            toast.error("Fouten konden niet geladen worden.");
            // Log internal error but avoid loop
            if (err.type !== 'log_error') {
                errorTracker.captureError({
                    type: 'internal_log_load_error',
                    message: 'Failed to load error log',
                    originalError: err
                });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadErrors(filters);
    }, []); // Run once on mount, subsequent updates handled by debounced/filter effects

    // Debounced search handler
    const debouncedSearch = useMemo(
        () => debounce((newFilters) => {
            loadErrors(newFilters);
        }, 500),
        [loadErrors]
    );

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
        
        const newFilters = { ...filters, [key]: value };
        if (key === 'search') {
            debouncedSearch(newFilters);
        } else {
            loadErrors(newFilters);
        }
    };

    // Helper functions for styling
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
    };

    const formatErrorDetails = (details) => {
        if (!details) return 'Geen details beschikbaar';
        try {
            const parsed = typeof details === 'string' ? JSON.parse(details) : details;
            return JSON.stringify(parsed, null, 2);
        } catch {
            return details;
        }
    };

    // Actions
    const generateSolution = async (errorId) => {
        setGeneratingSolution(true);
        try {
            const { data } = await base44.functions.invoke('generateErrorSolution', { appErrorId: errorId });
            if (data.success) {
                toast.success("AI-oplossing gegenereerd!");
                // Optimistic update locally
                setErrors(prev => prev.map(e => e.id === errorId ? { ...e, ai_solution_suggestion: data.ai_solution } : e));
                setSelectedError(prev => prev && prev.id === errorId ? { ...prev, ai_solution_suggestion: data.ai_solution } : prev);
            } else {
                toast.error(data.error || "Fout bij genereren AI-oplossing.");
            }
        } catch (err) {
            console.error("Error generating AI solution:", err);
            toast.error("Fout bij genereren AI-oplossing.");
        } finally {
            setGeneratingSolution(false);
        }
    };

    const updateErrorStatus = async (errorId, newStatus) => {
        setUpdatingStatusId(errorId);
        try {
            await AppError.update(errorId, {
                status: newStatus,
                resolved_by_user_id: newStatus === 'resolved' ? currentUser?.id : null,
                resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
            });
            toast.success(`Status bijgewerkt naar ${newStatus}.`);
            
            // Optimistic update
            setErrors(prev => prev.map(e => e.id === errorId ? { ...e, status: newStatus } : e));
            setSelectedError(prev => prev && prev.id === errorId ? { ...prev, status: newStatus } : prev);
        } catch (err) {
            console.error("Error updating error status:", err);
            toast.error("Fout bij bijwerken status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // Bulk Actions
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(new Set(errors.map(e => e.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id, checked) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Weet je zeker dat je ${selectedIds.size} foutmeldingen wilt verwijderen?`)) return;

        setIsBulkDeleting(true);
        try {
            const ids = Array.from(selectedIds);
            const BATCH_SIZE = 3; // Kleine batch om rate limits te voorkomen
            
            // Verwerk in batches
            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(id => AppError.delete(id)));
                // Korte pauze tussen batches
                if (i + BATCH_SIZE < ids.length) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            toast.success(`${selectedIds.size} foutmeldingen verwijderd.`);
            setSelectedIds(new Set());
            loadErrors(filters);
        } catch (err) {
            console.error("Bulk delete failed:", err);
            toast.error("Fout bij verwijderen. Mogelijk te veel verzoeken tegelijk, probeer het opnieuw.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    if (loading && !currentUser && !errors.length) {
        return <div className="p-6 text-center"><LoadingSpinner size="default" /><p className="mt-2">Laden...</p></div>;
    }

    if (!isSuperAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center border-red-200 bg-red-50 dark:bg-red-900/10">
                    <CardHeader><CardTitle className="text-red-700 dark:text-red-400">Toegang Geweigerd</CardTitle></CardHeader>
                    <CardContent>
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-300">U heeft geen rechten om deze pagina te bekijken. Alleen super admins kunnen foutmeldingen inzien.</p>
                        <Button className="mt-4" onClick={() => window.location.href = createPageUrl('Dashboard')}>Naar Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">App Foutlogboek</CardTitle>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <Badge variant="secondary" className="px-2 py-1">{selectedIds.size} geselecteerd</Badge>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="h-8"
                                >
                                    {isBulkDeleting ? <InlineSpinner className="mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                                    Verwijderen
                                </Button>
                            </div>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loadErrors(filters)} disabled={loading} aria-label="Lijst vernieuwen">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Vernieuwen
                    </Button>
                </CardHeader>
                
                <CardContent className="px-0">
                    <div className="flex flex-wrap items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <Input
                            placeholder="Zoeken op bericht, gebruiker of pagina..."
                            defaultValue={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="max-w-sm"
                            aria-label="Zoeken"
                        />
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger className="w-[180px]" aria-label="Filter op status">
                                <SelectValue placeholder="Filter op status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Statussen</SelectItem>
                                <SelectItem value="new">Nieuw</SelectItem>
                                <SelectItem value="in_progress">In Behandeling</SelectItem>
                                <SelectItem value="resolved">Opgelost</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                            <SelectTrigger className="w-[180px]" aria-label="Filter op ernst">
                                <SelectValue placeholder="Filter op ernst" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Ernst</SelectItem>
                                <SelectItem value="low">Laag</SelectItem>
                                <SelectItem value="medium">Gemiddeld</SelectItem>
                                <SelectItem value="high">Hoog</SelectItem>
                                <SelectItem value="critical">Kritiek</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableHead className="w-[40px]">
                                        <Checkbox 
                                            checked={errors.length > 0 && selectedIds.size === errors.length}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Selecteer alles"
                                        />
                                    </TableHead>
                                    <TableHead>Tijdstip</TableHead>
                                    <TableHead>Bericht</TableHead>
                                    <TableHead>Gebruiker</TableHead>
                                    <TableHead>Pagina</TableHead>
                                    <TableHead>Ernst</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Acties</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && errors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                            <LoadingSpinner size="default" />
                                            <p>Fouten laden...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : errors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                                                <p className="text-lg font-medium">Geen foutmeldingen gevonden</p>
                                                <p className="text-sm">Alles lijkt goed te werken!</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    errors.map((error) => (
                                        <TableRow 
                                            key={error.id} 
                                            onClick={() => setSelectedError(error)} 
                                            className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.has(error.id) ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}
                                        >
                                            <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox 
                                                    checked={selectedIds.has(error.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(error.id, checked)}
                                                    aria-label={`Selecteer fout ${error.id}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-xs whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {format(new Date(error.timestamp), 'dd-MM HH:mm', { locale: nl })}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm font-medium text-gray-900 dark:text-gray-100" title={error.error_message}>
                                                {error.error_message}
                                            </TableCell>
                                            <TableCell className="text-xs max-w-[150px] truncate text-gray-600 dark:text-gray-400" title={error.user_email}>
                                                {error.user_email || 'Onbekend'}
                                            </TableCell>
                                            <TableCell className="text-xs max-w-[120px] truncate text-gray-600 dark:text-gray-400" title={error.component_page}>
                                                {error.component_page || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`font-normal ${getSeverityColor(error.severity)}`}>
                                                    {error.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`font-normal ${getStatusColor(error.status)}`}>
                                                    {error.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedError(error); }}
                                                    aria-label="Bekijk details"
                                                    className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {selectedError && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-fade-in">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-100 dark:border-gray-800 py-4">
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Foutdetails</CardTitle>
                                <p className="text-xs text-gray-500">ID: {selectedError.id}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedError(null)} aria-label="Sluiten">
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Tijdstip</span>
                                    <p className="font-medium">{format(new Date(selectedError.timestamp), 'dd MMMM yyyy HH:mm:ss', { locale: nl })}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Gebruiker</span>
                                    <p className="font-medium">{selectedError.user_email || 'Onbekend'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Pagina</span>
                                    <p className="font-medium">{selectedError.component_page || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Status & Ernst</span>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className={getStatusColor(selectedError.status)}>{selectedError.status}</Badge>
                                        <Badge variant="outline" className={getSeverityColor(selectedError.severity)}>{selectedError.severity}</Badge>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <strong className="text-sm font-semibold text-gray-900 dark:text-gray-100">Foutmelding</strong>
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                    <p className="text-sm text-red-700 dark:text-red-300 font-medium font-mono">{selectedError.error_message}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <strong className="text-sm font-semibold text-gray-900 dark:text-gray-100">Technische Details</strong>
                                <div className="relative">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs whitespace-pre-wrap max-h-60 overflow-y-auto font-mono shadow-inner scrollbar-hide">
                                        {formatErrorDetails(selectedError.error_details)}
                                    </pre>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <strong className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        <Zap className="w-4 h-4 text-yellow-500" />
                                        AI Oplossingssuggestie
                                    </strong>
                                    <Button
                                        onClick={() => generateSolution(selectedError.id)}
                                        disabled={generatingSolution}
                                        size="sm"
                                        variant={selectedError.ai_solution_suggestion ? "outline" : "default"}
                                        className={selectedError.ai_solution_suggestion ? "" : "bg-purple-600 hover:bg-purple-700 text-white"}
                                    >
                                        {generatingSolution ? <InlineSpinner className="mr-2" /> : <Zap className="h-3 w-3 mr-2" />}
                                        {generatingSolution ? 'Genereren...' : (selectedError.ai_solution_suggestion ? 'Opnieuw Genereren' : 'Genereer Oplossing')}
                                    </Button>
                                </div>
                                <div className={`p-4 rounded-lg border transition-colors ${selectedError.ai_solution_suggestion ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30' : 'bg-gray-50 dark:bg-gray-800 border-dashed border-gray-200 dark:border-gray-700'}`}>
                                    {selectedError.ai_solution_suggestion ? (
                                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                            {selectedError.ai_solution_suggestion}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic text-center py-2">Klik op de knop om een mogelijke oplossing te genereren met AI.</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
                                <Button variant="outline" onClick={() => setSelectedError(null)}>
                                    Sluiten
                                </Button>
                                {selectedError.status !== 'resolved' && (
                                    <Button 
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                                        onClick={() => updateErrorStatus(selectedError.id, 'resolved')}
                                        disabled={updatingStatusId === selectedError.id}
                                    >
                                        {updatingStatusId === selectedError.id ? <InlineSpinner /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Markeren als Opgelost
                                    </Button>
                                )}
                                {selectedError.status === 'new' && (
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => updateErrorStatus(selectedError.id, 'in_progress')}
                                        disabled={updatingStatusId === selectedError.id}
                                    >
                                        {updatingStatusId === selectedError.id ? <InlineSpinner /> : null}
                                        In Behandeling Nemen
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}