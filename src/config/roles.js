/**
 * PaintConnect Role & Subscription Configuration
 * 
 * Dit bestand definieert alle rollen, permissies en abonnementslimieten
 * voor het PaintConnect platform.
 */

// ============================================
// SUPER ADMIN EMAIL
// ============================================
export const SUPER_ADMIN_EMAIL = 'mynysteven@gmail.com';

/**
 * Check if user is Super Admin by email
 */
export function isSuperAdminByEmail(email) {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

// ============================================
// USER ROLES
// ============================================
export const USER_ROLES = {
  // Schildersbedrijf rollen (admins)
  ADMIN: 'admin',
  
  // Teamleden
  PAINTER: 'painter',
  
  // Platform rollen
  SUPER_ADMIN: 'super_admin',
  HELPDESK: 'helpdesk',
  
  // Externe rollen
  SUPPLIER: 'supplier',
  CLIENT: 'client',
};

// ============================================
// SUBSCRIPTION TIERS
// ============================================
export const SUBSCRIPTION_TIERS = {
  STARTER_TRIAL: 'starter_trial',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

// ============================================
// TIER CONFIGURATION
// ============================================
export const TIER_CONFIG = {
  [SUBSCRIPTION_TIERS.STARTER_TRIAL]: {
    name: 'Starter (Trial)',
    displayName: 'Proefperiode',
    price: 0,
    trialDays: 14,
    isTrial: true,
    maxUsers: 2, // 1 admin + 1 schilder
    maxProjectsPerMonth: 10,
    maxMaterials: 50,
    description: '14 dagen gratis proefperiode',
  },
  
  [SUBSCRIPTION_TIERS.STARTER]: {
    name: 'Starter',
    displayName: 'Starter',
    price: 29,
    trialDays: 0,
    isTrial: false,
    maxUsers: 2, // 1 admin + 1 schilder
    maxProjectsPerMonth: 10,
    maxMaterials: 50,
    description: 'Voor kleine zelfstandigen',
  },
  
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    name: 'Professional',
    displayName: 'Professional',
    price: 79,
    trialDays: 0,
    isTrial: false,
    maxUsers: 5, // 1 admin + 4 schilders
    maxProjectsPerMonth: 30,
    maxMaterials: 150,
    description: 'Voor groeiende bedrijven',
  },
  
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    name: 'Enterprise',
    displayName: 'Enterprise',
    price: 199,
    trialDays: 0,
    isTrial: false,
    maxUsers: 100, // 1 admin + 99 schilders
    maxProjectsPerMonth: -1, // Onbeperkt
    maxMaterials: -1, // Onbeperkt
    description: 'Voor grote organisaties',
  },
};

// ============================================
// FEATURE ACCESS PER TIER
// ============================================
export const TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.STARTER_TRIAL]: {
    // Dashboard
    page_dashboard: true,
    dashboard_all_features: true,
    
    // Planning
    page_planning: true,
    page_weekplanning: false, // Alleen Professional+
    
    // Projecten
    page_projects: true,
    
    // Beschadigingen
    page_damages: true,
    
    // Referrals
    page_referrals: true,
    
    // Materialen
    page_materials: true,
    materials_request: true,
    
    // MateriaalBeheer
    page_materiaalbeheer: true,
    materiaalbeheer_tab_materials: true,
    materiaalbeheer_tab_invoices: false, // Geen toegang
    materiaalbeheer_tab_usage: false, // Geen toegang
    materiaalbeheer_add_manual: true,
    materiaalbeheer_add_invoice: false, // Kan ENKEL handmatig toevoegen
    
    // VoorraadBeheer
    page_voorraad: false, // Geen toegang
    
    // Verfcalculator
    page_verfcalculator: true,
    
    // Leads
    page_leads: true,
    
    // Team Activiteit
    page_team_activiteit: true,
    checkin_features: true,
    
    // Subscription
    page_subscription: true,
    
    // Account Settings
    page_accountsettings: true,
    accountsettings_show_email: false, // Email niet zichtbaar voor Starter
    
    // Klantportaal
    page_klantportaal: false, // Geen toegang
    invite_clients: false,
    
    // Analytics
    page_analytics: false, // Geen toegang
    
    // API
    api_access: false,
    
    // Support
    support_email: true,
    support_priority: false,
    support_helpdesk: false,
    personal_account_manager: false,
  },
  
  [SUBSCRIPTION_TIERS.STARTER]: {
    // Zelfde als STARTER_TRIAL
    page_dashboard: true,
    dashboard_all_features: true,
    page_planning: true,
    page_weekplanning: false, // Alleen Professional+
    page_projects: true,
    page_damages: true,
    page_referrals: true,
    page_materials: true,
    materials_request: true,
    page_materiaalbeheer: true,
    materiaalbeheer_tab_materials: true,
    materiaalbeheer_tab_invoices: false,
    materiaalbeheer_tab_usage: false,
    materiaalbeheer_add_manual: true,
    materiaalbeheer_add_invoice: false,
    page_voorraad: false,
    page_verfcalculator: true,
    page_leads: true,
    page_team_activiteit: true,
    checkin_features: true,
    page_subscription: true,
    page_accountsettings: true,
    accountsettings_show_email: false,
    page_klantportaal: false,
    invite_clients: false,
    page_analytics: false,
    api_access: false,
    support_email: true,
    support_priority: false,
    support_helpdesk: false,
    personal_account_manager: false,
  },
  
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    // Alle Starter functies
    page_dashboard: true,
    dashboard_all_features: true,
    page_planning: true,
    page_weekplanning: true, // Professional heeft toegang
    page_projects: true,
    page_damages: true,
    page_referrals: true,
    page_materials: true,
    materials_request: true,
    page_verfcalculator: true,
    page_leads: true,
    page_team_activiteit: true,
    checkin_features: true,
    page_subscription: true,
    page_accountsettings: true,
    
    // Professional specifiek
    page_materiaalbeheer: true,
    materiaalbeheer_tab_materials: true,
    materiaalbeheer_tab_invoices: true, // Professional heeft toegang
    materiaalbeheer_tab_usage: true, // Professional heeft toegang
    materiaalbeheer_add_manual: true,
    materiaalbeheer_add_invoice: true, // Kan ook via facturen toevoegen
    
    // VoorraadBeheer
    page_voorraad: true, // Professional heeft toegang
    
    // Klantportaal
    page_klantportaal: true, // Professional heeft toegang
    invite_clients: true,
    
    // Analytics
    page_analytics: true, // Professional heeft toegang
    
    // Account Settings
    accountsettings_show_email: true, // Email zichtbaar voor Professional
    
    // API
    api_access: false,
    
    // Support
    support_email: true,
    support_priority: true,
    support_helpdesk: true,
    personal_account_manager: false,
  },
  
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    // Alle functies
    page_dashboard: true,
    dashboard_all_features: true,
    page_planning: true,
    page_weekplanning: true, // Enterprise heeft toegang
    page_projects: true,
    page_damages: true,
    page_referrals: true,
    page_materials: true,
    materials_request: true,
    page_materiaalbeheer: true,
    materiaalbeheer_tab_materials: true,
    materiaalbeheer_tab_invoices: true,
    materiaalbeheer_tab_usage: true,
    materiaalbeheer_add_manual: true,
    materiaalbeheer_add_invoice: true,
    page_voorraad: true,
    page_verfcalculator: true,
    page_leads: true,
    page_team_activiteit: true,
    checkin_features: true,
    page_subscription: true,
    page_accountsettings: true,
    accountsettings_show_email: true,
    page_klantportaal: true,
    invite_clients: true,
    page_analytics: true,
    
    // Enterprise specifiek
    api_access: true,
    
    // Support
    support_email: true,
    support_priority: true,
    support_helpdesk: true,
    personal_account_manager: true,
  },
};

// ============================================
// PAINTER PERMISSIONS
// Schilders hebben beperkte toegang onafhankelijk van subscription tier
// ============================================
export const PAINTER_FEATURES = {
  // Dashboard
  page_dashboard: true,
  dashboard_checkin: true,
  dashboard_quick_actions: true,
  dashboard_view_assigned_projects: true,
  
  // Planning (alleen toegewezen projecten zien)
  page_planning: true,
  planning_view_only: true,
  planning_create_events: false,
  planning_edit_events: false,
  
  // Projecten (alleen toegewezen projecten)
  page_projects: true,
  projects_view_assigned: true,
  projects_create: false,
  projects_edit: false,
  projects_delete: false,
  projects_upload_photos: true,
  projects_add_updates: true,
  
  // Beschadigingen (status opvolgen van toegewezen projecten)
  page_damages: true,
  damages_view_assigned: true,
  damages_report: true,
  damages_resolve: false,
  
  // Referrals
  page_referrals: true,
  
  // Materialen (aanvragen opvolgen)
  page_materials: true,
  materials_request: true,
  materials_view_requests: true,
  materials_approve: false,
  
  // Verfcalculator
  page_verfcalculator: true,
  
  // Geen toegang tot beheer functies
  page_materiaalbeheer: false,
  page_voorraad: false,
  page_analytics: false,
  page_leads: false,
  page_klantportaal: false,
  page_team_activiteit: false, // Kan eigen activiteit zien via dashboard
  page_accountsettings: true, // Eigen profiel beheren
  page_subscription: false,
  
  // Check-in
  checkin_features: true,
};

// ============================================
// SUPER ADMIN PERMISSIONS
// Super Admin heeft toegang tot ALLES
// ============================================
export const SUPER_ADMIN_FEATURES = {
  all_access: true, // Override voor alle features
  super_admin_panel: true,
  manage_companies: true,
  manage_all_users: true,
  view_all_data: true,
  system_settings: true,
  billing_management: true,
  feature_flags: true,
  error_logs: true,
};

// ============================================
// TIER LIMITS
// ============================================
export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.STARTER_TRIAL]: {
    max_users: 2,
    max_projects_per_month: 10,
    max_materials: 50,
    max_storage_gb: 1,
  },
  
  [SUBSCRIPTION_TIERS.STARTER]: {
    max_users: 2,
    max_projects_per_month: 10,
    max_materials: 50,
    max_storage_gb: 5,
  },
  
  [SUBSCRIPTION_TIERS.PROFESSIONAL]: {
    max_users: 5,
    max_projects_per_month: 30,
    max_materials: 150,
    max_storage_gb: 25,
  },
  
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    max_users: 100,
    max_projects_per_month: -1, // Onbeperkt
    max_materials: -1, // Onbeperkt
    max_storage_gb: -1, // Onbeperkt
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get features for a specific tier
 */
export function getTierFeatures(tier) {
  return TIER_FEATURES[tier] || TIER_FEATURES[SUBSCRIPTION_TIERS.STARTER];
}

/**
 * Get limits for a specific tier
 */
export function getTierLimits(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS[SUBSCRIPTION_TIERS.STARTER];
}

/**
 * Get tier config
 */
export function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG[SUBSCRIPTION_TIERS.STARTER];
}

/**
 * Check if user has access to a feature based on role and tier
 * @param {string} userRole - User's role
 * @param {string} subscriptionTier - Company's subscription tier
 * @param {string} featureKey - Feature to check
 * @param {object} companyData - Optional company data with subscription_status
 */
export function hasFeatureAccess(userRole, subscriptionTier, featureKey, companyData = null) {
  // Super Admin heeft altijd toegang
  if (userRole === USER_ROLES.SUPER_ADMIN) {
    return true;
  }
  
  // Check subscription status - expired/past_due companies have limited access
  if (companyData?.subscription_status) {
    const status = companyData.subscription_status;
    
    // Expired companies can only access subscription page
    if (status === 'expired') {
      if (featureKey === 'page_subscription') {
        return true; // Allow access to subscription page to upgrade
      }
      return false; // Block all other features
    }
    
    // Past due companies have grace period (handled in Layout.jsx)
    // But still allow basic access during grace period
    if (status === 'past_due') {
      const paymentFailedAt = companyData.payment_failed_at ? new Date(companyData.payment_failed_at) : null;
      if (paymentFailedAt) {
        const gracePeriodEnd = new Date(paymentFailedAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        const now = new Date();
        
        // If grace period expired, treat as expired
        if (now > gracePeriodEnd) {
          if (featureKey === 'page_subscription') {
            return true;
          }
          return false;
        }
        // Still in grace period - allow access but could show warnings
      }
    }
    
    // Canceled companies can only access subscription page
    if (status === 'canceled') {
      if (featureKey === 'page_subscription') {
        return true;
      }
      return false;
    }
  }
  
  // Schilders gebruiken hun eigen feature set
  if (userRole === USER_ROLES.PAINTER) {
    return PAINTER_FEATURES[featureKey] === true;
  }
  
  // Admins en Owners gebruiken tier-based features
  if (userRole === USER_ROLES.ADMIN || userRole === 'owner') {
    const tierFeatures = getTierFeatures(subscriptionTier);
    return tierFeatures[featureKey] === true;
  }
  
  // Default: gebruik tier-based features (voor onbekende rollen)
  const tierFeatures = getTierFeatures(subscriptionTier || SUBSCRIPTION_TIERS.STARTER_TRIAL);
  return tierFeatures[featureKey] === true;
}

/**
 * Check if within limit
 */
export function checkLimit(subscriptionTier, limitKey, currentValue) {
  const limits = getTierLimits(subscriptionTier);
  const limit = limits[limitKey];
  
  // -1 betekent onbeperkt
  if (limit === -1 || limit === undefined) {
    return { allowed: true, limit: -1, remaining: -1 };
  }
  
  const remaining = limit - currentValue;
  return {
    allowed: currentValue < limit,
    limit,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Get user-friendly tier name
 */
export function getTierDisplayName(tier) {
  const config = getTierConfig(tier);
  return config?.displayName || 'Onbekend';
}

/**
 * Check if tier is trial
 */
export function isTrial(tier) {
  return tier === SUBSCRIPTION_TIERS.STARTER_TRIAL;
}

/**
 * Get upgrade suggestions based on current tier
 */
export function getUpgradeSuggestions(currentTier, blockedFeature) {
  const upgradeMap = {
    [SUBSCRIPTION_TIERS.STARTER_TRIAL]: SUBSCRIPTION_TIERS.STARTER,
    [SUBSCRIPTION_TIERS.STARTER]: SUBSCRIPTION_TIERS.PROFESSIONAL,
    [SUBSCRIPTION_TIERS.PROFESSIONAL]: SUBSCRIPTION_TIERS.ENTERPRISE,
    [SUBSCRIPTION_TIERS.ENTERPRISE]: null, // Al op hoogste niveau
  };
  
  const suggestedTier = upgradeMap[currentTier];
  
  if (!suggestedTier) {
    return null;
  }
  
  // Check of de blocked feature beschikbaar is in de suggested tier
  const suggestedFeatures = getTierFeatures(suggestedTier);
  
  if (suggestedFeatures[blockedFeature]) {
    return {
      tier: suggestedTier,
      config: getTierConfig(suggestedTier),
    };
  }
  
  // Als feature niet in suggested tier zit, probeer volgende tier
  const nextTier = upgradeMap[suggestedTier];
  if (nextTier) {
    const nextFeatures = getTierFeatures(nextTier);
    if (nextFeatures[blockedFeature]) {
      return {
        tier: nextTier,
        config: getTierConfig(nextTier),
      };
    }
  }
  
  return {
    tier: suggestedTier,
    config: getTierConfig(suggestedTier),
  };
}

export default {
  USER_ROLES,
  SUBSCRIPTION_TIERS,
  TIER_CONFIG,
  TIER_FEATURES,
  TIER_LIMITS,
  PAINTER_FEATURES,
  SUPER_ADMIN_FEATURES,
  getTierFeatures,
  getTierLimits,
  getTierConfig,
  hasFeatureAccess,
  checkLimit,
  getTierDisplayName,
  isTrial,
  getUpgradeSuggestions,
};

