
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Users, Briefcase, CheckCircle, Circle, PaintBucket } from 'lucide-react';
import { User, Project, Company } from '@/api/entities';
import InviteUserForm from '@/components/admin/InviteUserForm';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

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
      className="mb-6"
    >
      <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src={paintConnectLogoUrl} 
                alt="PaintConnect" 
                className="h-8 w-auto"
              />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  Welkom bij PaintConnect! 🎉
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Voltooi deze 2 stappen om aan de slag te gaan
                </p>
              </div>
            </div>
            {/* Progress circle or checkmark */}
            <div className="flex-shrink-0">
              {completedTasks === totalTasks ? (
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="relative w-8 h-8">
                  <Progress 
                    value={progressPercentage} 
                    className="w-8 h-8 rotate-[-90deg]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {completedTasks}/{totalTasks}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-emerald-100 dark:bg-emerald-900/50"
            />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              {completedTasks} van {totalTasks} taken voltooid ({Math.round(progressPercentage)}%)
            </p>
          </div>

          {/* Task list */}
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  task.completed
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    task.completed 
                      ? 'bg-emerald-500 text-white' 
                      : 'border-2 border-gray-300 dark:border-gray-600'
                  }`}>
                    {task.completed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
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
                    <p className={`text-xs ${
                      task.completed 
                        ? 'text-emerald-600 dark:text-emerald-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {task.completed ? '✅ Voltooid' : task.description}
                    </p>
                  </div>
                </div>

                {!task.completed && (
                  <Button
                    size="sm"
                    onClick={task.action}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
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
              className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-center"
            >
              <p className="text-emerald-800 dark:text-emerald-200 font-medium text-sm">
                🎉 Gefeliciteerd! Je PaintConnect omgeving is klaar voor gebruik.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
