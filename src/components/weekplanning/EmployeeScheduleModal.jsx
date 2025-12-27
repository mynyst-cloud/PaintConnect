import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, Users, Check, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { EmployeeDaySchedule } from "@/api/entities";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function EmployeeScheduleModal({ 
  companyId, 
  projectId, 
  date, 
  userEmail, 
  users, 
  onClose, 
  onRefresh 
}) {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    user_email: userEmail || '',
    start_time: '08:00',
    end_time: '17:00',
    notes: ''
  });

  // Load existing schedules for this date/project
  useEffect(() => {
    const loadSchedules = async () => {
      setIsLoading(true);
      try {
        const dateStr = format(date, 'yyyy-MM-dd');
        const allSchedules = await EmployeeDaySchedule.filter({
          project_id: projectId,
          scheduled_date: dateStr
        });
        setSchedules(allSchedules || []);
      } catch (error) {
        console.error('Error loading schedules:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedules();
  }, [projectId, date]);

  // Get available users (not already scheduled)
  const availableUsers = users?.filter(
    u => !schedules.some(s => s.user_email === u.email)
  ) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_email) return;

    setIsSaving(true);
    try {
      await EmployeeDaySchedule.create({
        company_id: companyId,
        project_id: projectId,
        scheduled_date: format(date, 'yyyy-MM-dd'),
        user_email: formData.user_email,
        start_time: formData.start_time || '08:00',
        end_time: formData.end_time || '17:00',
        notes: formData.notes || null
      });
      
      // Reload schedules
      const dateStr = format(date, 'yyyy-MM-dd');
      const allSchedules = await EmployeeDaySchedule.filter({
        project_id: projectId,
        scheduled_date: dateStr
      });
      setSchedules(allSchedules || []);
      
      // Reset form
      setFormData({
        user_email: '',
        start_time: '08:00',
        end_time: '17:00',
        notes: ''
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error saving schedule:', error);
      if (error.code === '23505') { // Unique constraint violation
        alert('Deze werknemer is al ingepland voor dit project op deze dag');
      } else {
        alert('Fout bij opslaan planning');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm('Weet u zeker dat u deze planning wilt verwijderen?')) return;
    
    setIsLoading(true);
    try {
      await EmployeeDaySchedule.delete(scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      onRefresh();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Fout bij verwijderen planning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSchedule = async (scheduleId, updates) => {
    try {
      await EmployeeDaySchedule.update(scheduleId, updates);
      setSchedules(schedules.map(s => 
        s.id === scheduleId ? { ...s, ...updates } : s
      ));
      onRefresh();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Fout bij bijwerken planning');
    }
  };

  const quickAddUser = async (email) => {
    setIsSaving(true);
    try {
      await EmployeeDaySchedule.create({
        company_id: companyId,
        project_id: projectId,
        scheduled_date: format(date, 'yyyy-MM-dd'),
        user_email: email,
        start_time: '08:00',
        end_time: '17:00'
      });
      
      // Reload schedules
      const dateStr = format(date, 'yyyy-MM-dd');
      const allSchedules = await EmployeeDaySchedule.filter({
        project_id: projectId,
        scheduled_date: dateStr
      });
      setSchedules(allSchedules || []);
      onRefresh();
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Werknemers inplannen</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {format(date, 'EEEE d MMMM yyyy', { locale: nl })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Quick Add - Available Users */}
          {availableUsers.length > 0 && (
            <div className="mb-6">
              <Label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                Snel toevoegen
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableUsers.map(user => (
                  <button
                    key={user.email}
                    onClick={() => quickAddUser(user.email)}
                    disabled={isSaving}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed",
                      "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      "transition-colors text-sm"
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                      {(user.full_name || user.email).substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">{user.full_name || user.email}</span>
                    <Plus className="w-4 h-4 text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Schedules */}
          <div className="space-y-3">
            <Label className="text-sm text-slate-600 dark:text-slate-400">
              Ingepland ({schedules.length})
            </Label>
            
            {isLoading && schedules.length === 0 ? (
              <div className="text-center py-4 text-slate-500">Laden...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nog geen werknemers ingepland</p>
              </div>
            ) : (
              schedules.map(schedule => {
                const user = users?.find(u => u.email === schedule.user_email);
                
                return (
                  <div 
                    key={schedule.id}
                    className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                      {(user?.full_name || schedule.user_email).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {user?.full_name || schedule.user_email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Input
                            type="time"
                            value={schedule.start_time?.slice(0, 5) || '08:00'}
                            onChange={(e) => handleUpdateSchedule(schedule.id, { start_time: e.target.value })}
                            className="h-7 w-24 text-xs"
                          />
                          <span className="text-slate-400">-</span>
                          <Input
                            type="time"
                            value={schedule.end_time?.slice(0, 5) || '17:00'}
                            onChange={(e) => handleUpdateSchedule(schedule.id, { end_time: e.target.value })}
                            className="h-7 w-24 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Custom Add Form */}
          {availableUsers.length === 0 && schedules.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-300">
              <p>Alle beschikbare werknemers zijn al ingepland voor deze dag.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            <Check className="w-4 h-4 mr-2" />
            Klaar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}



