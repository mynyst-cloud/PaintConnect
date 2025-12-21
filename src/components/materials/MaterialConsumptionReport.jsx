import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/components/utils";

export default function MaterialConsumptionReport({ companyId, categoryColors }) {
    const [period, setPeriod] = useState('month'); // week, month, quarter, year
    const [data, setData] = useState([]);
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const response = await base44.functions.invoke('getMaterialConsumption', {
                company_id: companyId,
                period: period
            });
            
            if (response.data && response.data.data) {
                setData(response.data.data);
                setTotals(response.data.totals || {});
            }
        } catch (error) {
            console.error("Error fetching consumption data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [companyId, period]);

    const categories = Object.keys(totals);

    // Default colors if not provided
    const colors = categoryColors || {
        'verf': '#3b82f6',
        'primer': '#a855f7',
        'lak': '#6366f1', 
        'klein_materiaal': '#f97316',
        'toebehoren': '#ec4899',
        'onbekend': '#9ca3af'
    };

    const getFillColor = (cat) => {
        const colorClass = colors[cat] || colors['onbekend'];
        // If colorClass is a tailwind class like 'bg-blue-500', we need to convert it or use a map
        // But here we expect categoryColors to pass hex or we assume defaults.
        // Let's try to extract hex if it's not hex
        if (colorClass.startsWith('#')) return colorClass;
        // Simple fallback map for tailwind classes to hex if needed, but let's rely on defaults for now
        return '#cbd5e1';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Periode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Per Week</SelectItem>
                            <SelectItem value="month">Per Maand</SelectItem>
                            <SelectItem value="quarter">Per Kwartaal</SelectItem>
                            <SelectItem value="year">Per Jaar</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <Card key={cat}>
                        <CardContent className="pt-6">
                            <div className="text-sm font-medium text-muted-foreground capitalize">{cat}</div>
                            <div className="text-2xl font-bold">{formatCurrency(totals[cat])}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Verbruik per {period === 'month' ? 'Maand' : period === 'week' ? 'Week' : period === 'quarter' ? 'Kwartaal' : 'Jaar'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        {loading && data.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <LoadingSpinner size="default" />
                            </div>
                        ) : data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                    {categories.map((cat, index) => (
                                        <Bar 
                                            key={cat} 
                                            dataKey={cat} 
                                            stackId="a" 
                                            fill={Object.values(colors)[index % Object.values(colors).length]} 
                                            name={cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                Geen data beschikbaar voor deze periode
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}