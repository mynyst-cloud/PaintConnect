import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Company } from '@/api/entities';
import {
  USER_ROLES,
  SUBSCRIPTION_TIERS,
  TIER_FEATURES,
  TIER_LIMITS,
  PAINTER_FEATURES,
  SUPER_ADMIN_FEATURES,
  getTierFeatures,
  getTierLimits,
  getTierConfig,
  hasFeatureAccess as checkFeatureAccess,
  checkLimit as checkTierLimit,
  isTrial,
  getUpgradeSuggestions,
  SUPER_ADMIN_EMAIL,
  isSuperAdminByEmail,
} from '@/config/roles';

const FeatureAccessContext = createContext(null);

// ============================================
// FEATURE ACCESS PROVIDER
// ============================================
export function FeatureAccessProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const [enabledFeatures, setEnabledFeatures] = useState({});
  const [limits, setLimits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState(null);

  // Load user and company data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (user?.company_id) {
          // Load company
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', user.company_id)
            .single();
          
          setCompany(companyData);

          // Get subscription tier from company
          const tierId = companyData?.subscription_tier || SUBSCRIPTION_TIERS.STARTER_TRIAL;

          // Load tier data from database
          const { data: tierData } = await supabase
            .from('subscription_tiers')
            .select('*')
            .eq('id', tierId)
            .single();

          // Use fallback from config if database doesn't have tier
          const finalTierData = tierData || getTierConfig(tierId);
          setSubscriptionTier(finalTierData);

          // Determine features based on user role
          const userRole = user.company_role || USER_ROLES.PAINTER;
          
          if (userRole === USER_ROLES.SUPER_ADMIN) {
            // Super Admin gets all features
            setEnabledFeatures({ ...SUPER_ADMIN_FEATURES, ...getTierFeatures(SUBSCRIPTION_TIERS.ENTERPRISE) });
            setLimits({ max_users: -1, max_projects_per_month: -1, max_materials: -1, max_storage_gb: -1 });
          } else if (userRole === USER_ROLES.PAINTER) {
            // Painters get limited features regardless of tier
            setEnabledFeatures(PAINTER_FEATURES);
            // Painters don't have limits, they just see assigned content
            setLimits({});
          } else {
            // Admin users - load from database or use config fallback
            const { data: tierFeatures } = await supabase
              .from('tier_features')
              .select('feature_key, is_enabled')
              .eq('tier_id', tierId);

            if (tierFeatures && tierFeatures.length > 0) {
              const featuresMap = {};
              tierFeatures.forEach(tf => {
                featuresMap[tf.feature_key] = tf.is_enabled;
              });
              setEnabledFeatures(featuresMap);
            } else {
              // Fallback to config
              setEnabledFeatures(getTierFeatures(tierId));
            }

            // Load limits from database or config
            const { data: tierLimits } = await supabase
              .from('tier_limits')
              .select('limit_key, limit_value')
              .eq('tier_id', tierId);

            if (tierLimits && tierLimits.length > 0) {
              const limitsMap = {};
              tierLimits.forEach(tl => {
                limitsMap[tl.limit_key] = tl.limit_value;
              });
              setLimits(limitsMap);
            } else {
              // Fallback to config
              setLimits(getTierLimits(tierId));
            }
          }

          // Calculate trial info
          if (tierId === SUBSCRIPTION_TIERS.STARTER_TRIAL && companyData?.trial_ends_at) {
            const trialEndsAt = new Date(companyData.trial_ends_at);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)));
            const isExpired = daysRemaining <= 0;
            
            setTrialInfo({
              isActive: !isExpired,
              isExpired,
              daysRemaining,
              endsAt: trialEndsAt,
            });
          } else {
            setTrialInfo(null);
          }
        }
      } catch (error) {
        console.error('Error loading feature access:', error);
        // Default to starter trial features if there's an error
        setEnabledFeatures(getTierFeatures(SUBSCRIPTION_TIERS.STARTER_TRIAL));
        setLimits(getTierLimits(SUBSCRIPTION_TIERS.STARTER_TRIAL));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if a feature is enabled
  const hasFeature = useCallback((featureKey) => {
    const userRole = currentUser?.company_role || USER_ROLES.PAINTER;
    const tierId = company?.subscription_tier || SUBSCRIPTION_TIERS.STARTER_TRIAL;
    
    console.log('[useFeatureAccess] hasFeature called:', {
      featureKey,
      userEmail: currentUser?.email,
      companyRole: userRole,
      tier: tierId,
      enabledFeaturesCount: Object.keys(enabledFeatures).length
    });
    
    // Super admin always has access - check by email first
    if (isSuperAdminByEmail(currentUser?.email)) {
      console.log('[useFeatureAccess] Super admin by email, returning true');
      return true;
    }
    
    // Super admin check via role
    if (userRole === USER_ROLES.SUPER_ADMIN) {
      console.log('[useFeatureAccess] Super admin by role, returning true');
      return true;
    }
    
    // FIXED: Allow trialing users to access dashboard and other basic features
    // This ensures new registrations can access Dashboard even if enabledFeatures is not loaded yet
    if (company?.subscription_status === 'trialing') {
      // Always allow dashboard access for trialing users (new registrations)
      if (featureKey === 'page_dashboard') {
        console.log('[useFeatureAccess] Trialing user accessing dashboard - allowing');
        return true;
      }
      // For other features, continue with normal checks below
    }
    
    // Check subscription status first (expired/past_due/canceled)
    if (company?.subscription_status) {
      const status = company.subscription_status;
      
      // Expired companies can only access subscription page
      if (status === 'expired') {
        if (featureKey === 'page_subscription') {
          return true;
        }
        return false;
      }
      
      // Past due companies have grace period
      if (status === 'past_due') {
        const paymentFailedAt = company.payment_failed_at ? new Date(company.payment_failed_at) : null;
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
          // Still in grace period - allow access
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
    
    // If no features loaded yet OR specific feature not in enabledFeatures, use config-based check
    if (Object.keys(enabledFeatures).length === 0 || !(featureKey in enabledFeatures)) {
      const result = checkFeatureAccess(userRole, tierId, featureKey, company);
      console.log('[useFeatureAccess] Using config check for', featureKey, ':', result, {
        role: userRole,
        tier: tierId,
        subscription_status: company?.subscription_status
      });
      return result;
    }
    
    const result = enabledFeatures[featureKey] === true;
    console.log('[useFeatureAccess] Feature from enabledFeatures:', featureKey, '=', result);
    return result;
  }, [currentUser, company, enabledFeatures]);

  // Check if within limit
  const checkLimit = useCallback((limitKey, currentValue) => {
    // Super admin has no limits
    if (currentUser?.company_role === USER_ROLES.SUPER_ADMIN) {
      return { allowed: true, limit: -1, remaining: -1 };
    }
    
    // Painters don't manage limits
    if (currentUser?.company_role === USER_ROLES.PAINTER) {
      return { allowed: true, limit: -1, remaining: -1 };
    }
    
    const limit = limits[limitKey];
    
    // -1 means unlimited
    if (limit === -1 || limit === undefined) {
      return { allowed: true, limit: -1, remaining: -1 };
    }
    
    const remaining = limit - currentValue;
    return {
      allowed: currentValue < limit,
      limit,
      remaining: Math.max(0, remaining)
    };
  }, [currentUser, limits]);

  // Get limit value
  const getLimit = useCallback((limitKey) => {
    if (currentUser?.company_role === USER_ROLES.SUPER_ADMIN) return -1;
    if (currentUser?.company_role === USER_ROLES.PAINTER) return -1;
    return limits[limitKey] ?? -1;
  }, [currentUser, limits]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return currentUser?.company_role === USER_ROLES.ADMIN || 
           currentUser?.company_role === USER_ROLES.SUPER_ADMIN;
  }, [currentUser]);

  // Check if user is super admin
  const isSuperAdmin = useCallback(() => {
    // Check by email first (mynysteven@gmail.com)
    if (isSuperAdminByEmail(currentUser?.email)) return true;
    // Then check by role
    return currentUser?.company_role === USER_ROLES.SUPER_ADMIN;
  }, [currentUser]);

  // Check if user is painter (super admins are NEVER treated as painters)
  const isPainter = useCallback(() => {
    // Super admins should never be blocked as painters
    if (isSuperAdminByEmail(currentUser?.email)) return false;
    if (currentUser?.company_role === USER_ROLES.SUPER_ADMIN) return false;
    
    return currentUser?.company_role === USER_ROLES.PAINTER;
  }, [currentUser]);

  // Check if user can access a page
  const canAccessPage = useCallback((pageName) => {
    const pageFeatureMap = {
      'Dashboard': 'page_dashboard',
      'Projecten': 'page_projects',
      'Planning': 'page_planning',
      'Materialen': 'page_materials',
      'MateriaalBeheer': 'page_materiaalbeheer',
      'Beschadigingen': 'page_damages',
      'TeamChat': 'page_teamchat',
      'Analytics': 'page_analytics',
      'Referrals': 'page_referrals',
      'Leads': 'page_leads',
      'Klantportaal': 'page_klantportaal',
      'NaCalculatie': 'page_nacalculatie',
      'VoorraadBeheer': 'page_voorraad',
      'OfferteOpmeting': 'page_offerte',
      'Verfcalculator': 'page_verfcalculator',
      'TeamActiviteit': 'page_team_activiteit',
      'Subscription': 'page_subscription',
      'AccountSettings': 'page_accountsettings',
    };

    const featureKey = pageFeatureMap[pageName];
    if (!featureKey) return true; // Unknown pages are allowed
    
    return hasFeature(featureKey);
  }, [hasFeature]);

  // Get subscription tier ID
  const getTierId = useCallback(() => {
    return company?.subscription_tier || SUBSCRIPTION_TIERS.STARTER_TRIAL;
  }, [company]);

  // Check if on trial
  const isOnTrial = useCallback(() => {
    return getTierId() === SUBSCRIPTION_TIERS.STARTER_TRIAL;
  }, [getTierId]);

  // Get upgrade suggestion for a blocked feature
  const getUpgrade = useCallback((blockedFeature) => {
    const tierId = getTierId();
    return getUpgradeSuggestions(tierId, blockedFeature);
  }, [getTierId]);

  // Can invite more users
  const canInviteMoreUsers = useCallback((currentUserCount) => {
    const result = checkLimit('max_users', currentUserCount);
    return result.allowed;
  }, [checkLimit]);

  // Can add more projects this month
  const canAddMoreProjects = useCallback((currentMonthlyProjectCount) => {
    const result = checkLimit('max_projects_per_month', currentMonthlyProjectCount);
    return result.allowed;
  }, [checkLimit]);

  // Can add more materials
  const canAddMoreMaterials = useCallback((currentMaterialCount) => {
    const result = checkLimit('max_materials', currentMaterialCount);
    return result.allowed;
  }, [checkLimit]);

  const value = {
    // State
    currentUser,
    company,
    subscriptionTier,
    enabledFeatures,
    limits,
    isLoading,
    trialInfo,
    
    // Feature checks
    hasFeature,
    checkLimit,
    getLimit,
    canAccessPage,
    
    // Role checks
    isAdmin,
    isSuperAdmin,
    isPainter,
    
    // Tier helpers
    getTierId,
    isOnTrial,
    getUpgrade,
    
    // Specific limit helpers
    canInviteMoreUsers,
    canAddMoreProjects,
    canAddMoreMaterials,
  };

  return (
    <FeatureAccessContext.Provider value={value}>
      {children}
    </FeatureAccessContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useFeatureAccess() {
  const context = useContext(FeatureAccessContext);
  
  if (!context) {
    // Return safe defaults if not in provider
    return {
      currentUser: null,
      company: null,
      subscriptionTier: null,
      enabledFeatures: {},
      limits: {},
      isLoading: false,
      trialInfo: null,
      hasFeature: () => true,
      checkLimit: () => ({ allowed: true, limit: -1, remaining: -1 }),
      getLimit: () => -1,
      canAccessPage: () => true,
      isAdmin: () => false,
      isSuperAdmin: () => false,
      isPainter: () => true,
      getTierId: () => SUBSCRIPTION_TIERS.STARTER_TRIAL,
      isOnTrial: () => true,
      getUpgrade: () => null,
      canInviteMoreUsers: () => true,
      canAddMoreProjects: () => true,
      canAddMoreMaterials: () => true,
    };
  }
  
  return context;
}

// ============================================
// FEATURE GATE COMPONENT
// ============================================
export function FeatureGate({ feature, children, fallback = null }) {
  const { hasFeature, isLoading } = useFeatureAccess();
  
  if (isLoading) return null;
  
  if (!hasFeature(feature)) {
    return fallback;
  }
  
  return children;
}

// ============================================
// LIMIT GATE COMPONENT
// ============================================
export function LimitGate({ limitKey, currentValue, children, fallback = null }) {
  const { checkLimit, isLoading } = useFeatureAccess();
  
  if (isLoading) return null;
  
  const { allowed } = checkLimit(limitKey, currentValue);
  
  if (!allowed) {
    return fallback;
  }
  
  return children;
}

// ============================================
// ROLE GATE COMPONENT
// ============================================
export function RoleGate({ allowedRoles, children, fallback = null }) {
  const { currentUser, isLoading } = useFeatureAccess();
  
  if (isLoading) return null;
  
  const userRole = currentUser?.company_role;
  
  if (!allowedRoles.includes(userRole)) {
    return fallback;
  }
  
  return children;
}

// ============================================
// ADMIN ONLY COMPONENT
// ============================================
export function AdminOnly({ children, fallback = null }) {
  const { isAdmin, isSuperAdmin, isLoading } = useFeatureAccess();
  
  if (isLoading) return null;
  
  if (!isAdmin() && !isSuperAdmin()) {
    return fallback;
  }
  
  return children;
}

// ============================================
// SUPER ADMIN ONLY COMPONENT
// ============================================
export function SuperAdminOnly({ children, fallback = null }) {
  const { isSuperAdmin, isLoading } = useFeatureAccess();
  
  if (isLoading) return null;
  
  if (!isSuperAdmin()) {
    return fallback;
  }
  
  return children;
}

// ============================================
// TRIAL BANNER COMPONENT - With progress bar
// ============================================
export function TrialBanner() {
  const { trialInfo, isOnTrial } = useFeatureAccess();
  
  if (!isOnTrial() || !trialInfo) return null;
  
  const isUrgent = trialInfo.daysRemaining <= 3;
  const isExpired = trialInfo.isExpired;
  
  // Calculate progress percentage (14 days = 100%, 0 days = 0%)
  const totalDays = 14;
  const progressPercentage = Math.max(0, Math.min(100, (trialInfo.daysRemaining / totalDays) * 100));
  
  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-medium whitespace-nowrap">Je proefperiode is verlopen</span>
            <div className="flex-1 max-w-xs bg-white/20 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-white/60" style={{ width: '0%' }} />
            </div>
          </div>
          <a href="/Subscription" className="text-xs underline font-medium hover:text-white/90 whitespace-nowrap">
            Upgrade nu
          </a>
        </div>
      </div>
    );
  }
  
  // Banner with progress bar
  return (
    <div className={`${
      isUrgent 
        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
        : 'bg-gradient-to-r from-emerald-600 to-teal-600'
    } text-white py-2 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-medium whitespace-nowrap">
            Nog <span className="font-bold">{trialInfo.daysRemaining}</span> {trialInfo.daysRemaining === 1 ? 'dag' : 'dagen'} in je proefperiode
          </span>
          <div className="flex-1 max-w-xs bg-white/20 rounded-full h-1.5 hidden sm:block">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${isUrgent ? 'bg-white' : 'bg-white/80'}`} 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
        </div>
        <a href="/Subscription" className="text-xs underline font-medium hover:text-white/90 whitespace-nowrap">
          Bekijk abonnementen
        </a>
      </div>
    </div>
  );
}

// ============================================
// UPGRADE PROMPT COMPONENT
// ============================================
export function UpgradePrompt({ feature, message }) {
  const { subscriptionTier, getUpgrade } = useFeatureAccess();
  const upgrade = getUpgrade(feature);
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Upgrade Vereist
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {message || `Deze functie is niet beschikbaar in het ${subscriptionTier?.name || subscriptionTier?.display_name || 'huidige'} abonnement.`}
      </p>
      {upgrade && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Beschikbaar vanaf <span className="font-semibold">{upgrade.config.displayName}</span> (€{upgrade.config.price}/maand)
        </p>
      )}
      <a 
        href="/Subscription" 
        className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
      >
        Bekijk Abonnementen
      </a>
    </div>
  );
}

// ============================================
// LIMIT WARNING COMPONENT
// ============================================
export function LimitWarning({ limitKey, currentValue, warningThreshold = 0.8 }) {
  const { checkLimit, getLimit, subscriptionTier } = useFeatureAccess();
  const { limit, remaining } = checkLimit(limitKey, currentValue);
  
  // Unlimited or no limit set
  if (limit === -1) return null;
  
  const usagePercentage = currentValue / limit;
  
  // Not yet at warning threshold
  if (usagePercentage < warningThreshold) return null;
  
  const isAtLimit = remaining === 0;
  
  const limitLabels = {
    max_users: 'gebruikers',
    max_projects_per_month: 'projecten deze maand',
    max_materials: 'materialen',
    max_storage_gb: 'GB opslag',
  };
  
  const label = limitLabels[limitKey] || limitKey;
  
  return (
    <div className={`${isAtLimit ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'} border rounded-lg p-3 text-sm`}>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>
          {isAtLimit ? (
            <>Je hebt het maximum van <strong>{limit} {label}</strong> bereikt.</>
          ) : (
            <>Je hebt nog <strong>{remaining} {label}</strong> over van je limiet van {limit}.</>
          )}
        </span>
      </div>
      <a href="/Subscription" className="text-xs underline mt-1 block">
        Upgrade voor meer capaciteit
      </a>
    </div>
  );
}

export default useFeatureAccess;
