import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from "react";
import { Project, MaterialRequest, Damage, ChatMessage, User, Company, ReferralPoint, DailyUpdate, Notification } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Package, AlertTriangle, Calendar, MessageCircle, ArrowRight, Trophy, Star,
  RefreshCw, LogIn, Plus, Zap, Building, X, Loader2, Clock, Users, BarChart,
  ClipboardList, Crown, Bell, Mic
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl, formatDateTime } from "@/components/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

import { globalCache } from '@/components/utils/performanceOptimizer';
import DashboardProjectCard from "@/components/projects/DashboardProjectCard";
import PlatformUpdates from '@/components/dashboard/PlatformUpdates';
import OnboardingGuide from '@/components/dashboard/OnboardingGuide';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import InviteUserForm from '@/components/admin/InviteUserForm';
import { seedDummyProjects, deleteDummyProjects } from '@/api/functions';
import { notifyAssignedPainters } from '@/api/functions';
import { useRealtimeData } from '@/components/utils/useRealtimeData';
import { sendQuickActionEmail } from '@/api/functions';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/providers/ThemeProvider';
import { debugLog } from '@/utils/debugLog';

const ProjectDetails = lazy(() => import('@/components/projects/ProjectDetails'));
const ProjectForm = lazy(() => import('@/components/planning/PlanningForm'));
const MaterialRequestForm = lazy(() => import('@/components/materials/MaterialRequestForm'));
const DamageForm = lazy(() => import('@/components/damages/DamageForm'));
const QuickUpdateForm = lazy(() => import('@/components/projects/QuickUpdateForm'));
const HoursConfirmationForm = lazy(() => import('@/components/projects/HoursConfirmationForm'));
const MaterialsConfirmationForm = lazy(() => import('@/components/projects/MaterialsConfirmationForm'));

const SuspenseLoader = () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"><LoadingSpinner size="default" /></div>;

import CheckInButton from '@/components/checkin/CheckInButton';
import CheckOutButton from '@/components/checkin/CheckOutButton';
import TeamActivityFeed from '@/components/checkin/TeamActivityFeed';
import PushNotificationPrompt from '@/components/notifications/PushNotificationPrompt';
import { useTeamChat } from '@/contexts/TeamChatContext';

// Helper functie om dummy/demo notificaties te genereren
const generateDummyNotifications = () => {
  const now = new Date();
  return [
    {
      id: 'dummy-material-1',
      message: 'Materiaal aanvraag - Verf wit 10L - Project: Villa Renovatie',
      type: 'material_requested',
      created_date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 uur geleden
      read: false,
      isDummy: true
    },
    {
      id: 'dummy-project-1',
      message: 'Project update - Voortgang: 65% - Penthouse Amsterdam',
      type: 'project_update',
      created_date: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 uur geleden
      read: false,
      isDummy: true
    },
    {
      id: 'dummy-damage-1',
      message: 'Schademelding - Beschadiging gemeld - Boutique Hotel Lobby',
      type: 'damage_reported',
      created_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dag geleden
      read: true,
      isDummy: true
    }
  ];
};

export default function Dashboard() {
  // Get TeamChat props from context instead of props
  const { onOpenTeamChat, unreadMessages, impersonatedCompanyId } = useTeamChat();
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setupComplete = searchParams.get('setupComplete') === 'true';

  const [projects, setProjects] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [damages, setDamages] = useState([]);
  const [referralData, setReferralData] = useState({ pending: 0, topPainters: [], activePeriod: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [company, setCompany] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [statsCardsExpanded, setStatsCardsExpanded] = useState(false);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [showOnboardingChecklist, setShowOnboardingChecklist] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [showHoursForm, setShowHoursForm] = useState(false);
  const [showMaterialsConfirmForm, setShowMaterialsConfirmForm] = useState(false);
  const [selectedProjectForHours, setSelectedProjectForHours] = useState(null);
  const [selectedProjectForMaterials, setSelectedProjectForMaterials] = useState(null);
  const [showHoursProjectSelector, setShowHoursProjectSelector] = useState(false);
  const [showMaterialsProjectSelector, setShowMaterialsProjectSelector] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectDetailsInitialTab, setProjectDetailsInitialTab] = useState(null);
  const [checkInRefreshTrigger, setCheckInRefreshTrigger] = useState(0);
  const [checkOutRefreshTrigger, setCheckOutRefreshTrigger] = useState(0);

  // FIXED: Also include 'owner' role (legacy) - same as isCurrentUserAdmin
  const isAdmin = currentUser?.company_role === 'admin' || currentUser?.company_role === 'owner' || currentUser?.role === 'admin';

  const realProjects = useMemo(() => {
    return Array.isArray(projects) ? projects.filter((p) => p && !p.is_dummy) : [];
  }, [projects]);

  const projectsToDisplay = useMemo(() => {
    if (realProjects.length > 0) return realProjects.slice(0, 4);
    if (isAdmin && Array.isArray(projects)) {
      const dummyProjects = projects.filter(p => p && p.is_dummy);
      return dummyProjects.slice(0, 4);
    }
    return [];
  }, [realProjects, projects, isAdmin]);

  const isLoadingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeSetState = useCallback((setter, value) => {
    if (mountedRef.current) setter(value);
  }, []);

  const openQuestionsCount = useMemo(() => {
    if (!Array.isArray(allMessages) || allMessages.length === 0) return 0;
    let count = 0;
    for (const msg of allMessages) {
      if (msg?.message?.includes('[KLANT VRAAG -') && msg?.type === 'client_message') {
        count++;
      }
    }
    return count;
  }, [allMessages]);

  const trialInfo = useMemo(() => {
    if (!company || company.subscription_status !== 'trialing' || !company.trial_ends_at) return null;
    const now = new Date();
    const trialEnd = new Date(company.trial_ends_at);
    let trialStart = company.trial_started_at ? new Date(company.trial_started_at) : new Date(company.created_date);
    if (isNaN(trialEnd.getTime())) return null;
    if (isNaN(trialStart.getTime()) || trialStart.getTime() > trialEnd.getTime()) {
      trialStart = new Date(trialEnd.getTime() - 14 * 24 * 60 * 60 * 1000);
    }
    const totalDuration = trialEnd.getTime() - trialStart.getTime();
    const remainingTime = trialEnd.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
    let progress = 0;
    if (totalDuration > 0) {
      const elapsedDuration = now.getTime() - trialStart.getTime();
      progress = Math.max(0, Math.min(100, elapsedDuration / totalDuration * 100));
    }
    if (now.getTime() >= trialEnd.getTime()) progress = 100;
    return { remainingDays, progress: Math.floor(progress), isExpiringSoon: remainingDays <= 3 && remainingDays > 0 };
  }, [company]);

  const calculateProgress = useCallback((project) => {
    if (!project || !project.start_date || !project.expected_end_date) return { progress: 0, isOverdue: false };
    const start = new Date(project.start_date);
    const end = new Date(project.expected_end_date);
    const now = new Date();
    if (now < start) return { progress: 0, isOverdue: false };
    const isOverdue = now > end && project.status !== 'afgerond';
    if (now >= end) return { progress: 100, isOverdue };
    const totalDuration = end.getTime() - start.getTime();
    if (totalDuration <= 0) return { progress: 100, isOverdue };
    const elapsedDuration = now.getTime() - start.getTime();
    const progress = Math.min(100, Math.round(elapsedDuration / totalDuration * 100));
    return { progress, isOverdue };
  }, []);

  const dashboardStats = useMemo(() => {
    const safeProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
    const safeMaterialRequests = Array.isArray(materialRequests) ? materialRequests.filter(Boolean) : [];
    const safeDamages = Array.isArray(damages) ? damages.filter(Boolean) : [];
    return {
      activeProjects: safeProjects.filter((p) => p?.status === "in_uitvoering").length,
      openDamages: safeDamages.filter((d) => d?.status === "gemeld").length,
      pendingMaterials: safeMaterialRequests.filter((m) => m?.status === "aangevraagd").length,
      openQuestions: openQuestionsCount,
      newReferrals: referralData.pending
    };
  }, [projects, materialRequests, damages, openQuestionsCount, referralData]);

  const fetchData = useCallback(async (key, fetchFn, ttl = 60000, forceRefresh = false) => {
    let data = globalCache.get(key);
    if (!data || forceRefresh) {
      try {
        data = await fetchFn();
        globalCache.set(key, data, ttl);
      } catch (error) {
        console.warn(`Failed to fetch ${key}:`, error.message);
        data = [];
        globalCache.set(key, data, 30000);
      }
    }
    return data || [];
  }, []);

  const checkOnboardingStatus = useCallback(async (company, currentUser) => {
    // FIXED: Also allow 'owner' role (legacy) - treat it as 'admin'
    const isAdmin = currentUser?.company_role === 'admin' || currentUser?.company_role === 'owner' || currentUser?.role === 'admin';
    
    if (!company || !currentUser || !isAdmin || impersonatedCompanyId) {
      console.log('[checkOnboardingStatus] Skipping check:', {
        hasCompany: !!company,
        hasUser: !!currentUser,
        userRole: currentUser?.company_role,
        isAdmin,
        impersonatedCompanyId
      });
      return;
    }
    
    // FIXED: Add delay to allow database updates to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // FIXED: Fetch latest company data to ensure we have the most up-to-date onboarding_status
      const latestCompany = await Company.get(company.id);
      
      console.log('[checkOnboardingStatus] Starting check:', {
        companyId: latestCompany.id,
        onboarding_status: latestCompany.onboarding_status,
        userId: currentUser.id
      });
      
      if (latestCompany.onboarding_status === 'completed') {
        console.log('[checkOnboardingStatus] Onboarding already completed');
        return;
      }
      
      const usersResult = await base44.functions.invoke('getCompanyUsers', { company_id: latestCompany.id }).catch(() => ({ data: [] }));
      const users = usersResult.data || [];
      // Only count ACTIVE non-admin users as team members (not pending invites)
      const nonAdminUsers = (users || []).filter((u) => 
        u.company_role !== 'admin' && 
        u.company_role !== 'owner' &&
        u.status === 'active' // Must be active, not pending
      );
      const projectsList = await Project.filter({ company_id: latestCompany.id, is_dummy: { '$ne': true } }).catch(() => []);
      const hasTeamMembers = nonAdminUsers.length > 0;
      const hasProjects = (projectsList || []).length > 0;
      
      debugLog({
        location: 'Dashboard.jsx:220',
        message: 'Onboarding status check',
        data: { onboarding_status: latestCompany.onboarding_status, hasTeamMembers, hasProjects, teamMemberCount: nonAdminUsers.length, projectCount: projectsList.length, allUsersCount: users.length },
        runId: 'run1',
        hypothesisId: 'A'
      });
      
      console.log('[checkOnboardingStatus] Status check:', {
        onboarding_status: latestCompany.onboarding_status,
        hasTeamMembers,
        hasProjects,
        teamMemberCount: nonAdminUsers.length,
        projectCount: projectsList.length
      });
      
      // FIXED: Show onboarding guide if not_started and no projects (even if team members exist)
      // Show checklist if skipped and missing either team members or projects
      if ((latestCompany.onboarding_status === 'not_started' || latestCompany.onboarding_status == null) && !hasProjects) {
        debugLog({
          location: 'Dashboard.jsx:234',
          message: 'Showing OnboardingGuide',
          data: { reason: 'not_started_and_no_projects', hasTeamMembers },
          runId: 'run1',
          hypothesisId: 'A'
        });
        console.log('[checkOnboardingStatus] Showing OnboardingGuide (not_started, no projects)');
        setShowOnboardingGuide(true);
      } else if (latestCompany.onboarding_status === 'skipped' && (!hasTeamMembers || !hasProjects)) {
        debugLog({
          location: 'Dashboard.jsx:240',
          message: 'Showing OnboardingChecklist',
          data: { reason: 'skipped_and_missing_items', hasTeamMembers, hasProjects },
          runId: 'run1',
          hypothesisId: 'B'
        });
        console.log('[checkOnboardingStatus] Showing OnboardingChecklist');
        setShowOnboardingChecklist(true);
      } else if (hasTeamMembers && hasProjects && latestCompany.onboarding_status !== 'completed') {
        // Only company admins can update Company entity
        // FIXED: Also allow 'owner' role (legacy)
        const isAdmin = currentUser.company_role === 'admin' || currentUser.company_role === 'owner' || currentUser.role === 'admin';
        if (isAdmin) {
          try {
            await Company.update(latestCompany.id, { onboarding_status: 'completed' });
            console.log('[checkOnboardingStatus] Marked onboarding as completed');
          } catch (updateErr) {
            console.warn('Could not update onboarding status:', updateErr.message);
          }
        }
      }
    } catch (error) {
      console.error('[checkOnboardingStatus] Error checking onboarding status:', error);
    }
  }, [impersonatedCompanyId]);

  const loadNotifications = useCallback(async () => {
    if (!company?.id || !currentUser?.email) return;
    try {
      const notificationsData = await Notification.filter({
        company_id: company.id,
        recipient_email: currentUser.email
      }, '-created_date', 8);
      if (Array.isArray(notificationsData)) {
        safeSetState(setNotifications, notificationsData.filter(Boolean));
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    }
  }, [company?.id, currentUser?.email, safeSetState]);

  useRealtimeData(loadNotifications, 15000);

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    safeSetState(setIsLoading, true);
    safeSetState(setError, null);
    if (forceRefresh) globalCache.clear();

    try {
      let user = globalCache.get('user');
      if (!user || forceRefresh) {
        user = await User.me();
        globalCache.set('user', user, 60000);
      }
      if (!user) throw new Error('auth');
      safeSetState(setCurrentUser, user);

      const getCurrentCompanyIdForUser = (u) => {
        if (u?.current_company_id) return u.current_company_id;
        if (u?.company_id) return u.company_id;
        if (u?.memberships && u.memberships.length > 0) return u.memberships[0].company_id;
        return null;
      };

      const companyId = impersonatedCompanyId || getCurrentCompanyIdForUser(user);
      // FIXED: Also allow 'owner' role (legacy) - treat it as 'admin'
      const isCurrentUserAdmin = user.company_role === 'admin' || user.company_role === 'owner' || user.role === 'admin';

      // FIXED: Check for users without company - redirect to registration
      // If user has no company_id and is not a super admin, they need to register
      if (!companyId) {
        const isSuperAdmin = user.company_role === 'super_admin' || user.role === 'super_admin';
        if (isSuperAdmin) {
          isLoadingRef.current = false;
          if (mountedRef.current) safeSetState(setIsLoading, false);
          return;
        }
        
        // For painters without company, they might be waiting for invite
        if (user.company_role === 'painter') {
          throw new Error('painter_invite_pending');
        }
        
        // For all other users without company (including new Google OAuth users), redirect to registration
        throw new Error('setup');
      }

      const companyPromise = fetchData(`company_${companyId}`, async () => {
        const companyData = await Company.get(companyId);
        
        debugLog({
          location: 'Dashboard.jsx:320',
          message: 'Company data loaded',
          data: { companyId: companyData?.id, subscription_tier: companyData?.subscription_tier, onboarding_status: companyData?.onboarding_status, has_trial_started: !!companyData?.trial_started_at, isCurrentUserAdmin, impersonatedCompanyId },
          runId: 'run1',
          hypothesisId: 'C'
        });
        
        // FIXED: Auto-fix legacy companies with 'free' tier or missing onboarding_status
        if (companyData && isCurrentUserAdmin && !impersonatedCompanyId) {
          const needsUpdate = 
            companyData.subscription_tier === 'free' || 
            !companyData.subscription_tier ||
            (companyData.subscription_tier && companyData.subscription_tier !== 'starter_trial' && companyData.subscription_tier !== 'starter' && companyData.subscription_tier !== 'professional' && companyData.subscription_tier !== 'enterprise') ||
            !companyData.onboarding_status ||
            !companyData.trial_started_at;
          
          debugLog({
            location: 'Dashboard.jsx:330',
            message: 'Checking if company needs update',
            data: { needsUpdate, subscription_tier: companyData.subscription_tier, has_onboarding: !!companyData.onboarding_status, has_trial_started: !!companyData.trial_started_at },
            runId: 'run1',
            hypothesisId: 'C'
          });
          
          if (needsUpdate) {
            console.log('[loadDashboardData] Auto-fixing legacy company:', {
              companyId: companyData.id,
              current_tier: companyData.subscription_tier,
              current_onboarding: companyData.onboarding_status,
              has_trial_started: !!companyData.trial_started_at
            });
            
            try {
              const updateData = {};
              
              // Fix subscription_tier
              if (companyData.subscription_tier === 'free' || !companyData.subscription_tier) {
                updateData.subscription_tier = 'starter_trial';
                updateData.subscription_status = 'trialing';
              }
              
              // Fix onboarding_status
              if (!companyData.onboarding_status) {
                updateData.onboarding_status = 'not_started';
              }
              
              // Fix trial dates if missing
              if (!companyData.trial_started_at) {
                const now = new Date();
                updateData.trial_started_at = now.toISOString();
                if (!companyData.trial_ends_at) {
                  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
                  updateData.trial_ends_at = trialEndsAt.toISOString();
                }
              }
              
              debugLog({
                location: 'Dashboard.jsx:360',
                message: 'Attempting company update',
                data: { updateData, companyId: companyData.id },
                runId: 'run1',
                hypothesisId: 'C'
              });
              
              if (Object.keys(updateData).length > 0) {
                await Company.update(companyData.id, updateData);
                console.log('[loadDashboardData] Company updated:', updateData);
                
                debugLog({
                  location: 'Dashboard.jsx:368',
                  message: 'Company update successful, reloading',
                  data: { updateData },
                  runId: 'run1',
                  hypothesisId: 'C'
                });
                
                // Reload company data to get updated values
                const updatedCompany = await Company.get(companyId);
                
                debugLog({
                  location: 'Dashboard.jsx:375',
                  message: 'Reloaded company data after update',
                  data: { subscription_tier: updatedCompany?.subscription_tier, onboarding_status: updatedCompany?.onboarding_status, has_trial_started: !!updatedCompany?.trial_started_at },
                  runId: 'run1',
                  hypothesisId: 'C'
                });
                
                return updatedCompany;
              }
            } catch (updateError) {
              debugLog({
                location: 'Dashboard.jsx:382',
                message: 'Company update failed',
                data: { error: updateError.message, stack: updateError.stack },
                runId: 'run1',
                hypothesisId: 'C'
              });
              console.warn('[loadDashboardData] Could not auto-fix company:', updateError.message);
            }
          }
        }
        
        return companyData;
      }, 300000, forceRefresh);

      let projectsPromise;
      if (isCurrentUserAdmin || impersonatedCompanyId) {
        projectsPromise = fetchData(`dashboard_projects_${companyId}`, async () => {
          const allProjects = await Project.filter({ company_id: companyId }, '-created_date', 20);
          return (allProjects || []);
        }, 60000, forceRefresh);
      } else {
        projectsPromise = fetchData(`dashboard_painter_assigned_projects_${user.email}`, async () => {
          const assignmentNotifications = await Notification.filter(
            { recipient_email: user.email, type: 'planning_change' }, '-created_date', 20
          );
          const uniqueProjectIds = [];
          const seenProjectIds = new Set();
          for (const notif of assignmentNotifications || []) {
            if (notif.project_id && !seenProjectIds.has(notif.project_id)) {
              uniqueProjectIds.push(notif.project_id);
              seenProjectIds.add(notif.project_id);
            }
            if (uniqueProjectIds.length >= 10) break;
          }
          if (uniqueProjectIds.length === 0) {
            debugLog({
              location: 'Dashboard.jsx:294',
              message: 'Painter fallback query with $contains',
              data: { email: user.email, companyId },
              hypothesisId: 'A'
            });
            // Use $contains for array column (assigned_painters is text[])
            const fallbackProjects = await Project.filter({
              company_id: companyId,
              assigned_painters: { '$contains': [user.email] }
            }, '-created_date', 10);
            debugLog({
              location: 'Dashboard.jsx:301',
              message: 'Painter fallback query result',
              data: { count: fallbackProjects?.length || 0, success: true },
              hypothesisId: 'A'
            });
            return (fallbackProjects || []).filter(p => !p.is_dummy).slice(0, 4);
          }
          const projects = await Project.filter({ id: { '$in': uniqueProjectIds } });
          const projectsById = (projects || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
          const sortedProjects = uniqueProjectIds.map((id) => projectsById[id]).filter(Boolean);
          return sortedProjects.filter(p => !p.is_dummy).slice(0, 4);
        }, 60000, forceRefresh);
      }

      const materialsPromise = fetchData(`dashboard_materials_${companyId}`, () => MaterialRequest.filter({ company_id: companyId }, '-created_date', 5), 60000, forceRefresh);
      const damagesPromise = fetchData(`dashboard_damages_${companyId}`, () => Damage.filter({ company_id: companyId }, '-created_date', 5), 60000, forceRefresh);
      // Only fetch users for admins using backend function to bypass RLS
      let usersPromise = Promise.resolve([]);
      if (isCurrentUserAdmin) {
        usersPromise = fetchData(`company_users_${companyId}`, async () => {
          try {
            const response = await base44.functions.invoke('getCompanyUsers', { company_id: companyId });
            return response.data || [];
          } catch (e) {
            console.warn("Failed to fetch company users:", e.message);
            return [];
          }
        }, 120000, forceRefresh);
      }

      const messagesPromise = fetchData(`messages_${companyId}`, () => ChatMessage.filter({ company_id: companyId }, '-timestamp', 10), 90000, forceRefresh);
        const notificationsPromise = fetchData(`notifications_${companyId}_${user.email}`, () => Notification.filter({
          company_id: companyId,
          recipient_email: user.email
        }, '-created_date', 8), 90000, forceRefresh);
        const referralPointsPromise = fetchData(`referral_points_${companyId}`, () => ReferralPoint.filter({ company_id: companyId }), 120000, forceRefresh);
        const dailyUpdatesPromise = fetchData(`daily_updates_${companyId}`, () => DailyUpdate.filter({ company_id: companyId }), 60000, forceRefresh);

        let [companyDetails, projectsData, materialsData, damagesData, usersData, messagesData, notificationsData, referralPointsData, dailyUpdatesData] = await Promise.all([
          companyPromise, projectsPromise, materialsPromise, damagesPromise, usersPromise, messagesPromise, notificationsPromise, referralPointsPromise, dailyUpdatesPromise
        ]);

      let filteredProjects = projectsData || [];
      try {
        const deletedProjects = JSON.parse(sessionStorage.getItem("deletedProjects") || "[]");
        if (deletedProjects.length > 0) filteredProjects = filteredProjects.filter(p => !deletedProjects.includes(p.id));
      } catch (e) {}

      if (isCurrentUserAdmin && !impersonatedCompanyId) {
        const realProjectCount = filteredProjects.filter(p => !p.is_dummy).length;
        const dummyProjectCount = filteredProjects.filter(p => p.is_dummy).length;
        if (realProjectCount === 0 && dummyProjectCount === 0) {
          try {
            await seedDummyProjects({ companyId });
            const refreshedProjects = await Project.filter({ company_id: companyId }, '-created_date', 20);
            filteredProjects = refreshedProjects || [];
          } catch (seedError) {}
        }
      }

      if (mountedRef.current) {
        safeSetState(setCompany, companyDetails || null);
        safeSetState(setProjects, filteredProjects.filter(Boolean));
        safeSetState(setMaterialRequests, (materialsData || []).filter(Boolean));
        safeSetState(setDamages, (damagesData || []).filter(Boolean));
        safeSetState(setAllUsers, (usersData || []).filter(Boolean));
        safeSetState(setAllMessages, (messagesData || []).filter(Boolean));
        safeSetState(setNotifications, (notificationsData || []).filter(Boolean));
        safeSetState(setDailyUpdates, dailyUpdatesData || []);

        const painterScores = {};
        (referralPointsData || []).filter(Boolean).forEach((point) => {
          if (point?.painter_id && point.painter_name) {
            if (!painterScores[point.painter_id]) {
              painterScores[point.painter_id] = { id: point.painter_id, full_name: point.painter_name, score: 0 };
            }
            painterScores[point.painter_id].score += point.points || 1;
          }
        });

        safeSetState(setReferralData, {
          pending: 0,
          topPainters: Object.values(painterScores).sort((a, b) => b.score - a.score).slice(0, 3)
        });
      }

      if (sessionStorage.getItem("deletedProjects")) sessionStorage.removeItem("deletedProjects");
      
      // FIXED: Always check onboarding status after company data is loaded
      // This ensures onboarding starts even after hard refresh
      if (companyDetails && user && mountedRef.current) {
        console.log('[loadDashboardData] Company loaded, checking onboarding status:', {
          companyId: companyDetails.id,
          onboarding_status: companyDetails.onboarding_status,
          userRole: user.company_role
        });
        await checkOnboardingStatus(companyDetails, user);
      } else {
        console.log('[loadDashboardData] Skipping onboarding check:', {
          hasCompany: !!companyDetails,
          hasUser: !!user,
          mounted: mountedRef.current
        });
      }

    } catch (err) {
      if (mountedRef.current) setError({ type: err.message || 'connection' });
    } finally {
      isLoadingRef.current = false;
      if (mountedRef.current) safeSetState(setIsLoading, false);
    }
  }, [impersonatedCompanyId, safeSetState, fetchData, checkOnboardingStatus]);

  useEffect(() => {
    loadDashboardData(setupComplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // FIXED: Also check onboarding when company or currentUser changes
  // This ensures onboarding starts even if company data loads after initial mount
  useEffect(() => {
    if (company && currentUser && mountedRef.current) {
      console.log('[Dashboard] Company or user changed, re-checking onboarding:', {
        companyId: company.id,
        onboarding_status: company.onboarding_status,
        userRole: currentUser.company_role
      });
      checkOnboardingStatus(company, currentUser);
    }
  }, [company?.id, company?.onboarding_status, currentUser?.id, currentUser?.company_role, checkOnboardingStatus]);

  useEffect(() => {
    const handleUrlParams = async () => {
      const projectId = searchParams.get('openProjectDetails');
      const tab = searchParams.get('tab');
      if (projectId) {
        safeSetState(setIsLoading, true);
        try {
          const projectToOpen = await Project.get(projectId);
          if (projectToOpen) {
            safeSetState(setSelectedProject, projectToOpen);
            safeSetState(setProjectDetailsInitialTab, tab || 'info');
            safeSetState(setShowProjectDetails, true);
            navigate(location.pathname, { replace: true });
          }
        } catch (error) {
          console.error(`Project met ID ${projectId} niet gevonden.`, error);
        } finally {
          safeSetState(setIsLoading, false);
        }
      }
    };
    handleUrlParams();
  }, [location.search, location.pathname, navigate, safeSetState, searchParams]);

  const openDetailsModal = useCallback((project) => {
    safeSetState(setSelectedProject, project);
    safeSetState(setShowProjectDetails, true);
  }, [safeSetState]);

  const handleProjectUpdate = useCallback(() => {
    safeSetState(setShowProjectDetails, false);
    setProjectDetailsInitialTab(null);
    loadDashboardData(true);
  }, [safeSetState, loadDashboardData]);

  const handleOpenFormForEdit = (project) => {
    setEditingProject(project);
    setShowProjectForm(true);
    setShowProjectDetails(false);
  };

  const handleProjectFormSubmit = useCallback(async (projectData) => {
    const companyId = impersonatedCompanyId || currentUser?.company_id;
    if (!projectData || !companyId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const dataWithCompany = { ...projectData, company_id: companyId };
      let oldPainterEmails = [];
      let projectIdToNotify;
      const isNewProject = !editingProject;
      
      if (editingProject) {
        projectIdToNotify = editingProject.id;
        const originalProject = await Project.get(editingProject.id);
        oldPainterEmails = originalProject.assigned_painters || [];
        await Project.update(editingProject.id, dataWithCompany);
      } else {
        const newProject = await Project.create(dataWithCompany);
        projectIdToNotify = newProject.id;
        
        // Delete dummy projects when first real project is created
        try {
          await deleteDummyProjects({ companyId });
          console.log('[Dashboard] Deleted dummy projects after first real project creation');
        } catch (dummyError) {
          console.warn('[Dashboard] Could not delete dummy projects:', dummyError);
        }
      }
      const newPainterEmails = dataWithCompany.assigned_painters || [];
      const newlyAssignedEmails = newPainterEmails.filter((email) => !oldPainterEmails.includes(email));
      if (newlyAssignedEmails.length > 0 && projectIdToNotify) {
        try {
          await notifyAssignedPainters({ projectId: projectIdToNotify, projectName: dataWithCompany.project_name, newlyAssignedEmails });
        } catch {}
      }
      globalCache.clear();
      setShowProjectForm(false);
      setEditingProject(null);
      await loadDashboardData(true);
    } catch (err) {
      setError(`Kon project niet opslaan: ${err.message || 'Onbekende fout'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, loadDashboardData, editingProject, impersonatedCompanyId]);

  const handleFormSubmit = useCallback(async (formType, data) => {
    const getCurrentCompanyIdForUser = (u) => u?.current_company_id || u?.company_id || (u?.memberships?.length > 0 ? u.memberships[0].company_id : null);
    const activeCompanyId = impersonatedCompanyId || getCurrentCompanyIdForUser(currentUser);
    if (!activeCompanyId || !mountedRef.current) return;
    try {
      if (formType === 'quickUpdate') {
        if (mountedRef.current) {
          setShowQuickUpdate(false);
          globalCache.clear();
          await loadDashboardData(true);
        }
        return;
      }
      const commonData = { company_id: activeCompanyId, requested_by: currentUser.full_name || currentUser.email };
      if (formType === 'material') {
        const newRequest = await MaterialRequest.create({ ...data, ...commonData });
        try {
          if (currentUser && company) {
            await sendQuickActionEmail({
              actionType: 'material_request_created', userEmail: currentUser.email, userName: currentUser.full_name,
              companyId: activeCompanyId, companyName: company.name, projectId: newRequest.project_id, projectName: data.project_name,
              details: { materialName: newRequest.material_name, quantity: newRequest.quantity, unit: newRequest.unit, notes: newRequest.notes }
            });
          }
        } catch {}
      }
      if (mountedRef.current) {
        setShowMaterialForm(false);
        setShowDamageForm(false);
        globalCache.clear();
        await loadDashboardData(true);
      }
    } catch (error) {
      console.error(`Error submitting ${formType}:`, error);
    }
  }, [currentUser, loadDashboardData, impersonatedCompanyId, company]);

  const handleQuickUpdateClick = useCallback(() => safeSetState(setShowQuickUpdate, true), [safeSetState]);
  const handleQuickHours = useCallback(() => {
    if (!mountedRef.current || !realProjects?.length) return;
    if (realProjects.length === 1) {
      safeSetState(setSelectedProjectForHours, realProjects[0]);
      safeSetState(setShowHoursForm, true);
    } else {
      safeSetState(setShowHoursProjectSelector, true);
    }
  }, [realProjects, safeSetState]);

  const handleQuickMaterials = useCallback(() => {
    if (!mountedRef.current || !realProjects?.length) return;
    if (realProjects.length === 1) {
      safeSetState(setSelectedProjectForMaterials, realProjects[0]);
      safeSetState(setShowMaterialsConfirmForm, true);
    } else {
      safeSetState(setShowMaterialsProjectSelector, true);
    }
  }, [realProjects, safeSetState]);

  const handleStartInviteTeam = useCallback(() => { setShowOnboardingGuide(false); setShowInviteForm(true); }, []);
  const handleStartProject = useCallback(() => { setShowOnboardingGuide(false); setShowProjectForm(true); }, []);
  const handleOnboardingComplete = useCallback(() => { setShowOnboardingGuide(false); setShowOnboardingChecklist(false); loadDashboardData(true); }, [loadDashboardData]);
  const handleOnboardingSkip = useCallback(() => { setShowOnboardingGuide(false); setShowOnboardingChecklist(true); }, []);
  const handleInviteSuccess = useCallback(() => { setShowInviteForm(false); if (showOnboardingChecklist) loadDashboardData(true); }, [showOnboardingChecklist, loadDashboardData]);

  if (isLoading && !currentUser) {
    return <div className="p-6"><LoadingSpinner size="default" /></div>;
  }

  if (error) {
    const ErrorCard = ({ icon: Icon, title, message, buttonText, onAction, actionLink }) => (
      <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          {actionLink ? (
            <Link to={createPageUrl(actionLink)}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 w-full"><Plus className="w-4 h-4 mr-2" />{buttonText}</Button>
            </Link>
          ) : (
            <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700 w-full">{buttonText}</Button>
          )}
        </div>
      </div>
    );

    if (error.type === 'auth') return <ErrorCard icon={LogIn} title="Inloggen Vereist" message="U moet ingelogd zijn om toegang te krijgen." buttonText="Inloggen met Google" onAction={User.login} />;
    if (error.type === 'no_company_association' || error.type === 'setup') return <ErrorCard icon={Building} title="Account Setup Vereist" message="Je account is nog niet volledig gekoppeld aan je bedrijf. Voltooi de bedrijfsregistratie om verder te gaan." buttonText="Bedrijf Registreren" actionLink={"RegistratieCompany"} />;
    if (error.type === 'painter_invite_pending') return <ErrorCard icon={Users} title="Account wordt geactiveerd" message="Uw uitnodiging wordt verwerkt. Als u deze pagina net heeft bezocht na het accepteren van een uitnodiging, probeer dan de pagina te verversen." buttonText="Pagina Verversen" onAction={() => window.location.reload()} />;
    return <ErrorCard icon={AlertTriangle} title="Verbindingsfout" message="Er is een probleem met de verbinding. Controleer uw internet of probeer het later opnieuw." buttonText="Opnieuw Proberen" onAction={() => loadDashboardData(true)} />;
  }

  const formattedDate = format(new Date(), "EEEE d MMMM yyyy", { locale: nl });
  const assignedProjectCount = realProjects.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 pb-4 sm:pt-3 sm:pb-6 lg:pt-2 lg:pb-8">
        
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-row justify-between items-start gap-4">
            <div className="flex-grow">
              {/* Mobile: show title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white md:hidden">Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 md:hidden">
                Welkom terug, {currentUser?.full_name?.split(' ')[0] || 'Gebruiker'}!
              </p>

              {/* Desktop: show icons instead with animation */}
              <motion.div 
                className="hidden md:flex items-center gap-3 animate-icon-shine"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {isAdmin && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowProjectForm(true)}
                          className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative ${
                            realProjects.length === 0 ? 'animate-pulse' : ''
                          }`}
                        >
                          <Plus className={`w-5 h-5 ${realProjects.length === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`} />
                          {realProjects.length === 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      {realProjects.length === 0 ? (
                        <TooltipContent 
                          side="bottom" 
                          className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm px-4 py-3 shadow-xl border-0 max-w-xs animate-in zoom-in-95"
                          sideOffset={8}
                        >
                          <p className="font-bold text-base">🚀 Voeg je eerste project toe!</p>
                          <p className="text-xs font-normal mt-1.5 opacity-95">Klik hier om te beginnen met je eerste schilderproject</p>
                        </TooltipContent>
                      ) : (
                        <TooltipContent side="bottom" className="text-xs">
                          Nieuw Project
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}

                <Link 
                  to={createPageUrl("Planning")} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" 
                  title="Planning"
                >
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </Link>

                {onOpenTeamChat && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onOpenTeamChat} 
                    className="relative p-2" 
                    title="TeamChat"
                  >
                    <MessageCircle className={`w-5 h-5 ${unreadMessages > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`} />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Button>
                )}

                {isAdmin && <div className="flex items-center"><TeamActivityFeed isCompactIcon={true} /></div>}

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setStatsCardsExpanded(!statsCardsExpanded)} 
                  className="p-2" 
                  title={statsCardsExpanded ? "Statistieken verbergen" : "Statistieken tonen"}
                >
                  <BarChart className={`w-5 h-5 ${statsCardsExpanded ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`} />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => loadDashboardData(true)} 
                  disabled={isLoading}
                  className="p-2"
                  title="Verversen"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>

              {impersonatedCompanyId && isAdmin && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  Bekijkt als: {company?.name || 'Onbekend Bedrijf'}
                </p>
              )}
              {setupComplete && (
                <div className="mt-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✅ Account succesvol geactiveerd - 14 dagen gratis trial gestart!
                  </Badge>
                </div>
              )}

              {/* Trial info is now shown in the TrialBanner component under the header */}
              
              {/* Push Notification Prompt */}
              <div className="mt-3">
                <PushNotificationPrompt currentUser={currentUser} />
              </div>
            </div>

            {currentUser && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <CheckInButton 
                  currentUser={currentUser} 
                  refreshTrigger={checkInRefreshTrigger}
                  onCheckInSuccess={(record) => {
                    debugLog({
                      location: 'Dashboard.jsx:onCheckInSuccess',
                      message: 'onCheckInSuccess callback called, triggering CheckOutButton refresh',
                      data: { hasRecord: !!record, currentCheckOutTrigger: checkOutRefreshTrigger },
                      hypothesisId: 'C'
                    });
                    // Trigger CheckOutButton to refresh its state
                    setCheckOutRefreshTrigger(prev => prev + 1);
                    loadDashboardData(true);
                  }} 
                />
                <CheckOutButton 
                  currentUser={currentUser}
                  refreshTrigger={checkOutRefreshTrigger}
                  onCheckOutSuccess={(record) => {
                    debugLog({
                      location: 'Dashboard.jsx:onCheckOutSuccess',
                      message: 'onCheckOutSuccess callback called',
                      data: { hasRecord: !!record },
                      hypothesisId: 'C'
                    });
                    loadDashboardData(true);
                  }}
                  onCheckOutComplete={() => {
                    debugLog({
                      location: 'Dashboard.jsx:onCheckOutComplete',
                      message: 'onCheckOutComplete called, triggering CheckInButton refresh',
                      data: { currentTrigger: checkInRefreshTrigger },
                      hypothesisId: 'E'
                    });
                    setCheckInRefreshTrigger(prev => prev + 1);
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile only: date and icons row */}
          <div className="flex items-center justify-between mt-2 md:hidden">
            <Link to={createPageUrl("Planning")} className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{formattedDate}</span>
            </Link>

            <div className="flex items-center gap-2">
              {onOpenTeamChat && (
                <Button variant="ghost" size="icon" onClick={onOpenTeamChat} className="w-6 h-6 relative" title="TeamChat openen">
                  <MessageCircle className={`w-4 h-4 ${unreadMessages > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'} transition-colors`} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Button>
              )}
              {isAdmin && <TeamActivityFeed isCompactIcon={true} />}
              <Button variant="ghost" size="icon" onClick={() => setStatsCardsExpanded(!statsCardsExpanded)} className="w-6 h-6" title={statsCardsExpanded ? "Statistieken verbergen" : "Statistieken tonen"}>
                <BarChart className={`w-4 h-4 ${statsCardsExpanded ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'} transition-colors`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => loadDashboardData(true)} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {showOnboardingChecklist && company && (
          <div className="mb-4">
            <OnboardingChecklist companyId={company.id} onInviteTeam={handleStartInviteTeam} onCreateProject={handleStartProject} onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
          </div>
        )}

        <AnimatePresence>
          {statsCardsExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 md:gap-2">
                {[
                  { label: 'Actieve Projecten', value: dashboardStats.activeProjects, icon: Briefcase, color: 'bg-teal-500', link: "Projecten?status=in_uitvoering" },
                  { label: 'Open Beschadigingen', value: dashboardStats.openDamages, icon: AlertTriangle, color: 'bg-red-500', link: "Beschadigingen?status=gemeld" },
                  { label: 'Materiaal Aanvragen', value: dashboardStats.pendingMaterials, icon: Package, color: 'bg-orange-500', link: "Materialen?status=aangevraagd" },
                  { label: 'Open Klantvragen', value: dashboardStats.openQuestions, icon: MessageCircle, color: 'bg-blue-500', link: "TeamChat" },
                  { label: 'Nieuwe Referrals', value: referralData.pending, icon: Star, color: 'bg-amber-500', link: "Referrals?status=pending" }
                ].map((stat) => (
                  <Link to={createPageUrl(stat.link)} key={stat.label}>
                    <Card className={`${stat.color} text-white shadow-sm hover:shadow-md transition-all h-full`}>
                      <CardContent className="p-2 md:p-3">
                        <div className="flex items-center justify-between mb-0.5">
                          <stat.icon className="w-4 h-4 md:w-5 md:h-5 opacity-80 flex-shrink-0" />
                          <p className="text-xl md:text-2xl lg:text-3xl font-bold">{stat.value}</p>
                        </div>
                        <p className="text-[10px] md:text-xs opacity-90 leading-tight font-medium line-clamp-2">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="order-1 lg:order-2">
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-sm">
              <CardHeader className="p-2 lg:p-3 pb-1 lg:pb-2">
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-semibold">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5" />Snelle Acties
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 pt-0">
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { label: "Meld Beschadiging", icon: AlertTriangle, action: () => setShowDamageForm(true), show: true, badge: "schilder" },
                    { label: "Vraag Materiaal Aan", icon: Package, action: () => setShowMaterialForm(true), show: true, badge: "schilder" },
                    { label: "Project Update", icon: BarChart, action: handleQuickUpdateClick, show: true, badge: "schilder" },
                    { label: "Project toevoegen", icon: Plus, action: () => setShowProjectForm(true), show: isAdmin, badge: "admin" },
                    { label: "Materialen toevoegen", icon: Package, action: () => navigate(createPageUrl('MateriaalBeheer')), show: isAdmin, badge: "admin" },
                    { label: "🎙️ Offerte Agent", icon: Mic, action: () => navigate(createPageUrl('OfferteOpmeting')), show: currentUser?.role === 'admin' }
                  ].filter(item => item.show).map((item, index) => (
                    <Button key={index} variant="ghost" className="bg-white/10 hover:bg-white/20 p-2 h-auto justify-start text-left w-full" onClick={item.action}>
                      <item.icon className="w-4 h-4 text-emerald-200 mr-2 flex-shrink-0" />
                      <span className="font-medium text-xs flex items-center gap-2">
                        {item.label}
                        {item.badge && (
                          <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[9px] px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="order-2 lg:order-1 lg:col-span-2 lg:row-span-3">
            <Card className="bg-white dark:bg-slate-800 shadow-sm h-full">
              <CardHeader className="flex flex-row justify-between items-center p-2 lg:p-3 pb-1 lg:pb-2">
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-semibold text-gray-900 dark:text-slate-100">
                  <ClipboardList className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" />
                  Recente Projecten
                </CardTitle>
                <Link to={createPageUrl("Projecten")} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                  Alle projecten <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 pt-0">
                {projectsToDisplay?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                    {projectsToDisplay.map((project) => (
                      <div key={project.id}><DashboardProjectCard project={project} calculateProgress={calculateProgress} onViewDetails={openDetailsModal} /></div>
                    ))}
                    {/* Placeholders voor lege slots (max 4 projecten totaal) */}
                    {Array.from({ length: Math.max(0, 4 - projectsToDisplay.length) }).map((_, index) => {
                      const placeholderLogoLight = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
                      const placeholderLogoDark = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png';
                      const placeholderLogo = resolvedTheme === 'dark' ? placeholderLogoDark : placeholderLogoLight;
                      
                      return (
                        <div 
                          key={`placeholder-${index}`} 
                          className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 flex items-center justify-center shadow-md"
                        >
                          <img 
                            src={placeholderLogo} 
                            alt="PaintConnect" 
                            className="w-1/3 h-1/3 max-w-24 max-h-24 object-contain opacity-60"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-500">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png" alt="PaintConnect" className="w-20 h-20 mx-auto mb-3 object-contain opacity-30" />
                    {isAdmin ? (
                      <>
                        <p className="text-sm lg:text-base font-medium">Nog geen projecten aangemaakt</p>
                        <p className="text-xs">Start met het toevoegen van uw eerste project</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm lg:text-base font-medium">
                          Je bent toegewezen aan {assignedProjectCount} {assignedProjectCount === 1 ? 'project' : 'projecten'}
                        </p>
                        <p className="text-xs mt-1">Check de Planning pagina voor meer details</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="order-3 lg:order-3">
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center p-2 lg:p-3 pb-1 lg:pb-2">
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-semibold">
                  <Bell className="w-4 h-4 lg:w-5 lg:h-5" />Meldingen
                </CardTitle>
                <Link to={createPageUrl("Notificaties")} className="text-xs font-medium text-white/90 hover:text-white">Alles <ArrowRight className="w-3 h-3 inline" /></Link>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 pt-0">
                {(() => {
                  const realNotifications = (notifications || []).filter(n => !n.isDummy);
                  const hasRealNotifications = realNotifications.length > 0;
                  const displayNotifications = hasRealNotifications ? realNotifications : generateDummyNotifications();
                  
                  return displayNotifications?.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {displayNotifications.slice(0, 3).map((notification) => (
                        <motion.div key={notification.id} className={`flex items-start gap-2 p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 ${notification.isDummy ? 'opacity-75' : ''}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!notification.read && !notification.isDummy ? 'bg-yellow-300' : notification.isDummy ? 'bg-amber-300' : 'bg-white/30'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className={`text-xs line-clamp-2 ${!notification.read && !notification.isDummy ? 'font-medium' : 'font-normal'} text-white flex-1`}>{notification.message}</p>
                              {notification.isDummy && (
                                <span className="text-[9px] bg-amber-500/80 text-white px-1.5 py-0.5 rounded font-semibold flex-shrink-0">DEMO</span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/75 mt-0.5">{formatDateTime(notification.created_date)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-white/70">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-white/50" />
                      <p className="font-medium text-sm">Geen nieuwe meldingen</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          <div className="order-4 lg:order-4">
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center p-2 lg:p-3 pb-1 lg:pb-2">
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-semibold">
                  <Trophy className="w-4 h-4 lg:w-5 lg:h-5" />
                  Referral Race
                </CardTitle>
                <Link to={createPageUrl("Referrals")} className="text-xs font-medium text-white/90 hover:text-white">
                  Volledig <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 pt-0">
                <div className="text-center py-4">
                  <Trophy className="w-12 h-12 mx-auto mb-2 text-white/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-4 order-5"><PlatformUpdates /></div>

        {showOnboardingGuide && company && <OnboardingGuide companyName={company.name} companyId={company.id} onStartInviteTeam={handleStartInviteTeam} onStartProject={handleStartProject} onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />}
        {showInviteForm && company && <InviteUserForm companyId={company.id} onInviteSuccess={handleInviteSuccess} onCancel={() => setShowInviteForm(false)} />}

        <AnimatePresence>
          <Suspense fallback={<LoadingSpinner />}>
            {showMaterialForm && <MaterialRequestForm request={null} projects={realProjects} onSubmit={(data) => handleFormSubmit('material', data)} onCancel={() => setShowMaterialForm(false)} />}
            {showDamageForm && <DamageForm damage={null} projects={realProjects} currentUser={currentUser} onSubmit={(data) => handleFormSubmit('damage', data)} onClose={() => setShowDamageForm(false)} />}
            {showQuickUpdate && <QuickUpdateForm projects={realProjects} currentUser={currentUser} onSubmit={(data) => handleFormSubmit('quickUpdate', data)} onCancel={() => setShowQuickUpdate(false)} />}
            {showHoursProjectSelector && (
              <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowHoursProjectSelector(false)}>
                <motion.div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Selecteer Project voor Uren</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowHoursProjectSelector(false)} className="text-gray-500 dark:text-slate-400"><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    {projects.filter(Boolean).map((project) => (
                      <Button key={project.id} variant="outline" className="w-full justify-start text-left h-auto p-3" onClick={() => { setSelectedProjectForHours(project); setShowHoursProjectSelector(false); setShowHoursForm(true); }} type="button">
                        <div>
                          <div className="font-semibold">{project.project_name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{project.client_name}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
            {showHoursForm && selectedProjectForHours && (
              <HoursConfirmationForm
                project={selectedProjectForHours} currentUser={currentUser}
                onSubmit={async (hoursData) => {
                  try {
                    if (currentUser && company && selectedProjectForHours) {
                      await sendQuickActionEmail({
                        actionType: 'hours_confirmed', userEmail: currentUser.email, userName: currentUser.full_name,
                        companyId: company.id, companyName: company.name, projectId: selectedProjectForHours.id,
                        projectName: selectedProjectForHours.project_name, details: { hours: hoursData.hours, description: hoursData.description, date: hoursData.date }
                      });
                    }
                  } catch {}
                  loadDashboardData(true); setShowHoursForm(false); setSelectedProjectForHours(null);
                }}
                onClose={() => { setShowHoursForm(false); setSelectedProjectForHours(null); }}
              />
            )}
            {showMaterialsProjectSelector && (
              <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMaterialsProjectSelector(false)}>
                <motion.div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Selecteer Project voor Materialen</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowMaterialsProjectSelector(false)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    {projects.filter(Boolean).map((project) => (
                      <Button key={project.id} variant="outline" className="w-full justify-start text-left h-auto p-3" onClick={() => { setSelectedProjectForMaterials(project); setShowMaterialsProjectSelector(false); setShowMaterialsConfirmForm(true); }} type="button">
                        <div>
                          <div className="font-semibold">{project.project_name}</div>
                          <div className="text-sm text-gray-500">{project.client_name}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
            {showMaterialsConfirmForm && selectedProjectForMaterials && (
              <MaterialsConfirmationForm
                project={selectedProjectForMaterials} currentUser={currentUser}
                onSubmit={async (materialsData) => {
                  try {
                    if (currentUser && company && selectedProjectForMaterials && materialsData) {
                      await sendQuickActionEmail({
                        actionType: 'materials_confirmed', userEmail: currentUser.email, userName: currentUser.full_name,
                        companyId: company.id, companyName: company.name, projectId: selectedProjectForMaterials.id,
                        projectName: selectedProjectForMaterials.project_name, details: { items: materialsData.items, summary: materialsData.summary }
                      });
                    }
                  } catch {}
                  loadDashboardData(true); setShowMaterialsConfirmForm(false); setSelectedProjectForMaterials(null);
                }}
                onClose={() => { setShowMaterialsConfirmForm(false); setSelectedProjectForMaterials(null); }}
              />
            )}
            {showProjectDetails && selectedProject && (
              <ProjectDetails project={selectedProject} onClose={() => { setShowProjectDetails(false); setProjectDetailsInitialTab(null); }}
                onProjectUpdate={handleProjectUpdate} onEditProject={handleOpenFormForEdit} isAdmin={isAdmin} initialTab={projectDetailsInitialTab} />
            )}
            {showProjectForm && <ProjectForm project={editingProject} onSubmit={handleProjectFormSubmit} onCancel={() => { setShowProjectForm(false); setEditingProject(null); }} isSubmitting={isSubmitting} painters={allUsers.filter((u) => u.status === 'active')} />}
          </Suspense>
        </AnimatePresence>
      </div>
    </div>
  );
}