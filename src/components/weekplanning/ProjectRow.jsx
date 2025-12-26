import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, ChevronDown, MapPin, Users, Car, 
  Wrench, Truck, Plus, X, Clock, MoreHorizontal,
  Pencil, ClipboardList
} from "lucide-react";
import { format, isToday, parseISO, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  VehicleAssignment, SubcontractorAssignment, 
  EmployeeDaySchedule, ProjectTask, MaterialDelivery 
} from "@/api/entities";

// Resource Row Component
function ResourceRow({ 
  icon: Icon, 
  label, 
  weekDays, 
  renderDayContent,
  className,
  iconBgColor = "bg-slate-100 dark:bg-slate-700"
}) {
  return (
    <div 
      className={cn("grid border-t border-slate-100 dark:border-slate-700/50", className)}
      style={{ gridTemplateColumns: `280px repeat(${weekDays.length}, minmax(120px, 1fr))` }}
    >
      {/* Row Label */}
      <div className="px-4 py-2 flex items-center gap-2 bg-slate-25 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-700/50">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", iconBgColor)}>
          <Icon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>

      {/* Day Cells */}
      {weekDays.map((day, idx) => (
        <div 
          key={idx}
          className={cn(
            "px-2 py-2 min-h-[48px] border-r border-slate-100 dark:border-slate-700/50 last:border-r-0",
            isToday(day) && "bg-blue-50/50 dark:bg-blue-900/10",
            (day.getDay() === 0 || day.getDay() === 6) && "bg-slate-50/50 dark:bg-slate-800/30"
          )}
        >
          {renderDayContent(day, idx)}
        </div>
      ))}
    </div>
  );
}

// Employee Badge Component
function EmployeeBadge({ schedule, user, onRemove, isAdmin }) {
  const displayName = user?.full_name?.split(' ')[0] || schedule.user_email.split('@')[0];
  const initials = displayName.substring(0, 2).toUpperCase();
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
              {initials}
            </div>
            <span className="max-w-[60px] truncate">{displayName}</span>
            <span className="text-blue-500 dark:text-blue-400 text-[10px]">
              {schedule.start_time?.slice(0, 5) || '08:00'}-{schedule.end_time?.slice(0, 5) || '17:00'}
            </span>
            {isAdmin && onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
              >
                <X className="w-3 h-3 text-blue-500 hover:text-blue-700" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <div className="font-medium">{user?.full_name || schedule.user_email}</div>
            <div className="text-slate-400">{schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Vehicle Badge Component
function VehicleBadge({ assignment, vehicle, onRemove, isAdmin }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md text-xs font-medium">
            <Car className="w-3.5 h-3.5" />
            <span className="max-w-[80px] truncate">{vehicle?.name || 'Voertuig'}</span>
            {vehicle?.license_plate && (
              <span className="text-emerald-500 dark:text-emerald-400 text-[10px]">
                {vehicle.license_plate}
              </span>
            )}
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
            <div className="font-medium">{vehicle?.name}</div>
            <div className="text-slate-400">{vehicle?.license_plate}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Subcontractor Badge Component
function SubcontractorBadge({ assignment, subcontractor, onRemove, isAdmin }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative inline-flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-md text-xs font-medium">
            <Wrench className="w-3.5 h-3.5" />
            <span className="max-w-[80px] truncate">{subcontractor?.name || 'Onderaannemer'}</span>
            {subcontractor?.specialty && (
              <span className="text-orange-500 dark:text-orange-400 text-[10px]">
                {subcontractor.specialty}
              </span>
            )}
            {isAdmin && onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-orange-500 hover:text-orange-700" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <div className="font-medium">{subcontractor?.name}</div>
            {subcontractor?.specialty && <div className="text-slate-400">{subcontractor.specialty}</div>}
            {assignment.task_description && <div className="text-slate-400 mt-1">{assignment.task_description}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Task Badge Component
function TaskBadge({ task, onRemove, isAdmin }) {
  const priorityColors = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    normal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "group relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
            priorityColors[task.priority || 'normal']
          )}>
            <ClipboardList className="w-3.5 h-3.5" />
            <span className="max-w-[100px] truncate">{task.title}</span>
            {isAdmin && onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs max-w-[200px]">
            <div className="font-medium">{task.title}</div>
            {task.description && <div className="text-slate-400 mt-1">{task.description}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Delivery Badge Component
function DeliveryBadge({ delivery, onRemove, isAdmin }) {
  const typeColors = {
    delivery: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    pickup: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    removal: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
  };
  
  const typeLabels = {
    delivery: 'Levering',
    pickup: 'Ophaling',
    removal: 'Afvoer'
  };
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "group relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
            typeColors[delivery.delivery_type || 'delivery']
          )}>
            <Truck className="w-3.5 h-3.5" />
            <span className="max-w-[60px] truncate">{delivery.supplier_name}</span>
            {delivery.scheduled_time && (
              <span className="text-[10px] opacity-75">
                {delivery.scheduled_time.slice(0, 5)}
              </span>
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
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <div className="font-medium">{typeLabels[delivery.delivery_type]} - {delivery.supplier_name}</div>
            {delivery.description && <div className="text-slate-400 mt-1">{delivery.description}</div>}
            {delivery.scheduled_time && <div className="text-slate-400">{delivery.scheduled_time.slice(0, 5)}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Add Button Component
function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
    >
      <Plus className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
}

// Main ProjectRow Component
export default function ProjectRow({
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
  onRefresh
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Get assigned painters for the project header display
  const assignedPainters = useMemo(() => {
    if (!project.assigned_painters || !Array.isArray(project.assigned_painters)) return [];
    return project.assigned_painters.map(email => {
      const user = users.find(u => u.email === email);
      return user || { email, full_name: email.split('@')[0] };
    });
  }, [project.assigned_painters, users]);

  // Remove handlers
  const handleRemoveEmployee = async (scheduleId) => {
    if (!confirm('Weet u zeker dat u deze toewijzing wilt verwijderen?')) return;
    await EmployeeDaySchedule.delete(scheduleId);
    onRefresh();
  };

  const handleRemoveVehicle = async (assignmentId) => {
    if (!confirm('Weet u zeker dat u deze voertuigtoewijzing wilt verwijderen?')) return;
    await VehicleAssignment.delete(assignmentId);
    onRefresh();
  };

  const handleRemoveSubcontractor = async (assignmentId) => {
    if (!confirm('Weet u zeker dat u deze onderaannemer wilt verwijderen?')) return;
    await SubcontractorAssignment.delete(assignmentId);
    onRefresh();
  };

  const handleRemoveTask = async (taskId) => {
    if (!confirm('Weet u zeker dat u deze taak wilt verwijderen?')) return;
    await ProjectTask.delete(taskId);
    onRefresh();
  };

  const handleRemoveDelivery = async (deliveryId) => {
    if (!confirm('Weet u zeker dat u deze levering wilt verwijderen?')) return;
    await MaterialDelivery.delete(deliveryId);
    onRefresh();
  };

  return (
    <div 
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Project Header Row */}
      <div 
        className={cn(
          "grid cursor-pointer transition-colors",
          isExpanded ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
        style={{ gridTemplateColumns: `280px repeat(${weekDays.length}, minmax(120px, 1fr))` }}
        onClick={onToggle}
      >
        {/* Project Info */}
        <div className="px-4 py-3 flex items-center gap-3 border-r border-slate-100 dark:border-slate-700/50">
          <button className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {project.project_name}
              </span>
              {project.priority === 'high' && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Prioriteit
                </Badge>
              )}
            </div>
            {project.address && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{project.address}</span>
              </div>
            )}
          </div>

          {/* Assigned painters avatars */}
          {assignedPainters.length > 0 && (
            <div className="flex -space-x-1.5">
              {assignedPainters.slice(0, 3).map((painter, idx) => (
                <TooltipProvider key={painter.email || idx} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                        {(painter.full_name || painter.email).substring(0, 2).toUpperCase()}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {painter.full_name || painter.email}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {assignedPainters.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  +{assignedPainters.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Edit button (visible on hover) */}
          {isAdmin && isHovered && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="w-4 h-4 mr-2" />
                  Project bewerken
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Day Cells (collapsed view - show summary) */}
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
                "px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 last:border-r-0",
                isToday(day) && "bg-blue-50/30 dark:bg-blue-900/5",
                (day.getDay() === 0 || day.getDay() === 6) && "bg-slate-50/30 dark:bg-slate-800/20"
              )}
            >
              {!isExpanded && totalItems > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dayData.employees.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      <Users className="w-2.5 h-2.5 mr-0.5" />
                      {dayData.employees.length}
                    </Badge>
                  )}
                  {dayData.vehicles.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Car className="w-2.5 h-2.5 mr-0.5" />
                      {dayData.vehicles.length}
                    </Badge>
                  )}
                  {dayData.subcontractors.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                      <Wrench className="w-2.5 h-2.5 mr-0.5" />
                      {dayData.subcontractors.length}
                    </Badge>
                  )}
                  {dayData.tasks.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      <ClipboardList className="w-2.5 h-2.5 mr-0.5" />
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
              iconBgColor="bg-blue-100 dark:bg-blue-900/40"
              renderDayContent={(day) => {
                const dayData = getProjectDayData(project.id, day);
                return (
                  <div className="flex flex-wrap gap-1">
                    {dayData.employees.map(schedule => {
                      const user = users.find(u => u.email === schedule.user_email);
                      return (
                        <EmployeeBadge
                          key={schedule.id}
                          schedule={schedule}
                          user={user}
                          isAdmin={isAdmin}
                          onRemove={() => handleRemoveEmployee(schedule.id)}
                        />
                      );
                    })}
                    {isAdmin && (
                      <AddButton 
                        onClick={(e) => { e.stopPropagation(); onAddEmployee(day); }} 
                        label="+"
                      />
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
              iconBgColor="bg-emerald-100 dark:bg-emerald-900/40"
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
                    {isAdmin && dayData.vehicles.length === 0 && (
                      <AddButton label="+" />
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
              iconBgColor="bg-orange-100 dark:bg-orange-900/40"
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
                    {isAdmin && dayData.subcontractors.length === 0 && (
                      <AddButton label="+" />
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
                      <AddButton 
                        onClick={(e) => { e.stopPropagation(); onAddTask(day); }} 
                        label="+"
                      />
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
                    {isAdmin && dayData.deliveries.length === 0 && (
                      <AddButton label="+" />
                    )}
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


