import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { 
  CompanyVehicle, VehicleAssignment,
  Subcontractor, SubcontractorAssignment,
  ProjectTask, EmployeeDaySchedule,
  MaterialDelivery
} from "@/api/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, ChevronRight, Plus, Search, 
  ChevronDown, ChevronUp, Car, Users, ClipboardList, Truck,
  MapPin, Wrench, X, Clock, MoreHorizontal, Pencil
} from "lucide-react";
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, 
  addWeeks, subWeeks, isToday, getWeek, addDays, parseISO
} from "date-fns";
import { nl } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Import modals
import VehicleManager from "@/components/weekplanning/VehicleManager";
import VehicleAssignmentModal from "@/components/weekplanning/VehicleAssignmentModal";
import SubcontractorManager from "@/components/weekplanning/SubcontractorManager";
import SubcontractorAssignmentModal from "@/components/weekplanning/SubcontractorAssignmentModal";
import TaskManager from "@/components/weekplanning/TaskManager";
import EmployeeScheduleModal from "@/components/weekplanning/EmployeeScheduleModal";

// ========================================
// BADGE COMPONENTS (matching Planning style)
// ========================================

function EmployeeBadge({ schedule, user, onRemove, isAdmin }) {
  const displayName = user?.full_name?.split(' ')[0] || schedule.user_email.split('@')[0];
  const initials = displayName.substring(0, 2).toUpperCase();
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs font-medium">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
              {initials}
            </div>
            <span className="max-w-[50px] truncate">{displayName}</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-[9px]">
              {schedule.start_time?.slice(0, 5) || '08:00'}-{schedule.end_time?.slice(0, 5) || '17:00'}
            </span>
            {isAdmin && onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-emerald-500 hover:text-emerald-700" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <div className="font-medium">{user?.full_name || schedule.user_email}</div>
            <div className="text-gray-400">{schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function VehicleBadge({ assignment, vehicle, onRemove, isAdmin }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
            <Car className="w-3 h-3" />
            <span className="max-w-[60px] truncate">{vehicle?.name || 'Auto'}</span>
            {isAdmin && onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-blue-500 hover:text-blue-700" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <div className="font-medium">{vehicle?.name}</div>
            <div className="text-gray-400">{vehicle?.license_plate}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SubcontractorBadge({ assignment, subcontractor, onRemove, isAdmin }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded text-xs font-medium">
            <Wrench className="w-3 h-3" />
            <span className="max-w-[60px] truncate">{subcontractor?.name || 'Onderaannemer'}</span>
            {isAdmin && onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-amber-500 hover:text-amber-700" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <div className="font-medium">{subcontractor?.name}</div>
            {subcontractor?.specialty && <div className="text-gray-400">{subcontractor.specialty}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TaskBadge({ task, onRemove, isAdmin }) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    normal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  };
  
  return (
    <div className={cn(
      "group relative inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
      priorityColors[task.priority || 'normal']
    )}>
      <ClipboardList className="w-3 h-3" />
      <span className="max-w-[80px] truncate">{task.title}</span>
      {isAdmin && onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function DeliveryBadge({ delivery, onRemove, isAdmin }) {
  const typeColors = {
    delivery: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    pickup: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    removal: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
  };
  
  return (
    <div className={cn(
      "group relative inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
      typeColors[delivery.delivery_type || 'delivery']
    )}>
      <Truck className="w-3 h-3" />
      <span className="max-w-[50px] truncate">{delivery.supplier_name}</span>
      {delivery.scheduled_time && (
        <span className="text-[9px] opacity-75">{delivery.scheduled_time.slice(0, 5)}</span>
      )}
      {isAdmin && onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ========================================
// RESOURCE ROW COMPONENT
// ========================================

function ResourceRow({ icon: Icon, label, weekDays, renderDayContent, iconBgColor = "bg-gray-100 dark:bg-gray-700", isMobile = false }) {
  return (
    <div 
      className="grid border-t border-gray-100 dark:border-slate-700"
      style={{ 
        gridTemplateColumns: isMobile 
          ? `180px repeat(${weekDays.length}, minmax(80px, 80px))` 
          : `220px repeat(${weekDays.length}, minmax(100px, 1fr))` 
      }}
    >
      <div className={cn(
        "flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-700",
        isMobile ? "px-2 py-2 sticky left-0 z-10" : "px-3 py-2"
      )}>
        <div className={cn("rounded flex items-center justify-center", iconBgColor, isMobile ? "w-4 h-4" : "w-5 h-5")}>
          <Icon className={cn("text-gray-600 dark:text-gray-400", isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} />
        </div>
        <span className={cn("text-gray-500 dark:text-gray-400", isMobile ? "text-[10px]" : "text-xs")}>{label}</span>
      </div>
      {weekDays.map((day, idx) => (
        <div 
          key={idx}
          className={cn(
            "px-1.5 py-2 min-h-[40px] border-r border-gray-100 dark:border-slate-700 last:border-r-0",
            isToday(day) && "bg-emerald-50/50 dark:bg-emerald-900/10",
            (day.getDay() === 0 || day.getDay() === 6) && "bg-gray-50/50 dark:bg-slate-800/30"
          )}
        >
          {renderDayContent(day, idx)}
        </div>
      ))}
    </div>
  );
}

// ========================================
// COLOR CLASSES (matching Planning.jsx)
// ========================================

const colorClasses = {
  blue: { 
    bg: 'bg-blue-500 dark:bg-blue-600', 
    border: 'border-blue-600 dark:border-blue-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-blue-500 dark:bg-blue-600'
  },
  green: { 
    bg: 'bg-emerald-500 dark:bg-emerald-600', 
    border: 'border-emerald-600 dark:border-emerald-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-emerald-500 dark:bg-emerald-600'
  },
  yellow: { 
    bg: 'bg-amber-400 dark:bg-amber-500', 
    border: 'border-amber-500 dark:border-amber-400', 
    text: 'text-amber-900 dark:text-amber-900',
    bar: 'bg-amber-400 dark:bg-amber-500'
  },
  red: { 
    bg: 'bg-red-500 dark:bg-red-600', 
    border: 'border-red-600 dark:border-red-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-red-500 dark:bg-red-600'
  },
  purple: { 
    bg: 'bg-purple-500 dark:bg-purple-600', 
    border: 'border-purple-600 dark:border-purple-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-purple-500 dark:bg-purple-600'
  },
  pink: { 
    bg: 'bg-pink-500 dark:bg-pink-600', 
    border: 'border-pink-600 dark:border-pink-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-pink-500 dark:bg-pink-600'
  },
  indigo: { 
    bg: 'bg-indigo-500 dark:bg-indigo-600', 
    border: 'border-indigo-600 dark:border-indigo-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-indigo-500 dark:bg-indigo-600'
  },
  gray: { 
    bg: 'bg-slate-500 dark:bg-slate-600', 
    border: 'border-slate-600 dark:border-slate-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-slate-500 dark:bg-slate-600'
  },
  orange: { 
    bg: 'bg-orange-500 dark:bg-orange-600', 
    border: 'border-orange-600 dark:border-orange-500', 
    text: 'text-white dark:text-white',
    bar: 'bg-orange-500 dark:bg-orange-600'
  }
};

// ========================================
// PROJECT ROW COMPONENT
// ========================================

function ProjectRow({
  project,
  weekDays,
  isExpanded,
  onToggle,
  getProjectDayData,
  vehicles,
  subcontractors,
  users,
  isAdmin,
  onAddTask,
  onAddEmployee,
  onAddVehicle,
  onAddSubcontractor,
  onRefresh,
  onProjectClick,
  isMobile = false
}) {
  // Get project color
  const projectColor = project?.calendar_color || 'blue';
  const colorClass = colorClasses[projectColor] || colorClasses.blue;
  const assignedPainters = useMemo(() => {
    if (!project.assigned_painters || !Array.isArray(project.assigned_painters)) return [];
    return project.assigned_painters.map(email => {
      const user = users.find(u => u.email === email);
      return user || { email, full_name: email.split('@')[0] };
    });
  }, [project.assigned_painters, users]);

  const handleRemoveEmployee = async (scheduleId) => {
    // Check if this is a virtual schedule (from assigned_painters)
    if (scheduleId.startsWith('virtual-')) {
      alert('Deze werknemer komt automatisch uit de toegewezen schilders van het project. Verwijder de toewijzing via Project Details om deze werknemer te verwijderen.');
      return;
    }
    
    if (!confirm('Toewijzing verwijderen?')) return;
    
    try {
      await EmployeeDaySchedule.delete(scheduleId);
      onRefresh();
    } catch (error) {
      console.error('Error removing employee schedule:', error);
      alert('Kon de toewijzing niet verwijderen. Mogelijk bestaat de database tabel nog niet.');
    }
  };

  const handleRemoveVehicle = async (assignmentId) => {
    if (!confirm('Voertuig verwijderen?')) return;
    await VehicleAssignment.delete(assignmentId);
    onRefresh();
  };

  const handleRemoveSubcontractor = async (assignmentId) => {
    if (!confirm('Onderaannemer verwijderen?')) return;
    await SubcontractorAssignment.delete(assignmentId);
    onRefresh();
  };

  const handleRemoveTask = async (taskId) => {
    if (!confirm('Taak verwijderen?')) return;
    await ProjectTask.delete(taskId);
    onRefresh();
  };

  const handleRemoveDelivery = async (deliveryId) => {
    if (!confirm('Levering verwijderen?')) return;
    await MaterialDelivery.delete(deliveryId);
    onRefresh();
  };

  return (
    <div className="group">
      {/* Project Header Row */}
      <div 
        className={cn(
          "grid cursor-pointer transition-colors",
          isExpanded ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-800"
        )}
        style={{ 
          gridTemplateColumns: isMobile 
            ? `180px repeat(${weekDays.length}, minmax(80px, 80px))` 
            : `220px repeat(${weekDays.length}, minmax(100px, 1fr))` 
        }}
        onClick={onToggle}
      >
        {/* Project Info */}
        <div className={cn(
          "flex items-center gap-2 border-r border-gray-100 dark:border-slate-700",
          isMobile ? "px-2 py-2 sticky left-0 z-10 bg-inherit" : "px-3 py-2.5"
        )}>
          {/* Color bar */}
          <div className={cn("w-1 h-full min-h-[40px] rounded-full", colorClass.bar)} />
          
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex-shrink-0 w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="text-xs">{isExpanded ? 'Inklappen' : 'Uitklappen'}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onProjectClick(project); }}
          >
            <div className="font-medium text-sm text-gray-900 dark:text-white truncate hover:text-emerald-600 dark:hover:text-emerald-400">
              {project.project_name}
            </div>
            {project.address && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{project.address}</span>
              </div>
            )}
          </div>

          {/* Assigned painters avatars */}
          {assignedPainters.length > 0 && (
            <div className="flex -space-x-1">
              {assignedPainters.slice(0, 2).map((painter, idx) => (
                <div 
                  key={painter.email || idx}
                  className="w-5 h-5 rounded-full bg-emerald-500 border border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-white"
                  title={painter.full_name || painter.email}
                >
                  {(painter.full_name || painter.email).substring(0, 2).toUpperCase()}
                </div>
              ))}
              {assignedPainters.length > 2 && (
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 border border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-medium text-gray-600 dark:text-gray-400">
                  +{assignedPainters.length - 2}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Day Cells (collapsed view) */}
        {weekDays.map((day, idx) => {
          const dayData = getProjectDayData(project.id, day);
          const totalItems = 
            dayData.employees.length + 
            dayData.vehicles.length + 
            dayData.subcontractors.length + 
            dayData.tasks.length +
            dayData.deliveries.length;
          
          return (
            <div 
              key={idx}
              className={cn(
                "border-r border-gray-100 dark:border-slate-700 last:border-r-0",
                isToday(day) && "bg-emerald-50/30 dark:bg-emerald-900/10",
                (day.getDay() === 0 || day.getDay() === 6) && "bg-gray-50/30 dark:bg-slate-800/20",
                isMobile ? "px-1 py-2 min-w-[80px]" : "px-1.5 py-2.5"
              )}
            >
              {!isExpanded && totalItems > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {dayData.employees.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Users className="w-2 h-2 mr-0.5" />
                      {dayData.employees.length}
                    </Badge>
                  )}
                  {dayData.vehicles.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <Car className="w-2 h-2 mr-0.5" />
                      {dayData.vehicles.length}
                    </Badge>
                  )}
                  {dayData.tasks.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      <ClipboardList className="w-2 h-2 mr-0.5" />
                      {dayData.tasks.length}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-white dark:bg-slate-800/50"
          >
            {/* Werknemers Row */}
            <ResourceRow
              icon={Users}
              label="Werknemers"
              weekDays={weekDays}
              iconBgColor="bg-emerald-100 dark:bg-emerald-900/40"
              isMobile={isMobile}
              renderDayContent={(day) => {
                const dayData = getProjectDayData(project.id, day);
                return (
                  <div className="flex flex-wrap gap-1">
                    {dayData.employees.map(schedule => {
                      const user = users.find(u => u.email === schedule.user_email);
                      const isVirtual = schedule.is_virtual || schedule.id.startsWith('virtual-');
                      
                      return (
                        <EmployeeBadge
                          key={schedule.id}
                          schedule={schedule}
                          user={user}
                          isAdmin={isAdmin}
                          onRemove={isVirtual ? null : () => handleRemoveEmployee(schedule.id)}
                        />
                      );
                    })}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddEmployee(day); }}
                        className="text-[9px] text-gray-400 hover:text-emerald-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              }}
            />

            {/* Voertuigen Row */}
            <ResourceRow
              icon={Car}
              label="Auto's"
              weekDays={weekDays}
              iconBgColor="bg-blue-100 dark:bg-blue-900/40"
              isMobile={isMobile}
              renderDayContent={(day) => {
                const dayData = getProjectDayData(project.id, day);
                return (
                  <div className="flex flex-wrap gap-1">
                    {dayData.vehicles.map(assignment => {
                      const vehicle = vehicles.find(v => v.id === assignment.vehicle_id);
                      return (
                        <VehicleBadge
                          key={assignment.id}
                          assignment={assignment}
                          vehicle={vehicle}
                          isAdmin={isAdmin}
                          onRemove={() => handleRemoveVehicle(assignment.id)}
                        />
                      );
                    })}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddVehicle(project.id, day); }}
                        className="text-[9px] text-gray-400 hover:text-blue-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              }}
            />

            {/* Onderaannemers Row */}
            <ResourceRow
              icon={Wrench}
              label="Onderaannemers"
              weekDays={weekDays}
              iconBgColor="bg-amber-100 dark:bg-amber-900/40"
              isMobile={isMobile}
              renderDayContent={(day) => {
                const dayData = getProjectDayData(project.id, day);
                return (
                  <div className="flex flex-wrap gap-1">
                    {dayData.subcontractors.map(assignment => {
                      const sub = subcontractors.find(s => s.id === assignment.subcontractor_id);
                      return (
                        <SubcontractorBadge
                          key={assignment.id}
                          assignment={assignment}
                          subcontractor={sub}
                          isAdmin={isAdmin}
                          onRemove={() => handleRemoveSubcontractor(assignment.id)}
                        />
                      );
                    })}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddSubcontractor(project.id, day); }}
                        className="text-[9px] text-gray-400 hover:text-amber-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              }}
            />

            {/* Taken Row */}
            <ResourceRow
              icon={ClipboardList}
              label="Taken"
              weekDays={weekDays}
              iconBgColor="bg-purple-100 dark:bg-purple-900/40"
              isMobile={isMobile}
              renderDayContent={(day) => {
                const dayData = getProjectDayData(project.id, day);
                return (
                  <div className="flex flex-wrap gap-1">
                    {dayData.tasks.map(task => (
                      <TaskBadge
                        key={task.id}
                        task={task}
                        isAdmin={isAdmin}
                        onRemove={() => handleRemoveTask(task.id)}
                      />
                    ))}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddTask(day); }}
                        className="text-[9px] text-gray-400 hover:text-purple-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              }}
            />

            {/* Leveringen Row */}
            <ResourceRow
              icon={Truck}
              label="Leveringen"
              weekDays={weekDays}
              iconBgColor="bg-green-100 dark:bg-green-900/40"
              isMobile={isMobile}
              renderDayContent={(day) => {
                const dayData = getProjectDayData(project.id, day);
                return (
                  <div className="flex flex-wrap gap-1">
                    {dayData.deliveries.map(delivery => (
                      <DeliveryBadge
                        key={delivery.id}
                        delivery={delivery}
                        isAdmin={isAdmin}
                        onRemove={() => handleRemoveDelivery(delivery.id)}
                      />
                    ))}
                  </div>
                );
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function WeekPlanningView({ 
  projects, 
  users, 
  company, 
  isAdmin, 
  onRefresh,
  onProjectClick 
}) {
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  
  // Modal states
  const [showVehicleManager, setShowVehicleManager] = useState(false);
  const [showSubcontractorManager, setShowSubcontractorManager] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(null);
  const [showVehicleAssignmentModal, setShowVehicleAssignmentModal] = useState(null);
  const [showSubcontractorAssignmentModal, setShowSubcontractorAssignmentModal] = useState(null);
  const processedWeekRef = useRef(null);

  // Calculate week days
  const weekDays = useMemo(() => {
    // Reset processed week ref when week changes
    const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
    if (processedWeekRef.current !== weekKey) {
      processedWeekRef.current = null;
    }
    return eachDayOfInterval({ 
      start: currentWeekStart, 
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }) 
    });
  }, [currentWeekStart]);

  // Fetch week planning data
  const { data: weekData } = useQuery({
    queryKey: ['week-planning-resources', company?.id, format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!company?.id) return {};
      
      try {
        const [vehicles, vehicleAssignments, subcontractors, subcontractorAssignments, tasks, employeeSchedules, deliveries] = await Promise.all([
          CompanyVehicle.filter({ company_id: company.id, status: 'active' }).catch(() => []),
          VehicleAssignment.filter({ company_id: company.id }).catch(() => []),
          Subcontractor.filter({ company_id: company.id, status: 'active' }).catch(() => []),
          SubcontractorAssignment.filter({ company_id: company.id }).catch(() => []),
          ProjectTask.filter({ company_id: company.id }).catch(() => []),
          EmployeeDaySchedule.filter({ company_id: company.id }).catch(() => []),
          MaterialDelivery.filter({ company_id: company.id }).catch(() => [])
        ]);

        return {
          vehicles: vehicles || [],
          vehicleAssignments: vehicleAssignments || [],
          subcontractors: subcontractors || [],
          subcontractorAssignments: subcontractorAssignments || [],
          tasks: tasks || [],
          employeeSchedules: employeeSchedules || [],
          deliveries: deliveries || []
        };
      } catch (error) {
        console.warn('[WeekPlanning] Some tables may not exist yet. Run SQL migration script:', error);
        // Return empty arrays if tables don't exist
        return {
          vehicles: [],
          vehicleAssignments: [],
          subcontractors: [],
          subcontractorAssignments: [],
          tasks: [],
          employeeSchedules: [],
          deliveries: []
        };
      }
    },
    enabled: !!company?.id,
    staleTime: 1000 * 60
  });

  const { 
    vehicles = [], vehicleAssignments = [], 
    subcontractors = [], subcontractorAssignments = [], 
    tasks = [], employeeSchedules = [], deliveries = [] 
  } = weekData || {};

  // Filter projects by search and date
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.project_name?.toLowerCase().includes(query) ||
        p.client_name?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
      );
    }
    
    // Filter to projects active in current week
    return filtered.filter(project => {
      if (!project.start_date) return false;
      const projectStart = parseISO(project.start_date);
      const projectEnd = project.expected_end_date ? parseISO(project.expected_end_date) : projectStart;
      const weekEnd = weekDays[weekDays.length - 1];
      return !(projectEnd < currentWeekStart || projectStart > weekEnd);
    });
  }, [projects, searchQuery, currentWeekStart, weekDays]);

  // Toggle project expansion
  const toggleProject = useCallback((projectId) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // Get data for a specific project on a specific day
  const getProjectDayData = useCallback((projectId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Get database employee schedules
    const dbEmployees = employeeSchedules.filter(s => s.project_id === projectId && s.scheduled_date === dateStr);
    
    // Find the project to get assigned_painters
    const project = projects.find(p => p.id === projectId);
    
    // Create virtual employee schedules for assigned painters that don't have a DB schedule
    const virtualEmployees = [];
    if (project?.assigned_painters && Array.isArray(project.assigned_painters)) {
      const projectStart = project.start_date ? parseISO(project.start_date) : null;
      const projectEnd = project.expected_end_date ? parseISO(project.expected_end_date) : projectStart;
      
      // Only add virtual schedules for days within project period
      const isWithinProjectPeriod = projectStart && projectEnd && date >= projectStart && date <= projectEnd;
      
      if (isWithinProjectPeriod) {
        for (const painterEmail of project.assigned_painters) {
          // Check if painter already has a DB schedule
          const hasDbSchedule = dbEmployees.some(s => s.user_email === painterEmail);
          if (!hasDbSchedule) {
            virtualEmployees.push({
              id: `virtual-${projectId}-${dateStr}-${painterEmail}`,
              project_id: projectId,
              scheduled_date: dateStr,
              user_email: painterEmail,
              start_time: project.work_start_time || '08:00',
              end_time: project.work_end_time || '17:00',
              notes: null,
              is_virtual: true // Mark as virtual so we know it's from assigned_painters
            });
          }
        }
      }
    }
    
    return {
      employees: [...dbEmployees, ...virtualEmployees],
      vehicles: vehicleAssignments.filter(a => a.project_id === projectId && a.assigned_date === dateStr),
      subcontractors: subcontractorAssignments.filter(a => a.project_id === projectId && a.assigned_date === dateStr),
      tasks: tasks.filter(t => t.project_id === projectId && t.scheduled_date === dateStr),
      deliveries: deliveries.filter(d => d.project_id === projectId && d.scheduled_date === dateStr)
    };
  }, [employeeSchedules, vehicleAssignments, subcontractorAssignments, tasks, deliveries, projects]);

  // Refetch all data
  const refetchAll = useCallback(async () => {
    await queryClient.invalidateQueries(['week-planning-resources']);
    onRefresh();
  }, [queryClient, onRefresh]);

  // Automatically create EmployeeDaySchedule for assigned_painters
  useEffect(() => {
    const autoAssignPainters = async () => {
      // Wait for all required data to be loaded
      if (!company?.id) {
        console.log('[WeekPlanning] Skipping - no company ID');
        return;
      }
      if (!weekData) {
        console.log('[WeekPlanning] Skipping - weekData not loaded yet');
        return;
      }
      if (weekData.employeeSchedules === undefined) {
        console.log('[WeekPlanning] Skipping - employeeSchedules not loaded yet');
        return;
      }
      if (!filteredProjects.length) {
        console.log('[WeekPlanning] Skipping - no filtered projects');
        return;
      }
      
      const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
      // Skip if we already processed this week
      if (processedWeekRef.current === weekKey) {
        console.log('[WeekPlanning] Skipping auto-assign - already processed week', weekKey);
        return;
      }
      
      console.log('[WeekPlanning] Starting auto-assign for week', weekKey, {
        projects: filteredProjects.length,
        schedules: weekData.employeeSchedules.length
      });
      
      const schedulesToCreate = [];
      
      for (const project of filteredProjects) {
        if (!project.assigned_painters || !Array.isArray(project.assigned_painters) || project.assigned_painters.length === 0) {
          console.log('[WeekPlanning] Skipping project - no assigned painters', project.id);
          continue;
        }
        if (!project.start_date) {
          console.log('[WeekPlanning] Skipping project - no start date', project.id);
          continue;
        }
        
        const projectStart = parseISO(project.start_date);
        const projectEnd = project.expected_end_date ? parseISO(project.expected_end_date) : projectStart;
        
        console.log('[WeekPlanning] Processing project', project.project_name, {
          assignedPainters: project.assigned_painters.length,
          startDate: project.start_date,
          endDate: project.expected_end_date
        });
        
        // Check each day in the week
        for (const day of weekDays) {
          // Only create schedules for days within project period
          if (day < projectStart || day > projectEnd) continue;
          
          const dateStr = format(day, 'yyyy-MM-dd');
          
          // Check each assigned painter
          for (const painterEmail of project.assigned_painters) {
            // Check if schedule already exists
            const exists = weekData.employeeSchedules.some(
              s => s.project_id === project.id && 
                   s.scheduled_date === dateStr && 
                   s.user_email === painterEmail
            );
            
            if (!exists) {
              // Use project work times if available, otherwise defaults
              const startTime = project.work_start_time || '08:00';
              const endTime = project.work_end_time || '17:00';
              
              console.log('[WeekPlanning] Adding schedule to create', {
                project: project.project_name,
                painter: painterEmail,
                date: dateStr,
                times: `${startTime}-${endTime}`
              });
              
              schedulesToCreate.push({
                company_id: company.id,
                project_id: project.id,
                scheduled_date: dateStr,
                user_email: painterEmail,
                start_time: startTime,
                end_time: endTime,
                notes: null
              });
            } else {
              console.log('[WeekPlanning] Schedule already exists', {
                project: project.project_name,
                painter: painterEmail,
                date: dateStr
              });
            }
          }
        }
      }
      
      // Create all schedules in batch
      if (schedulesToCreate.length > 0) {
        console.log('[WeekPlanning] Creating', schedulesToCreate.length, 'schedules');
        try {
          const results = await Promise.allSettled(
            schedulesToCreate.map(schedule => EmployeeDaySchedule.create(schedule))
          );
          
          // Count successes and failures
          let successCount = 0;
          let conflictCount = 0;
          let otherErrors = 0;
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              successCount++;
            } else {
              const error = result.reason;
              // 409 Conflict = unique constraint violation = schedule already exists (okay to ignore)
              if (error.code === '23505' || error.code === 'PGRST116' || (error.message && error.message.includes('unique constraint'))) {
                conflictCount++;
                console.log('[WeekPlanning] Schedule already exists (409), skipping:', schedulesToCreate[index]);
              } else {
                otherErrors++;
                console.error('[WeekPlanning] Error creating schedule:', error, schedulesToCreate[index]);
              }
            }
          });
          
          console.log('[WeekPlanning] Schedule creation complete:', {
            success: successCount,
            conflicts: conflictCount,
            errors: otherErrors
          });
          
          // Mark as processed if all went well (success or conflicts are okay, other errors are not)
          if (otherErrors === 0) {
            processedWeekRef.current = weekKey;
            // Refetch data after creating schedules
            await queryClient.invalidateQueries(['week-planning-resources']);
            onRefresh();
          } else {
            console.warn('[WeekPlanning] Not marking as processed due to errors');
          }
        } catch (error) {
          console.error('[WeekPlanning] Unexpected error in auto-assign:', error);
          // Don't mark as processed on unexpected errors
        }
      } else {
        console.log('[WeekPlanning] No schedules to create');
        // Mark as processed even if no schedules to create
        processedWeekRef.current = weekKey;
      }
    };
    
    autoAssignPainters();
  }, [company?.id, weekData, filteredProjects, weekDays, currentWeekStart, queryClient, onRefresh]);

  // Navigation
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const goToPrevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));

  const weekNumber = getWeek(currentWeekStart, { weekStartsOn: 1 });

  return (
    <div className="space-y-4">
      {/* Week Navigation Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3">
        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPrevWeek} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center min-w-[140px]">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Week {weekNumber}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {format(currentWeekStart, 'd MMM', { locale: nl })} - {format(weekDays[weekDays.length - 1], 'd MMM yyyy', { locale: nl })}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
              Vandaag
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Zoek project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 w-40 text-sm"
              />
            </div>

            {/* Management buttons */}
            {isAdmin && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVehicleManager(true)}
                  className="h-8 text-xs"
                >
                  <Car className="w-3.5 h-3.5 mr-1" />
                  Voertuigen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSubcontractorManager(true)}
                  className="h-8 text-xs"
                >
                  <Users className="w-3.5 h-3.5 mr-1" />
                  Onderaannemers
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPrevWeek} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center flex-1 px-2">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Week {weekNumber}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {format(currentWeekStart, 'd MMM', { locale: nl })} - {format(weekDays[weekDays.length - 1], 'd MMM', { locale: nl })}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search - Mobile */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Zoek project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-sm w-full"
              />
            </div>
            
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-8 px-2">
              Vandaag
            </Button>
          </div>

          {/* Management buttons - Mobile */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowVehicleManager(true)}
                className="h-8 text-xs flex-1"
              >
                <Car className="w-3.5 h-3.5 mr-1" />
                Voertuigen
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSubcontractorManager(true)}
                className="h-8 text-xs flex-1"
              >
                <Users className="w-3.5 h-3.5 mr-1" />
                Onderaannemers
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Week Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {/* Desktop Grid */}
        <div className="hidden md:block">
          {/* Header - Days */}
          <div 
            className="grid border-b border-gray-200 dark:border-slate-700"
            style={{ gridTemplateColumns: `220px repeat(${weekDays.length}, minmax(100px, 1fr))` }}
          >
          <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border-r border-gray-200 dark:border-slate-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Project</span>
          </div>
          {weekDays.map((day, idx) => {
            const dayIsToday = isToday(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            
            return (
              <div 
                key={idx}
                className={cn(
                  "px-2 py-2 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0",
                  isWeekend ? "bg-gray-100/50 dark:bg-slate-800/50" : "bg-gray-50 dark:bg-slate-900/50",
                  dayIsToday && "bg-emerald-50 dark:bg-emerald-900/20"
                )}
              >
                <div className={cn(
                  "text-[10px] font-semibold uppercase",
                  dayIsToday ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                )}>
                  {format(day, 'EEE', { locale: nl })}
                </div>
                <div className={cn(
                  "text-sm font-bold",
                  dayIsToday ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project Rows */}
        <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Geen projecten gevonden voor deze week</p>
            </div>
          ) : (
            filteredProjects.map(project => (
              <ProjectRow
                key={project.id}
                project={project}
                weekDays={weekDays}
                isExpanded={expandedProjects.has(project.id)}
                onToggle={() => toggleProject(project.id)}
                getProjectDayData={getProjectDayData}
                vehicles={vehicles}
                subcontractors={subcontractors}
                users={users}
                isAdmin={isAdmin}
                onAddTask={(date) => setShowTaskModal({ projectId: project.id, date })}
                onAddEmployee={(date) => setShowEmployeeModal({ projectId: project.id, date })}
                onAddVehicle={(projectId, date) => setShowVehicleAssignmentModal({ projectId, date })}
                onAddSubcontractor={(projectId, date) => setShowSubcontractorAssignmentModal({ projectId, date })}
                onRefresh={refetchAll}
                onProjectClick={onProjectClick}
              />
            ))
          )}
        </div>
        </div>

        {/* Mobile: Horizontally scrollable grid */}
        <div className="md:hidden overflow-x-auto -mx-4 px-4">
          <div className="inline-block min-w-full">
            {/* Header - Days */}
            <div 
              className="grid border-b border-gray-200 dark:border-slate-700"
              style={{ gridTemplateColumns: `180px repeat(${weekDays.length}, minmax(80px, 80px))` }}
            >
              <div className="px-2 py-2 bg-gray-50 dark:bg-slate-900/50 border-r border-gray-200 dark:border-slate-700 sticky left-0 z-10">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Project</span>
              </div>
              {weekDays.map((day, idx) => {
                const dayIsToday = isToday(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "px-1 py-2 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0 min-w-[80px]",
                      isWeekend ? "bg-gray-100/50 dark:bg-slate-800/50" : "bg-gray-50 dark:bg-slate-900/50",
                      dayIsToday && "bg-emerald-50 dark:bg-emerald-900/20"
                    )}
                  >
                    <div className={cn(
                      "text-[9px] font-semibold uppercase",
                      dayIsToday ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {format(day, 'EEE', { locale: nl })}
                    </div>
                    <div className={cn(
                      "text-xs font-bold",
                      dayIsToday ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Project Rows - Mobile */}
            <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Geen projecten gevonden voor deze week</p>
                </div>
              ) : (
                filteredProjects.map(project => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    weekDays={weekDays}
                    isExpanded={expandedProjects.has(project.id)}
                    onToggle={() => toggleProject(project.id)}
                    getProjectDayData={getProjectDayData}
                    vehicles={vehicles}
                    subcontractors={subcontractors}
                    users={users}
                    isAdmin={isAdmin}
                      onAddTask={(date) => setShowTaskModal({ projectId: project.id, date })}
                      onAddEmployee={(date) => setShowEmployeeModal({ projectId: project.id, date })}
                      onAddVehicle={(projectId, date) => setShowVehicleAssignmentModal({ projectId, date })}
                      onAddSubcontractor={(projectId, date) => setShowSubcontractorAssignmentModal({ projectId, date })}
                      onRefresh={refetchAll}
                      onProjectClick={onProjectClick}
                    isMobile={true}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showVehicleManager && (
          <VehicleManager
            companyId={company?.id}
            vehicles={vehicles}
            onClose={() => setShowVehicleManager(false)}
            onRefresh={refetchAll}
          />
        )}

        {showSubcontractorManager && (
          <SubcontractorManager
            companyId={company?.id}
            subcontractors={subcontractors}
            onClose={() => setShowSubcontractorManager(false)}
            onRefresh={refetchAll}
          />
        )}

        {showTaskModal && (
          <TaskManager
            companyId={company?.id}
            projectId={showTaskModal.projectId}
            date={showTaskModal.date}
            users={users}
            onClose={() => setShowTaskModal(null)}
            onRefresh={refetchAll}
          />
        )}

        {showEmployeeModal && (
          <EmployeeScheduleModal
            companyId={company?.id}
            projectId={showEmployeeModal.projectId}
            date={showEmployeeModal.date}
            users={users}
            onClose={() => setShowEmployeeModal(null)}
            onRefresh={refetchAll}
          />
        )}

        {showVehicleAssignmentModal && (
          <VehicleAssignmentModal
            companyId={company?.id}
            projectId={showVehicleAssignmentModal.projectId}
            date={showVehicleAssignmentModal.date}
            vehicles={vehicles}
            onClose={() => setShowVehicleAssignmentModal(null)}
            onRefresh={refetchAll}
          />
        )}

        {showSubcontractorAssignmentModal && (
          <SubcontractorAssignmentModal
            companyId={company?.id}
            projectId={showSubcontractorAssignmentModal.projectId}
            date={showSubcontractorAssignmentModal.date}
            subcontractors={subcontractors}
            onClose={() => setShowSubcontractorAssignmentModal(null)}
            onRefresh={refetchAll}
          />
        )}
        </AnimatePresence>
    </div>
  );
}

