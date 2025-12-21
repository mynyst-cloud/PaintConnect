import { useState, useEffect, createContext, useContext } from 'react';
import { User, Role } from '@/api/entities';
import { USER_ROLES } from '@/config/roles';

const PermissionsContext = createContext(null);

// Hook om permissies te checken
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions moet gebruikt worden binnen een PermissionsProvider');
  }
  return context;
}

// Provider component
export function PermissionsProvider({ children, currentUser }) {
  const [permissions, setPermissions] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!currentUser) {
        setPermissions(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // Als gebruiker een custom role heeft
        if (currentUser.role_id) {
          const role = await Role.get(currentUser.role_id);
          setUserRole(role);
          setPermissions(role.permissions);
        } else {
          // Gebruik standaard permissies gebaseerd op company_role
          const defaultPermissions = getDefaultPermissions(currentUser.company_role);
          setPermissions(defaultPermissions);
          setUserRole({ name: currentUser.company_role, is_system_role: true });
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        // Fallback naar basic permissions
        setPermissions(getDefaultPermissions(USER_ROLES.PAINTER));
        setUserRole({ name: USER_ROLES.PAINTER, is_system_role: true });
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, [currentUser]);

  // Helper functie om te checken of een permissie actief is
  const hasPermission = (category, action) => {
    // Super admin heeft altijd alle permissies
    if (currentUser?.company_role === USER_ROLES.SUPER_ADMIN) return true;
    
    if (!permissions || !permissions[category]) return false;
    return permissions[category][action] === true;
  };

  // Helper functie om te checken of gebruiker admin is (voor backwards compatibility)
  const isAdmin = () => {
    return currentUser?.company_role === USER_ROLES.ADMIN || 
           currentUser?.company_role === USER_ROLES.SUPER_ADMIN ||
           hasPermission('settings', 'system_admin');
  };

  // Helper functie om te checken of gebruiker super admin is
  const isSuperAdmin = () => {
    return currentUser?.company_role === USER_ROLES.SUPER_ADMIN;
  };

  // Helper functie om te checken of gebruiker schilder is
  const isPainter = () => {
    return currentUser?.company_role === USER_ROLES.PAINTER;
  };

  // Helper functie om te checken of gebruiker bepaalde actie mag uitvoeren
  const canPerform = (action) => {
    // Super admin kan alles
    if (isSuperAdmin()) return true;
    
    const actionMap = {
      'create_project': () => hasPermission('projects', 'create'),
      'edit_project': () => hasPermission('projects', 'edit'),
      'delete_project': () => hasPermission('projects', 'delete'),
      'upload_photos': () => hasPermission('projects', 'upload_photos'),
      'assign_painters': () => hasPermission('projects', 'assign_painters'),
      'approve_materials': () => hasPermission('materials', 'approve_request'),
      'manage_team': () => hasPermission('team', 'invite_users'),
      'manage_roles': () => hasPermission('team', 'manage_roles'),
      'view_analytics': () => hasPermission('analytics', 'view_basic'),
      'manage_company': () => hasPermission('settings', 'edit_company'),
      'manage_subscription': () => hasPermission('settings', 'manage_subscription'),
      'view_all_projects': () => isAdmin(),
      'view_all_damages': () => isAdmin(),
      'invite_clients': () => isAdmin(),
    };

    return actionMap[action] ? actionMap[action]() : false;
  };

  const contextValue = {
    permissions,
    userRole,
    isLoading,
    hasPermission,
    isAdmin,
    isSuperAdmin,
    isPainter,
    canPerform,
    currentUser
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Standaard permissies per rol
function getDefaultPermissions(role) {
  const basePermissions = {
    projects: { view: true, create: false, edit: false, delete: false, upload_photos: false, assign_painters: false },
    materials: { view: true, create_request: true, approve_request: false, manage_inventory: false },
    damages: { view: true, report: true, resolve: false, approve: false },
    team: { view_team: true, invite_users: false, manage_roles: false, view_hours: false, approve_hours: false },
    planning: { view: true, create_events: false, edit_events: false, delete_events: false },
    analytics: { view_basic: false, view_detailed: false, export_data: false },
    settings: { edit_company: false, manage_subscription: false, system_admin: false }
  };

  // Super Admin krijgt alles
  if (role === USER_ROLES.SUPER_ADMIN) {
    return {
      projects: { view: true, create: true, edit: true, delete: true, upload_photos: true, assign_painters: true },
      materials: { view: true, create_request: true, approve_request: true, manage_inventory: true },
      damages: { view: true, report: true, resolve: true, approve: true },
      team: { view_team: true, invite_users: true, manage_roles: true, view_hours: true, approve_hours: true },
      planning: { view: true, create_events: true, edit_events: true, delete_events: true },
      analytics: { view_basic: true, view_detailed: true, export_data: true },
      settings: { edit_company: true, manage_subscription: true, system_admin: true },
      super_admin: { access_all: true, manage_companies: true, manage_users: true, error_logs: true }
    };
  }

  // Admin (bedrijfseigenaar) krijgt alle bedrijfs-gerelateerde permissies
  if (role === USER_ROLES.ADMIN) {
    return {
      projects: { view: true, create: true, edit: true, delete: true, upload_photos: true, assign_painters: true },
      materials: { view: true, create_request: true, approve_request: true, manage_inventory: true },
      damages: { view: true, report: true, resolve: true, approve: true },
      team: { view_team: true, invite_users: true, manage_roles: true, view_hours: true, approve_hours: true },
      planning: { view: true, create_events: true, edit_events: true, delete_events: true },
      analytics: { view_basic: true, view_detailed: true, export_data: true },
      settings: { edit_company: true, manage_subscription: true, system_admin: false }
    };
  }

  // Schilder krijgt beperkte permissies
  if (role === USER_ROLES.PAINTER) {
    return {
      ...basePermissions,
      projects: { 
        view: true,  // Alleen toegewezen projecten
        create: false, 
        edit: false, 
        delete: false, 
        upload_photos: true,  // Kan foto's uploaden
        assign_painters: false,
        add_updates: true  // Kan updates toevoegen aan projecten
      },
      materials: {
        view: true,
        create_request: true,  // Kan materialen aanvragen
        approve_request: false,
        manage_inventory: false
      },
      damages: { 
        ...basePermissions.damages, 
        report: true,  // Kan schade melden
        resolve: false  // Kan geen schade oplossen
      },
      planning: {
        view: true,  // Kan alleen eigen planning zien
        create_events: false,
        edit_events: false,
        delete_events: false
      },
      team: {
        view_team: false,  // Kan team niet beheren
        invite_users: false,
        manage_roles: false,
        view_hours: false,
        approve_hours: false
      },
      analytics: {
        view_basic: false,
        view_detailed: false,
        export_data: false
      },
      settings: {
        edit_company: false,
        manage_subscription: false,
        system_admin: false
      }
    };
  }

  // Helpdesk rol
  if (role === USER_ROLES.HELPDESK) {
    return {
      ...basePermissions,
      projects: { view: true, create: false, edit: false, delete: false, upload_photos: false, assign_painters: false },
      team: { view_team: true, invite_users: false, manage_roles: false, view_hours: true, approve_hours: false },
      analytics: { view_basic: true, view_detailed: false, export_data: false }
    };
  }

  // Supplier rol
  if (role === USER_ROLES.SUPPLIER) {
    return {
      ...basePermissions,
      materials: { view: true, create_request: false, approve_request: false, manage_inventory: false },
      orders: { view: true, update_status: true }
    };
  }

  return basePermissions; // andere rollen krijgen basis permissies
}

// Component om permissies te checken
export function RequirePermission({ category, action, children, fallback = null }) {
  const { hasPermission, isLoading } = usePermissions();
  
  if (isLoading) return null;
  
  if (!hasPermission(category, action)) {
    return fallback;
  }
  
  return children;
}

// Component voor admin-only content
export function AdminOnly({ children, fallback = null }) {
  const { isAdmin, isLoading } = usePermissions();
  
  if (isLoading) return null;
  
  if (!isAdmin()) {
    return fallback;
  }
  
  return children;
}

// Component voor super-admin-only content
export function SuperAdminOnly({ children, fallback = null }) {
  const { isSuperAdmin, isLoading } = usePermissions();
  
  if (isLoading) return null;
  
  if (!isSuperAdmin()) {
    return fallback;
  }
  
  return children;
}
