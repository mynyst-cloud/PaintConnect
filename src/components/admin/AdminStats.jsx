import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, CheckCircle, Package, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, iconBgColor, iconColor }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Bedrijven" 
        value={stats.totalCompanies} 
        icon={Building} 
        iconBgColor="bg-blue-100" 
        iconColor="text-blue-600" 
      />
      <StatCard 
        title="Actieve Bedrijven" 
        value={stats.activeCompanies} 
        icon={CheckCircle} 
        iconBgColor="bg-green-100" 
        iconColor="text-green-600" 
      />
      <StatCard 
        title="Leveranciers" 
        value={stats.totalSuppliers} 
        icon={Package} 
        iconBgColor="bg-purple-100" 
        iconColor="text-purple-600" 
      />
      <StatCard 
        title="Gebruikers" 
        value={stats.totalUsers} 
        icon={Users} 
        iconBgColor="bg-orange-100" 
        iconColor="text-orange-600" 
      />
    </div>
  );
}