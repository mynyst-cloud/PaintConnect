import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Car, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { CompanyVehicle } from "@/api/entities";
import { cn } from "@/lib/utils";

const vehicleTypes = [
  { value: 'bestelwagen', label: 'Bestelwagen' },
  { value: 'aanhangwagen', label: 'Aanhangwagen' },
  { value: 'personenwagen', label: 'Personenwagen' },
  { value: 'vrachtwagen', label: 'Vrachtwagen' }
];

const vehicleColors = [
  { value: 'white', label: 'Wit', bg: 'bg-gray-100' },
  { value: 'black', label: 'Zwart', bg: 'bg-gray-800' },
  { value: 'blue', label: 'Blauw', bg: 'bg-blue-500' },
  { value: 'red', label: 'Rood', bg: 'bg-red-500' },
  { value: 'green', label: 'Groen', bg: 'bg-green-500' },
  { value: 'silver', label: 'Zilver', bg: 'bg-gray-400' }
];

export default function VehicleManager({ companyId, vehicles, onClose, onRefresh }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    vehicle_type: 'bestelwagen',
    color: 'white',
    capacity: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      license_plate: '',
      vehicle_type: 'bestelwagen',
      color: 'white',
      capacity: '',
      notes: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (vehicle) => {
    setFormData({
      name: vehicle.name || '',
      license_plate: vehicle.license_plate || '',
      vehicle_type: vehicle.vehicle_type || 'bestelwagen',
      color: vehicle.color || 'white',
      capacity: vehicle.capacity || '',
      notes: vehicle.notes || ''
    });
    setEditingId(vehicle.id);
    setIsAdding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vul een naam in voor het voertuig');
      return;
    }

    if (!companyId) {
      alert('Geen bedrijf ID gevonden');
      return;
    }

    setIsLoading(true);
    try {
      if (editingId) {
        await CompanyVehicle.update(editingId, {
          ...formData,
          company_id: companyId
        });
      } else {
        await CompanyVehicle.create({
          ...formData,
          company_id: companyId,
          status: 'active',
          is_available: true
        });
      }
      resetForm();
      // Wacht even zodat de database update is voltooid
      await new Promise(resolve => setTimeout(resolve, 100));
      onRefresh();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      // Toon specifieke error details
      const errorMessage = error.message || error.error_description || 'Onbekende fout';
      alert(`Fout bij opslaan voertuig: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!confirm('Weet u zeker dat u dit voertuig wilt verwijderen?')) return;
    
    setIsLoading(true);
    try {
      await CompanyVehicle.update(vehicleId, { status: 'inactive' });
      onRefresh();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Fout bij verwijderen voertuig');
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Voertuigenbeheer</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{vehicles.length} voertuigen</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Naam *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Mercedes Sprinter"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="license_plate">Kenteken</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    placeholder="XX-XXX-XX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_type">Type</Label>
                  <Select 
                    value={formData.vehicle_type} 
                    onValueChange={(val) => setFormData({ ...formData, vehicle_type: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacity">Capaciteit</Label>
                  <Input
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="3 personen / 500kg"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Kleur</Label>
                  <div className="flex gap-2 mt-2">
                    {vehicleColors.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform",
                          color.bg,
                          formData.color === color.value && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                        )}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notities</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optionele notities..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
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
              className="w-full mb-4 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw voertuig toevoegen
            </Button>
          )}

          {/* Vehicles List */}
          <div className="space-y-3">
            {vehicles.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nog geen voertuigen toegevoegd</p>
              </div>
            ) : (
              vehicles.map(vehicle => {
                const colorInfo = vehicleColors.find(c => c.value === vehicle.color) || vehicleColors[0];
                const typeInfo = vehicleTypes.find(t => t.value === vehicle.vehicle_type) || vehicleTypes[0];
                
                return (
                  <div 
                    key={vehicle.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorInfo.bg)}>
                      <Car className={cn("w-5 h-5", vehicle.color === 'white' ? 'text-slate-600' : 'text-white')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{vehicle.name}</span>
                        <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {vehicle.license_plate && <span>{vehicle.license_plate}</span>}
                        {vehicle.capacity && <span>• {vehicle.capacity}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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


