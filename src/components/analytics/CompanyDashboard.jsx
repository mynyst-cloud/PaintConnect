
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Clock,
  Users,
  Briefcase,
  Package,
  AlertTriangle,
  Calendar,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { Project, MaterialRequest, Damage, User, TimeEntry } from '@/api/entities';
import { formatCurrency, formatDate } from '@/components/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function CompanyDashboard() {
  const [projects, setProjects] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [damages, setDamages] = useState([]);
  const [painters, setPainters] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [currentUser, setCurrentUser] = useState(null);

  // FIXED: Load data directly in useEffect to prevent infinite loops
  // selectedPeriod is not used in data loading, so we only load once on mount
  useEffect(() => {
    console.log('[CompanyDashboard] useEffect triggered - loading data', {
      stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });
    
    let mounted = true;
    
    const loadData = async () => {
      console.log('[CompanyDashboard] loadData called, mounted:', mounted);
      setIsLoading(true);
      try {
        const user = await User.me();
        console.log('[CompanyDashboard] User loaded:', user?.id, 'mounted:', mounted);
        if (!mounted) {
          console.log('[CompanyDashboard] Component unmounted, aborting');
          return;
        }
        
        setCurrentUser(user);
        
        if (!user.company_id) {
          console.log('[CompanyDashboard] No company_id, stopping');
          setIsLoading(false);
          return;
        }

        console.log('[CompanyDashboard] Loading data for company:', user.company_id);
        const [projectsData, materialsData, damagesData, paintersData, timeEntriesData] = await Promise.all([
          Project.filter({ 
            company_id: user.company_id,
            is_dummy: { $ne: true } // Exclude dummy projects from the initial fetch
          }),
          MaterialRequest.filter({ company_id: user.company_id }),
          Damage.filter({ company_id: user.company_id }),
          User.filter({ company_id: user.company_id, is_painter: true }),
          TimeEntry.filter({ company_id: user.company_id }).catch(() => [])
        ]);

        if (!mounted) {
          console.log('[CompanyDashboard] Component unmounted during data load, aborting');
          return;
        }

        // Extra safeguard: filter again client-side to exclude dummy projects
        const realProjects = (projectsData || []).filter(p => p && p.is_dummy !== true);
        
        console.log('[CompanyDashboard] Data loaded:', {
          projects: realProjects.length,
          materials: materialsData?.length || 0,
          damages: damagesData?.length || 0,
          painters: paintersData?.length || 0,
          timeEntries: timeEntriesData?.length || 0
        });

        setProjects(realProjects);
        setMaterialRequests(materialsData || []);
        setDamages(damagesData || []);
        setPainters(paintersData || []);
        setTimeEntries(timeEntriesData || []);
      } catch (error) {
        console.error('[CompanyDashboard] Error loading analytics data:', error);
        if (mounted) {
          setIsLoading(false);
        }
      } finally {
        if (mounted) {
          console.log('[CompanyDashboard] Setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      console.log('[CompanyDashboard] Cleanup function called');
      mounted = false;
    };
  }, []); // Only run once on mount

  const calculateKPIs = () => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'afgerond').length;
    const activeProjects = projects.filter(p => p.status === 'in_uitvoering').length;
    const totalMaterialCosts = materialRequests.reduce((sum, m) => sum + (m.estimated_cost || 0), 0);
    const openDamages = damages.filter(d => d.status === 'gemeld').length;
    const averageProjectDuration = calculateAverageProjectDuration();
    const painterPerformance = calculatePainterPerformance();

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      totalMaterialCosts,
      openDamages,
      averageProjectDuration,
      painterPerformance
    };
  };

  const calculateAverageProjectDuration = () => {
    const completedProjects = projects.filter(p => 
      p.status === 'afgerond' && p.start_date && p.updated_date
    );
    
    if (completedProjects.length === 0) return 0;
    
    const totalDays = completedProjects.reduce((sum, project) => {
      const start = new Date(project.start_date);
      const end = new Date(project.updated_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / completedProjects.length);
  };

  // FIXED: Gebruik email in plaats van full_name
  const calculatePainterPerformance = () => {
    return painters.map(painter => {
      const painterProjects = projects.filter(p => 
        p.assigned_painters && Array.isArray(p.assigned_painters) && 
        p.assigned_painters.includes(painter.email)
      );
      const completedProjects = painterProjects.filter(p => p.status === 'afgerond').length;
      const totalProjects = painterProjects.length;
      
      // Bereken totale gewerkte uren
      const painterHours = timeEntries
        .filter(te => te.painter_id === painter.id)
        .reduce((sum, te) => sum + (te.hours || 0), 0);
      
      return {
        name: painter.full_name,
        email: painter.email,
        totalProjects,
        completedProjects,
        completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
        totalHours: painterHours
      };
    }).filter(p => p.totalProjects > 0); // Alleen schilders met projecten tonen
  };

  const generateProjectStatusData = () => {
    const statusCounts = {
      'Nieuw': projects.filter(p => p.status === 'nieuw' || p.status === 'niet_gestart').length,
      'Planning': projects.filter(p => p.status === 'planning' || p.status === 'bijna_klaar').length,
      'In uitvoering': projects.filter(p => p.status === 'in_uitvoering').length,
      'Afgerond': projects.filter(p => p.status === 'afgerond').length,
      'On Hold': projects.filter(p => p.status === 'on_hold').length,
      'Geannuleerd': projects.filter(p => p.status === 'geannuleerd').length,
      'Offerte': projects.filter(p => p.status === 'offerte').length
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    })).filter(item => item.value > 0);
  };

  // VERVANGEN: Echte data in plaats van willekeurige getallen
  const generateMonthlyProjectData = () => {
    const monthlyData = {};
    
    projects.forEach(project => {
      if (project.updated_date) {
        const month = new Date(project.updated_date).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { completed: 0, total: 0 };
        }
        monthlyData[month].total++;
        if (project.status === 'afgerond') {
          monthlyData[month].completed++;
        }
      }
    });

    return Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-6)
      .map(([month, data]) => ({
        month: month.split(' ')[0],
        completed: data.completed,
        total: data.total
      }));
  };

  const generateMaterialCostsData = () => {
    const materialsByMonth = {};
    materialRequests.forEach(request => {
      const month = new Date(request.created_date).toLocaleDateString('nl-NL', { month: 'short' });
      materialsByMonth[month] = (materialsByMonth[month] || 0) + (request.estimated_cost || 0);
    });

    return Object.entries(materialsByMonth)
      .sort((a, b) => new Date('2024 ' + a[0]) - new Date('2024 ' + b[0]))
      .slice(-6)
      .map(([month, cost]) => ({
        month,
        cost
      }));
  };

  // NIEUW: Prestatie metrics over tijd
  const generatePerformanceMetrics = () => {
    const monthlyMetrics = {};
    
    projects.forEach(project => {
      if (project.created_date) {
        const month = new Date(project.created_date).toLocaleDateString('nl-NL', { month: 'short' });
        if (!monthlyMetrics[month]) {
          monthlyMetrics[month] = {
            projects: 0,
            completed: 0,
            damages: 0,
            materialCost: 0
          };
        }
        monthlyMetrics[month].projects++;
        if (project.status === 'afgerond') monthlyMetrics[month].completed++;
      }
    });

    damages.forEach(damage => {
      const month = new Date(damage.created_date).toLocaleDateString('nl-NL', { month: 'short' });
      if (monthlyMetrics[month]) {
        monthlyMetrics[month].damages++;
      }
    });

    materialRequests.forEach(request => {
      const month = new Date(request.created_date).toLocaleDateString('nl-NL', { month: 'short' });
      if (monthlyMetrics[month]) {
        monthlyMetrics[month].materialCost += request.estimated_cost || 0;
      }
    });

    return Object.entries(monthlyMetrics)
      .slice(-6)
      .map(([month, data]) => ({
        month,
        completionRate: data.projects > 0 ? ((data.completed / data.projects) * 100).toFixed(1) : 0,
        damageRate: data.projects > 0 ? ((data.damages / data.projects) * 100).toFixed(1) : 0,
        avgMaterialCost: data.projects > 0 ? Math.round(data.materialCost / data.projects) : 0
      }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate data during render (simple calculations, no need for memoization)
  const kpis = calculateKPIs();
  const performanceMetrics = generatePerformanceMetrics();
  const projectStatusData = generateProjectStatusData();
  const monthlyProjectData = generateMonthlyProjectData();
  const materialCostsData = generateMaterialCostsData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bedrijfsanalytics</h1>
          <p className="text-gray-600 dark:text-slate-400">Inzichten in uw bedrijfsprestaties</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Wekelijks</SelectItem>
            <SelectItem value="monthly">Maandelijks</SelectItem>
            <SelectItem value="quarterly">Kwartaal</SelectItem>
            <SelectItem value="yearly">Jaarlijks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Totaal Projecten</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{kpis.totalProjects}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Actief: {kpis.activeProjects}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Voltooiingspercentage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{kpis.completionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Voltooid: {kpis.completedProjects}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Materiaalkosten</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {formatCurrency(kpis.totalMaterialCosts)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                  <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Euro className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">Totaal</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Open Beschadigingen</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{kpis.openDamages}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {kpis.openDamages > 5 ? (
                  <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                )}
                <span className={`text-sm ${kpis.openDamages > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {kpis.openDamages > 5 ? 'Aandacht vereist' : 'Onder controle'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="performance">Prestaties</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Verdeling</CardTitle>
              </CardHeader>
              <CardContent>
                {projectStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Geen projectdata beschikbaar
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gemiddelde Projectduur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    {kpis.averageProjectDuration}
                  </div>
                  <div className="text-lg text-gray-600 dark:text-slate-400">dagen</div>
                  <p className="text-sm text-gray-500 dark:text-slate-500 mt-4">
                    Gebaseerd op {projects.filter(p => p.status === 'afgerond').length} voltooide projecten
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Maandelijkse Projecten</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyProjectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10B981" name="Voltooid" />
                  <Bar dataKey="total" fill="#3B82F6" name="Totaal" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Materiaalkosten per Maand</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={materialCostsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="cost" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Prestatie Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#10B981" 
                    name="Voltooiingspercentage (%)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="damageRate" 
                    stroke="#EF4444" 
                    name="Beschadigingspercentage (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gem. Materiaalkosten per Project</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area 
                      type="monotone" 
                      dataKey="avgMaterialCost" 
                      stroke="#F59E0B" 
                      fill="#F59E0B" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Indicatoren</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Voltooiingsratio</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {kpis.completionRate.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Gem. Doorlooptijd</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {kpis.averageProjectDuration}d
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Beschadigingsratio</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-600">
                      {kpis.totalProjects > 0 
                        ? ((damages.length / kpis.totalProjects) * 100).toFixed(1) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Schilder Prestaties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpis.painterPerformance.length > 0 ? (
                  kpis.painterPerformance
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .map((painter, index) => (
                      <div key={painter.email} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-500' :
                            'bg-emerald-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{painter.name}</div>
                            <div className="text-sm text-gray-600 dark:text-slate-400">
                              {painter.totalProjects} projecten • {painter.totalHours || 0} uren
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">{painter.completionRate.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600 dark:text-slate-400">voltooiing</div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Geen schilderdata beschikbaar
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Capaciteit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <div className="font-medium">Totaal Schilders</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">Actief in het systeem</div>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600">{painters.length}</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <div className="font-medium">Actieve Projecten</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">Momenteel in uitvoering</div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{kpis.activeProjects}</div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <div className="font-medium">Gem. Projecten per Schilder</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">Werkbelasting</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {painters.length > 0 ? (kpis.totalProjects / painters.length).toFixed(1) : 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {kpis.painterPerformance
                    .sort((a, b) => b.completedProjects - a.completedProjects)
                    .slice(0, 5)
                    .map((painter, index) => (
                      <div key={painter.email} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{painter.name}</div>
                          <div className="text-xs text-gray-600 dark:text-slate-400">
                            {painter.completedProjects} voltooide projecten
                          </div>
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {painter.completionRate.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
