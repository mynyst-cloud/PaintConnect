import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Company } from '@/api/entities';

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
          const tierId = companyData?.subscription_tier || 'starter';

          // Load tier data
          const { data: tierData } = await supabase
            .from('subscription_tiers')
            .select('*')
            .eq('id', tierId)
            .single();

          setSubscriptionTier(tierData);

          // Load enabled features for this tier
          const { data: tierFeatures } = await supabase
            .from('tier_features')
            .select('feature_key, is_enabled')
            .eq('tier_id', tierId);

          const featuresMap = {};
          (tierFeatures || []).forEach(tf => {
            featuresMap[tf.feature_key] = tf.is_enabled;
          });
          setEnabledFeatures(featuresMap);

          // Load limits for this tier
          const { data: tierLimits } = await supabase
            .from('tier_limits')
            .select('limit_key, limit_value')
            .eq('tier_id', tierId);

          const limitsMap = {};
          (tierLimits || []).forEach(tl => {
            limitsMap[tl.limit_key] = tl.limit_value;
          });
          setLimits(limitsMap);
        }
      } catch (error) {
        console.error('Error loading feature access:', error);
        // Default to allowing everything if there's an error
        setEnabledFeatures({});
        setLimits({});
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if a feature is enabled
  const hasFeature = useCallback((featureKey) => {
    // Super admin always has access
    if (currentUser?.role === 'admin') return true;
    
    // If no features loaded yet, allow access (graceful degradation)
    if (Object.keys(enabledFeatures).length === 0) return true;
    
    return enabledFeatures[featureKey] === true;
  }, [currentUser, enabledFeatures]);

  // Check if within limit
  const checkLimit = useCallback((limitKey, currentValue) => {
    // Super admin has no limits
    if (currentUser?.role === 'admin') return { allowed: true, limit: -1, remaining: -1 };
    
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
    if (currentUser?.role === 'admin') return -1;
    return limits[limitKey] ?? -1;
  }, [currentUser, limits]);

  // Check if user can access a page
  const canAccessPage = useCallback((pageName) => {
    const pageFeatureMap = {
      'Dashboard': 'page_dashboard',
      'Projecten': 'page_projects',
      'Planning': 'page_planning',
      'Materialen': 'page_materials',
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
    };

    const featureKey = pageFeatureMap[pageName];
    if (!featureKey) return true; // Unknown pages are allowed
    
    return hasFeature(featureKey);
  }, [hasFeature]);

  const value = {
    currentUser,
    company,
    subscriptionTier,
    enabledFeatures,
    limits,
    isLoading,
    hasFeature,
    checkLimit,
    getLimit,
    canAccessPage,
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
      hasFeature: () => true,
      checkLimit: () => ({ allowed: true, limit: -1, remaining: -1 }),
      getLimit: () => -1,
      canAccessPage: () => true,
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
// UPGRADE PROMPT COMPONENT
// ============================================
export function UpgradePrompt({ feature, message }) {
  const { subscriptionTier } = useFeatureAccess();
  
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
        {message || `Deze functie is niet beschikbaar in het ${subscriptionTier?.name || 'huidige'} abonnement.`}
      </p>
      <a 
        href="/Subscription" 
        className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
      >
        Bekijk Abonnementen
      </a>
    </div>
  );
}

export default useFeatureAccess;




