import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Clock,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Briefcase,
  Loader2,
  Calendar as CalendarIcon,
  Filter,
  X,
  FileText,
  Eye,
  Car,
  Navigation,
  Lock
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import UpgradeModal from '@/components/ui/UpgradeModal';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import PerformanceCharts from '../components/teamactivity/PerformanceCharts';
import RecordDetailsDrawer from '../components/teamactivity/RecordDetailsDrawer';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TeamActiviteit() {
  // Feature access - TeamActiviteit is admin only
  const { isPainter, isSuperAdmin, isLoading: featureLoading } = useFeatureAccess();
  const [showAccessModal, setShowAccessModal] = useState(false);
  const modalDismissedRef = useRef(false); // Track if user manually closed the modal
  
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    date_from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    date_to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    project_id: '',
    user_id: '',
    status: 'all',
    on_time_status: 'all',
    search: '',
    // NIEUW: Travel filters
    with_travel: false,
    long_distance: false,
    slow_traffic: false
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });

  // Use ref to track current pagination to avoid infinite loops
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    check_in_time: '',
    check_out_time: '',
    notes: '',
    reason: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // NIEUW: Details drawer
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      
      const companyId = userData.company_id || userData.current_company_id;
      
      if (!companyId) {
        toast.error('Geen bedrijf gekoppeld');
        setIsLoading(false);
        return;
      }

      const [companyData, projectsData, usersData] = await Promise.all([
        base44.entities.Company.get(companyId),
        base44.entities.Project.filter({ company_id: companyId }),
        base44.functions.invoke('getCompanyPainters', { company_id: companyId }).then(res => res.data)
      ]);

      setCompany(companyData);
      setProjects(projectsData || []);
      setUsers(usersData || []);
      
      await loadTeamActivity(userData, companyData);
    } catch (error) {
      console.error('[TeamActiviteit] Error loading initial data:', error);
      toast.error('Fout bij laden van gegevens: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamActivity = useCallback(async (user = currentUser, comp = company, page = null) => {
    if (!user || !comp) {
      console.log('[TeamActiviteit] Missing user or company data, skipping load');
      return;
    }

    setIsLoading(true);
    try {
      const companyId = comp.id || user.company_id || user.current_company_id;
      const currentPage = page ?? paginationRef.current.page;
      
      const response = await base44.functions.invoke('getTeamActivity', {
        company_id: companyId,
        page: currentPage,
        limit: paginationRef.current.limit,
        filters: {
          ...filters,
          project_id: filters.project_id || undefined,
          user_id: filters.user_id || undefined,
          on_time_status: filters.on_time_status !== 'all' ? filters.on_time_status : undefined,
          // NEW Travel filters
          with_travel: filters.with_travel ? true : undefined,
          long_distance: filters.long_distance ? true : undefined,
          slow_traffic: filters.slow_traffic ? true : undefined
        },
        compute_stats: currentPage === 1
      });

      if (response.data) {
        setRecords(response.data.records || []);
        
        // Only update total if it changed to prevent re-renders
        const newTotal = response.data.pagination?.total ?? 0;
        setPagination(prev => {
          if (prev.total === newTotal) return prev;
          return { ...prev, total: newTotal };
        });
        
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error) {
      console.error('[TeamActiviteit] Error loading activity:', error);
      toast.error('Fout bij laden van activiteiten: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentUser, company]);

  // Load data when filters or user/company change
  useEffect(() => {
    if (currentUser && company) {
      loadTeamActivity(currentUser, company, 1);
    }
  }, [filters, currentUser, company, loadTeamActivity]);
  
  // Handle pagination changes separately
  useEffect(() => {
    if (currentUser && company && pagination.page > 1) {
      loadTeamActivity(currentUser, company, pagination.page);
    }
  }, [pagination.page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Role check - show modal for painters (must be before any conditional returns!)
  useEffect(() => {
    // Never show for super admins or if user already dismissed it
    if (modalDismissedRef.current) return;
    
    // Check super admin status first
    const isSuperAdminUser = isSuperAdmin && isSuperAdmin();
    if (isSuperAdminUser) return;
    
    // Only show modal for painters (not admins or super admins)
    if (!featureLoading && isPainter && isPainter()) {
      setShowAccessModal(true);
    }
  }, [featureLoading, isPainter, isSuperAdmin]);
  
  // Handler to close modal and remember dismissal
  const handleCloseAccessModal = () => {
    modalDismissedRef.current = true;
    setShowAccessModal(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleQuickFilter = (preset) => {
    try {
      const today = new Date();
      let from, to;

      switch (preset) {
        case 'today':
          from = format(today, 'yyyy-MM-dd');
          to = format(today, 'yyyy-MM-dd');
          break;
        case 'week':
          from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          to = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          break;
        case 'month':
          from = format(startOfMonth(today), 'yyyy-MM-dd');
          to = format(endOfMonth(today), 'yyyy-MM-dd');
          break;
        case 'last7':
          from = format(subDays(today, 7), 'yyyy-MM-dd');
          to = format(today, 'yyyy-MM-dd');
          break;
        case 'lastMonth':
          const lastMonth = subMonths(today, 1);
          from = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
          to = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
          break;
        default:
          return;
      }

      setFilters(prev => ({ ...prev, date_from: from, date_to: to }));
      setPagination(prev => ({ ...prev, page: 1 }));
    } catch (error) {
      console.error('[TeamActiviteit] Error in quick filter:', error);
      toast.error('Fout bij filter wijziging');
    }
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const companyId = company?.id || currentUser.company_id;
      
      const response = await base44.functions.invoke('exportTeamActivity', {
        company_id: companyId,
        filters: {
          ...filters,
          project_id: filters.project_id || undefined,
          user_id: filters.user_id || undefined,
          on_time_status: filters.on_time_status !== 'all' ? filters.on_time_status : undefined,
          // NEW Travel filters for export
          with_travel: filters.with_travel ? true : undefined,
          long_distance: filters.long_distance ? true : undefined,
          slow_traffic: filters.slow_traffic ? true : undefined
        },
        format
      });

      if (response.data?.file_url) {
        window.open(response.data.file_url, '_blank');
        toast.success(`Export gelukt: ${response.data.file_name}`);
      }
    } catch (error) {
      console.error('[TeamActiviteit] Export error:', error);
      toast.error('Export mislukt: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setEditFormData({
      check_in_time: format(new Date(record.check_in_time), "yyyy-MM-dd'T'HH:mm"),
      check_out_time: record.check_out_time ? format(new Date(record.check_out_time), "yyyy-MM-dd'T'HH:mm") : '',
      notes: record.notes || '',
      reason: ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.reason.trim()) {
      toast.error('Reden voor aanpassing is verplicht');
      return;
    }

    try {
      const updates = {
        check_in_time: new Date(editFormData.check_in_time).toISOString(),
        notes: editFormData.notes
      };

      if (editFormData.check_out_time) {
        updates.check_out_time = new Date(editFormData.check_out_time).toISOString();
        updates.status = 'checked_out';
        
        const checkIn = new Date(editFormData.check_in_time);
        const checkOut = new Date(editFormData.check_out_time);
        updates.duration_minutes = Math.round((checkOut - checkIn) / 60000);
      } else {
        // If check_out_time is cleared, ensure the record status and duration are updated accordingly
        updates.check_out_time = null;
        updates.status = 'checked_in';
        updates.duration_minutes = null;
      }


      await base44.functions.invoke('updateCheckInRecord', {
        record_id: editingRecord.id,
        updates,
        reason: editFormData.reason
      });

      toast.success('Record bijgewerkt');
      setShowEditModal(false);
      setEditingRecord(null);
      setEditFormData({ check_in_time: '', check_out_time: '', notes: '', reason: '' });
      loadTeamActivity();
    } catch (error) {
      console.error('[TeamActiviteit] Update error:', error);
      toast.error('Bijwerken mislukt: ' + error.message);
    }
  };

  const handleDeleteRecord = (record) => {
    setDeletingRecord(record);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Reden voor verwijdering is verplicht');
      return;
    }

    try {
      await base44.functions.invoke('deleteCheckInRecord', {
        record_id: deletingRecord.id,
        reason: deleteReason
      });

      toast.success('Check-in record verwijderd');
      setShowDeleteModal(false);
      setDeletingRecord(null);
      setDeleteReason('');
      loadTeamActivity();
    } catch (error) {
      console.error('[TeamActiviteit] Delete error:', error);
      toast.error('Verwijderen mislukt: ' + error.message);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailsDrawer(true);
  };

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined || minutes < 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}u ${mins}m`;
    if (hours > 0) return `${hours}u`;
    if (mins > 0) return `${mins}m`;
    return '0m';
  };

  const resetFilters = () => {
    setFilters({
      date_from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      date_to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      project_id: '',
      user_id: '',
      status: 'all',
      on_time_status: 'all',
      search: '',
      with_travel: false,
      long_distance: false,
      slow_traffic: false
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if ((isLoading && records.length === 0) || featureLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="default" />
      </div>
    );
  }

  // Super admins always have access - check this first
  const isSuperAdminUser = isSuperAdmin && isSuperAdmin();
  
  // Only block painters, not super admins
  if (!isSuperAdminUser && isPainter && isPainter()) {
    return (
      <>
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-md mx-auto mt-12 sm:mt-24 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Geen toegang
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Team Activiteit is alleen beschikbaar voor beheerders.
            </p>
          </div>
        </div>
        <UpgradeModal
          isOpen={showAccessModal}
          onClose={handleCloseAccessModal}
          featureName="Team Activiteit"
          requiredTier="starter"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Team Activiteit
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Volledige historiek van check-ins en statistieken
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting || records.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={isExporting || records.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTeamActivity()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards - UITGEBREID */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Totaal Check-ins</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.total_checkins}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unieke Schilders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.unique_users}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Op Tijd</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.on_time_percentage}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.on_time_count} / {stats.total_checkins}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gem. Uren/Dag</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.avg_hours_per_day}u
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            {/* NIEUW: Travel stats cards */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gem. Reistijd</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.avg_travel_time_per_checkin ? Math.round(stats.avg_travel_time_per_checkin) : 0}m
                    </p>
                    <p className="text-xs text-gray-500">
                      Per check-in (heen+terug)
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gem. Afstand</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.avg_travel_distance_per_checkin ? stats.avg_travel_distance_per_checkin.toFixed(1) : 0} km
                    </p>
                    <p className="text-xs text-gray-500">
                      Per check-in (heen+terug)
                    </p>
                  </div>
                  <Car className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Totaal Reistijd</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatDuration(stats.total_travel_time)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Deze periode
                    </p>
                  </div>
                  <Navigation className="w-8 h-8 text-teal-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Totaal Afstand</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.total_travel_distance ? stats.total_travel_distance.toFixed(0) : 0} km
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.records_with_travel} records met reisdata
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Charts */}
        <PerformanceCharts stats={stats} />

        {/* NIEUW: Top 3 Verste Projecten */}
        {stats && stats.top_distant_projects && stats.top_distant_projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-pink-600" />
                Top 3 Verste Projecten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.top_distant_projects.map((project, index) => (
                  <div key={project.project_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{project.project_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{project.check_ins} check-ins</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{project.avg_distance.toFixed(1)} km</p>
                      <p className="text-xs text-gray-500">gem. afstand</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date From */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Van Datum</Label>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Date To */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tot Datum</Label>
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Project Filter */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Project</Label>
                <Select
                  value={filters.project_id}
                  onValueChange={(value) => handleFilterChange('project_id', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Alle projecten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Alle projecten</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Schilder</Label>
                <Select
                  value={filters.user_id}
                  onValueChange={(value) => handleFilterChange('user_id', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Alle schilders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Alle schilders</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* On-Time Status Filter */}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</Label>
                <Select
                  value={filters.on_time_status}
                  onValueChange={(value) => handleFilterChange('on_time_status', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="on_time">Op Tijd</SelectItem>
                    <SelectItem value="late">Te Laat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('today')}
                className="h-8"
              >
                Vandaag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('last7')}
                className="h-8"
              >
                Laatste 7 dagen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('week')}
                className="h-8"
              >
                Deze week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('month')}
                className="h-8"
              >
                Deze maand
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('lastMonth')}
                className="h-8"
              >
                Vorige maand
              </Button>

              {/* NIEUW: Travel filters */}
              <Button
                variant={filters.with_travel ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('with_travel', !filters.with_travel)}
                className="h-8"
              >
                <Car className="w-3 h-3 mr-1" />
                Met reistijd
              </Button>
              <Button
                variant={filters.long_distance ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('long_distance', !filters.long_distance)}
                className="h-8"
              >
                <MapPin className="w-3 h-3 mr-1" />
                &gt;20 km
              </Button>
              <Button
                variant={filters.slow_traffic ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('slow_traffic', !filters.slow_traffic)}
                className="h-8"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Traag verkeer (&gt;45min)
              </Button>

              {/* NIEUW: Reset filters knop */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="h-8 ml-auto"
              >
                <Filter className="w-3 h-3 mr-1" />
                Reset filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Check-in Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Geen records gevonden voor deze filters</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-3"
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                        <th className="pb-2 font-medium">Tijd</th>
                        <th className="pb-2 font-medium">Schilder</th>
                        <th className="pb-2 font-medium">Project</th>
                        <th className="pb-2 font-medium">Duur</th>
                        <th className="pb-2 font-medium">Reistijd</th>
                        <th className="pb-2 font-medium">Afstand</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Locatie</th>
                        <th className="pb-2 font-medium">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {records.map(record => (
                        <tr 
                          key={record.id} 
                          className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => handleViewDetails(record)}
                        >
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {format(new Date(record.check_in_time), 'HH:mm', { locale: nl })}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(record.check_in_time), 'd MMM', { locale: nl })}
                              </p>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                                {record.user_name?.charAt(0) || '?'}
                              </div>
                              <span className="text-gray-900 dark:text-gray-100">{record.user_name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-900 dark:text-gray-100">
                            {record.project_name}
                          </td>
                          <td className="py-3">
                            {record.check_out_time ? (
                              <span className="text-gray-900 dark:text-gray-100">
                                {formatDuration(record.duration_minutes)}
                              </span>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Actief
                              </Badge>
                            )}
                          </td>

                          {/* AANGEPAST: Null-safe reistijd */}
                          <td className="py-3">
                            {record.total_travel_time && record.total_travel_time > 0 ? (
                              <span className="text-gray-900 dark:text-gray-100">
                                {formatDuration(record.total_travel_time)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>

                          {/* AANGEPAST: Null-safe afstand */}
                          <td className="py-3">
                            {record.total_travel_distance && record.total_travel_distance > 0 ? (
                              <span className="text-gray-900 dark:text-gray-100">
                                {record.total_travel_distance.toFixed(1)} km
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>

                          <td className="py-3">
                            {record.is_on_time ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Op tijd
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border-red-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Te laat
                              </Badge>
                            )}
                          </td>
                          <td className="py-3">
                            {record.location_name && (
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">
                                  {record.location_name}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(record);
                                }}
                                className="h-8 w-8"
                                title="Bekijk details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRecord(record);
                                }}
                                className="h-8 w-8"
                                title="Bewerken"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRecord(record);
                                }}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                                title="Verwijderen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pagina {pagination.page} - {records.length} records
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                    >
                      Vorige
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={records.length < pagination.limit || records.length === 0}
                    >
                      Volgende
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in Record Bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Check-in Tijd *</Label>
              <Input
                type="datetime-local"
                value={editFormData.check_in_time}
                onChange={(e) => setEditFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
              />
            </div>

            <div>
              <Label>Check-out Tijd</Label>
              <Input
                type="datetime-local"
                value={editFormData.check_out_time}
                onChange={(e) => setEditFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
              />
            </div>

            <div>
              <Label>Notities</Label>
              <Textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label>Reden voor Aanpassing *</Label>
              <Textarea
                value={editFormData.reason}
                onChange={(e) => setEditFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Verplicht: waarom wordt dit record aangepast?"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowEditModal(false);
                setEditingRecord(null);
                setEditFormData({ check_in_time: '', check_out_time: '', notes: '', reason: '' });
              }}>
                Annuleren
              </Button>
              <Button onClick={handleSaveEdit} className="bg-emerald-600 hover:bg-emerald-700" disabled={!editFormData.reason.trim()}>
                Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in Record Verwijderen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-200">Let op!</h4>
                  <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                    Je staat op het punt een check-in record te verwijderen. Deze actie kan niet ongedaan worden gemaakt.
                  </p>
                </div>
              </div>
            </div>

            {deletingRecord && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Schilder:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {deletingRecord.user_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Project:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {deletingRecord.project_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(deletingRecord.check_in_time), 'dd MMM yyyy HH:mm', { locale: nl })}
                  </span>
                </div>
              </div>
            )}

            <div>
              <Label>Reden voor Verwijdering *</Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Verplicht: waarom wordt dit record verwijderd?"
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Deze reden wordt opgeslagen in de audit log.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRecord(null);
                  setDeleteReason('');
                }}
              >
                Annuleren
              </Button>
              <Button 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!deleteReason.trim()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Verwijderen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NIEUW: Details Drawer */}
      <RecordDetailsDrawer
        record={selectedRecord}
        isOpen={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
}