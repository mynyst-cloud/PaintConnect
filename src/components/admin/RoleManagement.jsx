import { InlineSpinner } from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback } from 'react';
import { Role, User, RoleChangeLog, Company } from '@/api/entities'; // Added Company entity
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Plus, Edit, Trash2, Save, X, Shield, 
  Eye, UserPlus, Settings, BarChart3, Calendar,
  Package, AlertTriangle 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Added Select components

const defaultPermissions = {
  projects: { view: true, create: false, edit: false, delete: false, upload_photos: false, assign_painters: false },
  materials: { view: true, create_request: true, approve_request: false, manage_inventory: false },
  damages: { view: true, report: true, resolve: false, approve: false },
  team: { view_team: true, invite_users: false, manage_roles: false, view_hours: false, approve_hours: false },
  planning: { view: true, create_events: false, edit_events: false, delete_events: false },
  analytics: { view_basic: false, view_detailed: false, export_data: false },
  settings: { edit_company: false, manage_subscription: false, system_admin: false }
};

const permissionCategories = {
  projects: { name: 'Projecten', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  materials: { name: 'Materialen', icon: Package, color: 'bg-green-100 text-green-800' },
  damages: { name: 'Beschadigingen', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
  team: { name: 'Team', icon: Users, color: 'bg-purple-100 text-purple-800' },
  planning: { name: 'Planning', icon: Calendar, color: 'bg-orange-100 text-orange-800' },
  analytics: { name: 'Analytics', icon: BarChart3, color: 'bg-indigo-100 text-indigo-800' },
  settings: { name: 'Instellingen', icon: Settings, color: 'bg-gray-100 text-gray-800' }
};

const permissionLabels = {
  projects: {
    view: 'Projecten bekijken',
    create: 'Projecten aanmaken',
    edit: 'Projecten bewerken', 
    delete: 'Projecten verwijderen',
    upload_photos: 'Foto\'s uploaden',
    assign_painters: 'Schilders toewijzen'
  },
  materials: {
    view: 'Materialen bekijken',
    create_request: 'Aanvragen indienen',
    approve_request: 'Aanvragen goedkeuren',
    manage_inventory: 'Voorraad beheren'
  },
  damages: {
    view: 'Beschadigingen bekijken',
    report: 'Beschadigingen melden',
    resolve: 'Beschadigingen oplossen',
    approve: 'Beschadigingen goedkeuren'
  },
  team: {
    view_team: 'Team bekijken',
    invite_users: 'Gebruikers uitnodigen',
    manage_roles: 'Rollen beheren',
    view_hours: 'Uren bekijken',
    approve_hours: 'Uren goedkeuren'
  },
  planning: {
    view: 'Planning bekijken',
    create_events: 'Events aanmaken',
    edit_events: 'Events bewerken',
    delete_events: 'Events verwijderen'
  },
  analytics: {
    view_basic: 'Basis analytics',
    view_detailed: 'Gedetailleerde analytics',
    export_data: 'Data exporteren'
  },
  settings: {
    edit_company: 'Bedrijf bewerken',
    manage_subscription: 'Abonnement beheren',
    system_admin: 'Systeem beheer'
  }
};

export default function RoleManagement({ currentUser }) {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [changeLogs, setChangeLogs] = useState([]);
  const [companies, setCompanies] = useState([]); // New state
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCompany, setSelectedCompany] = useState(''); // New state
  const [isInitializingRoles, setIsInitializingRoles] = useState(false); // New state
  const { toast } = useToast();

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: { ...defaultPermissions }
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Voor super admin - laad alle bedrijven
      let companiesData = [];
      if (currentUser.role === 'admin') {
        companiesData = await Company.list();
        setCompanies(companiesData || []);
        // Set default selected company if not already set, or if the current selected one is invalid
        if (!selectedCompany && companiesData.length > 0) {
          setSelectedCompany(companiesData[0].id);
        }
      }

      let targetCompanyId = currentUser.company_id;
      if (currentUser.role === 'admin' && selectedCompany) {
        targetCompanyId = selectedCompany;
      } else if (currentUser.role === 'admin' && companiesData.length > 0) {
        // If no specific company is selected by admin, but companies are loaded, use the first one
        targetCompanyId = companiesData[0].id;
      }

      if (targetCompanyId) {
        const [rolesData, usersData, logsData] = await Promise.all([
          Role.filter({ company_id: targetCompanyId }),
          User.filter({ company_id: targetCompanyId }),
          RoleChangeLog.filter({ company_id: targetCompanyId }, '-created_date', 20)
        ]);
        
        setRoles(rolesData || []);
        setUsers(usersData || []);
        setChangeLogs(logsData || []);
      } else {
        setRoles([]);
        setUsers([]);
        setChangeLogs([]);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon rollendata niet laden.' });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedCompany, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInitializeDefaultRoles = async () => {
    const companyId = currentUser.role === 'admin' && selectedCompany ? selectedCompany : currentUser.company_id;
    
    if (!companyId) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Selecteer eerst een bedrijf.' });
      return;
    }

    if (!confirm('Weet u zeker dat u de standaard rollen wilt aanmaken? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    setIsInitializingRoles(true);
    try {
      const { initializeDefaultRoles } = await import('@/api/functions');
      const response = await initializeDefaultRoles({ company_id: companyId });
      
      if (response.data?.success) {
        toast({ title: 'Succes', description: response.data.message });
        loadData();
      } else {
        throw new Error(response.data?.error || 'Onbekende fout');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Fout', description: error.message });
    } finally {
      setIsInitializingRoles(false);
    }
  };

  const handleCreateRole = async () => {
    const companyId = currentUser.role === 'admin' && selectedCompany ? selectedCompany : currentUser.company_id;
    if (!companyId) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Geen bedrijf geselecteerd om de rol voor aan te maken.' });
      return;
    }

    try {
      const roleData = {
        company_id: companyId,
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        is_system_role: false
      };

      await Role.create(roleData);
      
      await RoleChangeLog.create({
        company_id: companyId,
        changed_by_user_id: currentUser.id,
        changed_by_email: currentUser.email,
        action: 'role_created',
        role_name: newRole.name,
        changes_summary: `Rol '${newRole.name}' aangemaakt`,
        details: { permissions: newRole.permissions }
      });

      toast({ title: 'Succes', description: `Rol '${newRole.name}' is aangemaakt.` });
      setShowCreateRole(false);
      setNewRole({ name: '', description: '', permissions: { ...defaultPermissions } });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon rol niet aanmaken.' });
    }
  };

  const handleUpdateRole = async (roleId, updatedRole) => {
    const companyId = currentUser.role === 'admin' && selectedCompany ? selectedCompany : currentUser.company_id;
    if (!companyId) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Geen bedrijf geselecteerd om de rol voor bij te werken.' });
      return;
    }

    try {
      await Role.update(roleId, updatedRole);
      
      await RoleChangeLog.create({
        company_id: companyId,
        changed_by_user_id: currentUser.id,
        changed_by_email: currentUser.email,
        action: 'role_updated',
        role_name: updatedRole.name,
        changes_summary: `Rol '${updatedRole.name}' bijgewerkt`,
        details: { permissions: updatedRole.permissions }
      });

      toast({ title: 'Succes', description: `Rol '${updatedRole.name}' is bijgewerkt.` });
      setEditingRole(null);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon rol niet bijwerken.' });
    }
  };

  const handleDeleteRole = async (role) => {
    const companyId = currentUser.role === 'admin' && selectedCompany ? selectedCompany : currentUser.company_id;
    if (!companyId) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Geen bedrijf geselecteerd om de rol voor te verwijderen.' });
      return;
    }

    if (role.is_system_role) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Systeemrollen kunnen niet worden verwijderd.' });
      return;
    }

    try {
      await Role.delete(role.id);
      
      await RoleChangeLog.create({
        company_id: companyId,
        changed_by_user_id: currentUser.id,
        changed_by_email: currentUser.email,
        action: 'role_deleted',
        role_name: role.name,
        changes_summary: `Rol '${role.name}' verwijderd`,
        details: {}
      });

      toast({ title: 'Succes', description: `Rol '${role.name}' is verwijderd.` });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon rol niet verwijderen.' });
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    const companyId = currentUser.role === 'admin' && selectedCompany ? selectedCompany : currentUser.company_id;
    if (!companyId) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Geen bedrijf geselecteerd om de rol voor toe te wijzen.' });
      return;
    }

    try {
      const user = users.find(u => u.id === userId);
      const role = roles.find(r => r.id === roleId);
      
      await User.update(userId, { role_id: roleId });
      
      await RoleChangeLog.create({
        company_id: companyId,
        target_user_id: userId,
        target_user_email: user.email,
        changed_by_user_id: currentUser.id,
        changed_by_email: currentUser.email,
        action: 'user_role_changed',
        old_role_id: user.role_id,
        new_role_id: roleId,
        role_name: role.name,
        changes_summary: `Rol van ${user.full_name} gewijzigd naar '${role.name}'`,
        details: { user_name: user.full_name }
      });

      toast({ title: 'Succes', description: `Rol van ${user.full_name} is gewijzigd.` });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon rol niet toewijzen.' });
    }
  };

  if (isLoading && (!selectedCompany || currentUser.role !== 'admin')) { // Only show full loading spinner if not an admin or if admin has selected a company
    return <LoadingSpinner text="Rollen laden..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Rollen & Permissies
          </h2>
          <p className="text-gray-600">Beheer gebruikersrollen en permissies voor uw bedrijf</p>
        </div>
        <div className="flex gap-2">
          {currentUser.role === 'admin' && (
            <Button 
              onClick={handleInitializeDefaultRoles} 
              disabled={isInitializingRoles || !selectedCompany}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              {isInitializingRoles ? (
                <InlineSpinner className="mr-2" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Initialiseer Standaard Rollen
            </Button>
          )}
          <Button onClick={() => setShowCreateRole(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Rol
          </Button>
        </div>
      </div>

      {/* Company Selector voor Super Admin */}
      {currentUser.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Bedrijf Selecteren</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && companies.length === 0 ? (
              <LoadingSpinner text="Bedrijven laden..." />
            ) : (
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecteer een bedrijf om rollen te beheren" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} ({company.owner_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!selectedCompany && companies.length > 0 && (
              <Alert className="mt-4">
                <AlertDescription>
                  Selecteer een bedrijf om de rollen te beheren.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alleen tonen als er een bedrijf geselecteerd is (of als niet admin) */}
      {(currentUser.company_id || selectedCompany) && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="users">Gebruikers</TabsTrigger>
            <TabsTrigger value="logs">Wijzigingslog</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {roles.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Geen rollen gevonden voor dit bedrijf. Overweeg "Initialiseer Standaard Rollen" aan te maken.
                  </AlertDescription>
                </Alert>
              ) : (
                roles.map((role) => {
                  const roleUsers = users.filter(u => u.role_id === role.id);
                  return (
                    <Card key={role.id} className="relative">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {role.name}
                            {role.is_system_role && (
                              <Badge variant="secondary" className="text-xs">Systeem</Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{roleUsers.length} gebruikers</Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingRole(role)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!role.is_system_role && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteRole(role)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(permissionCategories).map(([key, category]) => {
                            const Icon = category.icon;
                            const permissions = role.permissions[key] || {};
                            const activePerms = Object.values(permissions).filter(Boolean).length;
                            const totalPerms = Object.keys(permissions).length;
                            
                            return (
                              <div key={key} className={`p-3 rounded-lg ${category.color}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className="w-4 h-4" />
                                  <span className="text-sm font-medium">{category.name}</span>
                                </div>
                                <span className="text-xs">{activePerms}/{totalPerms} permissies</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gebruikers & Rollen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        Geen gebruikers gevonden voor dit bedrijf.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    users.map((user) => {
                      const userRole = roles.find(r => r.id === user.role_id);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={userRole ? "default" : "secondary"}>
                              {userRole ? userRole.name : user.company_role || 'Geen rol'}
                            </Badge>
                            <select
                              value={user.role_id || ''}
                              onChange={(e) => handleAssignRole(user.id, e.target.value)}
                              className="px-3 py-1 border rounded-md text-sm"
                            >
                              <option value="">Standaard rol</option>
                              {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Wijzigingslog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {changeLogs.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        Geen wijzigingslogboeken gevonden voor dit bedrijf.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    changeLogs.map((log) => (
                      <div key={log.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{log.changes_summary}</p>
                            <p className="text-sm text-gray-600">
                              Door {log.changed_by_email}
                              {log.target_user_email && ` • Gebruiker: ${log.target_user_email}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {new Date(log.created_date).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Role Dialog */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe Rol Aanmaken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  placeholder="Bijv. Project Manager"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Input
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Korte beschrijving van de rol"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Permissies</h3>
              <div className="space-y-6">
                {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                  const Icon = category.icon;
                  return (
                    <div key={categoryKey} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium">{category.name}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(permissionLabels[categoryKey] || {}).map(([permKey, label]) => (
                          <div key={permKey} className="flex items-center space-x-2">
                            <Switch
                              id={`${categoryKey}-${permKey}`}
                              checked={newRole.permissions[categoryKey]?.[permKey] || false}
                              onCheckedChange={(checked) => {
                                setNewRole({
                                  ...newRole,
                                  permissions: {
                                    ...newRole.permissions,
                                    [categoryKey]: {
                                      ...newRole.permissions[categoryKey],
                                      [permKey]: checked
                                    }
                                  }
                                });
                              }}
                            />
                            <Label htmlFor={`${categoryKey}-${permKey}`} className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateRole(false)}>
                Annuleren
              </Button>
              <Button 
                onClick={handleCreateRole} 
                disabled={!newRole.name.trim() || !(currentUser.company_id || selectedCompany)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Rol Aanmaken
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      {editingRole && (
        <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rol Bewerken: {editingRole.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Naam</Label>
                  <Input
                    id="edit-name"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                    disabled={editingRole.is_system_role}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Beschrijving</Label>
                  <Input
                    id="edit-description"
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Permissies</h3>
                <div className="space-y-6">
                  {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                    const Icon = category.icon;
                    return (
                      <div key={categoryKey} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium">{category.name}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(permissionLabels[categoryKey] || {}).map(([permKey, label]) => (
                            <div key={permKey} className="flex items-center space-x-2">
                              <Switch
                                id={`edit-${categoryKey}-${permKey}`}
                                checked={editingRole.permissions[categoryKey]?.[permKey] || false}
                                onCheckedChange={(checked) => {
                                  setEditingRole({
                                    ...editingRole,
                                    permissions: {
                                      ...editingRole.permissions,
                                      [categoryKey]: {
                                        ...editingRole.permissions[categoryKey],
                                        [permKey]: checked
                                      }
                                    }
                                  });
                                }}
                                disabled={editingRole.is_system_role}
                              />
                              <Label htmlFor={`edit-${categoryKey}-${permKey}`} className="text-sm">{label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingRole(null)}>
                  Annuleren
                </Button>
                <Button 
                  onClick={() => handleUpdateRole(editingRole.id, editingRole)}
                  disabled={editingRole.is_system_role || !(currentUser.company_id || selectedCompany)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Wijzigingen Opslaan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
