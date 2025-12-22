
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { User, Company, Notification, ChatMessage, GlobalSettings } from "@/api/entities";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/components/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Calendar, Briefcase, Package, AlertTriangle,
  Calculator, MessageCircle, Gift, Users, Building, CreditCard,
  Settings, LogOut, Menu, X, Bell, BarChart3, HelpCircle, Power, Activity,
  ChevronDown, ChevronRight, Eye, XCircle, Crown, Bot, Warehouse, ClipboardList } from
"lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import MobileNavigation from '@/components/ui/MobileNavigation';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import CompanySwitcher from '@/components/layout/CompanySwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';
import DebugPanel from '@/components/debug/DebugPanel';
import { errorTracker } from '@/components/utils/errorTracker';
import TrialExpiredModal from '@/components/modals/TrialExpiredModal';
import GlobalLoader from '@/components/common/GlobalLoader';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import { usePWA } from '@/components/utils/usePWA';
import TeamChatSidebar from '@/components/chat/TeamChatSidebar';
import AISupportWidget from '@/components/support/AISupportWidget';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useFeatureAccess, TrialBanner } from '@/hooks/useFeatureAccess';
import { USER_ROLES, isSuperAdminByEmail } from '@/config/roles';
import UpgradeModal from '@/components/ui/UpgradeModal';
import { Lock } from 'lucide-react';

const paintConnectLogoLightUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
const paintConnectLogoDarkUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png';

const globalFaviconUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png';

const themeStyles = `
html, body {
  max-width: 100%;
  overflow-x: hidden;
}

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border-color: #e2e8f0;
  --card-bg: #ffffff;
  --sidebar-bg: #ffffff;
  --accent-color: #059669;
  --accent-hover: #047857;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.dark {
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --bg-tertiary: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  --border-color: #374151;
  --card-bg: #1f2937;
  --sidebar-bg: #1f2937;
  --accent-color: #10b981;
  --accent-hover: #059669;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.theme-dark {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.theme-light {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.theme-dark .bg-white,
.theme-light .bg-white,
.dark .bg-white {
  background-color: var(--card-bg) !important;
  color: var(--text-primary) !important;
}

.theme-dark .bg-gray-50,
.theme-light .bg-gray-50,
.dark .bg-gray-50 {
  background-color: var(--bg-secondary) !important;
}

.theme-dark .bg-gray-100,
.theme-light .bg-gray-100,
.dark .bg-gray-100 {
  background-color: var(--bg-tertiary) !important;
}

.theme-dark .text-gray-900,
.dark .text-gray-900 {
  color: var(--text-primary) !important;
}

.theme-dark .text-gray-600,
.dark .text-gray-600 {
  color: var(--text-secondary) !important;
}

.theme-dark .text-gray-500,
.dark .text-gray-500 {
  color: var(--text-tertiary) !important;
}

.theme-dark .border-gray-200,
.dark .border-gray-200 {
  border-color: var(--border-color) !important;
}

.theme-dark .bg-emerald-600,
.theme-light .bg-emerald-600,
.dark .bg-emerald-600 {
  background-color: var(--accent-color) !important;
}

.theme-dark .hover\\:bg-emerald-700:hover,
.theme-light .hover\\:bg-emerald-700:hover,
.dark .hover\\:bg-emerald-700:hover {
  background-color: var(--accent-hover) !important;
}

.theme-dark .shadow,
.theme-dark .shadow-sm,
.theme-dark .shadow-md,
.theme-dark .shadow-lg,
.dark .shadow,
.dark .shadow-sm,
.dark .shadow-md,
.dark .shadow-lg {
  box-shadow: var(--shadow) !important;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = themeStyles;
  document.head.appendChild(styleSheet);
}

const Logo = () => {
  const { resolvedTheme } = useTheme();
  const logoUrl = resolvedTheme === 'dark' ? paintConnectLogoDarkUrl : paintConnectLogoLightUrl;

  return (
    <Link to={createPageUrl("Dashboard")} className="flex items-center shrink-0 w-full">
      <img
        src={logoUrl}
        alt="PaintConnect Logo"
        className="h-auto w-full max-w-full object-contain" />
    </Link>);

};

const formatSubscriptionPlan = (company) => {
  if (!company) return null;
  const tier = company.subscription_tier?.toUpperCase() || 'STARTER';
  const status = company.subscription_status;
  if (status === 'trialing') {
    return `TRIAL (${tier})`;
  }
  return tier;
};

function LayoutContent({ children }) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isBeheerExpanded, setIsBeheerExpanded] = useState(true);
  const [isInventarisExpanded, setIsInventarisExpanded] = useState(true);
  const [isCalculatiesExpanded, setIsCalculatiesExpanded] = useState(true);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [showTeamChatSidebar, setShowTeamChatSidebar] = useState(false);
  const previousUnreadCount = useRef(0);
  
  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalProps, setUpgradeModalProps] = useState({ featureName: '', requiredTier: 'professional' });

  usePWA();

  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const paintConnectLogoUrl = resolvedTheme === 'dark' ? paintConnectLogoDarkUrl : paintConnectLogoLightUrl;

  const searchParams = new URLSearchParams(location.search);
  const impersonatedCompanyId = searchParams.get('impersonate_company_id');
  const currentPageName = location.pathname.split('/').filter(Boolean).pop() || 'Dashboard';

  const layoutSkippingPages = useMemo(() => [
  createPageUrl('InviteAcceptance'),
  createPageUrl('VerifyEmail'),
  createPageUrl('RegistratieCompany'),
  createPageUrl('RegistratieSetup'),
  createPageUrl('RegistratieSupplier'),
  createPageUrl('PasswordLogin'),
  createPageUrl('Registreren'),
  createPageUrl('ForgotPassword'),
  createPageUrl('ResetPassword'),
  createPageUrl('ActivateAccount'),
  createPageUrl('ClientPortalEntry')],
  []);

  const publicPagesWithLayout = useMemo(() => [
  createPageUrl('PrivacyPolicy'),
  createPageUrl('TermsOfService')],
  []);

  const alwaysAccessiblePages = useMemo(() => [
  createPageUrl('Subscription'),
  ...publicPagesWithLayout],
  [publicPagesWithLayout]);

  const isNetworkError = useCallback((error) => {
    if (!navigator.onLine) return true;
    if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) return true;
    if (error.message?.includes('NetworkError')) return true;
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ERR_NETWORK') return true;
    return false;
  }, []);

  const isLayoutSkippingPage = layoutSkippingPages.some((page) => location.pathname.startsWith(page));

  const { data: layoutData, isLoading, refetch } = useQuery({
    queryKey: ['layout-data', impersonatedCompanyId, location.pathname],
    queryFn: async () => {
      const currentPath = location.pathname;

      if (isLayoutSkippingPage) {
        return { skipLayout: true };
      }

      try {
        const [user, globalSettingsResponse] = await Promise.all([
        User.me(),
        GlobalSettings.filter({}, '', 1).catch(() => [])]
        );

        const notificationSoundUrl = globalSettingsResponse?.[0]?.notification_sound_url || null;

        const companyId = impersonatedCompanyId || user?.current_company_id || user?.company_id || (
        user?.memberships?.length > 0 ? user.memberships[0].company_id : null);

        let company = null;
        let impersonatedCompany = null;

        if (companyId) {
          company = await Company.get(companyId);
        }

        if (user?.role === 'admin' && impersonatedCompanyId) {
          impersonatedCompany = await Company.get(impersonatedCompanyId);
        }

        const isAdmin = user?.company_role === 'admin' || user?.role === 'admin';

        // Check trial expiration - don't show modal if subscription is active or pending_activation
        let showTrialExpired = false;
        if (company && user?.role !== 'admin' && isAdmin) {
          // Only show trial expired if NOT active and NOT pending_activation
          if (company.subscription_status !== 'active' && company.subscription_status !== 'pending_activation' && (
            (company.subscription_status === 'trialing' && company.trial_ends_at && new Date(company.trial_ends_at) < new Date()) ||
            (company.subscription_status === 'canceled')
          ) && !alwaysAccessiblePages.some((page) => currentPath.startsWith(page))) {
            showTrialExpired = true;
          }
        }

        // Handle special cases
        if (!user.company_id && user.user_type === 'painter_company' && user.company_role === 'admin') {
          const alwaysAllowedPagesForAuthCheck = [
          createPageUrl('RegistratieCompany'),
          createPageUrl('InviteAcceptance'),
          createPageUrl('ActivateAccount'),
          createPageUrl('PrivacyPolicy'),
          createPageUrl('TermsOfService')];


          if (!alwaysAllowedPagesForAuthCheck.some((page) => currentPath.startsWith(page))) {
            navigate(createPageUrl('RegistratieCompany'));
            return { redirect: true };
          }
        }

        return {
          user,
          company,
          impersonatedCompany,
          notificationSoundUrl,
          isAdmin,
          showTrialExpired
        };
      } catch (err) {
        errorTracker.captureError({
          type: 'auth_error',
          message: `Authentication failed: ${err.message}`,
          stack: err.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });

        if (isNetworkError(err)) {
          return { networkError: true };
        }

        const isAuthError = err.response?.status === 401 || err.message?.includes('Unauthorized');
        const isPublicPage = publicPagesWithLayout.some((page) => currentPath.startsWith(page));

        if (!isPublicPage && isAuthError) {
          User.logout();
          User.login();
          return { authRedirect: true };
        }

        throw err;
      }
    },
    staleTime: 1000 * 60 * 2,
    cacheTime: 1000 * 60 * 5,
    enabled: !isLayoutSkippingPage,
    retry: 1
  });

  const user = layoutData?.user;
  const company = layoutData?.company;
  const impersonatedCompany = layoutData?.impersonatedCompany;
  const notificationSoundUrl = layoutData?.notificationSoundUrl;
  const isAdmin = layoutData?.isAdmin || false;

  useEffect(() => {
    if (layoutData?.showTrialExpired) {
      setShowTrialExpiredModal(true);
    }
  }, [layoutData?.showTrialExpired]);

  useEffect(() => {
    if (unreadNotifications > previousUnreadCount.current && notificationSoundUrl) {
      const audio = new Audio(notificationSoundUrl);
      audio.play().catch((error) => {
        console.error('[Layout] Error playing notification sound:', error);
      });
    }
    previousUnreadCount.current = unreadNotifications;
  }, [unreadNotifications, notificationSoundUrl]);

  const upsertMetaByName = (name, content) => {
    if (typeof document === 'undefined') return;
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content || '');
  };

  const upsertMetaByProperty = (property, content) => {
    if (typeof document === 'undefined') return;
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content || '');
  };

  const upsertLinkRel = (rel, href, extras = {}) => {
    if (typeof document === 'undefined') return;
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
    Object.entries(extras).forEach(([k, v]) => link.setAttribute(k, v));
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const appName = 'PaintConnect';
    const url = window.location.href;
    const isSuspended = user?.status === 'suspended';
    const isLoggedIn = !!user;
    const isUserAdmin = user?.company_role === 'admin' || user?.role === 'admin';

    let title = appName;
    if (!isLoggedIn) {
      title = appName;
    } else if (isSuspended) {
      title = `Account gedeactiveerd - ${appName}`;
    } else if (currentPageName) {
      title = `${currentPageName} - ${appName}`;
    }
    document.title = title;

    let description =
    'PaintConnect: professioneel platform voor schildersbedrijven. Beheer projecten, planning en klantcommunicatie.';
    if (!isLoggedIn) {
      description =
      'Log in om je projecten en planning te beheren in PaintConnect.';
    } else if (isSuspended) {
      description =
      'Account gedeactiveerd. Neem contact op met je beheerder of support.';
    } else if (isUserAdmin) {
      description =
      'Professioneel platform voor schildersbedrijven. Beheer projecten, planning, materialen, team en klantportaal.';
    } else {
      description =
      'Bekijk je planning, registreer uren en communiceer met je team en klanten.';
    }

    const imageUrl = company?.logo_url || paintConnectLogoUrl || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
    const faviconUrl = globalFaviconUrl;

    upsertLinkRel('icon', faviconUrl, { type: 'image/png' });
    upsertLinkRel('shortcut icon', faviconUrl, { type: 'image/png' });
    upsertLinkRel('apple-touch-icon', faviconUrl, { sizes: '180x180' });
    upsertMetaByName('msapplication-TileImage', faviconUrl);

    upsertMetaByProperty('og:title', title);
    upsertMetaByProperty('og:description', description);
    upsertMetaByProperty('og:image', imageUrl);
    upsertMetaByProperty('og:url', url);
    upsertMetaByProperty('og:type', 'website');

    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', title);
    upsertMetaByName('twitter:description', description);
    upsertMetaByName('twitter:image', imageUrl);
    upsertMetaByName('twitter:url', url);

    const themeGreenLight = '#10B981';
    const themeGreenDark = '#059669';
    const isDarkMode = resolvedTheme === 'dark';
    upsertMetaByName('theme-color', isDarkMode ? themeGreenDark : themeGreenLight);
    upsertMetaByName('msapplication-TileColor', isDarkMode ? themeGreenDark : themeGreenLight);
  }, [user, company, currentPageName, location.pathname, location.search, resolvedTheme]);

  const loadNotifications = useCallback(async () => {
    if (!user?.email) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    try {
      const notificationsData = await Notification.filter({
        recipient_email: user.email
      }, '-created_date', 50);

      if (!Array.isArray(notificationsData)) {
        setNotifications([]);
        setUnreadNotifications(0);
        return;
      }

      const validNotifications = notificationsData.filter((n) => n && typeof n === 'object' && n.id && n.message);

      const processedNotifications = validNotifications.map((notif) => ({
        ...notif,
        localTimestamp: new Date(notif.created_date || notif.created_at).toLocaleString('nl-NL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

      const unreadCount = processedNotifications.filter((n) => !n.read).length;

      setNotifications(processedNotifications);
      setUnreadNotifications(unreadCount);

    } catch (error) {
      console.error('[Layout] Error loading notifications:', error);
      setNotifications([]);
      setUnreadNotifications(0);
    }
  }, [user?.email]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await Notification.update(notificationId, { read: true });
      if (user) await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        setDebugPanelOpen((prev) => !prev);
      }

      if (event.key === 'Escape' && debugPanelOpen) {
        setDebugPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugPanelOpen]);

  useEffect(() => {
    if (user && !isLoading) {
      loadNotifications();
      const interval = setInterval(() => loadNotifications(), 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadNotifications(0);
    }
  }, [user, isLoading, loadNotifications]);

  const loadUnreadMessages = useCallback(async () => {
    if (!company?.id || !user?.email) {
      setUnreadMessages(0);
      return;
    }

    try {
      const lastViewedTime = sessionStorage.getItem('teamchat_last_viewed');
      const cutoffTime = lastViewedTime ? new Date(lastViewedTime) : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const messages = await ChatMessage.filter({
        company_id: company.id
      }, '-timestamp', 50);

      if (!Array.isArray(messages)) {
        setUnreadMessages(0);
        return;
      }

      const recentMessagesNotByCurrentUser = messages.filter((msg) => {
        const msgDate = new Date(msg.timestamp || msg.created_date);
        return msgDate > cutoffTime && msg.sender_email !== user?.email;
      });

      setUnreadMessages(recentMessagesNotByCurrentUser.length);

    } catch (error) {
      console.error('[Layout] Error loading unread messages:', error);
      setUnreadMessages(0);
    }
  }, [company?.id, user?.email]);

  useEffect(() => {
    if (company && user && !isLoading) {
      loadUnreadMessages();
      const interval = setInterval(() => loadUnreadMessages(), 60000);
      return () => clearInterval(interval);
    } else {
      setUnreadMessages(0);
    }
  }, [company, user, isLoading, loadUnreadMessages]);

  const handleTeamChatClick = useCallback(() => {
    sessionStorage.setItem('teamchat_last_viewed', new Date().toISOString());
    setUnreadMessages(0);
    setShowTeamChatSidebar(true);
  }, []);

  const handleLogout = async () => {
    await User.logout();
    navigate('/login');
  };

  if (isLoading || !layoutData && !isLayoutSkippingPage) {
    return <GlobalLoader />;
  }

  if (layoutData?.skipLayout || layoutData?.redirect || layoutData?.authRedirect || layoutData?.networkError) {
    return <>{children}</>;
  }

  const isPublicPageWithLayout = publicPagesWithLayout.some((page) => location.pathname.startsWith(page));

  if (isLayoutSkippingPage || !user && isPublicPageWithLayout) {
    return <>{children}</>;
  }

  if (showTrialExpiredModal && company) {
    return <TrialExpiredModal companyName={company.name} trialEnd={company.trial_ends_at} />;
  }

  const userCompanyRole = user?.company_role || USER_ROLES.PAINTER;
  const isSuperAdmin = user?.role === 'admin' || isSuperAdminByEmail(user?.email); // Platform super admin
  const isCompanyAdmin = userCompanyRole === USER_ROLES.ADMIN;
  const isPainter = userCompanyRole === USER_ROLES.PAINTER;
  
  // Get subscription tier for feature checks
  const subscriptionTier = company?.subscription_tier || 'starter';
  const isProfessionalOrHigher = ['professional', 'enterprise'].includes(subscriptionTier);
  
  // Helper to check if user has access to a feature
  const hasAccessToFeature = (item) => {
    // Super admin always has access
    if (isSuperAdmin) return true;
    
    // Check role requirement
    if (item.requiredRole === 'admin' && isPainter) return false;
    
    // Check tier requirement
    if (item.requiredTier === 'professional' && !isProfessionalOrHigher) return false;
    if (item.requiredTier === 'enterprise' && subscriptionTier !== 'enterprise') return false;
    
    return true;
  };
  
  // Handle restricted feature click - show upgrade modal
  const handleRestrictedClick = (item) => {
    const featureName = item.name;
    const requiredTier = item.requiredTier || 'professional';
    setUpgradeModalProps({ featureName, requiredTier });
    setShowUpgradeModal(true);
  };

  // Base menu items - available to all users
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: createPageUrl("Dashboard"), feature: 'page_dashboard' },
    { name: "Planning", icon: Calendar, href: createPageUrl("Planning"), feature: 'page_planning' },
    { name: "Projecten", icon: Briefcase, href: createPageUrl("Projecten"), feature: 'page_projects' },
    { name: "Beschadigingen", icon: AlertTriangle, href: createPageUrl("Beschadigingen"), feature: 'page_damages' },
    { name: "Referrals", icon: Gift, href: createPageUrl("Referrals"), feature: 'page_referrals' },
  ];

  // ALL Inventory items - always visible, access controlled via modal
  const inventarisItems = [
    { name: "Materialen", icon: Package, href: createPageUrl("Materialen"), feature: 'page_materials' },
    { name: "MateriaalBeheer", icon: ClipboardList, href: createPageUrl("MateriaalBeheer"), feature: 'page_materiaalbeheer', requiredRole: 'admin' },
    { name: "VoorraadBeheer", icon: Warehouse, href: createPageUrl("VoorraadBeheer"), feature: 'page_voorraad', requiredRole: 'admin', requiredTier: 'professional' },
  ];

  // ALL Calculation items - always visible
  const calculatiesItems = [
    { name: "Verfcalculator", icon: Calculator, href: createPageUrl("Verfcalculator"), feature: 'page_verfcalculator' },
    { name: "NaCalculatie", icon: Calculator, href: createPageUrl("NaCalculatie"), feature: 'page_nacalculatie', requiredRole: 'admin' },
    { name: "Offertes", icon: Briefcase, href: createPageUrl("OfferteLijst"), feature: 'page_offerte', requiredRole: 'admin' },
  ];

  // ALL Management items - always visible, access controlled
  const beheerItems = [
    { name: "Leads", icon: Users, href: createPageUrl("Leads"), feature: 'page_leads', requiredRole: 'admin' },
    { name: "Klantportaal", icon: Building, href: createPageUrl("Klantportaal"), feature: 'page_klantportaal', requiredRole: 'admin', requiredTier: 'professional' },
    { name: "TeamActiviteit", icon: Activity, href: createPageUrl("TeamActiviteit"), feature: 'page_team_activiteit', requiredRole: 'admin' },
    { name: "Subscription", icon: CreditCard, href: createPageUrl("Subscription"), feature: 'page_subscription' },
    { name: "Analytics", icon: BarChart3, href: createPageUrl("Analytics"), feature: 'page_analytics', requiredRole: 'admin', requiredTier: 'professional' },
    { name: "AccountSettings", icon: Settings, href: createPageUrl("AccountSettings"), feature: 'page_accountsettings' },
  ];


  const systeemItems = [
  { name: "FAQ", icon: HelpCircle, href: createPageUrl("FAQ") },
  { name: "Uitloggen", icon: LogOut, onClick: handleLogout }];


  if (user?.role === 'admin') {
    systeemItems.unshift({ name: "Foutenlogboek", icon: AlertTriangle, href: createPageUrl("SuperAdminErrorLog") });
    systeemItems.unshift({ name: "Super Admin", icon: Power, href: createPageUrl("SuperAdmin") });
  }

  const NavLink = ({ item }) => {
    const hasAccess = hasAccessToFeature(item);
    const isActive = currentPageName.toLowerCase() === item.name.toLowerCase().replace(/\s/g, '');
    
    const handleClick = (e) => {
      if (!hasAccess) {
        e.preventDefault();
        handleRestrictedClick(item);
      } else {
        setSidebarOpen(false);
      }
    };
    
    return (
      <Link
        to={hasAccess ? item.href : '#'}
        onClick={handleClick}
        className={`flex items-center px-2 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          !hasAccess 
            ? 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
            : isActive
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <item.icon className={`mr-2 h-4 w-4 ${
          !hasAccess 
            ? 'text-gray-300 dark:text-gray-600' 
            : isActive 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-gray-400 dark:text-gray-500'
        }`} />
        {item.name}
        {!hasAccess && <Lock className="ml-auto h-3 w-3 text-gray-400 dark:text-gray-500" />}
      </Link>
    );
  };

  const ActionButton = ({ item }) =>
  <button
    onClick={item.onClick}
    className="flex items-center w-full px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
      <item.icon className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
      {item.name}
    </button>;

  const stopImpersonation = () => {
    navigate(createPageUrl('SuperAdmin'));
  };

  const formattedDate = format(new Date(), "EEEE d MMMM yyyy", { locale: nl });

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>

        <div className="px-3 h-20 flex items-center border-b border-gray-200 dark:border-gray-700">
          <Logo />
        </div>

        {user && company && <CompanySwitcher currentUser={user} />}

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {company && isAdmin &&
          <Link to={createPageUrl("Subscription")} className="block mb-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all shadow-sm hover:-translate-y-0.5">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight mb-1">
                  {company.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {formatSubscriptionPlan(company)}
                  </span>
                </div>
              </div>
            </Link>
          }

          <h3 className="px-2 text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Menu</h3>
          <div className="space-y-0.5 mb-3">
            {menuItems.map((item) => <NavLink key={item.name} item={item} />)}
            
            {/* Inventaris section - always visible for all users */}
            <div className="mb-1">
                <button
                onClick={() => setIsInventarisExpanded(!isInventarisExpanded)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">Inventaris & Logistiek</span>
                  </div>
                  {isInventarisExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                <AnimatePresence>
                  {isInventarisExpanded &&
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden">
                      <div className="space-y-0.5 mt-0.5 ml-2">
                        {inventarisItems.map((item) => <NavLink key={item.name} item={item} />)}
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>

            {/* Calculaties section - always visible for all users */}
            <div>
                <button
                onClick={() => setIsCalculatiesExpanded(!isCalculatiesExpanded)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center">
                    <Calculator className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">Calculaties</span>
                  </div>
                  {isCalculatiesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                <AnimatePresence>
                  {isCalculatiesExpanded &&
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden">
                      <div className="space-y-0.5 mt-0.5 ml-2">
                        {calculatiesItems.map((item) => <NavLink key={item.name} item={item} />)}
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>
          </div>

          {/* Beheer section - always visible for all users */}
          <div className="mb-3">
              <button
              onClick={() => setIsBeheerExpanded(!isBeheerExpanded)}
              className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider hover:text-orange-700 dark:hover:text-orange-300 transition-colors rounded-lg">
                <span>Beheer</span>
                {isBeheerExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {isBeheerExpanded &&
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden">
                    <div className="space-y-0.5 mt-1">
                      {beheerItems.map((item) => <NavLink key={item.name} item={item} />)}
                    </div>
                  </motion.div>
              }
              </AnimatePresence>
            </div>

          <h3 className="px-2 text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Systeem</h3>
          <div className="space-y-0.5">
            {systeemItems.map((item) => item.href ? <NavLink key={item.name} item={item} /> : <ActionButton key={item.name} item={item} />)}
          </div>
        </nav>

        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Thema</span>
            <ThemeToggle />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden absolute top-4 right-4 text-gray-500 dark:text-gray-400"
          onClick={() => setSidebarOpen(false)}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-col flex-1 overflow-x-hidden">
        {/* Trial Banner */}
        <TrialBanner />
        
        {impersonatedCompany &&
        <div className="bg-indigo-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-4">
            <Eye className="w-5 h-5" />
            <p>U bekijkt de app nu als <strong>{impersonatedCompany.name}</strong>.</p>
            <Button variant="ghost" size="sm" onClick={stopImpersonation} className="text-white hover:bg-indigo-700 hover:text-white">
              <XCircle className="w-4 h-4 mr-2" />
              Stop Weergave
            </Button>
          </div>
        }
        <header className="bg-white px-4 flex items-center justify-between h-20 md:px-8 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1">
            <div className="lg:hidden flex items-center gap-0">
              <Button variant="ghost" size="icon" className="-ml-2 text-gray-600 dark:text-gray-300 p-2" onClick={() => setMobileNavOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>

              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadNotifications}
                onMarkAsRead={handleMarkAsRead}
                onRefresh={() => loadNotifications()} />

              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 dark:text-gray-300 p-2 relative"
                onClick={handleTeamChatClick}>

                <MessageCircle className={`h-6 w-6 ${unreadMessages > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                {unreadMessages > 0 &&
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                }
              </Button>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Welkom, {user?.full_name?.split(' ')[0] || 'Gebruiker'}!</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hier is een overzicht van alle activiteiten.</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{formattedDate}</p>
            
            {/* Team Chat Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleTeamChatClick}
              title="Team Chat"
            >
              <MessageCircle className={`h-5 w-5 ${unreadMessages > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white shadow-lg">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Button>
            
            {/* Notifications */}
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadNotifications}
              onMarkAsRead={handleMarkAsRead}
              onRefresh={() => loadNotifications()} />
            
            {/* User Avatar */}
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <Link to={createPageUrl("Dashboard")}>
              <img src={paintConnectLogoUrl} alt="PaintConnect Logo" className="h-8 w-auto max-w-full" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-4 lg:p-4 bg-gray-50 dark:bg-gray-900">
          {React.cloneElement(children, { impersonatedCompanyId, onOpenTeamChat: handleTeamChatClick, unreadMessages })}
        </main>

        <footer className="relative md:sticky md:bottom-0 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-screen-xl mx-auto px-2 sm:px-4 lg:px-8 py-2">
            <div className="flex md:hidden items-center justify-between">
              <div className="flex flex-col">
                <Link to={createPageUrl("Dashboard")} className="flex-shrink-0">
                  <img src={paintConnectLogoUrl} alt="PaintConnect Logo" className="h-6 w-auto" />
                </Link>
              </div>

              <div className="text-right">
                <div className="flex gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300 mb-1">
                  <Link to={createPageUrl("FAQ")} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQ</Link>
                  <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</Link>
                  <Link to={createPageUrl("TermsOfService")} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Voorwaarden</Link>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} PaintConnect</p>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to={createPageUrl("Dashboard")} className="flex-shrink-0">
                  <img src={paintConnectLogoUrl} alt="PaintConnect Logo" className="h-6 w-auto" />
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} PaintConnect</p>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                <Link to={createPageUrl("PlatformUpdates")} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Updates</Link>
                <Link to={createPageUrl("FAQ")} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">FAQ</Link>
                <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy Policy</Link>
                <Link to={createPageUrl("TermsOfService")} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Algemene Voorwaarden</Link>
                <a href="mailto:support@paintconnect.be" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">support@paintconnect.be</a>
              </div>
            </div>
          </div>
        </footer>

      </div>

      <MobileNavigation
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        currentPageName={currentPageName}
        user={user}
        unreadNotifications={unreadNotifications}
        handleLogout={handleLogout}
        menuItems={menuItems}
        inventarisItems={inventarisItems}
        calculatiesItems={calculatiesItems}
        beheerItems={beheerItems}
        systeemItems={systeemItems}
        company={company}
        paintConnectLogoUrl={paintConnectLogoUrl}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        isCompanyAdmin={isCompanyAdmin}
        isPainter={isPainter}
        hasAccessToFeature={hasAccessToFeature}
        onRestrictedClick={handleRestrictedClick}
        theme={resolvedTheme}
        setTheme={() => {}} />

      {sidebarOpen &&
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={() => setSidebarOpen(false)} />
      }

      <TeamChatSidebar
        isOpen={showTeamChatSidebar}
        onClose={() => setShowTeamChatSidebar(false)}
        currentUser={user}
        company={company} />


      <DebugPanel
        isOpen={debugPanelOpen}
        onClose={() => setDebugPanelOpen(false)} />

      <PWAInstallPrompt />

      {user && <AISupportWidget currentUser={user} />}
      
      {/* Upgrade Modal for restricted features */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeModalProps.featureName}
        requiredTier={upgradeModalProps.requiredTier}
        currentTier={subscriptionTier}
      />
    </div>);

}

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    errorTracker.init();
  }, []);

  return (
    <>
      <style>{`
        .leaflet-container {
            z-index: 1 !important;
        }
        .leaflet-pane,
        .leaflet-tile-pane,
        .leaflet-overlay-pane {
            z-index: 1 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
            z-index: 10 !important;
        }
        [data-project-details-modal] {
            z-index: 1000 !important;
        }

        /* Subtle pulse shine for icons on load */
        .animate-icon-shine svg {
          animation: icon-shine-effect 1.5s ease-out 0.5s backwards;
        }

        @keyframes icon-shine-effect {
          0% {
            filter: brightness(1);
            opacity: 0.8;
          }
          30% {
            filter: brightness(1.5) drop-shadow(0 0 4px rgba(16, 185, 129, 0.5));
            opacity: 1;
          }
          100% {
            filter: brightness(1);
            opacity: 1;
          }
        }
      `}</style>
      
      <ThemeProvider>
        <LayoutContent>{children}</LayoutContent>
      </ThemeProvider>
    </>);

}
