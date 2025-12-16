import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Briefcase, AlertTriangle, Package } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function KpiCharts({ projects, requests, damages }) {

    const weeklyActivity = React.useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return weekDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            return {
                name: format(day, 'EEE', { locale: nl }),
                aanvragen: requests.filter(r => format(parseISO(r.created_date), 'yyyy-MM-dd') === dayStr).length,
                schades: damages.filter(d => format(parseISO(d.created_date), 'yyyy-MM-dd') === dayStr).length,
            };
        });
    }, [requests, damages]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">Key Metrics (Deze Week)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-800">
                        <Briefcase className="w-8 h-8 mx-auto text-emerald-500 mb-2"/>
                        <p className="text-2xl font-bold">{projects.length}</p>
                        <p className="text-sm text-gray-600">Actieve Projecten</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-800">
                        <Package className="w-8 h-8 mx-auto text-blue-500 mb-2"/>
                        <p className="text-2xl font-bold">{requests.length}</p>
                        <p className="text-sm text-gray-600">Open Aanvragen</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-800">
                        <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2"/>
                        <p className="text-2xl font-bold">{damages.length}</p>
                        <p className="text-sm text-gray-600">Open Schades</p>
                    </div>
                </div>
                <div className="mt-6 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyActivity}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="aanvragen" fill="#3b82f6" name="Aanvragen" />
                            <Bar dataKey="schades" fill="#ef4444" name="Schades" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}