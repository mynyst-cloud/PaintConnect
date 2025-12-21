import React, { useState, useEffect, useCallback } from 'react';
import { Project, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator, ArrowRight, AlertTriangle, Euro, RefreshCw, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SearchAndSort from '@/components/ui/SearchAndSort';
import PaginationControls from '@/components/ui/PaginationControls';
import { usePagination } from '@/components/utils/usePagination';
import { getProjectStats } from '@/api/functions';
import ProjectDetails from '@/components/projects/ProjectDetails';
import ProjectForm from '@/components/planning/PlanningForm';
import { globalCache } from '@/components/utils/cache';

const statusColors = {
  // Nieuwe geldige statussen
  nieuw: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  in_uitvoering: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  afgerond: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  geannuleerd: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  offerte: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  // Backwards compatibility
  niet_gestart: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  bijna_klaar: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};

const statusLabels = {
  // Nieuwe geldige statussen
  nieuw: "Nieuw",
  planning: "Planning",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  on_hold: "On Hold",
  geannuleerd: "Geannuleerd",
  offerte: "Offerte",
  // Backwards compatibility
  niet_gestart: "Nieuw",
  bijna_klaar: "Planning",
};

const ITEMS_PER_PAGE = 10;

export default function NaCalculatie() {
  const [allProjects, setAllProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [triggerElement, setTriggerElement] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState([]);


  const {
    paginatedData: paginatedProjects,
    currentPage,
    totalPages,
    goToPage,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    setItems,
  } = usePagination([], ITEMS_PER_PAGE);

  const sortOptions = [
    { value: 'project_name', label: 'Projectnaam' },
    { value: 'client_name', label: 'Klantnaam' },
    { value: 'status', label: 'Status' },
    { value: 'created_date', label: 'Aangemaakt' },
  ];

  const loadAllProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user?.company_id && user?.company_role === 'admin') {
        const [projectsData, usersData] = await Promise.all([
            Project.filter({ company_id: user.company_id }, '-created_date'),
            User.filter({ company_id: user.company_id })
        ]);

        setAllProjects(projectsData || []);
        setItems(projectsData || []);
        setAllUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Kon projecten niet laden. Probeer het opnieuw.');
    } finally {
        setIsLoading(false);
    }
  }, [setItems]);

  const loadProjectStats = useCallback(async (projects, force = false) => {
    if (!projects || projects.length === 0) {
      setIsLoading(false);
      return;
    }

    const projectsToFetch = force
      ? projects
      : projects.filter(p => !projectStats[p.id]);

    if (projectsToFetch.length === 0 && !force) {
        setIsLoading(false);
        return;
    }

    // Only set loading true if there are stats to actually fetch
    // Otherwise, it might create a flickering effect if there's nothing to do.
    const currentStatsLoadingState = isLoading; 
    if (projectsToFetch.length > 0) {
        setIsLoading(true);
    }

    try {
      const projectIdsToFetch = projectsToFetch.map(p => p.id);

      if (projectIdsToFetch.length > 0) {
          const { data: stats, error: statsError } = await getProjectStats({ project_ids: projectIdsToFetch });

          if (statsError || !stats) {
            const newStatsWithError = {};
            projectIdsToFetch.forEach(id => {
                newStatsWithError[id] = { error: true, message: statsError?.message || 'Statistieken ophalen mislukt.' };
            });
            setProjectStats(prevStats => ({ ...prevStats, ...newStatsWithError }));
            throw new Error(statsError?.message || 'Statistieken ophalen mislukt.');
          }

          setProjectStats(prevStats => ({ ...prevStats, ...stats }));
      }
    } catch (error) {
      console.error('Error loading project stats:', error);
      setError(`Statistieken laden mislukt: ${error.message}`);
    } finally {
      if (currentStatsLoadingState || projectsToFetch.length > 0) {
          setIsLoading(false);
      }
    }
  }, [isLoading, projectStats]);

  useEffect(() => {
    loadAllProjects();
  }, [loadAllProjects]);

  useEffect(() => {
    if (paginatedProjects && paginatedProjects.length > 0) {
      loadProjectStats(paginatedProjects, false);
    }
  }, [paginatedProjects, loadProjectStats]);

  useEffect(() => {
    if (!showProjectDetails && triggerElement) {
        triggerElement.focus();
        setTriggerElement(null);
    }
  }, [showProjectDetails, triggerElement]);

  const handleRetryStats = () => {
    setError(null);
    if (allProjects && allProjects.length > 0) {
      loadProjectStats(allProjects, true); // Force reload all project stats
    } else {
        loadAllProjects(); // If no projects at all, try loading all projects again.
    }
  };
  
  const handleProjectUpdate = useCallback(() => {
    setShowProjectDetails(false);
    loadAllProjects(); // Reload all data to ensure consistency
  }, [loadAllProjects]);

  const openProjectDetails = (project, event) => {
    if (event && event.currentTarget) {
        setTriggerElement(event.currentTarget);
    }
    setSelectedProject(project);
    setShowProjectDetails(true);
  };
  
  const handleCloseDetailsModal = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const handleOpenFormForEdit = (project) => {
    setEditingProject(project);
    setShowProjectForm(true);
    setShowProjectDetails(false); // Close details when opening edit
  };

  const handleProjectFormSubmit = useCallback(async (projectData) => {
    if (!projectData || !currentUser?.company_id) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      const dataWithCompany = { 
        ...projectData, 
        company_id: currentUser.company_id
      };
      
      if (editingProject) {
          await Project.update(editingProject.id, dataWithCompany);
      } else {
          await Project.create(dataWithCompany);
      }
      
      globalCache.clear();
      setShowProjectForm(false);
      setEditingProject(null);
      await loadAllProjects();
    } catch (err) {
      console.error("Error submitting project:", err);
      setError(`Kon project niet opslaan: ${err.message || 'Onbekende fout'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, loadAllProjects, editingProject]);

  if (!currentUser) {
      return <div className="p-8"><LoadingSpinner text="Gebruikersgegevens laden..." /></div>
  }

  if (currentUser?.company_role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900">Geen toegang</h2>
        <p className="text-gray-600 mt-2">Alleen admins kunnen na-calculaties bekijken.</p>
      </div>
    );
  }

  // Calculate totals from all loaded stats (not just current page)
  const allLoadedStats = allProjects.map(p => projectStats[p.id]).filter(Boolean);
  const totals = allLoadedStats.reduce(
    (acc, stats) => ({
      totalCost: acc.totalCost + (stats.totalCost || 0),
      pendingApprovals: acc.pendingApprovals + (stats.pendingApprovals || 0),
    }),
    { totalCost: 0, pendingApprovals: 0 }
  );

  const actualTotals = {
    ...totals,
    totalProjects: allProjects.length
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-8 h-8 text-emerald-600" />
              Na-calculatie Overzicht
            </h1>
            <p className="text-gray-600 mt-1">Beheer de financiële afrekening van uw projecten.</p>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totaal Projecten</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{actualTotals.totalProjects}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totale Geregistreerde Kosten</CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">€{totals.totalCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        Van alle geladen projecten
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Openstaande Bevestigingen</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totals.pendingApprovals}</div>
                </CardContent>
            </Card>
        </div>

        {/* Search and Sort Controls */}
        <Card>
          <CardContent className="p-4">
            <SearchAndSort
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              sortOptions={sortOptions}
              placeholder="Zoek project of klant..."
            />
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <p>{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleRetryStats}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2"/>
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* NEW Project Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projecten Overzicht</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Uren</TableHead>
                    <TableHead className="text-right">Materiaal</TableHead>
                    <TableHead className="text-right">Km's</TableHead>
                    <TableHead className="text-right">Extra</TableHead>
                    <TableHead className="text-right font-bold">Totaal</TableHead>
                    <TableHead className="text-right font-bold text-blue-600 dark:text-blue-400">Offerte</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="text-center">Acties</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && paginatedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <LoadingSpinner text="Projecten laden..." />
                      </TableCell>
                    </TableRow>
                  ) : paginatedProjects.length > 0 ? (
                    paginatedProjects.map(project => {
                      const stats = projectStats[project.id];
                      const isLoadingStats = isLoading && !stats;
                      const hasError = stats && stats.error;

                      return (
                        <TableRow key={project.id} className="hover:bg-muted/50 dark:hover:bg-slate-800/50">
                          <TableCell>
                            <div className="font-medium text-gray-900 dark:text-slate-100">{project.project_name}</div>
                            <div className="text-sm text-muted-foreground">{project.client_name}</div>
                            {stats && !hasError && stats.pendingApprovals > 0 && (
                              <div className="mt-1 text-yellow-800 dark:text-yellow-400 text-xs flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {stats.pendingApprovals} item(s) wachten op goedkeuring
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[project.status]} border-none`}>{statusLabels[project.status]}</Badge>
                          </TableCell>

                          {isLoadingStats ? (
                            <TableCell colSpan={7} className="text-center">
                              <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" /> Kosten...
                              </div>
                            </TableCell>
                          ) : hasError ? (
                            <TableCell colSpan={7} className="text-center text-red-500 dark:text-red-400 text-sm">
                              Kon kosten niet laden
                            </TableCell>
                          ) : stats ? (
                            <>
                              <TableCell className="text-right">€{stats.hoursCost?.toFixed(2) ?? '0.00'}</TableCell>
                              <TableCell className="text-right">€{stats.materialsCost?.toFixed(2) ?? '0.00'}</TableCell>
                              <TableCell className="text-right">€{stats.travelCost?.toFixed(2) ?? '0.00'}</TableCell>
                              <TableCell className="text-right">€{stats.extraCosts?.toFixed(2) ?? '0.00'}</TableCell>
                              <TableCell className="text-right font-bold text-lg text-gray-900 dark:text-slate-100">€{stats.totalCost?.toFixed(2) ?? '0.00'}</TableCell>
                              <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                                {project.quote_price ? `€${project.quote_price.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {project.quote_price && stats.totalCost ? (
                                  <Badge className={`${project.quote_price - stats.totalCost >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    €{(project.quote_price - stats.totalCost).toFixed(2)}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              </>
                              ) : (
                              <TableCell colSpan={7} className="text-center text-gray-400 dark:text-gray-500">
                                Wachten op stats...
                              </TableCell>
                              )}

                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={(e) => openProjectDetails(project, e)}>
                              Bekijk
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-gray-500 dark:text-gray-400">
                        Geen projecten gevonden die aan de criteria voldoen.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="p-4 border-t dark:border-slate-800">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showProjectDetails && selectedProject && (
          <ProjectDetails
            project={selectedProject}
            onClose={handleCloseDetailsModal}
            onProjectUpdate={handleProjectUpdate}
            isAdmin={currentUser?.company_role === 'admin'}
            onEditProject={handleOpenFormForEdit}
            initialTab="calculation"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProjectForm && (
          <ProjectForm
            project={editingProject}
            onSubmit={handleProjectFormSubmit}
            onCancel={() => { setShowProjectForm(false); setEditingProject(null); }}
            isSubmitting={isSubmitting}
            painters={allUsers.filter(u => u.status === 'active')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}