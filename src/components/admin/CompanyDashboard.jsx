import React, { useState, useEffect, useMemo } from 'react';
import { Project, MaterialRequest, Damage, User, Company, Lead } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, Target, Building } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CompanyDashboard = () => {
    const [stats, setStats] = useState({});
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [projects, materials, damages, users, companies, leads] = await Promise.all([
                    Project.list().catch(() => []),
                    MaterialRequest.list().catch(() => []),
                    Damage.list().catch(() => []),
                    User.list().catch(() => []),
                    Company.list().catch(() => []),
                    Lead.list().catch(() => [])
                ]);

                const totalProjects = projects?.length || 0;
                const activeProjects = projects?.filter(p => p.status === 'in_uitvoering').length || 0;
                const totalUsers = users?.length || 0;
                const totalCompanies = companies?.length || 0;
                const totalLeads = leads?.length || 0;
                const wonLeads = leads?.filter(l => l.status === 'gewonnen').length || 0;

                setStats({
                    totalProjects,
                    activeProjects,
                    totalUsers,
                    totalCompanies,
                    totalLeads,
                    wonLeads
                });
                
                 const data = [
                    { name: 'Bedrijven', value: totalCompanies },
                    { name: 'Gebruikers', value: totalUsers },
                    { name: 'Projecten', value: totalProjects },
                    { name: 'Leads', value: totalLeads },
                ];
                setChartData(data);

            } catch (error) {
                console.error("Failed to fetch analytics data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const statCards = useMemo(() => [
        { title: "Totaal Bedrijven", value: stats.totalCompanies, icon: Building, color: "text-blue-500" },
        { title: "Totaal Gebruikers", value: stats.totalUsers, icon: Users, color: "text-emerald-500" },
        { title: "Totaal Projecten", value: stats.totalProjects, icon: Briefcase, color: "text-indigo-500" },
        { title: "Totaal Leads", value: stats.totalLeads, icon: Target, color: "text-amber-500" },
        { title: "Actieve Projecten", value: stats.activeProjects, icon: Briefcase, color: "text-green-500" },
        { title: "Gewonnen Leads", value: stats.wonLeads, icon: Target, color: "text-teal-500" },
    ], [stats]);

    if (isLoading) {
        return <LoadingSpinner text="Dashboard laden..." />;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map(card => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value ?? '...'}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Platform Overzicht</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
export default CompanyDashboard;