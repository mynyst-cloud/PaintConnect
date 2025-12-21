import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, Calendar as CalendarIcon, Upload, Loader2, User, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { UploadFile } from "@/api/integrations";
import { User as UserEntity } from "@/api/entities";

const statusOptions = [
  { value: "nieuw", label: "Nieuw" },
  { value: "planning", label: "Planning" },
  { value: "in_uitvoering", label: "In uitvoering" },
  { value: "afgerond", label: "Afgerond" },
  { value: "on_hold", label: "On Hold" },
  { value: "geannuleerd", label: "Geannuleerd" },
  { value: "offerte", label: "Offerte" }
];

const colorOptions = [
  { value: "blue", label: "Blauw", color: "bg-blue-500" },
  { value: "green", label: "Groen", color: "bg-green-500" },
  { value: "yellow", label: "Geel", color: "bg-yellow-500" },
  { value: "red", label: "Rood", color: "bg-red-500" },
  { value: "purple", label: "Paars", color: "bg-purple-500" },
  { value: "pink", label: "Roze", color: "bg-pink-500" },
  { value: "indigo", label: "Indigo", color: "bg-indigo-500" },
  { value: "gray", label: "Grijs", color: "bg-gray-500" }
];

export default function ProjectForm({ project, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    project_name: "",
    client_name: "",
    client_email: "",
    address: "",
    start_date: "",
    expected_end_date: "",
    status: "nieuw",
    progress_percentage: 0,
    description: "",
    assigned_painters: [],
    notes: "",
    estimated_hours: "",
    photo_urls: [],
    thumbnail_url: "",
    cover_photo_url: "",
    calendar_color: "blue",
    quote_price: "",
    work_start_time: "08:00",
    work_end_time: "17:00"
  });

  const [availablePainters, setAvailablePainters] = useState([]);
  const [isLoadingPainters, setIsLoadingPainters] = useState(true);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.project_name || "",
        client_name: project.client_name || "",
        client_email: project.client_email || "",
        address: project.address || "",
        start_date: project.start_date || "",
        expected_end_date: project.expected_end_date || "",
        status: project.status || "nieuw",
        progress_percentage: project.progress_percentage || 0,
        description: project.description || "",
        assigned_painters: project.assigned_painters || [],
        notes: project.notes || "",
        estimated_hours: project.estimated_hours?.toString() || "",
        photo_urls: project.photo_urls || [],
        thumbnail_url: project.thumbnail_url || "",
        cover_photo_url: project.cover_photo_url || "",
        calendar_color: project.calendar_color || "blue",
        quote_price: project.quote_price || "",
        work_start_time: project.work_start_time?.slice(0, 5) || "08:00",
        work_end_time: project.work_end_time?.slice(0, 5) || "17:00"
      });
    }
    loadUsers();
  }, [project]);

  const loadUsers = async () => {
    setIsLoadingPainters(true);
    try {
      const currentUser = await UserEntity.me();
      if (currentUser?.company_id) {
        const users = await UserEntity.filter({ company_id: currentUser.company_id });
        // Include all painters AND the current user (admin can assign themselves as "meewerkend zaakvoerder")
        const painters = users.filter(user => user.is_painter || user.id === currentUser.id);
        setAvailablePainters(painters);
      }
    } catch (error) {
      console.error("Error loading painters:", error);
      setAvailablePainters([]);
    } finally {
      setIsLoadingPainters(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePainterToggle = (painterId) => {
    setFormData(prev => ({
      ...prev,
      assigned_painters: prev.assigned_painters.includes(painterId)
        ? prev.assigned_painters.filter(id => id !== painterId)
        : [...prev.assigned_painters, painterId]
    }));
  };

  const handleDateChange = (field, date) => {
    if (date) {
      handleChange(field, format(date, "yyyy-MM-dd"));
    } else {
      handleChange(field, "");
    }
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map(result => result.file_url);
      
      setFormData(prev => ({
        ...prev,
        photo_urls: [...(prev.photo_urls || []), ...newPhotoUrls],
        thumbnail_url: prev.thumbnail_url || newPhotoUrls[0], // Set first photo as thumbnail if none exists
        cover_photo_url: prev.cover_photo_url || newPhotoUrls[0] // Also set as cover if none exists
      }));
    } catch (error) {
      console.error("Error uploading photos:", error);
      setErrors(prev => ({ ...prev, photos: "Foto's uploaden mislukt." }));
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => {
      const newPhotoUrls = prev.photo_urls.filter((_, i) => i !== index);
      const wasThumbnail = prev.thumbnail_url === prev.photo_urls[index];
      const wasCover = prev.cover_photo_url === prev.photo_urls[index];

      return {
        ...prev,
        photo_urls: newPhotoUrls,
        thumbnail_url: wasThumbnail ? (newPhotoUrls[0] || "") : prev.thumbnail_url,
        cover_photo_url: wasCover ? (newPhotoUrls[0] || "") : prev.cover_photo_url
      };
    });
  };

  const setAsThumbnail = (url) => {
    handleChange("thumbnail_url", url);
  };
  
  const setAsCover = (url) => {
    handleChange("cover_photo_url", url);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.project_name?.trim()) newErrors.project_name = "Projectnaam is verplicht";
    if (!formData.client_name?.trim()) newErrors.client_name = "Klantnaam is verplicht";
    if (!formData.address?.trim()) newErrors.address = "Adres is verplicht";
    
    if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = "Ongeldig e-mailadres";
    }
    
    if (formData.estimated_hours && (isNaN(formData.estimated_hours) || parseFloat(formData.estimated_hours) < 0)) {
      newErrors.estimated_hours = "Geschatte uren moet een geldig getal zijn";
    }

    if (formData.start_date && formData.expected_end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.expected_end_date);
      if (endDate <= startDate) {
        newErrors.expected_end_date = "Einddatum moet na startdatum liggen";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      client_email: formData.client_email?.trim() || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      quote_price: formData.quote_price ? parseFloat(formData.quote_price) : null,
      notes: formData.notes?.trim() || null,
      description: formData.description?.trim() || null,
      work_start_time: formData.work_start_time ? `${formData.work_start_time}:00` : '08:00:00',
      work_end_time: formData.work_end_time ? `${formData.work_end_time}:00` : '17:00:00'
    };

    await onSubmit(submitData);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">
                {project ? "Project Bewerken" : "Nieuw Project"}
              </CardTitle>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Basis Informatie */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project_name">Projectnaam *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => handleChange("project_name", e.target.value)}
                    className={errors.project_name ? "border-red-300" : ""}
                    placeholder="Bijv. Schilderen woonkamer"
                  />
                  {errors.project_name && <p className="text-red-500 text-sm mt-1">{errors.project_name}</p>}
                </div>

                <div>
                  <Label htmlFor="client_name">Klantnaam *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => handleChange("client_name", e.target.value)}
                    className={errors.client_name ? "border-red-300" : ""}
                    placeholder="Voor- en achternaam"
                  />
                  {errors.client_name && <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>}
                </div>

                <div>
                  <Label htmlFor="client_email">E-mailadres klant</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleChange("client_email", e.target.value)}
                    className={errors.client_email ? "border-red-300" : ""}
                    placeholder="voor klantportaal toegang"
                  />
                  {errors.client_email && <p className="text-red-500 text-sm mt-1">{errors.client_email}</p>}
                </div>

                <div>
                  <Label htmlFor="address">Adres *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className={errors.address ? "border-red-300" : ""}
                    placeholder="Volledig adres van het project"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Startdatum</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(parseISO(formData.start_date), 'PPP', { locale: nl }) : 'Selecteer datum'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date ? parseISO(formData.start_date) : undefined}
                          onSelect={(date) => handleDateChange("start_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Verwachte einddatum</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expected_end_date ? format(parseISO(formData.expected_end_date), 'PPP', { locale: nl }) : 'Selecteer datum'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.expected_end_date ? parseISO(formData.expected_end_date) : undefined}
                          onSelect={(date) => handleDateChange("expected_end_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.expected_end_date && <p className="text-red-500 text-sm mt-1">{errors.expected_end_date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="estimated_hours">Geschatte uren</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.estimated_hours}
                      onChange={(e) => handleChange("estimated_hours", e.target.value)}
                      className={errors.estimated_hours ? "border-red-300" : ""}
                      placeholder="Bijv. 40"
                    />
                    {errors.estimated_hours && <p className="text-red-500 text-sm mt-1">{errors.estimated_hours}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="quote_price">Offerteprijs (€)</Label>
                  <Input
                    id="quote_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quote_price}
                    onChange={(e) => handleChange("quote_price", e.target.value)}
                    placeholder="Totaalbedrag offerte"
                  />
                </div>

                <div>
                  <Label htmlFor="calendar_color">Kalender kleur</Label>
                  <Select value={formData.calendar_color} onValueChange={(value) => handleChange("calendar_color", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer kleur" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Werktijden voor check-in reminders */}
                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Werktijden (voor herinneringen)
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Schilders krijgen een push melding bij aanvang en einde werkdag
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="work_start_time">Starttijd</Label>
                      <Input
                        id="work_start_time"
                        type="time"
                        value={formData.work_start_time}
                        onChange={(e) => handleChange("work_start_time", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="work_end_time">Eindtijd</Label>
                      <Input
                        id="work_end_time"
                        type="time"
                        value={formData.work_end_time}
                        onChange={(e) => handleChange("work_end_time", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Schilders Toewijzing & Beschrijving */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Schilders aan project toewijzen
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                    Toegewezen schilders kunnen het project zien, planning volgen en updates plaatsen
                  </p>
                  
                  {isLoadingPainters ? (
                    <div className="flex items-center gap-2 p-4 border rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">Schilders laden...</span>
                    </div>
                  ) : availablePainters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800/50">
                      {availablePainters.map((painter) => (
                        <div key={painter.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`painter-${painter.id}`}
                            checked={formData.assigned_painters.includes(painter.id)}
                            onCheckedChange={() => handlePainterToggle(painter.id)}
                          />
                          <Label
                            htmlFor={`painter-${painter.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {painter.full_name || painter.email}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-slate-800/50 text-center">
                      <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Geen schilders beschikbaar om toe te wijzen
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Beschrijving van het werk dat uitgevoerd moet worden"
                    rows={4}
                  />
                </div>
              </div>

              {/* Column 3: Notities & Foto's */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Interne notities</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Interne notities (niet zichtbaar voor klant)"
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">Projectfoto's</Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('photo-upload').click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Foto's Toevoegen
                      </Button>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      {isUploading && <span className="text-sm text-gray-600">Uploaden...</span>}
                    </div>
                    
                    {errors.photos && <p className="text-red-500 text-sm">{errors.photos}</p>}
                    
                    {formData.photo_urls && formData.photo_urls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.photo_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Project foto ${index + 1}`}
                              className={`w-full h-24 object-cover rounded border-2 ${
                                formData.thumbnail_url === url ? 'border-emerald-500' : 
                                formData.cover_photo_url === url ? 'border-blue-500' : ''
                              }`}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded flex items-center justify-center p-1">
                              <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1">
                                {formData.thumbnail_url !== url && (
                                  <Button type="button" size="sm" variant="secondary" onClick={() => setAsThumbnail(url)} className="text-xs h-6 px-2 w-full">Hoofd</Button>
                                )}
                                {formData.cover_photo_url !== url && (
                                  <Button type="button" size="sm" variant="secondary" onClick={() => setAsCover(url)} className="text-xs h-6 px-2 w-full">Cover</Button>
                                )}
                                <Button type="button" size="sm" variant="destructive" onClick={() => removePhoto(index)} className="text-xs h-6 px-2 w-full"><X className="w-3 h-3" /></Button>
                              </div>
                            </div>
                            {formData.thumbnail_url === url && (
                              <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                Hoofd
                              </div>
                            )}
                             {formData.cover_photo_url === url && (
                              <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                Cover
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="flex justify-end gap-3 p-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bezig met opslaan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {project ? 'Project Bijwerken' : 'Project Aanmaken'}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}