import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, DailyUpdate, Damage, MaterialRequest, MaterialUsage, ColorAdvice, User, TimeEntry, ExtraCost, Material, Company } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Edit, Info, MessageSquare, Palette, Package, AlertTriangle, Calculator, Camera, MapPin, Users as UsersIcon } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { geocodeAddress } from '@/api/functions';
import { globalCache } from '@/components/utils/cache';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Lazy loading components
const ProjectDetailsMainContent = lazy(() => import('@/components/projects/ProjectDetailsMainContent'));
const ProjectsMap = lazy(() => import('@/components/projects/ProjectsMap'));

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85d_Colorlogo-nobackground.png';

// Helper om initialen te krijgen
const getInitials = (name) => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

export default function ProjectDetails({ project: initialProject, onClose, onProjectUpdate, isAdmin, onEditProject, initialTab }) {
    const [project, setProject] = useState(initialProject);
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState(initialTab || 'info');
    const [relatedData, setRelatedData] = useState({
        updates: [],
        damages: [],
        materialRequests: [],
        materialUsages: [],
        colorAdvices: [],
        assignedPainters: [],
        timeEntries: [],
        extraCosts: [],
        materialsList: [],
        costTotals: {},
        allPhotos: [],
    });

    const safeEntityCall = async (entityCall, fallbackValue = []) => {
        try {
            const result = await entityCall();
            return result || fallbackValue;
        } catch (error) {
            if (error.response?.status !== 401) { 
              console.warn('Entity call failed, using fallback:', error.message);
            }
            return fallbackValue;
        }
    };

    const loadProjectData = useCallback(async () => {
        if (!project?.id) {
            setError("Geen project ID beschikbaar.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // KRITIEK: Verify project still exists and fetch fresh data
            const projectData = await Project.get(project.id);
            if (!projectData) {
                // This case should ideally be caught by the 404 error below,
                // but adding an explicit check just in case Project.get returns null without erroring.
                throw new Error("Project niet gevonden.");
            }
            setProject(projectData);

            if (projectData.company_id) {
                const companyData = await safeEntityCall(() => Company.get(projectData.company_id), null);
                setCompany(companyData);
            }

            const [
                updatesData, damagesData, materialRequestsData, materialUsagesData,
                colorAdvicesData, timeEntriesData, extraCostsData, allMaterials, projectStatsResponse
            ] = await Promise.all([
                safeEntityCall(() => DailyUpdate.filter({ project_id: project.id }, '-work_date', 1000)),
                safeEntityCall(() => Damage.filter({ project_id: project.id }, '-created_date')),
                safeEntityCall(() => MaterialRequest.filter({ project_id: project.id }, '-created_date', 5)),
                safeEntityCall(() => MaterialUsage.filter({ project_id: project.id }, '-date_used')),
                safeEntityCall(() => ColorAdvice.filter({ project_id: project.id }, '-created_date')),
                safeEntityCall(() => TimeEntry.filter({ project_id: project.id })),
                safeEntityCall(() => ExtraCost.filter({ project_id: project.id })),
                safeEntityCall(() => Material.filter({ company_id: projectData.company_id })),
                base44.functions.invoke('getProjectStats', { project_ids: [project.id] })
            ]);

            // TOEGEVOEGD: Debug logging voor kleuradviezen
            console.log('ProjectDetails: Loaded color advices:', colorAdvicesData);

            // Haal ALLE users op van het bedrijf via backend functie (voorkomt 403 voor schilders)
            let teamMembersData = [];
            if (projectData.company_id) {
                try {
                    const paintersResponse = await base44.functions.invoke('getCompanyPainters', { company_id: projectData.company_id });
                    teamMembersData = paintersResponse?.data || [];
                } catch (err) {
                    console.warn('Could not fetch team members:', err.message);
                    teamMembersData = [];
                }
            }

            // Filter assigned painters uit de teamMembersData voor backward compatibility indien nodig,
            // maar we geven nu teamMembersData door als 'teamMembers'
            let paintersData = [];
            if (projectData.assigned_painters?.length > 0) {
                paintersData = teamMembersData.filter(u => projectData.assigned_painters.includes(u.email));
            }

            // Extract stats from the new getProjectStats function
            const projectCalculatedStats = projectStatsResponse?.data?.[project.id] || {};
            const { hoursCost: hours_cost, materialsCost: materials_cost, extraCosts: extra_costs_total, travelCost: travel_cost, totalCost: total_calculated_cost } = projectCalculatedStats;
            
            // Fallbacks
            const total_cost = total_calculated_cost !== undefined ? total_calculated_cost : 0;

            let allPhotosDetailed = [];
            const projectPhotoUrls = new Set(projectData.photo_urls || []);
            if (projectData.thumbnail_url && !projectPhotoUrls.has(projectData.thumbnail_url)) {
                allPhotosDetailed.push({ url: projectData.thumbnail_url, uploader: projectData.created_by, date: projectData.created_date, source_id: projectData.id, source_type: 'Project (Thumbnail)' });
            }
            if (projectData.cover_photo_url && !projectPhotoUrls.has(projectData.cover_photo_url)) {
                allPhotosDetailed.push({ url: projectData.cover_photo_url, uploader: projectData.created_by, date: projectData.created_date, source_id: projectData.id, source_type: 'Project (Cover Photo)' });
            }
            (projectData.photo_urls || []).forEach(url => allPhotosDetailed.push({ url, uploader: projectData.created_by, date: projectData.created_date, source_id: projectData.id, source_type: 'Project' }));
            (updatesData || []).forEach(update => (update.photo_urls || []).forEach(url => allPhotosDetailed.push({ url, uploader: update.painter_name, date: update.work_date, source_id: update.id, source_type: 'DailyUpdate' })));
            (damagesData || []).forEach(damage => (damage.photo_urls || []).forEach(url => allPhotosDetailed.push({ url, uploader: damage.reported_by, date: damage.created_date, source_id: damage.id, source_type: 'Damage' })));
            const uniquePhotos = allPhotosDetailed.filter((photo, index, self) => index === self.findIndex((p) => p.url === photo.url));

            setRelatedData({
                updates: updatesData, 
                damages: damagesData, 
                materialRequests: materialRequestsData,
                materialUsages: materialUsagesData, 
                colorAdvices: colorAdvicesData || [], // AANGEPAST: Expliciet fallback naar lege array
                assignedPainters: paintersData,
                teamMembers: teamMembersData,
                timeEntries: timeEntriesData, 
                extraCosts: extraCostsData, 
                materialsList: allMaterials,
                costTotals: { hours_cost, materials_cost, extra_costs: extra_costs_total, travel_cost, total_cost },
                allPhotos: uniquePhotos,
            });

        } catch (err) {
            console.error("Error loading project details:", err);
            
            // Als project niet meer bestaat (404), sluit modal
            if (err.response?.status === 404) {
                alert("Dit project bestaat niet meer.");
                onClose();
                return;
            }
            
            setError(err.message || "Fout bij laden van projectgegevens.");
        } finally {
            setIsLoading(false);
        }
    }, [project?.id]); 

    useEffect(() => { 
        loadProjectData(); 
    }, [loadProjectData]); 
    
    const handleDataRefresh = useCallback(async (updatedProjectData) => {
        if (!updatedProjectData || !project?.id) return;
        if (updatedProjectData.address && updatedProjectData.address !== project.address) {
            try {
                const { data: geoData } = await geocodeAddress({ address: updatedProjectData.address });
                if (geoData && geoData.latitude && geoData.longitude) {
                    updatedProjectData.latitude = geoData.latitude;
                    updatedProjectData.longitude = geoData.longitude;
                }
            } catch (geoError) { console.warn('Could not geocode address during update', geoError); }
        }
        try {
            await Project.update(project.id, updatedProjectData);
            globalCache.clear();
            onProjectUpdate();
            await loadProjectData();
        } catch (err) { console.error("Error updating project from details modal:", err); setError("Kon project niet bijwerken."); }
    }, [project, onProjectUpdate, loadProjectData]);

    const menuItems = [
        { id: 'info', label: 'Project Informatie', icon: Info },
        { id: 'updates', label: 'Updates', icon: MessageSquare },
        { id: 'colorAdvice', label: 'Kleuradvies', icon: Palette },
        { id: 'materials', label: 'Materialen', icon: Package },
        { id: 'damages', label: 'Beschadigingen', icon: AlertTriangle },
        { id: 'post-calculation', label: 'Na-calculatie', icon: Calculator, adminOnly: true },
        { id: 'photos', label: 'Foto\'s', icon: Camera }
    ];

    const coverPhotoUrl = project?.cover_photo_url || project?.photo_urls?.[0];

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 md:p-4" 
                style={{ zIndex: 1000 }} // Changed: Added inline style for zIndex
                onClick={(e) => {
                    // Voorkom dat clicks op Select componenten de modal sluiten
                    if (e.target.closest('[role="combobox"]') || e.target.closest('[role="listbox"]')) {
                        return;
                    }
                    onClose();
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 50, scale: 0.95 }} 
                    transition={{ duration: 0.3 }}
                    className="bg-gray-100 dark:bg-slate-950 rounded-lg md:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-[95%] lg:max-w-[90%] xl:max-w-7xl h-[100vh] sm:h-[98vh] md:h-[95vh] flex flex-col overflow-hidden relative"
                    style={{ zIndex: 1001 }} // Changed: Added inline style for zIndex
                    onClick={(e) => e.stopPropagation()}
                >
                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center"><LoadingSpinner text="Projectdetails laden..." /></div>
                    ) : error ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-red-500">
                            <p>Fout: {error}</p>
                            <Button onClick={loadProjectData} className="mt-4">Opnieuw Proberen</Button>
                        </div>
                    ) : (
                        <>
                            {/* Header met cover photo */}
                            <div className="relative w-full h-32 sm:h-40 md:h-56 flex-shrink-0 bg-gray-300 dark:bg-slate-700">
                                {coverPhotoUrl ? (
                                     <img src={coverPhotoUrl} alt={project.project_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600">
                                        <img src={paintConnectLogoUrl} alt="PaintConnect" className="w-1/4 sm:w-1/3 h-1/3 object-contain opacity-30" />
                                    </div>
                                )}
                               
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                
                                {/* Top Controls */}
                                <div className="absolute top-2 sm:top-4 left-2 sm:left-6 right-2 sm:right-6 flex justify-end items-start gap-2">
                                    {isAdmin && onEditProject && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEditProject(project)}
                                            className="bg-white/20 hover:bg-white/40 border-white/30 text-white"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Bewerken
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white bg-black/30 hover:bg-black/50">
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </Button>
                                </div>

                                {/* Project Title & Team */}
                                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 md:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                                        <div>
                                            <h2 className="text-lg sm:text-xl md:text-3xl font-bold text-white shadow-lg">{project.project_name}</h2>
                                            <p className="text-xs sm:text-sm md:text-base text-white/90 shadow-sm">{project.client_name}</p>
                                        </div>
                                        
                                        {/* Team in cover foto */}
                                        {relatedData.assignedPainters.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center -space-x-1 sm:-space-x-2">
                                                    {relatedData.assignedPainters.slice(0, 3).map(p => (
                                                        <Avatar key={p.id} className="border-1 sm:border-2 border-white w-6 h-6 sm:w-8 sm:h-8">
                                                            <AvatarImage src={p.avatar_url} />
                                                            <AvatarFallback className="text-xs">{getInitials(p.full_name)}</AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                    {relatedData.assignedPainters.length > 3 && (
                                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold text-white border-1 sm:border-2 border-white">
                                                            +{relatedData.assignedPainters.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-white/75 hidden sm:inline">Team</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-grow flex flex-col overflow-hidden">
                                {/* Mobile Navigation Dropdown - AANGEPAST: ultra-hoge z-index voor werking vanuit Dashboard */}
                                <div className="block lg:hidden bg-white dark:bg-slate-800 mx-2 mt-2 rounded-lg relative" style={{ zIndex: 10000 }}>
                                    <Select value={activeView} onValueChange={setActiveView}>
                                        <SelectTrigger className="w-full h-12 relative" style={{ zIndex: 10001 }}>
                                            <SelectValue>
                                                {(() => {
                                                    const currentItem = menuItems.find(item => item.id === activeView);
                                                    if (currentItem) {
                                                        return (
                                                            <>
                                                                <currentItem.icon className="w-4 h-4" />
                                                                <span>{currentItem.label}</span>
                                                            </>
                                                        );
                                                    }
                                                    return <span>Selecteer weergave</span>;
                                                })()}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="w-full bg-white dark:bg-slate-800 pointer-events-auto" style={{ zIndex: 10002 }}>
                                            {menuItems.map(item => {
                                                if (item.adminOnly && !isAdmin) return null;
                                                return (
                                                    <SelectItem key={item.id} value={item.id} className="cursor-pointer">
                                                        <div className="flex items-center gap-3 py-1">
                                                            <item.icon className="w-4 h-4" />
                                                            <span>{item.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {/* Desktop Layout */}
                                <div className="hidden lg:flex flex-grow gap-4 p-4 overflow-hidden">
                                    {/* Kolom 1: Desktop Sidebar */}
                                    <nav className="w-56 xl:w-64 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl p-3 space-y-1">
                                        {menuItems.map(item => {
                                            if (item.adminOnly && !isAdmin) return null;
                                            const isActive = activeView === item.id;
                                            return (
                                                <Button
                                                    key={item.id}
                                                    variant={isActive ? "secondary" : "ghost"}
                                                    className={`w-full justify-start gap-3 px-3 py-2 text-sm ${isActive ? 'text-emerald-700 dark:text-emerald-300' : ''}`}
                                                    onClick={() => setActiveView(item.id)}
                                                >
                                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`} />
                                                    <span>{item.label}</span>
                                                </Button>
                                            );
                                        })}
                                    </nav>

                                    {/* Kolom 2: Main Content */}
                                    <main className="flex-grow bg-white dark:bg-slate-800 rounded-xl overflow-y-auto min-w-0">
                                        <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                                            <ProjectDetailsMainContent
                                                view={activeView}
                                                project={project}
                                                relatedData={relatedData}
                                                onDataRefresh={handleDataRefresh}
                                                isAdmin={isAdmin}
                                                onEditProject={onEditProject}
                                            />
                                        </Suspense>
                                    </main>

                                    {/* Kolom 3: Desktop Map */}
                                    <aside className="w-64 xl:w-80 flex-shrink-0">
                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-1 h-full relative group">
                                            <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                                                <div className="w-full h-full rounded-lg overflow-hidden cursor-pointer" onClick={() => {
                                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(project.address)}`;
                                                    window.open(url, '_blank', 'noopener,noreferrer');
                                                }}>
                                                     <ProjectsMap projects={[project]} onMarkerClick={() => {}} />
                                                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="text-center text-white">
                                                            <MapPin className="w-8 h-8 mx-auto mb-2" />
                                                            <p className="font-semibold">Klik om route te plannen</p>
                                                            <p className="text-sm text-white/75">{project.address}</p>
                                                        </div>
                                                     </div>
                                                </div>
                                            </Suspense>
                                        </div>
                                    </aside>
                                </div>
                                
                                {/* Mobile Layout */}
                                <div className="block lg:hidden flex flex-col flex-grow overflow-hidden">
                                    {/* Main Content */}
                                    <main className="flex-grow bg-white dark:bg-slate-800 m-2 rounded-lg overflow-y-auto relative z-10">
                                        <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                                            <ProjectDetailsMainContent
                                                view={activeView}
                                                project={project}
                                                relatedData={relatedData}
                                                onDataRefresh={handleDataRefresh}
                                                isAdmin={isAdmin}
                                                onEditProject={onEditProject}
                                            />
                                        </Suspense>
                                    </main>
                                    
                                    {/* Mobile Map - Compact */}
                                    <div className="bg-white dark:bg-slate-800 m-2 mt-0 rounded-lg p-1 h-32 flex-shrink-0 relative z-0 group">
                                        <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                                            <div className="w-full h-full rounded-lg overflow-hidden cursor-pointer" onClick={() => {
                                                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(project.address)}`;
                                                window.open(url, '_blank', 'noopener,noreferrer');
                                            }}>
                                                 <ProjectsMap projects={[project]} onMarkerClick={() => {}} />
                                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="text-center text-white">
                                                        <MapPin className="w-4 h-4 mx-auto mb-1" />
                                                        <p className="font-semibold text-xs">Route plannen</p>
                                                    </div>
                                                 </div>
                                            </div>
                                        </Suspense>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}