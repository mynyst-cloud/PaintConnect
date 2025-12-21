import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ArrowRight, Image, MessageSquare, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const statusColors = {
    'nieuw': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200',
    'planning': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200',
    'in_uitvoering': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200',
    'afgerond': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200',
    'on_hold': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200',
    'geannuleerd': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200',
    'offerte': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200',
    // Backwards compatibility
    'niet_gestart': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200',
    'bijna_klaar': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200'
};

const statusLabels = {
    'nieuw': 'Nieuw',
    'planning': 'Planning',
    'in_uitvoering': 'In uitvoering',
    'afgerond': 'Afgerond',
    'on_hold': 'On Hold',
    'geannuleerd': 'Geannuleerd',
    'offerte': 'Offerte',
    // Backwards compatibility
    'niet_gestart': 'Nieuw',
    'bijna_klaar': 'Planning'
};

export default function ProjectCard({ project, onOpenDetails, updates, damages }) {
    const coverPhoto = project.cover_photo_url || project.thumbnail_url || project.photo_urls?.[0];
    const updatesCount = updates?.length || 0;
    const damagesCount = damages?.length || 0;

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onOpenDetails}>
            {coverPhoto && (
                <div className="w-full h-48 sm:h-64 overflow-hidden rounded-t-xl">
                    <img
                        src={coverPhoto}
                        alt={project.project_name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                        <CardTitle className="text-xl sm:text-2xl">{project.project_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{project.address}</span>
                        </CardDescription>
                    </div>
                    <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {project.description && (
                        <p className="text-gray-600 dark:text-slate-400 text-sm">{project.description}</p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600 dark:text-slate-400">
                        {project.start_date && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>Start: {format(new Date(project.start_date), 'dd MMM yyyy', { locale: nl })}</span>
                            </div>
                        )}
                        {project.expected_end_date && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>Verwacht klaar: {format(new Date(project.expected_end_date), 'dd MMM yyyy', { locale: nl })}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 border-t dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                            <Image className="w-4 h-4" />
                            <span>{updatesCount} {updatesCount === 1 ? 'update' : 'updates'}</span>
                        </div>
                        {damagesCount > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                                <AlertTriangle className="w-4 h-4" />
                                <span>{damagesCount} {damagesCount === 1 ? 'melding' : 'meldingen'}</span>
                            </div>
                        )}
                    </div>

                    <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600" size="lg">
                        Bekijk details
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}