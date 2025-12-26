import { useState } from "react";
import { motion } from "framer-motion";
import { X, Car, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { VehicleAssignment } from "@/api/entities";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function VehicleAssignmentModal({ 
  companyId, 
  projectId, 
  date, 
  vehicles, 
  onClose, 
  onRefresh 
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter alleen beschikbare voertuigen
  const availableVehicles = vehicles.filter(v => v.status === 'active' && v.is_available !== false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicleId) {
      setError('Selecteer een voertuig');
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
      
      // Check of voertuig al is toegewezen op deze dag
      const existingAssignments = await VehicleAssignment.filter({
        vehicle_id: selectedVehicleId,
        assigned_date: dateStr
      });

      if (existingAssignments.length > 0) {
        setError('Dit voertuig is al toegewezen op deze dag');
        setIsLoading(false);
        return;
      }

      await VehicleAssignment.create({
        company_id: companyId,
        vehicle_id: selectedVehicleId,
        project_id: projectId,
        assigned_date: dateStr
      });

      // Wacht even zodat de database update is voltooid
      await new Promise(resolve => setTimeout(resolve, 100));
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      const errorMessage = error.message || error.error_description || 'Onbekende fout';
      
      // Check voor unique constraint violation
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        setError('Dit voertuig is al toegewezen op deze dag');
      } else {
        setError(`Fout bij toewijzen voertuig: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Voertuig toewijzen</h2>
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicle">Voertuig *</Label>
              <Select 
                value={selectedVehicleId} 
                onValueChange={setSelectedVehicleId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer een voertuig" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.length === 0 ? (
                    <SelectItem value="" disabled>
                      Geen beschikbare voertuigen
                    </SelectItem>
                  ) : (
                    availableVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} {vehicle.license_plate && `(${vehicle.license_plate})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
              disabled={isLoading || !selectedVehicleId || availableVehicles.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
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

