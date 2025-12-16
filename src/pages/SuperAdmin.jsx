import React, { useState, useEffect, useCallback } from 'react';
import { User, Company, PendingCompany, Supplier, Project, Lead } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crown,
  RefreshCw,
  Plus,
  Loader2,
  BarChart3,
  Building,
  Users,
  Package,
  Send,
  Mail,
  TestTube2,
  Megaphone,
  Settings,
  Wrench,
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminDashboardTab from '@/components/admin/AdminDashboardTab';
import CreateCompanyForm from '@/components/admin/CreateCompanyForm';
import PendingCompaniesManager from '@/components/admin/PendingCompaniesManager';
import UserManagement from '@/components/admin/UserManagement';
import SupplierManagement from '@/components/admin/SupplierManagement';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import StripeDiagnostics from '@/components/admin/StripeDiagnostics';
import ClientPortalAccess from '@/components/admin/ClientPortalAccess';
import DataCleanup from '@/components/admin/DataCleanup';
import CompanyImpersonation from '@/components/admin/CompanyImpersonation';
import PlatformUpdateManagement from "@/components/admin/PlatformUpdateManagement";
import TestBotPanel from '@/components/admin/TestBotPanel';
import EmailManagement from '@/components/admin/EmailManagement';
import DataRestore from '@/components/admin/DataRestore';
import NewsletterManager from '@/components/admin/NewsletterManager';
import EmailFooterSettings from '@/components/admin/EmailFooterSettings';
import NotificationSoundUpload from '@/components/admin/NotificationSoundUpload';

const StatsCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
        <div className={`h-1.5 bg-gradient-to-r ${colorClasses[color]}`} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function SuperAdmin() {
    const [stats, setStats] = useState(null);
    const [pendingCompanies, setPendingCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateCompany, setShowCreateCompany] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const loadAdminData = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const user = await User.me();
            if (user.role !== 'admin') {
                setError('Toegang geweigerd.');
                return;
            }

            const [companies, users, suppliers, projects, leads, pending] = await Promise.all([
                Company.list(),
                User.list(),
                Supplier.list(),
                Project.list(),
                Lead.list(),
                PendingCompany.list()
            ]);

            setStats({
                totalCompanies: companies?.length || 0,
                activeCompanies: (companies || []).filter(c => c.is_active).length,
                totalSuppliers: suppliers?.length || 0,
                totalUsers: users?.length || 0,
                totalProjects: projects?.length || 0,
                activeProjects: (projects || []).filter(p => p.status !== 'afgerond').length,
                totalLeads: leads?.length || 0,
                wonLeads: (leads || []).filter(l => l.status === 'gewonnen').length,
                pendingCompanies: (pending || []).filter(pc => pc.status === 'pending').length,
            });

            setPendingCompanies(pending || []);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError('Kon de beheerdersgegevens niet laden.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    const tabs = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: BarChart3,
            component: () => <AdminDashboardTab stats={stats} />
        },
        {
            id: 'companies',
            label: 'Bedrijven',
            icon: Building,
            component: () => <PendingCompaniesManager pendingCompanies={pendingCompanies} onRefresh={loadAdminData} />
        },
        {
            id: 'users',
            label: 'Gebruikers',
            icon: Users,
            component: () => <UserManagement onRefresh={loadAdminData} />
        },
        {
            id: 'suppliers',
            label: 'Leveranciers',
            icon: Package,
            component: () => <SupplierManagement onRefresh={loadAdminData} />
        },
        {
            id: 'notifications',
            label: 'Notificaties',
            icon: Volume2,
            component: NotificationSoundUpload,
        },
        {
            id: 'newsletter',
            label: 'Nieuwsbrief',
            icon: Send,
            component: NewsletterManager,
        },
        {
            id: 'emailFooter',
            label: 'E-mail Footer',
            icon: Mail,
            component: EmailFooterSettings,
        },
        {
            id: 'dataRestore',
            label: 'Data Herstel',
            icon: RefreshCw,
            component: DataRestore,
        },
        {
            id: 'email',
            label: 'E-mail Beheer',
            icon: Mail,
            component: EmailManagement,
        },
        {
            id: 'data-cleanup',
            label: 'Data Cleanup',
            icon: Wrench,
            component: DataCleanup,
        },
        {
            id: 'tests',
            label: 'Tests',
            icon: TestTube2,
            component: TestBotPanel,
        },
        {
            id: 'platform',
            label: 'Platform Updates',
            icon: Megaphone,
            component: PlatformUpdateManagement
        },
        {
            id: 'diagnostics',
            label: 'Diagnostics',
            icon: Settings,
            component: () => (
                <div className="space-y-6">
                    <StripeDiagnostics />
                    <ClientPortalAccess />
                </div>
            )
        }
    ];

    const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

    if (isLoading) {
        return <LoadingSpinner overlay text="Super Admin Panel laden..." />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Toegang Geweigerd</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Crown className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Panel</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Systeem beheer en monitoring</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 hidden sm:flex">
                                <Crown className="w-3.5 h-3.5 mr-1.5" />
                                Super Administrator
                            </Badge>
                            <Button onClick={() => setShowCreateCompany(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Nieuw Bedrijf</span>
                            </Button>
                            <Button variant="outline" onClick={loadAdminData} disabled={isRefreshing} className="shadow-sm">
                                {isRefreshing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">Vernieuwen</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
                {/* Top Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard
                            icon={Building}
                            title="Totaal Bedrijven"
                            value={stats.totalCompanies}
                            subtitle={`${stats.activeCompanies} actief`}
                            color="blue"
                        />
                        <StatsCard
                            icon={Users}
                            title="Totaal Gebruikers"
                            value={stats.totalUsers}
                            color="green"
                        />
                        <StatsCard
                            icon={Package}
                            title="Totaal Leveranciers"
                            value={stats.totalSuppliers}
                            color="purple"
                        />
                        <StatsCard
                            icon={AlertTriangle}
                            title="Wachtend op Goedkeuring"
                            value={stats.pendingCompanies}
                            subtitle="Nieuwe aanvragen"
                            color="orange"
                        />
                    </div>
                )}

                {/* Main Content: Tabs + Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Tabs Area */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg border-0 overflow-hidden">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 pt-4">
                                    <TabsList className="flex flex-wrap justify-start gap-1 bg-transparent h-auto p-0">
                                        {tabs.map(({ id, label, icon: Icon }) => (
                                            <TabsTrigger
                                                key={id}
                                                value={id}
                                                className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-t-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-yellow-500"
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="hidden md:inline">{label}</span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                <div className="p-6">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {ActiveTabComponent && (
                                                <TabsContent value={activeTab} className="mt-0">
                                                    <ActiveTabComponent />
                                                </TabsContent>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </Tabs>
                        </Card>
                    </div>

                    {/* Sidebar: Impersonation */}
                    <div className="lg:col-span-1">
                        <CompanyImpersonation />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showCreateCompany && (
                    <CreateCompanyForm
                        onCancel={() => setShowCreateCompany(false)}
                        onCompanyAdded={() => {
                            setShowCreateCompany(false);
                            loadAdminData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}