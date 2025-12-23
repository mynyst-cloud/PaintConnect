import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Upload, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Damage } from '@/api/entities';
import { handleDamageReport } from '@/api/functions';
import PlaceholderLogo from "@/components/ui/PlaceholderLogo";
import { supabase } from '@/lib/supabase';

const PLACEHOLDER_LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

const severities = ["laag", "gemiddeld", "hoog", "kritiek"];
const categories = [
  { value: "materiaal_defect", label: "Materiaal Defect" },
  { value: "schade_bestaand", label: "Bestaande Schade" },
  { value: "nieuwe_schade", label: "Nieuwe Schade" },
  { value: "kwaliteit_probleem", label: "Kwaliteitsprobleem" },
  { value: "veiligheid", label: "Veiligheidsprobleem" },
  { value: "anders", label: "Anders" }
];

export default React.memo(function DamageForm({ projects, currentUser, damage, onSubmit, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const safeDamage = damage && typeof damage === 'object' ? damage : {};
  const safeProjects = Array.isArray(projects) ? projects : [];

  const [formData, setFormData] = useState({
    project_id: safeDamage.project_id || (safeProjects.length === 1 ? safeProjects[0].id : ""),
    title: safeDamage.title || "",
    description: safeDamage.description || "",
    severity: safeDamage.severity || "gemiddeld",
    category: safeDamage.category || "anders",
    location: safeDamage.location || "",
    photo_urls: safeDamage.photo_urls || [],
    visible_to_client: safeDamage.visible_to_client !== false,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadedUrls = [];
      
      for (const file of files) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `damage-photos/${fileName}`;

          const { data, error } = await supabase.storage
            .from('project-uploads')
            .upload(filePath, file);

          if (error) throw error;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('project-uploads')
            .getPublicUrl(filePath);

          if (publicUrl) {
            uploadedUrls.push(publicUrl);
          }
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          // Continue met de volgende foto's
        }
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          photo_urls: [...(prev.photo_urls || []), ...uploadedUrls]
        }));
      }
      
      if (uploadedUrls.length < files.length) {
        setErrors(prev => ({ ...prev, photos: `${uploadedUrls.length} van ${files.length} foto's geüpload. Sommige foto's konden niet worden geüpload.` }));
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      setErrors(prev => ({ ...prev, photos: "Foto's uploaden mislukt." }));
    } finally {
      setUploadingPhotos(false);
      event.target.value = ""; // Reset input
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.project_id) newErrors.project_id = "Selecteer een project";
    if (!formData.title?.trim()) newErrors.title = "Titel is verplicht";
    if (!formData.description?.trim()) newErrors.description = "Beschrijving is verplicht";
    if (!formData.category) newErrors.category = "Selecteer een categorie";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // CRITICAL: Prevent double submission
    if (isSubmitting) {
      console.log('[DamageForm] Already submitting, ignoring duplicate call');
      return;
    }
    
    if (!validateForm()) return;

    console.log('[DamageForm] Starting submission...');
    setIsSubmitting(true);
    
    const project = safeProjects.find(p => p.id === formData.project_id);

    const damageData = {
      ...formData,
      company_id: project?.company_id,
      project_id: formData.project_id,
      reported_by: currentUser?.full_name || currentUser?.email || "Onbekend",
      title: formData.title?.trim(),
      description: formData.description?.trim(),
      location: formData.location?.trim() || null,
    };

    // Add placeholder logo if no photos
    if (!damageData.photo_urls || damageData.photo_urls.length === 0) {
      damageData.photo_urls = [PLACEHOLDER_LOGO];
    }

    try {
      let result;
      
      if (damage?.id) {
        // EDITING: Direct update, no backend function needed
        console.log('[DamageForm] Updating existing damage:', damage.id);
        result = await Damage.update(damage.id, damageData);
        console.log('[DamageForm] Update successful');
      } else {
        // NEW DAMAGE: Use backend function that creates + sends notifications
        console.log('[DamageForm] Creating new damage via handleDamageReport');
        const { data, error: functionError } = await handleDamageReport({
            damageData, 
            project, 
            currentUser
        });
        
        if (functionError) {
          throw new Error(functionError.message || 'Failed to create damage report');
        }
        
        if (data?.success && data?.damage) {
          result = data.damage;
          console.log('[DamageForm] Damage created successfully:', result.id);
        } else {
          throw new Error('Damage report creation failed');
        }
      }
      
      // Call onSubmit with the result to update parent state
      console.log('[DamageForm] Calling onSubmit with result');
      onSubmit(result);
      
      // NOTE: Do NOT set isSubmitting to false here
      // The parent will close the modal, which unmounts this component
      
    } catch (error) {
      console.error("[DamageForm] Submission error:", error);
      setErrors({ submit: error.message || "Er ging iets fout bij het opslaan. Probeer het opnieuw." });
      // Only re-enable on error
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-4">
             <div className="flex items-center gap-3">
              <PlaceholderLogo className="h-8 w-auto" />
              <CardTitle className="text-lg">{safeDamage.id ? "Beschadiging Bewerken" : "Nieuwe Beschadiging Melden"}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" type="button" onClick={onClose} disabled={isSubmitting}>
              <X className="w-4 h-4"/>
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}

              <div>
                <Label htmlFor="project">Project *</Label>
                <Select value={formData.project_id} onValueChange={(value) => handleChange("project_id", value)} disabled={isSubmitting}>
                  <SelectTrigger className={errors.project_id ? "border-red-300" : ""}>
                    <SelectValue placeholder="Selecteer een project" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.project_name || 'Naamloos project'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.project_id && <p className="text-red-500 text-sm mt-1">{errors.project_id}</p>}
              </div>

              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={errors.title ? "border-red-300" : ""}
                  placeholder="Korte beschrijving van de beschadiging"
                  disabled={isSubmitting}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description">Beschrijving *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className={errors.description ? "border-red-300" : ""}
                  placeholder="Gedetailleerde beschrijving van de beschadiging"
                  rows={4}
                  disabled={isSubmitting}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severity">Ernst</Label>
                  <Select value={formData.severity} onValueChange={(value) => handleChange("severity", value)} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer ernst" />
                    </SelectTrigger>
                    <SelectContent>
                      {severities.map((severity) => (
                        <SelectItem key={severity} value={severity} className="capitalize">
                          {severity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Categorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange("category", value)} disabled={isSubmitting}>
                    <SelectTrigger className={errors.category ? "border-red-300" : ""}>
                      <SelectValue placeholder="Selecteer categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="location">Locatie</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Bijv. woonkamer, badkamer, gang..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label>Foto's</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo-upload').click()}
                      disabled={uploadingPhotos || isSubmitting}
                    >
                      {uploadingPhotos ? (
                        <InlineSpinner />
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
                      disabled={isSubmitting}
                    />
                    {uploadingPhotos && <span className="text-sm text-gray-600">Uploaden...</span>}
                  </div>
                  
                  {errors.photos && <p className="text-red-500 text-sm">{errors.photos}</p>}
                  
                  {formData.photo_urls && formData.photo_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {formData.photo_urls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Beschadiging foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(index)}
                            disabled={isSubmitting}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visible_to_client"
                    checked={formData.visible_to_client}
                    onCheckedChange={(checked) => handleChange("visible_to_client", !!checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="visible_to_client" className="cursor-pointer text-sm font-medium">
                    Zichtbaar voor klant in klantenportaal
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-slate-800/50">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <InlineSpinner className="mr-2" />
                    Bezig met opslaan...
                  </>
                ) : (
                  damage ? 'Beschadiging Opslaan' : 'Beschadiging Melden'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
});