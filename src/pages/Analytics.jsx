import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building,
  Download,
  Calendar,
  Lock
} from 'lucide-react';
import CompanyDashboard from '../components/analytics/CompanyDashboard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useFeatureAccess, UpgradePrompt } from '@/hooks/useFeatureAccess';
import { isSuperAdminByEmail } from '@/config/roles';
import UpgradeModal from '@/components/ui/UpgradeModal';

export default function Analytics() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasFeature, isLoading: featureLoading, isSuperAdmin } = useFeatureAccess();
  const modalShownRef = useRef(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || featureLoading) {
    return <LoadingSpinner overlay text="Analytics laden..." />;
  }

  // Permission check - Analytics is only for Professional+ subscriptions
  // Show modal on first render if no access, then redirect
  // FIXED: Use ref to prevent infinite loop, check feature value not function
  useEffect(() => {
    if (modalShownRef.current) return;
    if (featureLoading) return;
    if (!currentUser) return; // Wait for user to load
    
    // Super admins always have access - check directly without function call
    const isSuperAdminUser = 
      (currentUser?.email && isSuperAdminByEmail(currentUser.email)) ||
      currentUser?.company_role === 'super_admin' ||
      currentUser?.role === 'super_admin';
    
    if (isSuperAdminUser) {
      setShowUpgradeModal(false);
      modalShownRef.current = true; // Mark as checked
      return;
    }
    
    // Check feature access - only call hasFeature if we have the hook ready
    try {
      const hasAnalyticsAccess = hasFeature && typeof hasFeature === 'function' ? hasFeature('page_analytics') : false;
      if (!hasAnalyticsAccess) {
        setShowUpgradeModal(true);
        modalShownRef.current = true;
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Default to showing modal if check fails
      setShowUpgradeModal(true);
      modalShownRef.current = true;
    }
  }, [featureLoading, currentUser]); // Removed isSuperAdmin and hasFeature from dependencies

  // Super admins always have access - check this first
  const isSuperAdminUser = 
    (isSuperAdmin && isSuperAdmin()) || 
    (currentUser?.email && isSuperAdminByEmail(currentUser.email)) ||
    currentUser?.company_role === 'super_admin';
  
  // Only block if not super admin and no feature access
  if (!isSuperAdminUser && !hasFeature('page_analytics')) {
    return (
      <>
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-2xl mx-auto mt-12 sm:mt-24">
            <UpgradePrompt 
              feature="page_analytics" 
              message="Analytics is alleen beschikbaar voor Professional en Enterprise abonnementen. Upgrade om uitgebreide inzichten in uw bedrijfsprestaties te krijgen."
            />
          </div>
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="Analytics"
          requiredTier="professional"
        />
      </>
    );
  }

  if (!currentUser?.company_id) {
    return (
      <div className="p-4 sm:p-6 text-center bg-gray-50 dark:bg-slate-950 min-h-screen">
        <div className="max-w-md mx-auto mt-12 sm:mt-24">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Geen toegang tot analytics</h2>
          <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base">
            U moet lid zijn van een bedrijf om analytics te bekijken.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
                Uitgebreide inzichten in uw bedrijfsprestaties en trends
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="sm:inline">Rapportage Planning</span>
              </Button>
              <Button size="sm" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                <span className="sm:inline">Export Data</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
              <TabsTrigger value="company" className="flex items-center gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Bedrijfsoverzicht</span>
                <span className="sm:hidden">Bedrijf</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Prestatie Analytics</span>
                <span className="sm:hidden">Prestatie</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Team Analytics</span>
                <span className="sm:hidden">Team</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-4 sm:mt-6">
              <CompanyDashboard />
            </TabsContent>

            <TabsContent value="performance" className="mt-4 sm:mt-6">
              <div className="text-center py-8 sm:py-12">
                <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Prestatie Analytics</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base">
                  Geavanceerde prestatie analytics komen binnenkort beschikbaar
                </p>
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-4 sm:mt-6">
              <div className="text-center py-8 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Team Analytics</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base">
                  Team prestatie dashboards komen binnenkort beschikbaar
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}