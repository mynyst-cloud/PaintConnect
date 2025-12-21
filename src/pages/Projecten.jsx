import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Project, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, MapIcon, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeatureAccess, LimitWarning } from "@/hooks/useFeatureAccess";

import ProjectForm from "@/components/planning/PlanningForm";
import DashboardProjectCard from "@/components/projects/DashboardProjectCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SearchAndSort from "@/components/ui/SearchAndSort";
import PaginationControls from "@/components/ui/PaginationControls";
import ProjectDetails from "@/components/projects/ProjectDetails";
import { globalCache } from "@/components/utils/cache";
import { useLocation, useNavigate } from "react-router-dom";
import { geocodeAddress } from '@/api/functions';
import ProjectsMap from "@/components/projects/ProjectsMap";
import { notifyAssignedPainters } from '@/api/functions';
import { base44 } from "@/api/base44Client";

const ITEMS_PER_PAGE = 12;
const MAX_GEOCODE_PROJECTS = 10;

export default function Projecten() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const projectIdToOpen = searchParams.get('project_id');
  const tabToOpen = searchParams.get('tab');
  
  // Feature access for project limits
  const { checkLimit, canAddMoreProjects, isAdmin: isFeatureAdmin } = useFeatureAccess();

  const [view, setView] = useState('grid');
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [triggerElement, setTriggerElement] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [geocodeError, setGeocodeError] = useState(null);
  const [isGeocodingInProgress, setIsGeocodingInProgress] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('created_date');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdmin = useMemo(() => currentUser?.company_role === 'admin' || currentUser?.role === 'admin', [currentUser]);

  // Track projects currently being deleted to prevent double-clicks
  const [deletingIds, setDeletingIds] = useState(new Set());

  const realProjects = useMemo(() => {
    return (projects || []).filter(p => p && !p.is_dummy);
  }, [projects]);

  const initialMapCenter = useMemo(() => {
    if (!realProjects || realProjects.length === 0) return null;

    const latestProjectWithCoords = realProjects.find(p => p.latitude && p.longitude);

    if (latestProjectWithCoords) {
      return {
        lat: latestProjectWithCoords.latitude,
        lng: latestProjectWithCoords.longitude,
        zoom: 13
      };
    }

    return null;
  }, [realProjects]);

  const calculateProgress = useCallback((project) => {
    if (!project || !project.start_date || !project.expected_end_date) return { progress: 0, isOverdue: false };

    const start = new Date(project.start_date);
    const end = new Date(project.expected_end_date);
    const now = new Date();

    if (now < start) return { progress: 0, isOverdue: false };

    const isOverdue = now > end && project.status !== 'afgerond';

    if (now >= end) return { progress: 100, isOverdue };

    const totalDuration = end.getTime() - start.getTime();
    if (totalDuration <= 0) return { progress: 100, isOverdue };

    const elapsedDuration = now.getTime() - start.getTime();
    const progress = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

    return { progress, isOverdue };
  }, []);

  const sortOptions = [
    { value: 'created_date', label: 'Nieuwste eerst' },
    { value: 'project_name', label: 'Projectnaam' },
    { value: 'client_name', label: 'Klantnaam' },
    { value: 'expected_end_date', label: 'Einddatum' },
  ];

  const backgroundGeocode = useCallback(async (projectsToGeocode) => {
    try {
      if (projectsToGeocode.length === 0) {
        setIsGeocodingInProgress(false);
        return;
      }

      const testProject = projectsToGeocode[0];
      const { data: geoDataTest } = await geocodeAddress({ address: testProject.address });
      
      if (!geoDataTest || !geoDataTest.latitude || !geoDataTest.longitude) {
        throw new Error("Geocoding test failed: No coordinates found for test project.");
      }

      for (const project of projectsToGeocode) {
        try {
          const { data: geoData } = await geocodeAddress({ address: project.address });
          if (geoData && geoData.latitude && geoData.longitude) {
            await Project.update(project.id, {
              latitude: geoData.latitude,
              longitude: geoData.longitude
            });

            setProjects(currentProjects => 
              currentProjects.map(p => 
                p.id === project.id 
                  ? { ...p, latitude: geoData.latitude, longitude: geoData.longitude }
                  : p
              )
            );
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.warn(`Background geocoding failed for project ${project.id}:`, error.message);
        }
      }
      setGeocodeError(null);
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Geocoding service is niet beschikbaar.";
      setGeocodeError(errorMessage);
      console.warn('Background geocoding failed:', errorMessage);
    } finally {
      setIsGeocodingInProgress(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeocodeError(null);
    setIsGeocodingInProgress(false);

    // Reset deleting state when loading fresh data
    setDeletingIds(new Set());

    // CRITICAL FIX: Fetch user first, before any project queries
    let user;
    try {
      user = await User.me();
      setCurrentUser(user);
    } catch (err) {
      console.error("Error fetching current user:", err);
      setError("Kon gebruiker niet laden.");
      setIsLoading(false);
      return;
    }

    if (!user) {
        setIsLoading(false);
        return;
    }

    console.log('[Projecten] Clearing sessionStorage deletedProjects');
    sessionStorage.removeItem("deletedProjects");

    setProjects([]);

    try {
      // Use the freshly fetched user for company_id
      const companyId = user?.company_id || user?.current_company_id;

      if (!companyId) {
        setError("U bent niet gekoppeld aan een bedrijf en bekijkt geen specifiek bedrijf.");
        setIsLoading(false);
        setProjects([]);
        setAllUsers([]);
        return;
      }

      globalCache.clear();
      console.log('[Projecten] All caches cleared, fetching 100% fresh data');

      await new Promise(resolve => setTimeout(resolve, 150));

      const timestamp = Date.now();
      console.log(`[Projecten] Fetching projects at timestamp: ${timestamp}`);

      console.log('[Projecten] Fetching projects directly from entities...');
      
      const userIsAdmin = user?.company_role === 'admin' || user?.role === 'admin';
      let projectsData = [];

      if (userIsAdmin) {
        // Admins see all real projects for the company (no dummies)
        const allProjects = await Project.filter({ company_id: companyId }, '-created_date');
        projectsData = (allProjects || []).filter(p => !p.is_dummy);
      } else {
        // Painters see only projects they are assigned to (no dummies)
        const allProjects = await Project.filter({ company_id: companyId }, '-created_date');
        projectsData = (allProjects || []).filter(p => 
          !p.is_dummy && 
          p.assigned_painters && 
          p.assigned_painters.includes(user.email)
        );
      }
      
      // Only fetch users if admin (to avoid RLS permission errors for non-admins)
      let usersData = [];
      if (userIsAdmin) {
        try {
          usersData = await User.filter({ company_id: companyId });
        } catch (err) {
          console.warn(`[Projecten] Could not fetch users: ${err.message}`);
          usersData = [];
        }
      }

      let projectsToSet = projectsData || [];
      const fetchedAllUsers = (usersData || []).filter(u => u.status === 'active');

      console.log('[Projecten] Loaded projects count:', projectsToSet.length);
      console.log('[Projecten] Project IDs:', projectsToSet.map(p => p.id));
      
      setProjects(projectsToSet);
      setAllUsers(fetchedAllUsers);

      const hasRealProjects = projectsToSet.some(p => p && !p.is_dummy);

      const projectsToGeocode = projectsToSet
        .filter(p => {
            if (!p || !p.address || (p.latitude && p.longitude)) return false;
            // Als er echte projecten zijn, negeer dummy projecten voor geocoding
            if (p.is_dummy && hasRealProjects) return false;
            return true;
        })
        .slice(0, MAX_GEOCODE_PROJECTS);

      if (projectsToGeocode.length > 0) {
        console.log(`Starting background geocoding for ${projectsToGeocode.length} projects`);
        setIsGeocodingInProgress(true);
        backgroundGeocode(projectsToGeocode);
      }

    } catch (err) {
      console.error("[pages/Projecten.js] Error loading initial data:", err);
      setError(`Kon projecten niet laden: ${err.message || 'Probeer het opnieuw.'}`);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [backgroundGeocode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!showProjectDetails && triggerElement) {
        triggerElement.focus();
        setTriggerElement(null);
    }
  }, [showProjectDetails, triggerElement]);

  const filteredAndSortedProjects = useMemo(() => {
    let tempProjects = [...(realProjects || [])];

    if (searchTerm) {
      tempProjects = tempProjects.filter(project =>
        (project.project_name && project.project_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.client_name && project.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.address && project.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      tempProjects = tempProjects.filter(project => project.status === statusFilter);
    }

    if (sortOption) {
      tempProjects.sort((a, b) => {
        const aVal = a[sortOption];
        const bVal = b[sortOption];
        
        if (sortOption.includes('date') && aVal && bVal) {
          return new Date(bVal) - new Date(aVal);
        }
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal);
        }
        
        return 0;
      });
    }

    return tempProjects;
  }, [realProjects, searchTerm, statusFilter, sortOption]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const result = filteredAndSortedProjects.slice(startIndex, endIndex);
    
    const totalProjects = filteredAndSortedProjects.length;
    const calculatedTotalPages = Math.ceil(totalProjects / ITEMS_PER_PAGE);
    setTotalPages(calculatedTotalPages);
    
    return result;
  }, [filteredAndSortedProjects, currentPage]);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleFormSubmit = async (projectData) => {
    const companyId = currentUser?.company_id || currentUser?.current_company_id;
    if (!projectData || !companyId) return;
    
    setIsSubmitting(true);
    setError(null);
    setGeocodeError(null);
    try {
      const dataWithCompany = { 
        ...projectData, 
        company_id: companyId
      };
      
      let savedProject;
      let projectId;
      let originalProject;

      if (editingProject) {
          originalProject = projects.find(p => p.id === editingProject.id);
          await Project.update(editingProject.id, dataWithCompany);
          projectId = editingProject.id;
          savedProject = { ...editingProject, ...dataWithCompany };

          const oldPainters = new Set(originalProject?.assigned_painters || []);
          const newPainters = new Set(dataWithCompany.assigned_painters || []);
          const newlyAssignedEmails = [...newPainters].filter(email => !oldPainters.has(email));

          if (newlyAssignedEmails.length > 0) {
              await notifyAssignedPainters({
                  projectId: projectId,
                  projectName: dataWithCompany.project_name,
                  newlyAssignedEmails: newlyAssignedEmails
              });
          }
      } else {
          const newProject = await Project.create(dataWithCompany);
          projectId = newProject.id;
          savedProject = newProject;
          
          const newlyAssignedEmails = dataWithCompany.assigned_painters || [];
          if (newlyAssignedEmails.length > 0) {
               await notifyAssignedPainters({
                  projectId: projectId,
                  projectName: dataWithCompany.project_name,
                  newlyAssignedEmails: newlyAssignedEmails
              });
          }
      }

      if (savedProject.address) {
        setIsGeocodingInProgress(true);
        backgroundGeocode([{ ...savedProject, id: projectId }]);
      }
      
      globalCache.clear();
      setShowForm(false);
      setEditingProject(null);
      await loadData();
    } catch (err) {
      console.error("Error submitting project:", err);
      setError(`Kon project niet opslaan: ${err.message || 'Onbekende fout'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = useCallback(async (projectId) => {
    if (!projectId || deletingIds.has(projectId)) {
      return;
    }

    if (!window.confirm('Weet u zeker dat u dit project wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    // Mark as deleting to prevent double-clicks
    setDeletingIds(prev => new Set([...prev, projectId]));

    // Optimistically remove from UI immediately
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    try {
      await Project.delete(projectId);
      globalCache.clear();
    } catch (deleteError) {
      const status = deleteError.response?.status;
      const message = deleteError.message || '';

      // 404 means already deleted - that's OK, ignore it
      const is404 = status === 404 || 
                    message.toLowerCase().includes('not found') ||
                    message.includes('404');

      if (is404) {
        console.log('[Projecten] Project was already deleted (404) - ignored');
        globalCache.clear();
        return;
      }

      // Check for auth errors
      const isAuthError = status === 401 || 
                          status === 403 || 
                          message.includes('logged in');

      if (isAuthError) {
        alert("Je sessie is verlopen. Je wordt opnieuw ingelogd...");
        await base44.auth.redirectToLogin();
        return;
      }

      // Other errors - restore UI and show error
      console.error('[Projecten] Delete error:', deleteError);
      setError("Kon project niet verwijderen. Probeer opnieuw.");
      await loadData();
    } finally {
      // Cleanup deleting state
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }, [deletingIds, loadData]);

  const openDetailsModal = useCallback((project, event) => {
    if (event && event.currentTarget) {
        setTriggerElement(event.currentTarget);
    }
    setSelectedProject(project);
    setShowProjectDetails(true);
  }, []);

  const handleCloseDetailsModal = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const handleProjectUpdate = () => {
    setShowProjectDetails(false);
    loadData();
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowForm(true);
    setShowProjectDetails(false);
  };

  useEffect(() => {
    if (projectIdToOpen && projects.length > 0) {
      const project = projects.find(p => p.id === projectIdToOpen);
      if (project) {
        openDetailsModal(project, null);
        navigate('/Projecten', { replace: true });
      }
    }
  }, [projectIdToOpen, projects, navigate, openDetailsModal]);

  if (isLoading) {
    return <LoadingSpinner text="Projecten laden..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
      <div className="px-2 sm:px-4 py-4 sm:py-6 max-w-full mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-50">Projecten</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">Beheer al uw schilderprojecten op één plek.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMap(!showMap)}
                className="w-auto text-sm flex items-center gap-2"
                disabled={geocodeError !== null && !showMap}
              >
                <MapIcon className="w-4 h-4" />
                {showMap ? 'Kaart Verbergen' : 'Kaart Tonen'}
              </Button>
              {isAdmin && (
                <Button 
                  onClick={() => { setEditingProject(null); setShowForm(true); }} 
                  className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuw Project
                </Button>
              )}
            </div>
          </div>
          {geocodeError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              Kaart tijdelijk niet beschikbaar: {geocodeError}
            </p>
          )}
        </div>

        <div className="mb-4 sm:mb-6 relative z-0">
          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  {isGeocodingInProgress && (
                    <div className="mb-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        Projecten worden voorbereid voor kaartweergave...
                      </div>
                    </div>
                  )}
                  
                  {(realProjects.filter(p => p.latitude && p.longitude).length === 0) ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-slate-400 max-w-full">
                      <MapIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-slate-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200 mb-2">
                        Geen projecten op de kaart
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 px-4">
                        Projecten hebben een geldig adres nodig om op de kaart getoond te worden.
                      </p>
                    </div>
                  ) : (
                    <div className="h-[500px] w-full rounded-lg overflow-hidden">
                        <ProjectsMap 
                          projects={realProjects} 
                          onMarkerClick={openDetailsModal}
                          initialCenter={initialMapCenter}
                        />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm max-w-full overflow-hidden">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 shadow-sm mb-4 sm:mb-6 max-w-full overflow-hidden">
          <SearchAndSort
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortOption}
            setSortBy={setSortOption}
            sortOrder={"asc"}
            setSortOrder={() => {}}
            sortOptions={sortOptions}
            placeholder="Zoek op project, klant..."
            className="w-full"
          />
        </div>

        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 max-w-full"
            >
                {(paginatedData || [])
                  .filter(project => project && project.id)
                  .map(project => (
                    <DashboardProjectCard
                    key={project.id}
                    project={project}
                    onDelete={isAdmin ? handleDeleteProject : undefined}
                    onEdit={isAdmin ? () => { setEditingProject(project); setShowForm(true); } : undefined}
                    onViewDetails={openDetailsModal}
                    isAdmin={isAdmin}
                    calculateProgress={calculateProgress}
                    isDeleting={deletingIds.has(project.id)}
                    />
                  ))}
            </motion.div>
        </AnimatePresence>

        {(!paginatedData || paginatedData.length === 0) && !isLoading && (
          <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-slate-400 max-w-full">
            <MapIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300 dark:text-slate-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-200 mb-2">
              {searchTerm ? 'Geen projecten gevonden' : (isAdmin ? 'Nog geen projecten aangemaakt' : 'Nog geen projecten toegewezen')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 px-4">
              {searchTerm
                ? 'Pas uw zoekopdracht aan.'
                : (isAdmin
                  ? 'Maak een nieuw project aan om te beginnen.'
                  : 'Vraag uw beheerder om u aan een project toe te wijgen.'
                )
              }
            </p>
          </div>
        )}
        
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
        
        <AnimatePresence>
          {showForm && (
            <ProjectForm
              project={editingProject}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setEditingProject(null); }}
              isSubmitting={isSubmitting}
              painters={allUsers.filter(u => u.status === 'active')}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showProjectDetails && selectedProject && (
            <ProjectDetails
              project={selectedProject}
              onClose={handleCloseDetailsModal}
              onProjectUpdate={handleProjectUpdate}
              onEditProject={handleEditProject}
              isAdmin={isAdmin}
              initialTab={tabToOpen}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}