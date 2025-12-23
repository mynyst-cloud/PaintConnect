
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Users, Briefcase, CheckCircle, Circle, PaintBucket, ChevronDown, ChevronUp } from 'lucide-react';
import { User, Project, Company } from '@/api/entities';
import InviteUserForm from '@/components/admin/InviteUserForm';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

// Storage key for collapsed state
const COLLAPSED_STORAGE_KEY = 'onboarding_checklist_collapsed';

export default function OnboardingChecklist({ 
  companyId, 
  onInviteTeam, 
  onCreateProject, 
  onComplete 
}) {
  const [hasTeamMembers, setHasTeamMembers] = useState(false);
  const [hasProjects, setHasProjects] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // Collapsed state - check localStorage first
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const autoCollapseTimerRef = useRef(null);
  
  // Auto-collapse after 4 seconds if not already collapsed
  useEffect(() => {
    if (!isCollapsed && !isLoading) {
      autoCollapseTimerRef.current = setTimeout(() => {
        setIsCollapsed(true);
        try {
          localStorage.setItem(COLLAPSED_STORAGE_KEY, 'true');
        } catch {}
      }, 4000);
    }
    
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
    };
  }, [isCollapsed, isLoading]);
  
  // Toggle collapsed state
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(newState));
    } catch {}
    
    // Clear auto-collapse timer when manually toggling
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
    }
  };

  // Check completion status
  useEffect(() => {
    const checkCompletionStatus = async () => {
      try {
        // Check if company has any ACTIVE team members (excluding admin/owner)
        // Must have status 'active' and not be the company admin
        const users = await User.filter({ company_id: companyId }).catch(() => []);
        const nonAdminUsers = (users || []).filter(u => 
          u.company_role !== 'admin' && 
          u.company_role !== 'owner' &&
          u.status === 'active' // Only count active users, not pending
        );
        console.log('[OnboardingChecklist] Team check:', {
          totalUsers: users?.length,
          nonAdminActiveUsers: nonAdminUsers.length,
          users: users?.map(u => ({ email: u.email, role: u.company_role, status: u.status }))
        });
        setHasTeamMembers(nonAdminUsers.length > 0);

        // AANGEPAST: Check if company has any REAL projects (exclude dummies)
        const projects = await Project.filter({ company_id: companyId, is_dummy: { '$ne': true } }).catch(() => []);
        console.log('[OnboardingChecklist] Projects check:', {
          totalProjects: projects?.length
        });
        setHasProjects((projects || []).length > 0);

      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      checkCompletionStatus();
    }
  }, [companyId]);

  // Auto-complete when both tasks are done
  useEffect(() => {
    if (hasTeamMembers && hasProjects) {
      const markAsCompleted = async () => {
        try {
          await Company.update(companyId, { onboarding_status: 'completed' });
          onComplete();
        } catch (error) {
          console.error('Error marking onboarding as completed:', error);
          onComplete(); // Still complete even if update fails
        }
      };
      
      // Small delay to show the completed state before hiding
      setTimeout(markAsCompleted, 1500);
    }
  }, [hasTeamMembers, hasProjects, companyId, onComplete]);

  const completedTasks = [hasTeamMembers, hasProjects].filter(Boolean).length;
  const totalTasks = 2;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  const handleInviteTeamClick = () => {
    setShowInviteForm(true);
  };

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    // Refresh the status
    setHasTeamMembers(true);
  };

  const handleInviteCancel = () => {
    setShowInviteForm(false);
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (showInviteForm) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800">
            <div className="relative p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <img 
                    src={paintConnectLogoUrl} 
                    alt="PaintConnect" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Team Uitnodigen
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Voltooi je onboarding
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleInviteCancel}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <InviteUserForm
                companyId={companyId}
                onInviteSuccess={handleInviteSuccess}
                onCancel={handleInviteCancel}
              />
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  const tasks = [
    {
      id: 'team',
      completed: hasTeamMembers,
      title: 'Teamleden uitnodigen',
      description: 'Nodig je eerste schilder uit',
      action: handleInviteTeamClick,
      buttonText: 'Uitnodigen',
      icon: Users
    },
    {
      id: 'project',
      completed: hasProjects,
      title: 'Eerste project aanmaken',
      description: 'Start met je eerste schilderproject',
      action: onCreateProject,
      buttonText: 'Nieuw project',
      icon: Briefcase
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Card className="border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 shadow-sm overflow-hidden">
        {/* Collapsed header - always visible, clickable to expand */}
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-between p-3 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <img 
              src={paintConnectLogoUrl} 
              alt="PaintConnect" 
              className="h-6 w-auto"
            />
            <div className="text-left">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Aan de slag met PaintConnect
              </span>
              <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                {completedTasks}/{totalTasks} stappen voltooid
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mini progress bar */}
            <div className="hidden sm:block w-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        </button>
        
        {/* Expandable content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="p-4 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                {/* Progress bar */}
                <div className="mb-4">
                  <Progress 
                    value={progressPercentage} 
                    className="h-2 bg-emerald-100 dark:bg-emerald-900/50"
                  />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    {completedTasks} van {totalTasks} taken voltooid
                  </p>
                </div>

                {/* Task list */}
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        task.completed
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full ${
                          task.completed 
                            ? 'bg-emerald-500 text-white' 
                            : 'border-2 border-gray-300 dark:border-gray-600'
                        }`}>
                          {task.completed ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${
                            task.completed 
                              ? 'text-emerald-800 dark:text-emerald-200' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {task.title}
                          </p>
                        </div>
                      </div>

                      {!task.completed && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            task.action();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 h-7"
                        >
                          <task.icon className="w-3 h-3 mr-1" />
                          {task.buttonText}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {completedTasks === totalTasks && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 p-2.5 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-center"
                  >
                    <p className="text-emerald-800 dark:text-emerald-200 font-medium text-sm">
                      🎉 Klaar voor gebruik!
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
