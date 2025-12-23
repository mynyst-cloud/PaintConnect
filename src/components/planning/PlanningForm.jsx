
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import LoadingSpinner, { InlineSpinner } from "@/components/ui/LoadingSpinner";
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
import { X, Save, Calendar, UserPlus, Trash2, Upload, Star, Camera, Check, Mail, MapPin, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { base44 } from "@/api/base44Client";
import { geocodeAddress } from "@/api/functions";
import ProjectsMap from "@/components/projects/ProjectsMap";

const statusOptions = [
  { value: "nieuw", label: "Nieuw" },
  { value: "planning", label: "Planning" },
  { value: "in_uitvoering", label: "In uitvoering" },
  { value: "afgerond", label: "Afgerond" },
  { value: "on_hold", label: "On Hold" },
  { value: "geannuleerd", label: "Geannuleerd" },
  { value: "offerte", label: "Offerte" }
];

export default function PlanningForm({ project, selectedDate, onSubmit, onCancel, painters: availablePainters }) {
  const [currentProject, setCurrentProject] = useState(() => ({
    project_name: project?.project_name || "",
    client_name: project?.client_name || "",
    client_email: project?.client_email || "",
    address: project?.address || "",
    start_date: project?.start_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ""),
    expected_end_date: project?.expected_end_date || "",
    status: project?.status || "nieuw",
    description: project?.description || "",
    assigned_painters: project?.assigned_painters || [],
    notes: project?.notes || "",
    estimated_hours: project?.estimated_hours || "",
    actual_hours: project?.actual_hours || 0,
    photo_urls: project?.photo_urls || [],
    thumbnail_url: project?.thumbnail_url || "",
    cover_photo_url: project?.cover_photo_url || project?.thumbnail_url || "",
    calendar_color: project?.calendar_color || "blue",
    is_outdoor: project?.is_outdoor || false,
    latitude: project?.latitude || null,
    longitude: project?.longitude || null,
    work_start_time: project?.work_start_time?.slice(0, 5) || "08:00",
    work_end_time: project?.work_end_time?.slice(0, 5) || "17:00"
  }));

  const [assignedPainterEmails, setAssignedPainterEmails] = useState(project?.assigned_painters || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [openPainterPopover, setOpenPainterPopover] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);

  // NEW: Address validation states
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(project?.latitude && project?.longitude ? { latitude: project.latitude, longitude: project.longitude } : null);
  const [addressError, setAddressError] = useState(null);
  const [showMapPreview, setShowMapPreview] = useState(false);

  // Filter voor actieve schilders EN admins (meewerkend zaakvoerder)
  const activePainters = useMemo(() => {
    return (availablePainters || []).filter(p =>
      p &&
      p.status === 'active' &&
      (p.is_painter === true || p.company_role === 'admin')
    );
  }, [availablePainters]);

  const colorOptions = [
    { value: "blue", label: "Blauw", bg: "bg-blue-100", border: "border-blue-200", text: "text-blue-800" },
    { value: "green", label: "Groen", bg: "bg-green-100", border: "border-green-200", text: "text-green-800" },
    { value: "yellow", label: "Geel", bg: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-800" },
    { value: "red", label: "Rood", bg: "bg-red-100", border: "border-red-200", text: "text-red-800" },
    { value: "purple", label: "Paars", bg: "bg-purple-100", border: "border-purple-200", text: "text-purple-800" },
    { value: "pink", label: "Roze", bg: "bg-pink-100", border: "border-pink-200", text: "text-pink-800" },
    { value: "indigo", label: "Indigo", bg: "bg-indigo-100", border: "border-indigo-200", text: "text-indigo-800" },
    { value: "gray", label: "Grijs", bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" }
  ];

  // Effect to sync currentProject and assigned painters when the project prop changes
  useEffect(() => {
    setCurrentProject({
      project_name: project?.project_name || "",
      client_name: project?.client_name || "",
      client_email: project?.client_email || "",
      address: project?.address || "",
      start_date: project?.start_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ""),
      expected_end_date: project?.expected_end_date || "",
      status: project?.status || "nieuw",
      description: project?.description || "",
      assigned_painters: project?.assigned_painters || [],
      notes: project?.notes || "",
      estimated_hours: project?.estimated_hours || "",
      actual_hours: project?.actual_hours || 0,
      photo_urls: project?.photo_urls || [],
      thumbnail_url: project?.thumbnail_url || "",
      cover_photo_url: project?.cover_photo_url || project?.thumbnail_url || "",
      calendar_color: project?.calendar_color || "blue",
      is_outdoor: project?.is_outdoor || false,
      latitude: project?.latitude || null,
      longitude: project?.longitude || null,
      work_start_time: project?.work_start_time?.slice(0, 5) || "08:00",
      work_end_time: project?.work_end_time?.slice(0, 5) || "17:00"
    });
    setAssignedPainterEmails(project?.assigned_painters || []);

    // Reset geocode states when project changes or on initial load if project has coords
    if (project?.latitude && project?.longitude) {
      setGeocodeResult({ latitude: project.latitude, longitude: project.longitude });
      setShowMapPreview(true);
      setAddressError(null);
    } else {
      setGeocodeResult(null);
      setShowMapPreview(false);
      setAddressError(null); // Ensure error is cleared if no coords initially
    }
  }, [project, selectedDate]);


  const handleChange = (field, value) => {
    setCurrentProject(prev => ({ ...prev, [field]: value }));
    // If address changes, reset validation states
    if (field === "address") {
      setGeocodeResult(null);
      setAddressError(null);
      setShowMapPreview(false);
      // Also clear latitude/longitude when address changes
      setCurrentProject(prev => ({ ...prev, latitude: null, longitude: null }));
    }
  };

  // NEW: Address validation function with specific error messages
  const handleAddressValidation = useCallback(async (address) => {
    if (!address || address.trim() === "") {
      setAddressError(null);
      setGeocodeResult(null);
      setShowMapPreview(false);
      setCurrentProject(prev => ({ ...prev, latitude: null, longitude: null }));
      return;
    }

    setIsGeocoding(true);
    setAddressError(null);

    try {
      const { data } = await geocodeAddress({ address: address.trim() });

      if (data && data.latitude !== undefined && data.longitude !== undefined) {
        const coords = {
          latitude: data.latitude,
          longitude: data.longitude
        };

        setGeocodeResult(coords);
        setAddressError(null);
        setShowMapPreview(true);
        setCurrentProject(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude
        }));
      } else {
        // Backend retourneerde geen coordinates, maar misschien wel een error boodschap
        const errorMsg = data?.error || "Adres niet gevonden. Controleer de invoer.";
        setAddressError(errorMsg);
        setGeocodeResult(null);
        setShowMapPreview(false);
        setCurrentProject(prev => ({ ...prev, latitude: null, longitude: null }));
      }
    } catch (error) {
      console.error("Address validation error:", error);
      // Haal de specifieke foutmelding uit de backend response
      const specificErrorMessage = error.response?.data?.error || "Kon adres niet valideren. Probeer het opnieuw.";
      setAddressError(specificErrorMessage);
      setGeocodeResult(null);
      setShowMapPreview(false);
      setCurrentProject(prev => ({ ...prev, latitude: null, longitude: null }));
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleTogglePainter = (email) => {
    setAssignedPainterEmails(prevEmails => {
      const newEmails = prevEmails.includes(email)
        ? prevEmails.filter(p => p !== email)
        : [...prevEmails, email];

      setCurrentProject(prevProject => ({
        ...prevProject,
        assigned_painters: newEmails
      }));

      return newEmails;
    });
  };

  const handlePhotoUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setIsUploading(true);
      try {
          // Changed to base44.integrations.Core.UploadFile
          const uploadPromises = files.map(file => base44.integrations.Core.UploadFile({ file }));
          const results = await Promise.all(uploadPromises);
          const newUrls = results.map(res => res.file_url).filter(Boolean);

          setCurrentProject(prev => ({
              ...prev,
              photo_urls: [...prev.photo_urls, ...newUrls],
              // Set first uploaded photo as cover if none exists
              cover_photo_url: prev.cover_photo_url || newUrls[0] || "",
              thumbnail_url: prev.thumbnail_url || newUrls[0] || ""
          }));
      } catch (error) {
          console.error("Error uploading photos:", error);
          alert("Kon foto's niet uploaden.");
      } finally {
          setIsUploading(false);
      }
  };

  const handleSetCoverPhoto = (url) => {
      setCurrentProject(prev => ({
          ...prev,
          cover_photo_url: url,
          thumbnail_url: url // Also update thumbnail for consistency
      }));
  };

  const handleDeletePhoto = (urlToDelete) => {
      setCurrentProject(prev => {
          const newPhotos = prev.photo_urls.filter(url => url !== urlToDelete);
          // If the deleted photo was the cover, reset cover photo to the first available one or empty
          const newCover = prev.cover_photo_url === urlToDelete ? (newPhotos[0] || "") : prev.cover_photo_url;

          return {
              ...prev,
              photo_urls: newPhotos,
              cover_photo_url: newCover,
              thumbnail_url: newCover
          };
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // NEW: Validate address before submitting
    if (currentProject.address && addressError) {
      alert("Los eerst de adresfout op voordat u het project opslaat.");
      return;
    }
    if (currentProject.address && !geocodeResult && !isGeocoding) {
        // If an address is entered but not yet geocoded or resulted in an error, try to geocode first.
        // This can happen if user types address and immediately clicks submit without blurring.
        await handleAddressValidation(currentProject.address);
        if (!geocodeResult) { // If still no result after attempted validation
            alert("Valideer het adres voordat u het project opslaat.");
            return;
        }
    }


    setIsSubmitting(true);

    const cleanedData = {
      ...currentProject,
      estimated_hours: currentProject.estimated_hours === "" ? null : parseFloat(currentProject.estimated_hours),
      actual_hours: currentProject.actual_hours === "" ? 0 : parseFloat(currentProject.actual_hours),
      assigned_painters: assignedPainterEmails,
      client_email: currentProject.client_email || null,
      description: currentProject.description || null,
      notes: currentProject.notes || null,
      start_date: currentProject.start_date || null,
      expected_end_date: currentProject.expected_end_date || null,
      thumbnail_url: currentProject.cover_photo_url || currentProject.thumbnail_url || (currentProject.photo_urls[0] || ""),
      latitude: currentProject.latitude, // Included latitude
      longitude: currentProject.longitude, // Included longitude
      work_start_time: currentProject.work_start_time ? `${currentProject.work_start_time}:00` : '08:00:00',
      work_end_time: currentProject.work_end_time ? `${currentProject.work_end_time}:00` : '17:00:00'
    };

    if (!cleanedData.project_name || !cleanedData.client_name || !cleanedData.address || !cleanedData.start_date || !cleanedData.expected_end_date) {
        alert("Vul alstublieft alle verplichte velden in (gemarkeerd met *).");
        setIsSubmitting(false);
        return;
    }

    await onSubmit(cleanedData);
    setIsSubmitting(false);
  };

  const getAssignedPaintersDetails = () => {
      return assignedPainterEmails
          .map(email => activePainters.find(p => p.email === email))
          .filter(Boolean);
  };

  const handleSendClientInvitation = async () => {
    if (!currentProject.client_email || !project?.id) {
      alert("Er is geen klant e-mailadres beschikbaar of project is nog niet opgeslagen.");
      return;
    }

    if (!window.confirm(`Wilt u een uitnodiging voor het klantenportaal sturen naar ${currentProject.client_email}?`)) {
      return;
    }

    setIsSendingInvitation(true);
    try {
      // GEFIXED: Gebruik snake_case parameters zoals de backend verwacht
      // Changed to base44.functions.invoke
      await base44.functions.invoke('sendClientInvitation', {
        project_id: project.id,
        client_email: currentProject.client_email,
        client_name: currentProject.client_name
      });
      alert(`Uitnodiging succesvol verzonden naar ${currentProject.client_email}`);
    } catch (error) {
      console.error("Error sending client invitation:", error);
      alert(`Kon uitnodiging niet verzenden: ${error.message}`);
    } finally {
      setIsSendingInvitation(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[1000]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              {project ? 'Project Bewerken' : 'Nieuw Project Plannen'}
            </h2>
            <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Projectnaam *</Label>
              <Input
                id="project_name"
                value={currentProject.project_name}
                onChange={(e) => handleChange("project_name", e.target.value)}
                placeholder="Bijv. Villa Renovatie Amsterdam"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar_color">Kalender Kleur</Label>
              <Select
                value={currentProject.calendar_color}
                onValueChange={(value) => handleChange("calendar_color", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
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

            <div className="space-y-2">
              <Label htmlFor="client_name">Klantnaam *</Label>
              <Input
                id="client_name"
                value={currentProject.client_name}
                onChange={(e) => handleChange("client_name", e.target.value)}
                placeholder="Naam van de klant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Klant E-mail</Label>
              <Input
                id="client_email"
                type="email"
                value={currentProject.client_email}
                onChange={(e) => handleChange("client_email", e.target.value)}
                placeholder="klant@email.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="assigned_painters">Toegewezen Schilder(s)</Label>
              {activePainters.length === 0 ? (
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  <p className="text-sm">Geen actieve schilders beschikbaar. Voeg eerst teamleden toe via Accountinstellingen.</p>
                </div>
              ) : (
                <>
                  <Popover open={openPainterPopover} onOpenChange={setOpenPainterPopover}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-start text-left h-auto min-h-[40px]">
                            <UserPlus className="mr-2 h-4 w-4 flex-shrink-0" />
                            {getAssignedPaintersDetails().length > 0
                                ? (
                                    <div className="flex flex-wrap gap-1">
                                        {getAssignedPaintersDetails().map(p => (
                                            <span key={p.email} className="text-sm bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{p.full_name.split(' ')[0]}</span>
                                        ))}
                                    </div>
                                )
                                : "Selecteer schilders..."
                            }
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[1100]" align="start">
                        <Command>
                            <CommandInput placeholder="Zoek schilder op naam..." />
                            <CommandList>
                                <CommandEmpty>Geen schilders gevonden.</CommandEmpty>
                                <CommandGroup>
                                    {activePainters.map(painter => (
                                        <CommandItem
                                            key={painter.email}
                                            value={`${painter.full_name} ${painter.email}`}
                                            onSelect={() => {
                                                handleTogglePainter(painter.email);
                                            }}
                                        >
                                            <div className={`mr-2 h-4 w-4 rounded-sm border flex items-center justify-center ${assignedPainterEmails.includes(painter.email) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                                               {assignedPainterEmails.includes(painter.email) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            {painter.full_name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {getAssignedPaintersDetails().map(painter => (
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
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum *</Label>
              <Input
                id="start_date"
                type="date"
                value={currentProject.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_end_date">Verwachte Einddatum *</Label>
              <Input
                id="expected_end_date"
                type="date"
                value={currentProject.expected_end_date}
                onChange={(e) => handleChange("expected_end_date", e.target.value)}
                required
              />
            </div>

            {/* Werktijden voor check-in reminders */}
            <div className="space-y-2">
              <Label htmlFor="work_start_time" className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Starttijd werkdag
              </Label>
              <Input
                id="work_start_time"
                type="time"
                value={currentProject.work_start_time}
                onChange={(e) => handleChange("work_start_time", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_end_time" className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Eindtijd werkdag
              </Label>
              <Input
                id="work_end_time"
                type="time"
                value={currentProject.work_end_time}
                onChange={(e) => handleChange("work_end_time", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={currentProject.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Geschatte Uren</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                value={currentProject.estimated_hours}
                onChange={(e) => handleChange("estimated_hours", e.target.value)}
                placeholder="40"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_outdoor"
                  checked={currentProject.is_outdoor}
                  onChange={(e) => handleChange("is_outdoor", e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor="is_outdoor" className="text-sm cursor-pointer">
                  Dit is een buitenproject (toon weersinformatie)
                </Label>
              </div>
            </div>

          </div>

          {/* NEW: Address field with validation */}
          <div className="space-y-2">
            <Label htmlFor="address">Adres *</Label>
            <div className="relative">
              <Input
                id="address"
                value={currentProject.address}
                onChange={(e) => handleChange("address", e.target.value)}
                onBlur={(e) => handleAddressValidation(e.target.value)}
                placeholder="Straat 123, Plaats"
                required
                className={`pr-10 ${
                  isGeocoding ? 'border-blue-500 focus-visible:ring-blue-500' :
                  addressError ? 'border-red-500 focus-visible:ring-red-500' :
                  geocodeResult ? 'border-green-500 focus-visible:ring-green-500' : ''
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isGeocoding && <InlineSpinner />}
                {!isGeocoding && addressError && <AlertCircle className="w-4 h-4 text-red-500" />}
                {!isGeocoding && geocodeResult && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </div>
            </div>

            {/* Validation feedback */}
            {isGeocoding && (
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                <InlineSpinner />
                Adres valideren...
              </p>
            )}
            {addressError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {addressError}
              </p>
            )}
            {geocodeResult && !addressError && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Adres gevalideerd en locatie gevonden
              </p>
            )}

            {/* Map preview */}
            {showMapPreview && geocodeResult && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="h-48 w-full">
                  <ProjectsMap
                    projects={[{
                      id: 'preview',
                      project_name: currentProject.project_name || 'Preview Project',
                      latitude: geocodeResult.latitude,
                      longitude: geocodeResult.longitude,
                      address: currentProject.address
                    }]}
                    onMarkerClick={() => {}}
                    initialCenter={{
                      lat: geocodeResult.latitude,
                      lng: geocodeResult.longitude,
                      zoom: 17
                    }}
                  />
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 px-3 py-2 text-xs text-gray-600 dark:text-slate-400 flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>{currentProject.address}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={currentProject.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Beschrijving van het werk dat uitgevoerd moet worden"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Planning Notities</Label>
            <Textarea
              id="notes"
              value={currentProject.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Speciale instructies voor de planning (toegang, materialen, etc.)"
              rows={2}
            />
          </div>

          {/* Photo Management Section */}
          <div className="space-y-4 pt-4 border-t dark:border-slate-700">
              <Label className="text-lg font-semibold flex items-center gap-2"><Camera className="w-5 h-5" /> Projectfoto's</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(currentProject.photo_urls || []).map(url => (
                      <div key={url} className="relative group aspect-square">
                          <img src={url} alt="Project photo" className="w-full h-full object-cover rounded-md"/>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button type="button" variant="outline" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 border-none text-white" onClick={() => handleSetCoverPhoto(url)}>
                                  <Star className={`w-4 h-4 ${currentProject.cover_photo_url === url ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                              </Button>
                              <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeletePhoto(url)}>
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>
                      </div>
                  ))}
                  <Label htmlFor="photo-upload" className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      {isUploading ? (
                          <LoadingSpinner size="sm" />
                      ) : (
                          <>
                              <Upload className="w-6 h-6 text-gray-400"/>
                              <span className="text-sm mt-2 text-gray-500">Upload</span>
                          </>
                      )}
                  </Label>
                  <Input id="photo-upload" type="file" multiple className="hidden" onChange={handlePhotoUpload} disabled={isUploading} accept="image/*" />
              </div>
          </div>

          {/* NEW: Client Portal Invitation Button - only show when editing existing project with email */}
          {project && currentProject.client_email && (
            <div className="pt-4 border-t dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleSendClientInvitation}
                disabled={isSendingInvitation}
                className="w-full flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {isSendingInvitation ? 'Uitnodiging versturen...' : 'Nodig klant uit naar klantenportaal'}
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || isGeocoding || (currentProject.address && addressError !== null)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <InlineSpinner />
                  Bezig...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {project ? "Project Bijwerken" : "Project Plannen"}
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
