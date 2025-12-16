// Centralized permission management for enterprise-grade security
const ROLES = {
  ADMIN: 'admin',
  PAINTER: 'painter',
  HELPDESK: 'helpdesk',
  SUPPLIER: 'supplier'
};

const PERMISSIONS = {
  [ROLES.ADMIN]: {
    project: ['create', 'read', 'update', 'delete'],
    user: ['create', 'read', 'update', 'delete'],
    billing: ['manage'],
    settings: ['*'], // wildcard for all settings
    analytics: ['view_full'],
    super_admin: ['access']
  },
  [ROLES.PAINTER]: {
    project: ['read', 'update_own'],
    damage: ['create', 'read_own'],
    material_request: ['create', 'read_own'],
    team_chat: ['read', 'write']
  },
  [ROLES.SUPPLIER]: {
    orders: ['read', 'update_status'],
    referrals: ['view']
  }
};

class PermissionManager {
  can(user, action, resource) {
    if (!user || !user.company_role) {
      return false;
    }

    const permissions = PERMISSIONS[user.company_role];
    if (!permissions || !permissions[resource]) {
      return false;
    }

    if (permissions[resource].includes('*') || permissions[resource].includes(action)) {
      return true;
    }

    return false;
  }
}

const permissionManager = new PermissionManager();
export default permissionManager;