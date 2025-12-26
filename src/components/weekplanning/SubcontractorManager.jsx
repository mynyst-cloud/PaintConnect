import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Users, Pencil, Trash2, Check, Wrench, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Subcontractor } from "@/api/entities";
import { cn } from "@/lib/utils";

const specialties = [
  { value: 'schilder', label: 'Schilder' },
  { value: 'stukadoor', label: 'Stukadoor' },
  { value: 'elektricien', label: 'Elektricien' },
  { value: 'loodgieter', label: 'Loodgieter' },
  { value: 'timmerman', label: 'Timmerman' },
  { value: 'metselaar', label: 'Metselaar' },
  { value: 'dakwerker', label: 'Dakwerker' },
  { value: 'tegelzetter', label: 'Tegelzetter' },
  { value: 'glazenwasser', label: 'Glazenwasser' },
  { value: 'schoonmaker', label: 'Schoonmaker' },
  { value: 'overig', label: 'Overig' }
];

const badgeColors = [
  { value: 'orange', label: 'Oranje', bg: 'bg-orange-500' },
  { value: 'purple', label: 'Paars', bg: 'bg-purple-500' },
  { value: 'pink', label: 'Roze', bg: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyaan', bg: 'bg-cyan-500' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { value: 'lime', label: 'Lime', bg: 'bg-lime-500' }
];

export default function SubcontractorManager({ companyId, subcontractors, onClose, onRefresh }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    specialty: 'overig',
    company_name: '',
    kvk_number: '',
    vat_number: '',
    hourly_rate: '',
    day_rate: '',
    notes: '',
    color: 'orange'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      specialty: 'overig',
      company_name: '',
      kvk_number: '',
      vat_number: '',
      hourly_rate: '',
      day_rate: '',
      notes: '',
      color: 'orange'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (sub) => {
    setFormData({
      name: sub.name || '',
      contact_person: sub.contact_person || '',
      email: sub.email || '',
      phone: sub.phone || '',
      specialty: sub.specialty || 'overig',
      company_name: sub.company_name || '',
      kvk_number: sub.kvk_number || '',
      vat_number: sub.vat_number || '',
      hourly_rate: sub.hourly_rate?.toString() || '',
      day_rate: sub.day_rate?.toString() || '',
      notes: sub.notes || '',
      color: sub.color || 'orange'
    });
    setEditingId(sub.id);
    setIsAdding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vul een naam in voor de onderaannemer');
      return;
    }

    if (!companyId) {
      alert('Geen bedrijf ID gevonden');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        ...formData,
        company_id: companyId,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        day_rate: formData.day_rate ? parseFloat(formData.day_rate) : null
      };

      if (editingId) {
        await Subcontractor.update(editingId, data);
      } else {
        await Subcontractor.create({
          ...data,
          status: 'active'
        });
      }
      resetForm();
      // Wacht even zodat de database update is voltooid
      await new Promise(resolve => setTimeout(resolve, 100));
      onRefresh();
    } catch (error) {
      console.error('Error saving subcontractor:', error);
      // Toon specifieke error details
      const errorMessage = error.message || error.error_description || 'Onbekende fout';
      alert(`Fout bij opslaan onderaannemer: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (subId) => {
    if (!confirm('Weet u zeker dat u deze onderaannemer wilt verwijderen?')) return;
    
    setIsLoading(true);
    try {
      await Subcontractor.update(subId, { status: 'inactive' });
      onRefresh();
    } catch (error) {
      console.error('Error deleting subcontractor:', error);
      alert('Fout bij verwijderen onderaannemer');
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Onderaannemers & Freelancers</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{subcontractors.length} contacten</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Naam / Bedrijf *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Vertuoza Menuiserie"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contactpersoon</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Jan Bakker"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@bedrijf.nl"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+31 6 12345678"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="specialty">Specialiteit</Label>
                  <Select 
                    value={formData.specialty} 
                    onValueChange={(val) => setFormData({ ...formData, specialty: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(spec => (
                        <SelectItem key={spec.value} value={spec.value}>{spec.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kvk_number">KVK-nummer</Label>
                  <Input
                    id="kvk_number"
                    value={formData.kvk_number}
                    onChange={(e) => setFormData({ ...formData, kvk_number: e.target.value })}
                    placeholder="12345678"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Uurtarief (€)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    placeholder="45.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="day_rate">Dagtarief (€)</Label>
                  <Input
                    id="day_rate"
                    type="number"
                    step="0.01"
                    value={formData.day_rate}
                    onChange={(e) => setFormData({ ...formData, day_rate: e.target.value })}
                    placeholder="350.00"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Badge kleur</Label>
                  <div className="flex gap-2 mt-2">
                    {badgeColors.map(color => (
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
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optionele notities over tarieven, beschikbaarheid, etc..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
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
              className="w-full mb-4 bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe onderaannemer toevoegen
            </Button>
          )}

          {/* Subcontractors List */}
          <div className="space-y-3">
            {subcontractors.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nog geen onderaannemers toegevoegd</p>
              </div>
            ) : (
              subcontractors.map(sub => {
                const colorInfo = badgeColors.find(c => c.value === sub.color) || badgeColors[0];
                const specInfo = specialties.find(s => s.value === sub.specialty);
                
                return (
                  <div 
                    key={sub.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorInfo.bg)}>
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{sub.name}</span>
                        {specInfo && (
                          <Badge variant="outline" className="text-xs">{specInfo.label}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {sub.contact_person && <span>{sub.contact_person}</span>}
                        {sub.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {sub.phone}
                          </span>
                        )}
                        {sub.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {sub.email}
                          </span>
                        )}
                      </div>
                      {(sub.hourly_rate || sub.day_rate) && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {sub.hourly_rate && `€${sub.hourly_rate}/uur`}
                          {sub.hourly_rate && sub.day_rate && ' • '}
                          {sub.day_rate && `€${sub.day_rate}/dag`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(sub)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(sub.id)}
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


