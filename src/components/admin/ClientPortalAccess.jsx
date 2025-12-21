import LoadingSpinner from '@/components/ui/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClientInvitation, Project } from '@/api/entities';
import { ExternalLink, Eye, User, Building, Calendar, Search } from 'lucide-react';

export default function ClientPortalAccess() {
    const [invitations, setInvitations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState('');

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        try {
            const allInvitations = await ClientInvitation.filter({ status: ['sent', 'accessed', 'active'] });
            
            // Haal project details op
            const projectIds = [...new Set(allInvitations.map(inv => inv.project_id))];
            const projects = await Project.filter({ id: { $in: projectIds } });
            const projectsMap = projects.reduce((acc, proj) => {
                acc[proj.id] = proj;
                return acc;
            }, {});

            // Verrijk invitations met project data
            const enrichedInvitations = allInvitations.map(inv => ({
                ...inv,
                project: projectsMap[inv.project_id]
            }));

            setInvitations(enrichedInvitations);
        } catch (error) {
            console.error('Error loading invitations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAsClient = (projectId) => {
        // Open in nieuwe tab met project_id
        const url = `/ClientPortalDashboard?project_id=${projectId}`;
        window.open(url, '_blank');
    };

    const filteredInvitations = invitations.filter(inv => 
        !searchEmail || inv.client_email.toLowerCase().includes(searchEmail.toLowerCase())
    );

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <LoadingSpinner size="default" />
                    <p>Uitnodigingen laden...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    Klantenportaal Toegang (Admin)
                </CardTitle>
                <p className="text-sm text-gray-600">
                    Bekijk klantenportalen als administrator zonder uitnodigingslink
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Zoek op e-mailadres..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="flex-1"
                    />
                    <Button variant="outline">
                        <Search className="w-4 h-4" />
                    </Button>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Let op:</strong> Als admin heeft u automatisch toegang tot alle klantenportalen van uw bedrijf. 
                    Super admins hebben toegang tot alle portalen.
                </div>

                {filteredInvitations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Geen uitnodigingen gevonden</p>
                        {searchEmail && <p className="text-sm">voor "{searchEmail}"</p>}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredInvitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-medium">{invitation.client_email}</p>
                                            {invitation.client_name && (
                                                <p className="text-sm text-gray-600">{invitation.client_name}</p>
                                            )}
                                        </div>
                                        <Badge 
                                            className={
                                                invitation.status === 'active' ? 'bg-green-100 text-green-800' :
                                                invitation.status === 'accessed' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }
                                        >
                                            {invitation.status}
                                        </Badge>
                                    </div>
                                    {invitation.project && (
                                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                            <Building className="w-3 h-3" />
                                            {invitation.project.project_name}
                                        </div>
                                    )}
                                    {invitation.last_login && (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            Laatste login: {new Date(invitation.last_login).toLocaleDateString('nl-NL')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewAsClient(invitation.project_id)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Bekijk Portaal
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}