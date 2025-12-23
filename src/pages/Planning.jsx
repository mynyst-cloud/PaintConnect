import { useState, useMemo } from "react";
import { Project, User, Company, PlanningEvent } from "@/api/entities";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Printer, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend, addMonths, subMonths, startOfWeek, endOfWeek, eachWeekOfInterval } from "date-fns";
import { nl } from "date-fns/locale";
import PlanningForm from "@/components/planning/PlanningForm";
import PlanningEventForm from "@/components/planning/PlanningEventForm";
import ProjectDetails from "@/components/projects/ProjectDetails";
import { AnimatePresence, motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CalendarItemBar from "@/components/planning/CalendarItemBar";
import { calculateItemSpans, assignTracksToSpans, getMaxTrackForWeek } from "@/components/planning/calendarHelpers";

const WEEK_NUMBER_COL = 1;

export default function Planning({ impersonatedCompanyId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedPainter, setSelectedPainter] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    return localStorage.getItem('planning_swipe_hint_seen') !== 'true';
  });

  const { data: planningData, isLoading, refetch: refetchAll } = useQuery({
    queryKey: ['planning-data', impersonatedCompanyId],
    queryFn: async () => {
      const user = await User.me();
      
      if (!user) throw new Error("No user");

      const companyId = impersonatedCompanyId || user?.current_company_id || user?.company_id;
      
      if (!companyId) throw new Error("No company");

      const company = await Company.get(companyId);
      // Include 'owner' for legacy users
      const isAdmin = user?.company_role === 'admin' || user?.company_role === 'owner' || user?.role === 'admin';

      const [allProjects, allEvents] = await Promise.all([
        isAdmin
          ? Project.filter({ company_id: companyId, is_dummy: false }, '-created_date', 20)
          : (async () => {
              // Schilders zien alleen projecten waaraan ze zijn toegewezen
              // Use $contains for array column (assigned_painters is text[])
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Planning.jsx:59',message:'Painter projects query with $contains',data:{email:user.email,companyId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              const assignedProjects = await Project.filter({
                company_id: companyId,
                assigned_painters: { '$contains': [user.email] }
              }, '-created_date', 20);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Planning.jsx:67',message:'Painter projects query result',data:{count:assignedProjects?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              return (assignedProjects || []).filter(p => !p.is_dummy);
            })(),
        
        PlanningEvent.filter({ company_id: companyId }),
      ]);

      const painterUsers = isAdmin ? await base44.functions.invoke('getCompanyPainters', { company_id: companyId }).then(res => res.data) : [];

      const deleted = JSON.parse(sessionStorage.getItem("deletedProjects") || "[]");
      const projects = (allProjects || []).filter(
        p => p && !p.is_dummy && !deleted.includes(p.id)
      );

      return {
        user,
        company,
        projects,
        users: painterUsers || [],
        events: allEvents || [],
        isAdmin,
      };
    },
    staleTime: 1000 * 60,
    cacheTime: 1000 * 60 * 5,
  });

  const user = planningData?.user;
  const company = planningData?.company;
  const projects = planningData?.projects || [];
  const users = planningData?.users || [];
  const events = planningData?.events || [];
  const isAdmin = planningData?.isAdmin || false;

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      if (showSwipeHint) {
        setShowSwipeHint(false);
        localStorage.setItem('planning_swipe_hint_seen', 'true');
      }
    }

    if (isLeftSwipe) {
      setCurrentDate(addMonths(currentDate, 1));
    }
    if (isRightSwipe) {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const hideSwipeHint = () => {
    setShowSwipeHint(false);
    localStorage.setItem('planning_swipe_hint_seen', 'true');
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    const nonDummyProjects = projects.filter(p => {
      if (p.is_dummy === true || p.is_dummy === 'true' || p.is_dummy === 1) return false;
      return true;
    });
    
    if (selectedPainter === "all") return nonDummyProjects;
    
    return nonDummyProjects.filter(p => 
      p.assigned_painters && 
      Array.isArray(p.assigned_painters) && 
      p.assigned_painters.includes(selectedPainter)
    );
  }, [projects, selectedPainter]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    if (selectedPainter === "all") {
      return events;
    }
    
    return events.filter(event => {
      if (event.event_type !== 'schilder_verlof' && event.event_type !== 'tijdelijke_werkloosheid') return true;
      
      return event.affected_painters && 
             Array.isArray(event.affected_painters) && 
             event.affected_painters.includes(selectedPainter);
    });
  }, [events, selectedPainter]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const weeks = eachWeekOfInterval({ start: calendarStart, end: calendarEnd }, { weekStartsOn: 1 });

  const allSpans = useMemo(() => {
    const projectSpans = calculateItemSpans(filteredProjects, calendarStart, calendarEnd, 'project');
    const eventSpans = calculateItemSpans(filteredEvents, calendarStart, calendarEnd, 'event');
    const combined = [...projectSpans, ...eventSpans];
    return assignTracksToSpans(combined);
  }, [filteredProjects, filteredEvents, calendarStart, calendarEnd]);

  const colorClasses = {
    blue: { 
      bg: 'bg-blue-500 dark:bg-blue-600', 
      border: 'border-blue-600 dark:border-blue-500', 
      text: 'text-white dark:text-white' 
    },
    green: { 
      bg: 'bg-emerald-500 dark:bg-emerald-600', 
      border: 'border-emerald-600 dark:border-emerald-500', 
      text: 'text-white dark:text-white' 
    },
    yellow: { 
      bg: 'bg-amber-400 dark:bg-amber-500', 
      border: 'border-amber-500 dark:border-amber-400', 
      text: 'text-amber-900 dark:text-amber-900' 
    },
    red: { 
      bg: 'bg-red-500 dark:bg-red-600', 
      border: 'border-red-600 dark:border-red-500', 
      text: 'text-white dark:text-white' 
    },
    purple: { 
      bg: 'bg-purple-500 dark:bg-purple-600', 
      border: 'border-purple-600 dark:border-purple-500', 
      text: 'text-white dark:text-white' 
    },
    pink: { 
      bg: 'bg-pink-500 dark:bg-pink-600', 
      border: 'border-pink-600 dark:border-pink-500', 
      text: 'text-white dark:text-white' 
    },
    indigo: { 
      bg: 'bg-indigo-500 dark:bg-indigo-600', 
      border: 'border-indigo-600 dark:border-indigo-500', 
      text: 'text-white dark:text-white' 
    },
    gray: { 
      bg: 'bg-slate-500 dark:bg-slate-600', 
      border: 'border-slate-600 dark:border-slate-500', 
      text: 'text-white dark:text-white' 
    },
    orange: { 
      bg: 'bg-orange-500 dark:bg-orange-600', 
      border: 'border-orange-600 dark:border-orange-500', 
      text: 'text-white dark:text-white' 
    }
  };

  const eventTypeLabels = {
    bouwverlof: "Bouwverlof",
    schilder_verlof: "Schilder Verlof",
    tijdelijke_werkloosheid: "Tijdelijke Werkloosheid",
    rustdag_bouw: "Rustdag Bouw",
    feestdag: "Feestdag"
  };

  const handleProjectSubmit = async (projectData) => {
    try {
      // Voeg company_id toe aan projectData
      const dataWithCompany = {
        ...projectData,
        company_id: company?.id
      };

      let savedProject;
      if (editingProject) {
        savedProject = await Project.update(editingProject.id, dataWithCompany);
        
        // Check if planning changed (dates or times)
        const planningChanged = 
          editingProject.start_date !== dataWithCompany.start_date ||
          editingProject.expected_end_date !== dataWithCompany.expected_end_date ||
          editingProject.work_start_time !== dataWithCompany.work_start_time ||
          editingProject.work_end_time !== dataWithCompany.work_end_time;
        
        if (savedProject.assigned_painters && savedProject.assigned_painters.length > 0) {
          const { notifyAssignedPainters, notifyPlanningChange } = await import('@/api/functions');
          
          // Notify about assignment (for newly assigned painters)
          try {
            await notifyAssignedPainters({
              projectId: savedProject.id,
              projectName: savedProject.project_name,
              newlyAssignedEmails: savedProject.assigned_painters,
              companyId: company?.id,
              isUpdate: true
            });
          } catch (notifError) {
            console.warn('Notificatie versturen mislukt:', notifError);
          }
          
          // Notify about planning change if dates/times changed
          if (planningChanged) {
            try {
              const changes = [];
              if (editingProject.start_date !== dataWithCompany.start_date) changes.push('startdatum');
              if (editingProject.expected_end_date !== dataWithCompany.expected_end_date) changes.push('einddatum');
              if (editingProject.work_start_time !== dataWithCompany.work_start_time) changes.push('starttijd');
              if (editingProject.work_end_time !== dataWithCompany.work_end_time) changes.push('eindtijd');
              
              await notifyPlanningChange({
                company_id: company?.id,
                project_id: savedProject.id,
                project_name: savedProject.project_name,
                change_description: changes.join(', ') + ' gewijzigd',
                painter_emails: savedProject.assigned_painters,
                changer_name: user?.full_name || user?.email
              });
            } catch (notifError) {
              console.warn('Planning change notificatie mislukt:', notifError);
            }
          }
        }
      } else {
        savedProject = await Project.create(dataWithCompany);
        if (savedProject.assigned_painters && savedProject.assigned_painters.length > 0) {
          const { notifyAssignedPainters } = await import('@/api/functions');
          try {
            await notifyAssignedPainters({
              projectId: savedProject.id,
              projectName: savedProject.project_name,
              newlyAssignedEmails: savedProject.assigned_painters
            });
          } catch (notifError) {
            console.warn('Notificatie versturen mislukt:', notifError);
          }
        }
      }
      await refetchAll();
      setShowProjectForm(false);
      setEditingProject(null);
      setSelectedDate(null);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Fout bij opslaan project. Probeer opnieuw.");
    }
  };

  const handleEventSubmit = async () => {
    await refetchAll();
    setShowEventForm(false);
    setSelectedDate(null);
  };

  const handleProjectClick = (project) => {
    if (project.is_dummy === true || project.is_dummy === 'true' || project.is_dummy === 1) return;
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventPopup(true);
  };

  const handleProjectUpdate = async () => {
    await refetchAll();
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const handleEditProject = (project) => {
    if (project.is_dummy === true || project.is_dummy === 'true' || project.is_dummy === 1) return;
    setShowProjectDetails(false);
    setSelectedProject(null);
    setEditingProject(project);
    setShowProjectForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="default" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Planning laden...</p>
        </div>
      </div>
    );
  }

  const formattedDate = format(new Date(), "EEEE d MMMM yyyy", { locale: nl });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="hidden md:flex md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-50">Planning</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                {format(currentDate, 'MMMM yyyy', { locale: nl })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <Select value={selectedPainter} onValueChange={setSelectedPainter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Alle schilders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle schilders</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="hidden md:flex"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print / PDF
              </Button>

              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDate(null);
                      setEditingProject(null);
                      setEditingEvent(null);
                      setShowEventForm(true);
                    }}
                    >
                    <Plus className="w-4 h-4 mr-2" />
                    Event toevoegen
                    </Button>
                  <Button
                    onClick={() => {
                      setSelectedDate(null);
                      setEditingProject(null);
                      setShowProjectForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Project plannen
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-3">Planning</h1>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-4">
          <div className="md:hidden">
            <div className="flex items-center justify-between p-3 border-b dark:border-slate-700">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCurrentDate(subMonths(currentDate, 1));
                  hideSwipeHint();
                }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <h2 className="text-sm font-semibold capitalize truncate max-w-[120px]">
                {format(currentDate, 'MMM yyyy', { locale: nl })}
              </h2>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCurrentDate(addMonths(currentDate, 1));
                  hideSwipeHint();
                }}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <AnimatePresence>
              {showSwipeHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center text-xs text-gray-500 dark:text-gray-400 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b dark:border-slate-700"
                >
                  <span className="flex items-center justify-center gap-1">
                    <ChevronLeft className="w-3 h-3" />
                    Veeg om tussen maanden te wisselen
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3 space-y-2">
              {isAdmin && (
                <Select value={selectedPainter} onValueChange={setSelectedPainter}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Alle schilders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle schilders</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {isAdmin && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(null);
                      setEditingProject(null);
                      setEditingEvent(null);
                      setShowEventForm(true);
                    }}
                    className="h-9"
                    >
                    <Plus className="w-4 h-4 mr-1" />
                    Event
                    </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDate(null);
                      setEditingProject(null);
                      setShowProjectForm(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 h-9"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Project
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: nl })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Vandaag
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div 
          className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-slate-700">
            <div className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50"></div>
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50">
                {day}
              </div>
            ))}
          </div>

          <TooltipProvider delayDuration={300}>
            <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {weeks.map((weekStart, weekIndex) => {
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
                const maxTrack = getMaxTrackForWeek(allSpans, weekIndex);
                const weekHeight = Math.max(120, (maxTrack + 1) * 28 + 40);
                
                return (
                  <div 
                    key={weekIndex} 
                    className="grid grid-cols-8 divide-x divide-gray-100 dark:divide-slate-700/50 relative"
                    style={{ minHeight: `${weekHeight}px` }}
                  >
                    {/* Weekend background overlay voor zaterdag (kolom 7) */}
                    <div 
                      className="absolute inset-y-0 bg-gray-100/50 dark:bg-slate-700/30 pointer-events-none"
                      style={{ 
                        left: 'calc(100% / 8 * 6)',
                        width: 'calc(100% / 8)'
                      }}
                    />
                    
                    {/* Weekend background overlay voor zondag (kolom 8) */}
                    <div 
                      className="absolute inset-y-0 bg-gray-100/50 dark:bg-slate-700/30 pointer-events-none"
                      style={{ 
                        left: 'calc(100% / 8 * 7)',
                        width: 'calc(100% / 8)'
                      }}
                    />

                    <div className="bg-gray-50 dark:bg-slate-900/50 flex items-start justify-center pt-2 relative z-10">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        W{format(weekStart, 'w')}
                      </span>
                    </div>

                    {weekDays.map((day, dayIndex) => {
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isCurrentDay = isToday(day);
                      const isDayWeekend = isWeekend(day);

                      return (
                        <div
                          key={dayIndex}
                          className={`p-2 relative z-10 ${
                            !isCurrentMonth 
                              ? 'bg-gray-50/50 dark:bg-slate-900/50' 
                              : ''
                          } hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer`}
                          onClick={() => {
                            if (isAdmin) {
                              setSelectedDate(day);
                              setEditingProject(null);
                              setShowProjectForm(true);
                            }
                          }}
                          onDoubleClick={() => {
                            if (isAdmin) {
                              setSelectedDate(day);
                              setEditingProject(null);
                              setShowProjectForm(true);
                            }
                          }}
                        >
                          {isCurrentDay && (
                            <div className="absolute inset-0 rounded-lg bg-emerald-500/10 ring-2 ring-inset ring-emerald-500 dark:ring-emerald-400 pointer-events-none" />
                          )}
                          <div className={`text-sm font-semibold relative z-10 ${
                            isCurrentDay 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : !isCurrentMonth 
                              ? 'text-gray-400 dark:text-slate-600' 
                              : 'text-gray-700 dark:text-slate-300'
                          }`}>
                            {format(day, 'd')}
                          </div>
                        </div>
                      );
                    })}

                    {allSpans
                      .filter(span => span.weekIndex === weekIndex)
                      .map((span, idx) => {
                        const colors = colorClasses[
                          span.type === 'project' ? span.item.calendar_color : span.item.color
                        ] || colorClasses.blue;

                        const tooltipContent = span.type === 'project' 
                          ? `${span.item.project_name}${span.item.assigned_painters?.length > 0 ? '\n' + span.item.assigned_painters.map(email => users.find(u => u.email === email)?.full_name || email).join(', ') : ''}`
                          : span.item.title;

                        return (
                          <Tooltip key={`${span.type}-${span.item.id}-${idx}`}>
                            <TooltipTrigger asChild>
                              <CalendarItemBar
                                item={span.item}
                                startColumn={span.startColumn + WEEK_NUMBER_COL}
                                endColumn={span.endColumn + WEEK_NUMBER_COL}
                                track={span.track}
                                type={span.type}
                                onClick={span.type === 'project' ? handleProjectClick : handleEventClick}
                                colorClasses={colors}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs z-[10000]">
                              <div className="whitespace-pre-line text-sm">
                                {tooltipContent}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        <AnimatePresence>
          {showProjectForm && (
            <PlanningForm
              project={editingProject}
              selectedDate={selectedDate}
              painters={users}
              onSubmit={handleProjectSubmit}
              onCancel={() => {
                setShowProjectForm(false);
                setEditingProject(null);
                setSelectedDate(null);
              }}
            />
          )}

          {showEventForm && (
            <PlanningEventForm
              event={editingEvent}
              companyId={company?.id}
              currentUser={user}
              painters={users}
              onCancel={() => {
                setShowEventForm(false);
                setEditingEvent(null);
                handleEventSubmit();
              }}
            />
          )}

          {showProjectDetails && selectedProject && (
            <ProjectDetails
              project={selectedProject}
              onClose={() => {
                setShowProjectDetails(false);
                setSelectedProject(null);
              }}
              onProjectUpdate={handleProjectUpdate}
              isAdmin={isAdmin}
              onEditProject={handleEditProject}
            />
          )}

          {showEventPopup && selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowEventPopup(false);
                setSelectedEvent(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="w-full max-w-md">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{selectedEvent.title}</CardTitle>
                      <Badge className={`mt-2 ${colorClasses[selectedEvent.color]?.bg} ${colorClasses[selectedEvent.color]?.text}`}>
                        {eventTypeLabels[selectedEvent.event_type] || selectedEvent.event_type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowEventPopup(false);
                        setSelectedEvent(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periode</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(selectedEvent.start_date), 'dd MMMM yyyy', { locale: nl })}
                        {selectedEvent.start_date !== selectedEvent.end_date && 
                          ` - ${format(new Date(selectedEvent.end_date), 'dd MMMM yyyy', { locale: nl })}`}
                      </p>
                    </div>

                    {selectedEvent.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beschrijving</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>
                      </div>
                    )}

                    {(selectedEvent.event_type === 'schilder_verlof' || selectedEvent.event_type === 'tijdelijke_werkloosheid') && selectedEvent.affected_painters && selectedEvent.affected_painters.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Betreffende schilders</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvent.affected_painters.map(email => {
                            const painter = users.find(u => u.email === email);
                            return (
                              <Badge key={email} variant="outline">
                                {painter?.full_name || email}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedEvent.is_recurring && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Jaarlijks terugkerend</span>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={async () => {
                            if (confirm('Weet u zeker dat u dit evenement wilt verwijderen?')) {
                              await PlanningEvent.delete(selectedEvent.id);
                              setShowEventPopup(false);
                              setSelectedEvent(null);
                              await refetchAll();
                            }
                          }}
                        >
                          Verwijderen
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingEvent(selectedEvent);
                            setShowEventPopup(false);
                            setSelectedEvent(null);
                            setShowEventForm(true);
                          }}
                        >
                          Bewerken
                        </Button>
                      </div>
                    )}
                    </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}