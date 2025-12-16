import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building, Users, Briefcase, Handshake, Target, CheckSquare, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon: Icon, color = "blue", trend }) => {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">{trend}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AdminDashboardTab({ stats }) {
  if (!stats) return null;
  
  const barChartData = [
    { name: 'Bedrijven', value: stats.totalCompanies, color: '#3b82f6' },
    { name: 'Gebruikers', value: stats.totalUsers, color: '#10b981' },
    { name: 'Projecten', value: stats.totalProjects, color: '#8b5cf6' },
    { name: 'Leveranciers', value: stats.totalSuppliers, color: '#f59e0b' },
    { name: 'Leads', value: stats.totalLeads, color: '#ef4444' },
  ];

  const projectStatusData = [
    { name: 'Actief', value: stats.activeProjects, color: '#10b981' },
    { name: 'Afgerond', value: stats.totalProjects - stats.activeProjects, color: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard 
          title="Totaal Bedrijven" 
          value={stats.totalCompanies} 
          icon={Building} 
          color="blue"
        />
        <MetricCard 
          title="Actieve Bedrijven" 
          value={stats.activeCompanies} 
          icon={Activity} 
          color="emerald"
        />
        <MetricCard 
          title="Totaal Gebruikers" 
          value={stats.totalUsers} 
          icon={Users} 
          color="green"
        />
        <MetricCard 
          title="Totaal Projecten" 
          value={stats.totalProjects} 
          icon={Briefcase} 
          color="purple"
        />
        <MetricCard 
          title="Actieve Projecten" 
          value={stats.activeProjects} 
          icon={Target} 
          color="orange"
        />
        <MetricCard 
          title="Gewonnen Leads" 
          value={stats.wonLeads} 
          icon={CheckSquare} 
          color="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Platform Overzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    allowDecimals={false} 
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Project Status Verdeling</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary */}
      <Card className="shadow-sm bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Platform Activiteit
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.totalCompanies} bedrijven met {stats.totalUsers} gebruikers beheren momenteel {stats.totalProjects} projecten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}