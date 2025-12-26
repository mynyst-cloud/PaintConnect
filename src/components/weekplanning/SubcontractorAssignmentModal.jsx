import { useState } from "react";
import { motion } from "framer-motion";
import { X, Wrench, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { SubcontractorAssignment } from "@/api/entities";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function SubcontractorAssignmentModal({ 
  companyId, 
  projectId, 
  date, 
  subcontractors, 
  onClose, 
  onRefresh 
}) {
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [taskDescription, setTaskDescription] = useState("");
  const [rateType, setRateType] = useState("hourly");
  const [agreedRate, setAgreedRate] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter alleen actieve onderaannemers
  const availableSubcontractors = subcontractors.filter(s => s.status === 'active');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSubcontractorId) {
      setError('Selecteer een onderaannemer');
      return;
    }

    if (!companyId || !projectId || !date) {
      setError('Ontbrekende gegevens');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      await SubcontractorAssignment.create({
        company_id: companyId,
        subcontractor_id: selectedSubcontractorId,
        project_id: projectId,
        assigned_date: dateStr,
        start_time: startTime,
        end_time: endTime,
        task_description: taskDescription || null,
        rate_type: rateType,
        agreed_rate: agreedRate ? parseFloat(agreedRate) : null,
        status: 'scheduled',
        notes: notes || null
      });

      // Wacht even zodat de database update is voltooid
      await new Promise(resolve => setTimeout(resolve, 100));
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error assigning subcontractor:', error);
      const errorMessage = error.message || error.error_description || 'Onbekende fout';
      setError(`Fout bij toewijzen onderaannemer: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSub = availableSubcontractors.find(s => s.id === selectedSubcontractorId);
  const defaultRate = selectedSub 
    ? (rateType === 'hourly' ? selectedSub.hourly_rate : selectedSub.day_rate)
    : null;

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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Onderaannemer toewijzen</h2>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="subcontractor">Onderaannemer *</Label>
              <Select 
                value={selectedSubcontractorId} 
                onValueChange={setSelectedSubcontractorId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer een onderaannemer" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcontractors.length === 0 ? (
                    <SelectItem value="" disabled>
                      Geen beschikbare onderaannemers
                    </SelectItem>
                  ) : (
                    availableSubcontractors.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} {sub.specialty && `(${sub.specialty})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Starttijd</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_time">Eindtijd</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="task_description">Taakomschrijving</Label>
              <Textarea
                id="task_description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Wat moet de onderaannemer doen?"
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate_type">Tarief type</Label>
                <Select 
                  value={rateType} 
                  onValueChange={setRateType}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Per uur</SelectItem>
                    <SelectItem value="daily">Per dag</SelectItem>
                    <SelectItem value="fixed">Vast bedrag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="agreed_rate">Afgesproken tarief (€)</Label>
                <Input
                  id="agreed_rate"
                  type="number"
                  step="0.01"
                  value={agreedRate}
                  onChange={(e) => setAgreedRate(e.target.value)}
                  placeholder={defaultRate ? defaultRate.toString() : "0.00"}
                  className="mt-1"
                />
                {defaultRate && !agreedRate && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Standaard: €{defaultRate}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionele notities..."
                className="mt-1"
                rows={2}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !selectedSubcontractorId || availableSubcontractors.length === 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Toewijzen
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

