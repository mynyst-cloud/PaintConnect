import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createPageUrl } from '@/components/utils';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, lastUpdate }) => {
    const calculateStatus = () => {
        const now = new Date();
        const endDate = parseISO(project.expected_end_date);
        const daysRemaining = differenceInDays(endDate, now);

        if (project.status === 'afgerond') return { label: "Afgerond", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-3 h-3"/> };
        if (daysRemaining < 0) return { label: "Vertraagd", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-3 h-3"/> };
        if (daysRemaining <= 3) return { label: "Bijna Klaar", color: "bg-orange-100 text-orange-800", icon: <Clock className="w-3 h-3"/> };
        return { label: "Op Schema", color: "bg-blue-100 text-blue-800", icon: <Zap className="w-3 h-3"/> };
    };

    const { label, color, icon } = calculateStatus();
    const progress = project.progress_percentage || 0;

    return (
        <Link to={createPageUrl('ProjectDetails') + '?id=' + project.id}>
            <Card className="h-full hover:shadow-md transition-shadow hover:-translate-y-0.5">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold truncate">{project.project_name}</CardTitle>
                    <p className="text-xs text-gray-500">{project.client_name}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs font-semibold">{progress}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <Badge className={`${color} font-medium flex items-center gap-1`}>
                            {icon} {label}
                        </Badge>
                        {lastUpdate && (
                            <p className="text-gray-500">
                                Update: {formatDistanceToNow(parseISO(lastUpdate.created_date), { locale: nl, addSuffix: true })}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default function ProjectStatusGrid({ projects, updates }) {
    if (!projects || projects.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-emerald-600"/>Actieve Projecten</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300"/>
                    <p>Geen actieve projecten gevonden.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-emerald-600"/>Actieve Projecten</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {projects.map(project => {
                        const lastUpdate = updates.find(u => u.project_id === project.id);
                        return <ProjectCard key={project.id} project={project} lastUpdate={lastUpdate} />;
                    })}
                </div>
            </CardContent>
        </Card>
    );
}