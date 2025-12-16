import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlanningEvent } from '@/api/entities';

const eventTypeOptions = [
  { value: "bouwverlof", label: "Bouwverlof" },
  { value: "schilder_verlof", label: "Verlof Schilder" },
  { value: "tijdelijke_werkloosheid", label: "Tijdelijke Werkloosheid" },
  { value: "rustdag_bouw", label: "Rustdag Bouw" },
  { value: "feestdag", label: "Feestdag" }
];

const colorOptions = [
  { value: "red", label: "Rood", bg: "bg-red-100", border: "border-red-200", text: "text-red-800" },
  { value: "orange", label: "Oranje", bg: "bg-orange-100", border: "border-orange-200", text: "text-orange-800" },
  { value: "yellow", label: "Geel", bg: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-800" },
  { value: "green", label: "Groen", bg: "bg-green-100", border: "border-green-200", text: "text-green-800" },
  { value: "blue", label: "Blauw", bg: "bg-blue-100", border: "border-blue-200", text: "text-blue-800" },
  { value: "purple", label: "Paars", bg: "bg-purple-100", border: "border-purple-200", text: "text-purple-800" },
  { value: "pink", label: "Roze", bg: "bg-pink-100", border: "border-pink-200", text: "text-pink-800" },
  { value: "gray", label: "Grijs", bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" }
];

export default function PlanningEventForm({ event, selectedDate, companyId, currentUser, painters, onCancel }) {
  const [currentEvent, setCurrentEvent] = useState(() => ({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "feestdag",
    start_date: event?.start_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ""),
    end_date: event?.end_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ""),
    color: event?.color || "gray",
    affected_painters: event?.affected_painters || [],
    is_recurring: event?.is_recurring || false
  }));

  const [selectedPainters, setSelectedPainters] = useState(event?.affected_painters || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPainterPopover, setOpenPainterPopover] = useState(false);

  const handleChange = (field, value) => {
    setCurrentEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleTogglePainter = (email) => {
    setSelectedPainters(prev =>
      prev.includes(email)
        ? prev.filter(p => p !== email)
        : [...prev, email]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const eventData = {
        ...currentEvent,
        company_id: companyId,
        created_by: currentUser?.email,
        affected_painters: (currentEvent.event_type === 'schilder_verlof' || currentEvent.event_type === 'tijdelijke_werkloosheid') ? selectedPainters : []
      };

      // Validatie
      if (!eventData.title || !eventData.start_date || !eventData.end_date) {
        alert("Vul alle verplichte velden in.");
        setIsSubmitting(false);
        return;
      }

      if (new Date(eventData.end_date) < new Date(eventData.start_date)) {
        alert("Einddatum kan niet vóór startdatum zijn.");
        setIsSubmitting(false);
        return;
      }

      if ((eventData.event_type === 'schilder_verlof' || eventData.event_type === 'tijdelijke_werkloosheid') && selectedPainters.length === 0) {
        alert("Selecteer minimaal één schilder voor dit event type.");
        setIsSubmitting(false);
        return;
      }

      // Create or update event
      if (event?.id) {
        await PlanningEvent.update(event.id, eventData);
      } else {
        await PlanningEvent.create(eventData);
      }

      // Close form and trigger parent refresh
      onCancel(); // This will close the form and parent should refresh

    } catch (error) {
      console.error('Error saving planning event:', error);
      alert(`Kon planning event niet opslaan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedPaintersDetails = () => {
    return selectedPainters
      .map(email => painters.find(p => p.email === email))
      .filter(Boolean);
  };

  const requiresPainterSelection = currentEvent.event_type === 'schilder_verlof' || currentEvent.event_type === 'tijdelijke_werkloosheid';

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              {event ? 'Planning Item Bewerken' : 'Nieuw Planning Item'}
            </h2>
            <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Type *</Label>
              <Select
                value={currentEvent.event_type}
                onValueChange={(value) => handleChange("event_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Kleur</Label>
              <Select
                value={currentEvent.color}
                onValueChange={(value) => handleChange("color", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${color.bg} ${color.border}`}></div>
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={currentEvent.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Bijv. Kerstvakantie, Verlof Jan Jansen"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum *</Label>
              <Input
                id="start_date"
                type="date"
                value={currentEvent.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Einddatum *</Label>
              <Input
                id="end_date"
                type="date"
                value={currentEvent.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                required
              />
            </div>

            {requiresPainterSelection && (
              <div className="space-y-2 md:col-span-2">
                <Label>Betreffende Schilder(s) *</Label>
                <Popover open={openPainterPopover} onOpenChange={setOpenPainterPopover}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      Selecteer schilders...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Zoek schilder..." />
                      <CommandList>
                        <CommandEmpty>Geen schilders gevonden.</CommandEmpty>
                        <CommandGroup>
                          {painters.map(painter => (
                            <CommandItem
                              key={painter.email}
                              onSelect={() => handleTogglePainter(painter.email)}
                            >
                              <div className={`mr-2 h-4 w-4 rounded ${selectedPainters.includes(painter.email) ? 'bg-emerald-500' : 'border border-gray-300'}`} />
                              {painter.full_name} ({painter.email})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <div className="flex flex-wrap gap-2 mt-2">
                  {getSelectedPaintersDetails().map(painter => (
                    <span key={painter.email} className="flex items-center bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full dark:bg-slate-700 dark:text-slate-200">
                      {painter.full_name}
                      <button
                        type="button"
                        className="ml-1.5 text-gray-400 hover:text-gray-600"
                        onClick={() => handleTogglePainter(painter.email)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={currentEvent.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Optionele beschrijving of toelichting"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_recurring"
              checked={currentEvent.is_recurring}
              onCheckedChange={(checked) => handleChange("is_recurring", checked)}
            />
            <Label htmlFor="is_recurring" className="text-sm">
              Jaarlijks terugkerend (bijv. voor feestdagen)
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {event ? "Bijwerken" : "Toevoegen"}
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}