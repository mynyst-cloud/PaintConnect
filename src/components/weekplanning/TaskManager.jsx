import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, ClipboardList, Check, Clock, AlertCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { ProjectTask } from "@/api/entities";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

const priorities = [
  { value: 'low', label: 'Laag', color: 'bg-slate-100 text-slate-700', icon: null },
  { value: 'normal', label: 'Normaal', color: 'bg-blue-100 text-blue-700', icon: null },
  { value: 'high', label: 'Hoog', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', icon: Flag }
];

const statuses = [
  { value: 'pending', label: 'Te doen', color: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'Bezig', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Voltooid', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Geannuleerd', color: 'bg-red-100 text-red-700' }
];

export default function TaskManager({ companyId, projectId, date, users, onClose, onRefresh }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'normal',
    status: 'pending',
    estimated_hours: '',
    start_time: '',
    end_time: '',
    assigned_to: []
  });

  // Load existing tasks for this date/project
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const dateStr = format(date, 'yyyy-MM-dd');
        const allTasks = await ProjectTask.filter({
          project_id: projectId,
          scheduled_date: dateStr
        });
        setTasks(allTasks || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [projectId, date]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'normal',
      status: 'pending',
      estimated_hours: '',
      start_time: '',
      end_time: '',
      assigned_to: []
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'normal',
      status: task.status || 'pending',
      estimated_hours: task.estimated_hours?.toString() || '',
      start_time: task.start_time?.slice(0, 5) || '',
      end_time: task.end_time?.slice(0, 5) || '',
      assigned_to: task.assigned_to || []
    });
    setEditingId(task.id);
    setIsAdding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      const data = {
        company_id: companyId,
        project_id: projectId,
        scheduled_date: format(date, 'yyyy-MM-dd'),
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        status: formData.status,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        assigned_to: formData.assigned_to.length > 0 ? formData.assigned_to : null
      };

      if (editingId) {
        await ProjectTask.update(editingId, data);
      } else {
        await ProjectTask.create(data);
      }
      
      // Reload tasks
      const dateStr = format(date, 'yyyy-MM-dd');
      const allTasks = await ProjectTask.filter({
        project_id: projectId,
        scheduled_date: dateStr
      });
      setTasks(allTasks || []);
      
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Fout bij opslaan taak');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Weet u zeker dat u deze taak wilt verwijderen?')) return;
    
    setIsLoading(true);
    try {
      await ProjectTask.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      onRefresh();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Fout bij verwijderen taak');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await ProjectTask.update(task.id, { status: newStatus });
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    onRefresh();
  };

  const toggleAssignee = (email) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(email)
        ? prev.assigned_to.filter(e => e !== email)
        : [...prev.assigned_to, email]
    }));
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Taken</h2>
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
          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Taakomschrijving *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Bijv. Plaatsing tegelwerk keuken op gelijkvloers"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Details</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Extra informatie over de taak..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioriteit</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(val) => setFormData({ ...formData, priority: val })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              {p.icon && <p.icon className="w-3 h-3" />}
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Geschatte uren</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      placeholder="2.5"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Starttijd</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Eindtijd</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {users && users.length > 0 && (
                  <div>
                    <Label>Toewijzen aan</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {users.map(user => (
                        <button
                          key={user.email}
                          type="button"
                          onClick={() => toggleAssignee(user.email)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                            formData.assigned_to.includes(user.email)
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                          )}
                        >
                          {user.full_name || user.email.split('@')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                  <Check className="w-4 h-4 mr-2" />
                  {editingId ? 'Opslaan' : 'Toevoegen'}
                </Button>
              </div>
            </form>
          )}

          {/* Add Button */}
          {!isAdding && !editingId && (
            <Button 
              onClick={() => setIsAdding(true)}
              className="w-full mb-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe taak toevoegen
            </Button>
          )}

          {/* Tasks List */}
          <div className="space-y-2">
            {isLoading && tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Laden...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nog geen taken voor deze dag</p>
              </div>
            ) : (
              tasks.map(task => {
                const priorityInfo = priorities.find(p => p.value === task.priority) || priorities[1];
                const statusInfo = statuses.find(s => s.value === task.status) || statuses[0];
                
                return (
                  <div 
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl transition-colors",
                      task.status === 'completed' 
                        ? "bg-green-50 dark:bg-green-900/20" 
                        : "bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900/70"
                    )}
                  >
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => handleToggleComplete(task)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "font-medium text-slate-900 dark:text-white",
                          task.status === 'completed' && "line-through text-slate-500"
                        )}>
                          {task.title}
                        </span>
                        <Badge className={cn("text-[10px]", priorityInfo.color)}>
                          {priorityInfo.label}
                        </Badge>
                        {task.start_time && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.start_time.slice(0, 5)}
                            {task.end_time && ` - ${task.end_time.slice(0, 5)}`}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {task.assigned_to.map(email => {
                            const user = users?.find(u => u.email === email);
                            return (
                              <Badge key={email} variant="outline" className="text-[10px]">
                                {user?.full_name || email.split('@')[0]}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleEdit(task)}
                      >
                        Bewerk
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(task.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}



