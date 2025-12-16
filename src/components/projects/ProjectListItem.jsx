import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { User, MapPin, Image as ImageIcon, Eye, Trash2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

const statusConfig = {
  niet_gestart: { label: "Niet gestart", color: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200" },
  in_uitvoering: { label: "In uitvoering", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  bijna_klaar: { label: "Bijna klaar", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  afgerond: { label: "Afgerond", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" }
};

export default function ProjectListItem({ project, onDelete, onViewDetails, isAdmin }) {
  const { progress, isOverdue } = React.useMemo(() => {
    const p = project || {};
    if (!p.start_date || !p.expected_end_date) return { progress: p.progress_percentage || 0, isOverdue: false };
    const start = parseISO(p.start_date);
    const end = parseISO(p.expected_end_date);
    const now = new Date();
    if (now < start) return { progress: 0, isOverdue: false };
    const overdue = now > end && p.status !== 'afgerond';
    const totalDuration = end.getTime() - start.getTime();
    if (totalDuration <= 0 || now >= end) return { progress: 100, isOverdue: overdue };
    const elapsed = now.getTime() - start.getTime();
    return { progress: Math.min(100, Math.round((elapsed / totalDuration) * 100)), isOverdue: overdue };
  }, [project]);
  
  const displayProgress = project.progress_percentage ?? progress;
  const statusInfo = statusConfig[project.status] || statusConfig.niet_gestart;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0 cursor-pointer" onClick={onViewDetails}>
      <div className="flex-shrink-0">
        {project.thumbnail_url ? (
          <img 
            src={project.thumbnail_url} 
            alt={project.project_name} 
            className="w-24 h-24 md:w-32 md:h-20 rounded-lg object-cover" 
          />
        ) : (
          <div className="w-24 h-24 md:w-32 md:h-20 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-grow w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {project.project_name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-slate-400 mt-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{project.client_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{project.address}</span>
              </div>
            </div>
          </div>
          <Badge className={`flex-shrink-0 ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 mb-1">
            <span>Voortgang</span>
            <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-emerald-600'}`}>
              {displayProgress}%
            </span>
          </div>
          <Progress 
            value={displayProgress} 
            className={`h-1.5 ${
              isOverdue 
                ? '[&>div]:bg-red-500 dark:[&>div]:bg-red-400' 
                : '[&>div]:bg-emerald-500 dark:[&>div]:bg-emerald-400'
            }`} 
          />
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2 self-start md:self-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-gray-500 dark:text-slate-500 w-24 text-right hidden md:block">
          {formatDistanceToNow(parseISO(project.updated_date || project.created_date), { 
            addSuffix: true, 
            locale: nl 
          })}
        </p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onViewDetails}
            className="h-8 w-8"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}