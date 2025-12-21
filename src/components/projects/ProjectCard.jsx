import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Calendar,
  Eye,
  Trash2,
  MapPin,
  MoreVertical,
  Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusLabels = {
  // Nieuwe geldige statussen
  nieuw: "Nieuw",
  planning: "Planning",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  on_hold: "On Hold",
  geannuleerd: "Geannuleerd",
  offerte: "Offerte",
  // Backwards compatibility (oude statussen)
  niet_gestart: "Nieuw",
  bijna_klaar: "Planning",
};

const statusColors = {
  // Nieuwe geldige statussen
  nieuw: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_uitvoering: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  afgerond: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  geannuleerd: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  offerte: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  // Backwards compatibility (oude statussen)
  niet_gestart: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
  bijna_klaar: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const colorClasses = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500'
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), "d MMM yyyy", { locale: nl });
  } catch (error) {
    return dateString;
  }
};

export default function ProjectCard({ project, onDelete, onViewDetails, isAdmin }) {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const { progress, isOverdue } = React.useMemo(() => {
    if (!project.start_date || !project.expected_end_date) return { progress: project.progress_percentage || 0, isOverdue: false };
    const start = parseISO(project.start_date);
    const end = parseISO(project.expected_end_date);
    const now = new Date();
    if (now < start) return { progress: 0, isOverdue: false };
    const overdue = now > end && project.status !== 'afgerond';
    const totalDuration = end.getTime() - start.getTime();
    if (totalDuration <= 0 || now >= end) return { progress: 100, isOverdue: overdue };
    const elapsed = now.getTime() - start.getTime();
    return { progress: Math.min(100, Math.round((elapsed / totalDuration) * 100)), isOverdue: overdue };
  }, [project.start_date, project.expected_end_date, project.status, project.progress_percentage]);

  const displayProgress = project.progress_percentage ?? progress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-300 border-0 hover:-translate-y-1">
        <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0" onClick={() => onViewDetails(project)} style={{cursor: 'pointer'}}>
                {project.thumbnail_url ? (
                  <div className="relative">
                    {!imageLoaded && (
                      <div className="absolute inset-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse" />
                    )}
                    <img
                      src={project.thumbnail_url}
                      alt={project.project_name}
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => setImageLoaded(true)}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      style={{ aspectRatio: '1/1' }}
                    />
                  </div>
                ) : (
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center border border-gray-200 dark:border-slate-600`}
                >
                  <span className="text-sm md:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {project.project_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm md:text-lg font-bold text-gray-900 dark:text-slate-100 truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer" onClick={() => onViewDetails(project)} title={project.project_name}>
                  {project.project_name}
                </CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs md:text-sm text-gray-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-500 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate">{project.client_name}</span>
                  </div>
                  {project.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-500 dark:text-slate-500 flex-shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Badge variant="outline" className={`text-xs font-medium border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 ${isOverdue ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : ''}`}>
                {displayProgress}%
              </Badge>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                      <MoreVertical className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(project)}>
                      <Eye className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Bekijken & Bewerken
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 pt-0 flex-grow flex flex-col justify-end space-y-4">
          <div className="space-y-3">
            <Progress value={displayProgress} className={`h-2 md:h-3 bg-gray-200 dark:bg-slate-700 ${isOverdue ? '[&>div]:bg-red-500 dark:[&>div]:bg-red-400' : '[&>div]:bg-emerald-500 dark:[&>div]:bg-emerald-400'}`} />

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusColors[project.status] || statusColors.nieuw}>
                {statusLabels[project.status] || project.status}
              </Badge>
              {project.calendar_color && (
                <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${colorClasses[project.calendar_color] || 'bg-gray-500'} border-2 border-white dark:border-slate-800 shadow-sm`} title={`Kalender kleur: ${project.calendar_color}`} />
              )}
            </div>

            {(project.start_date || project.expected_end_date) && (
              <div className="text-xs md:text-sm text-gray-500 dark:text-slate-500 space-y-1">
                {project.start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Start: {formatDate(project.start_date)}</span>
                  </div>
                )}
                {project.expected_end_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      Einde: {formatDate(project.expected_end_date)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={() => onViewDetails(project)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm md:text-base"
            size="sm"
          >
            <Eye className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Bekijk Details
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}