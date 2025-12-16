import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock } from 'lucide-react';

export default function PerformanceCharts({ stats }) {
  if (!stats || !stats.trend_data || !stats.top_performers) {
    return null;
  }

  const { trend_data, top_performers } = stats;

  // Format trend data for charts
  const trendChartData = trend_data.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' }),
    'Gem. Uren': d.avg_hours,
    'Op Tijd %': d.on_time_percentage
  }));

  // Top 5 performers
  const topPerformersData = top_performers.slice(0, 5).map(p => ({
    name: p.user_name.split(' ')[0], // First name only for chart
    'Totaal Uren': p.total_hours,
    'Op Tijd %': p.on_time_percentage
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Productivity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Productiviteit Trend (14 dagen)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="Gem. Uren" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="Op Tijd %" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-purple-600" />
            Top 5 Schilders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topPerformersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="Totaal Uren" 
                fill="#8b5cf6" 
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                yAxisId="right"
                dataKey="Op Tijd %" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}