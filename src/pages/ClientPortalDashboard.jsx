
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities'; // Specific import for User
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, MessageSquare, Image as ImageIcon, Palette, AlertTriangle, Calendar, Shield } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { getClientPortalData } from '@/api/functions'; // New function for data fetching
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function ClientPortalDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Added error state
    const [user, setUser] = useState(null);
    const [project, setProject] = useState(null);
    const [updates, setUpdates] = useState([]);
    const [colorAdvices, setColorAdvices] = useState([]);
    const [damages, setDamages] = useState([]);
    const [messages, setMessages] = useState([]);
    const [allPhotos, setAllPhotos] = useState([]); // Added allPhotos state
    const [company, setCompany] = useState(null); // Added company state
    const [isAdminView, setIsAdminView] = useState(false); // Added isAdminView state
    const [activeTab, setActiveTab] = useState('overview');
    
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get('project_id');

    // Changed useEffect dependency to projectId
    useEffect(() => {
        loadDashboardData();
    }, [projectId]);

    const loadDashboardData = async () => {
        setIsLoading(true); // Ensure loading state is true on re-run
        setError(null); // Clear previous errors
        if (!projectId) {
            setError('Geen project ID gevonden in URL');
            setIsLoading(false);
            return;
        }

        try {
            // Check auth (User.me() still used to get current user info for roles etc.)
            const currentUser = await User.me();
            setUser(currentUser);

            console.log('[ClientPortalDashboard] Loading data for project:', projectId);
            console.log('[ClientPortalDashboard] User role:', currentUser.role, 'Company role:', currentUser.company_role);

            // Haal portal data op via backend functie
            // This replaces the previous multiple entity calls and client access check
            const { data: response } = await getClientPortalData({ project_id: projectId });

            if (response.success) {
                console.log('[ClientPortalDashboard] Data loaded successfully, is_admin_view:', response.is_admin_view);
                
                setProject(response.data.project);
                setUpdates(response.data.updates || []);
                setColorAdvices(response.data.colorAdvices || []);
                setDamages(response.data.damages || []);
                setMessages(response.data.chatMessages || []);
                setAllPhotos(response.data.allPhotos || []); // Set allPhotos from response
                setCompany(response.data.company); // Set company from response
                setIsAdminView(response.is_admin_view || false);
            } else {
                // If the response indicates failure, set the error message
                setError(response.error || 'Kon portaalgegevens niet laden');
            }

        } catch (err) {
            console.error('[ClientPortalDashboard] Error loading dashboard:', err);
            // Catch any unexpected errors during the process
            setError('Kon portaalgegevens niet laden: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        if (isAdminView) {
            // If it's an admin view, "Terug naar Dashboard" means navigate back to their dashboard
            // without logging out.
            navigate('/dashboard'); // Assuming '/dashboard' is the admin's main dashboard route
        } else {
            // For regular client users, perform a full logout.
            await User.logout();
            navigate('/');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600">Portaalgegevens laden...</p>
                </div>
            </div>
        );
    }

    // Display error message if there was an error
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <img src={paintConnectLogoUrl} alt="PaintConnect" className="h-16 mx-auto mb-6" />
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Fout</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-700">
                        Terug naar home
                    </Button>
                </div>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    const coverPhotoUrl = project.cover_photo_url || project.photo_urls?.[0];
    
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin View Indicator */}
            {isAdminView && (
                <div className="bg-indigo-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin weergave - U bekijkt dit klantenportaal als administrator</span>
                </div>
            )}

            {/* Header with Cover Photo */}
            <div className="relative w-full h-64 bg-gradient-to-br from-emerald-500 to-teal-600">
                {coverPhotoUrl ? (
                    <img src={coverPhotoUrl} alt={project.project_name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <img src={paintConnectLogoUrl} alt="PaintConnect" className="w-1/4 h-auto opacity-30" />
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Header Content */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
                    {/* Use company logo if available, otherwise default */}
                    <img src={company?.logo_url || paintConnectLogoUrl} alt={company?.name || "PaintConnect"} className="h-10" />
                    <Button variant="ghost" onClick={handleLogout} className="text-white bg-black/30 hover:bg-black/50">
                        <LogOut className="w-4 h-4 mr-2" />
                        {/* Conditional button text */}
                        {isAdminView ? 'Terug naar Dashboard' : 'Uitloggen'}
                    </Button>
                </div>

                {/* Project Title */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="text-3xl font-bold text-white mb-2">{project.project_name}</h1>
                    <p className="text-white/90">{project.address}</p>
                    <div className="flex items-center gap-4 mt-3">
                        <Badge className="bg-white/20 text-white border-white/30">
                            Status: {project.status}
                        </Badge>
                        {project.start_date && (
                            <Badge className="bg-white/20 text-white border-white/30">
                                <Calendar className="w-3 h-3 mr-1" />
                                Start: {format(new Date(project.start_date), 'd MMM yyyy', { locale: nl })}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-1 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overzicht', icon: Calendar },
                            // Updated labels with counts
                            { id: 'updates', label: `Updates (${updates.length})`, icon: MessageSquare },
                            { id: 'colors', label: `Kleuradvies (${colorAdvices.length})`, icon: Palette },
                            { id: 'damages', label: `Beschadigingen (${damages.length})`, icon: AlertTriangle },
                            { id: 'gallery', label: `Foto's (${allPhotos.length})`, icon: ImageIcon } // Use allPhotos length
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-emerald-600 text-emerald-600 font-medium'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Stats Cards */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Updates</CardTitle>
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{updates.length}</div>
                                <p className="text-xs text-gray-500 mt-1">Laatste werkupdates</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Kleuradvies</CardTitle>
                                <Palette className="w-5 h-5 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{colorAdvices.length}</div>
                                <p className="text-xs text-gray-500 mt-1">Geselecteerde kleuren</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Beschadigingen</CardTitle>
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{damages.length}</div>
                                <p className="text-xs text-gray-500 mt-1">Geregistreerde items</p>
                            </CardContent>
                        </Card>

                        {/* Recent Updates Preview */}
                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                                    Laatste Updates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {updates.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Nog geen updates beschikbaar</p>
                                ) : (
                                    <div className="space-y-4">
                                        {updates.slice(0, 3).map(update => (
                                            <div key={update.id} className="border-b last:border-0 pb-4 last:pb-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium text-gray-900">{update.painter_name}</span>
                                                    <span className="text-sm text-gray-500">
                                                        {format(new Date(update.work_date), 'd MMM yyyy', { locale: nl })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm">{update.work_notes}</p>
                                                {update.photo_urls?.length > 0 && (
                                                    <div className="flex gap-2 mt-3">
                                                        {update.photo_urls.slice(0, 3).map((url, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={url}
                                                                alt={`Update foto ${idx + 1}`}
                                                                className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                                                                onClick={() => window.open(url, '_blank')}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'updates' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Alle Updates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {updates.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Nog geen updates beschikbaar</p>
                            ) : (
                                <div className="space-y-6">
                                    {updates.map(update => (
                                        <div key={update.id} className="border-b last:border-0 pb-6 last:pb-0">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="font-medium text-gray-900 text-lg">{update.painter_name}</span>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {format(new Date(update.work_date), 'EEEE d MMMM yyyy', { locale: nl })}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 mb-4">{update.work_notes}</p>
                                            {update.photo_urls?.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {update.photo_urls.map((url, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt={`Update foto ${idx + 1}`}
                                                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                                                            onClick={() => window.open(url, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'colors' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Kleuradvies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {colorAdvices.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Nog geen kleuradviezen beschikbaar</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {colorAdvices.map(advice => (
                                        <div key={advice.id} className="border rounded-lg p-4">
                                            <h3 className="font-semibold text-lg mb-3">{advice.room_name}</h3>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div 
                                                    className="w-16 h-16 rounded-lg border-2 border-gray-200"
                                                    style={{ backgroundColor: advice.color_hex }}
                                                />
                                                <div>
                                                    <p className="text-sm text-gray-600">Code: <span className="font-medium">{advice.color_code}</span></p>
                                                    <p className="text-sm text-gray-600">Type: <span className="font-medium">{advice.color_type}</span></p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2">
                                                <strong>Merk:</strong> {advice.paint_brand}
                                            </p>
                                            {advice.paint_name && (
                                                <p className="text-sm text-gray-700 mb-2">
                                                    <strong>Product:</strong> {advice.paint_name}
                                                </p>
                                            )}
                                            {advice.notes && (
                                                <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded">
                                                    {advice.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'damages' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Beschadigingen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {damages.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Geen beschadigingen geregistreerd</p>
                            ) : (
                                <div className="space-y-4">
                                    {damages.map(damage => (
                                        <div key={damage.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-semibold text-lg">{damage.title}</h3>
                                                <Badge className={
                                                    damage.status === 'opgelost' ? 'bg-green-100 text-green-800' :
                                                    damage.status === 'in_behandeling' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }>
                                                    {damage.status}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-700 mb-3">{damage.description}</p>
                                            {damage.location && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <strong>Locatie:</strong> {damage.location}
                                                </p>
                                            )}
                                            {damage.photo_urls?.length > 0 && (
                                                <div className="grid grid-cols-3 gap-2 mt-3">
                                                    {damage.photo_urls.map((url, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt={`Beschadiging foto ${idx + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                                                            onClick={() => window.open(url, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'gallery' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Fotogalerij</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Use the pre-aggregated allPhotos state */}
                            {allPhotos.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Nog geen foto's beschikbaar</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {allPhotos.map((photo, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={photo.url}
                                                alt={`Foto ${idx + 1}`}
                                                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                                                onClick={() => window.open(photo.url, '_blank')}
                                            />
                                            {/* Display uploader and source */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-2">
                                                <span className="text-white text-xs">{photo.uploader} - {photo.source}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
