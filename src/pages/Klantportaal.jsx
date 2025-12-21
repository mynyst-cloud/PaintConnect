
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProjectDetailModal from '@/components/klantportaal/ProjectDetailModal';
import ProjectCard from '@/components/klantportaal/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogOut, Search, Building, Eye, ArrowLeft } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { getClientPortalData } from '@/api/functions';
import { ClientInvitation, Project, User } from '@/api/entities';
import { useFeatureAccess, UpgradePrompt } from '@/hooks/useFeatureAccess';
import UpgradeModal from '@/components/ui/UpgradeModal';

const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function Klantportaal() {
    const location = useLocation();
    const navigate = useNavigate();
    const [portalData, setPortalData] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [jwt, setJwt] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdminView, setIsAdminView] = useState(false);
    
    // Admin view state
    const [invitations, setInvitations] = useState([]);
    const [projects, setProjects] = useState([]);
    const [searchEmail, setSearchEmail] = useState('');
    
    // Feature access
    const { hasFeature, isLoading: featureLoading, isAdmin } = useFeatureAccess();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Probeer eerst de gebruiker op te halen
                let user = null;
                try {
                    user = await User.me();
                    setCurrentUser(user);
                } catch (err) {
                    console.log('[Klantportaal] User not logged in');
                }

                // Check voor JWT in URL (klant flow)
                const urlParams = new URLSearchParams(location.search);
                const jwtFromUrl = urlParams.get('jwt');

                let clientJwt = null;

                if (jwtFromUrl) {
                    // JWT flow - KLANT
                    clientJwt = jwtFromUrl;
                    setJwt(jwtFromUrl);
                    localStorage.setItem('clientPortalJWT', jwtFromUrl);
                    
                    console.log('[Klantportaal] JWT received from URL, saved to localStorage');
                    
                    // Verwijder JWT uit URL voor veiligheid en betere UX
                    window.history.replaceState({}, document.title, '/Klantportaal');
                } else {
                    // Probeer JWT uit localStorage te halen
                    clientJwt = localStorage.getItem('clientPortalJWT');
                    if (clientJwt) {
                        setJwt(clientJwt);
                        console.log('[Klantportaal] JWT loaded from localStorage');
                    }
                }

                // SCENARIO A: JWT aanwezig -> Klant flow
                if (clientJwt) {
                    console.log('[Klantportaal] Client flow - loading portal data with JWT');
                    const response = await getClientPortalData({ jwt: clientJwt });

                    if (response.data.success) {
                        console.log('[Klantportaal] Portal data loaded successfully');
                        setPortalData(response.data.data);
                        setIsAdminView(false);
                    } else {
                        throw new Error(response.data.error || 'Kon portaalgegevens niet laden');
                    }
                }
                // SCENARIO B: Geen JWT maar wel admin/super admin -> Admin overzicht
                else if (user && (user.company_role === 'admin' || user.role === 'admin')) {
                    console.log('[Klantportaal] Admin flow - loading all client portals');
                    setIsAdminView(true);
                    
                    // Haal alle uitnodigingen en projecten op
                    const [allInvitations, allProjects] = await Promise.all([
                        user.role === 'admin' 
                            ? ClientInvitation.filter({ status: { $in: ['sent', 'accessed', 'active'] } })
                            : ClientInvitation.filter({ 
                                company_id: user.company_id || user.current_company_id,
                                status: { $in: ['sent', 'accessed', 'active'] }
                              }),
                        user.role === 'admin'
                            ? Project.list()
                            : Project.filter({ company_id: user.company_id || user.current_company_id })
                    ]);

                    // Verrijk invitations met project data
                    const projectsMap = (allProjects || []).reduce((acc, proj) => {
                        acc[proj.id] = proj;
                        return acc;
                    }, {});

                    const enrichedInvitations = (allInvitations || []).map(inv => ({
                        ...inv,
                        project: projectsMap[inv.project_id]
                    })).filter(inv => inv.project); // Filter entries zonder project

                    setInvitations(enrichedInvitations);
                    setProjects(allProjects || []);
                } 
                // SCENARIO C: Geen JWT en geen admin -> Error
                else {
                    setError('Geen geldige sessie gevonden. Gebruik de uitnodigingslink uit uw e-mail.');
                }

            } catch (err) {
                console.error('[Klantportaal] Error loading data:', err);
                
                // Als JWT expired is, clear localStorage en toon error
                if (err.message?.includes('expired') || err.message?.includes('Invalid or expired session')) {
                    localStorage.removeItem('clientPortalJWT');
                    setJwt(null);
                    setError('Uw sessie is verlopen. Gebruik de uitnodigingslink uit uw e-mail opnieuw.');
                } else {
                    setError('Kon gegevens niet laden: ' + err.message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [location.search]);

    const handleLogout = () => {
        localStorage.removeItem('clientPortalJWT');
        setJwt(null);
        setPortalData(null);
        navigate('/');
    };

    const handleViewPortal = async (projectId) => {
        setIsLoading(true);
        try {
            const response = await getClientPortalData({ project_id: projectId });
            if (response.data.success) {
                setPortalData(response.data.data);
                setIsAdminView(false);
            } else {
                setError(response.data.error || 'Kon portaal niet laden');
            }
        } catch (err) {
            console.error('[Klantportaal] Error loading project:', err);
            setError('Kon portaal niet laden: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToOverview = () => {
        setPortalData(null);
        setIsAdminView(true);
        setIsLoading(true);
        window.location.reload(); // Force reload to get fresh admin data
    };

    const filteredInvitations = searchEmail 
        ? invitations.filter(inv => inv.client_email.toLowerCase().includes(searchEmail.toLowerCase()))
        : invitations;

    if (isLoading || featureLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <img src={logoUrl} alt="PaintConnect" className="w-40 sm:w-48 mx-auto mb-6" />
                    <LoadingSpinner size="default" />
                    <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base">Laden...</p>
                </div>
            </div>
        );
    }

    // Permission check for admin view - Klantportaal management requires Professional+
    // Note: Client view (with JWT) is always accessible
    useEffect(() => {
        if (!featureLoading && isAdminView && !hasFeature('page_klantportaal')) {
            setShowUpgradeModal(true);
        }
    }, [featureLoading, isAdminView, hasFeature]);

    if (isAdminView && !hasFeature('page_klantportaal')) {
        return (
            <>
                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
                    <div className="max-w-2xl mx-auto mt-12 sm:mt-24">
                        <UpgradePrompt 
                            feature="page_klantportaal" 
                            message="Het Klantportaal is alleen beschikbaar voor Professional en Enterprise abonnementen. Upgrade om klanten uit te nodigen en projectvoortgang te delen."
                        />
                    </div>
                </div>
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    featureName="Klantportaal"
                    requiredTier="professional"
                />
            </>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
                    <img src={logoUrl} alt="PaintConnect" className="w-40 sm:w-48 mx-auto mb-6" />
                    <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Fout</h2>
                    <p className="text-gray-700 dark:text-slate-300 mb-6 text-sm sm:text-base">{error}</p>
                    <Button onClick={() => navigate('/')} className="w-full bg-gray-600 hover:bg-gray-700">
                        Terug naar home
                    </Button>
                </div>
            </div>
        );
    }

    // ADMIN VIEW - Overzicht van alle klantenportalen
    if (isAdminView) { // Changed from isAdminView && !portalData check for consistency
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-3 sm:p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header - RESPONSIVE */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <img src={logoUrl} alt="PaintConnect" className="w-16 h-16 sm:w-20 sm:h-20" />
                                <div>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">
                                        Klantenportaal
                                    </h1>
                                    {currentUser && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                            <Badge variant="outline" className="w-fit text-xs">
                                                {currentUser.role === 'admin' ? 'Super Admin' : 'Admin'}
                                            </Badge>
                                            <span className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                                                {currentUser.email}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/Dashboard')}
                                variant="outline"
                                className="w-full sm:w-auto gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Terug naar Dashboard</span>
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                                Beschikbare Klantenportalen
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mb-4">
                                Bekijk en beheer alle klantenportalen als administrator
                            </p>

                            {/* Search - RESPONSIVE */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Zoek op e-mailadres..."
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    className="pl-10 text-sm"
                                />
                            </div>
                        </div>

                        {/* Portal Cards - RESPONSIVE GRID */}
                        <div className="space-y-3 sm:space-y-4">
                            {filteredInvitations.length === 0 ? (
                                <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-slate-400">
                                    <Building className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                                    <p className="text-sm sm:text-base">
                                        {searchEmail ? 'Geen klantenportalen gevonden voor deze zoekopdracht' : 'Nog geen klantenportalen beschikbaar'}
                                    </p>
                                </div>
                            ) : (
                                filteredInvitations.map((invitation) => {
                                    const project = projects.find(p => p.id === invitation.project_id);
                                    if (!project) return null;

                                    return (
                                        <div
                                            key={invitation.id}
                                            className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white dark:bg-slate-800"
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-slate-100 truncate">
                                                            {invitation.client_email}
                                                        </h3>
                                                        <Badge 
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {invitation.status}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                                                        {invitation.client_name && (
                                                            <p className="font-medium text-gray-700 dark:text-slate-300">
                                                                {invitation.client_name}
                                                            </p>
                                                        )}
                                                        <p className="flex items-center gap-2">
                                                            <Building className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                            <span className="truncate">{project.project_name}</span>
                                                        </p>
                                                        <p className="text-xs ml-5">
                                                            <span className="font-medium">Adres:</span> {project.address}
                                                        </p>
                                                        {invitation.last_login && (
                                                            <p className="text-xs">
                                                                Laatste login: {new Date(invitation.last_login).toLocaleDateString('nl-NL')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <Button
                                                    onClick={() => handleViewPortal(project.id)}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 gap-2"
                                                    size="lg"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>Portaal Bekijken</span>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // CLIENT VIEW - Specifiek portaal dashboard (or Admin viewing a specific portal)
    if (portalData) {
        const { project, company } = portalData; // clientInfo is not destructured if not used in this scope.

        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
                {/* Header - RESPONSIVE */}
                <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                {company?.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 object-contain" />
                                ) : (
                                    <img src={logoUrl} alt="PaintConnect" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-slate-100 truncate">
                                        {company?.name || 'Klantenportaal'}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 truncate">
                                        {project.project_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                {currentUser && (currentUser.company_role === 'admin' || currentUser.role === 'admin') && (
                                    <Button
                                        onClick={handleBackToOverview}
                                        variant="outline"
                                        size="sm"
                                        className="hidden sm:flex gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Overzicht
                                    </Button>
                                )}
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">
                                        {currentUser && (currentUser.company_role === 'admin' || currentUser.role === 'admin') ? 'Dashboard' : 'Uitloggen'}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        
                        {/* Mobile back button for admin */}
                        {currentUser && (currentUser.company_role === 'admin' || currentUser.role === 'admin') && (
                            <Button
                                onClick={handleBackToOverview}
                                variant="outline"
                                size="sm"
                                className="sm:hidden w-full mt-2 gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Terug naar overzicht
                            </Button>
                        )}
                    </div>
                </header>

                {/* Main Content - RESPONSIVE PADDING */}
                <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                    <ProjectCard 
                        project={portalData.project}
                        updates={portalData.updates}
                        damages={portalData.damages}
                        colorAdvices={portalData.colorAdvices}
                        chatMessages={portalData.chatMessages}
                        allPhotos={portalData.allPhotos}
                        clientInfo={portalData.clientInfo}
                        onOpenDetails={() => setSelectedProject(portalData.project)}
                    />
                </main>

                {selectedProject && (
                    <ProjectDetailModal
                        project={selectedProject}
                        updates={portalData.updates}
                        damages={portalData.damages}
                        colorAdvices={portalData.colorAdvices}
                        chatMessages={portalData.chatMessages}
                        allPhotos={portalData.allPhotos}
                        company={company} // Passed company as well, since ProjectDetailModal might need it
                        clientInfo={portalData.clientInfo}
                        jwt={jwt} // Pass JWT for potential authenticated requests within modal
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </div>
        );
    }

    return null;
}
