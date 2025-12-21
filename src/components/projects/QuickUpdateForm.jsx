import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, UploadCloud, Image as ImageIcon } from "lucide-react";
import { handleProjectUpdate } from '@/api/functions';
import { supabase } from '@/lib/supabase';
import PlaceholderLogo from "@/components/ui/PlaceholderLogo";

// Supabase Storage upload functie
async function uploadFileToSupabase(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `project-photos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('project-uploads')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-uploads')
      .getPublicUrl(filePath);

    return { file_url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export default function QuickUpdateForm({ projects, currentUser, onSubmit, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  const [formData, setFormData] = useState({
    project_id: safeProjects.length === 1 ? safeProjects[0].id : "",
    work_notes: "",
    photo_urls: [],
    visible_to_client: true
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    
    try {
      const uploadedUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        
        try {
          const { file_url } = await uploadFileToSupabase(file);
          if (file_url) {
            uploadedUrls.push(file_url);
          }
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          // Continue met de volgende foto's
        }
      }
      
      if (uploadedUrls.length > 0) {
        handleChange("photo_urls", [...formData.photo_urls, ...uploadedUrls]);
      }
      
      if (uploadedUrls.length < files.length) {
        setError(`${uploadedUrls.length} van ${files.length} foto's succesvol geüpload. Sommige foto's konden niet worden geüpload.`);
      } else {
        setError(null);
      }
    } catch (uploadError) {
      console.error("Error uploading files:", uploadError);
      setError("Er is een fout opgetreden bij het uploaden van de foto's.");
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    const newPhotos = formData.photo_urls.filter((_, index) => index !== indexToRemove);
    handleChange("photo_urls", newPhotos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.project_id) {
      setError("Selecteer een project.");
      return;
    }
    if (!formData.work_notes.trim()) {
      setError("Beschrijving van werkzaamheden mag niet leeg zijn.");
      return;
    }

    if (!currentUser || !currentUser.full_name) {
      setError("Gebruikersinformatie ontbreekt. Probeer opnieuw in te loggen.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const project = safeProjects.find(p => p.id === formData.project_id);
      
      if (!project) {
        setError("Geselecteerd project niet gevonden.");
        setIsSubmitting(false);
        return;
      }

      const { data, error: functionError } = await handleProjectUpdate({
        company_id: project.company_id,
        project_id: project.id,
        painter_name: currentUser.full_name,
        painter_email: currentUser.email,
        work_notes: formData.work_notes,
        photo_urls: formData.photo_urls,
        work_date: new Date().toISOString().split('T')[0],
        visible_to_client: formData.visible_to_client
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to create update');
      }

      if (data?.success) {
        onSubmit(data);
      } else {
        throw new Error('Update creation failed');
      }
    } catch (err) {
      console.error("Error submitting daily update:", err);
      setError("Er is een fout opgetreden bij het opslaan van de update. Probeer het opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
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
        className="w-full max-w-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-4">
               <div className="flex items-center gap-3">
                <PlaceholderLogo />
                <CardTitle className="text-lg">Snelle Project Update</CardTitle>
              </div>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="project">Project *</Label>
                <Select value={formData.project_id} onValueChange={(value) => handleChange("project_id", value)}>
                  <SelectTrigger className={!formData.project_id && error && error.includes("project") ? "border-red-300" : ""}>
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
                {!formData.project_id && error && error.includes("project") && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_notes">Werkzaamheden vandaag *</Label>
                <Textarea id="work_notes" value={formData.work_notes} onChange={(e) => handleChange("work_notes", e.target.value)} placeholder="Beschrijf kort wat er vandaag is gedaan..." rows={4} required className={!formData.work_notes.trim() && error && error.includes("werkzaamheden") ? "border-red-300" : ""}/>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="visible_to_client" checked={formData.visible_to_client} onCheckedChange={(checked) => handleChange("visible_to_client", checked)}/>
                <Label htmlFor="visible_to_client">Zichtbaar voor klant in portaal</Label>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Foto's van het werk</Label>
                  <Button type="button" variant="outline" asChild className="cursor-pointer">
                    <label>
                      {isUploading ? (
                        <>
                          <InlineSpinner />
                          {uploadProgress.total > 0 && `${uploadProgress.current}/${uploadProgress.total}`}
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 mr-2" />
                          Foto's Toevoegen
                        </>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        accept="image/*"
                        multiple
                        disabled={isUploading}
                      />
                    </label>
                  </Button>
                </div>

                {isUploading && uploadProgress.total > 0 && (
                  <div className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                    Foto {uploadProgress.current} van {uploadProgress.total} uploaden...
                  </div>
                )}

                {formData.photo_urls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {formData.photo_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Werkfoto ${index + 1}`} className="w-full h-24 object-cover rounded-lg border"/>
                        <Button type="button" size="sm" variant="destructive" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto" onClick={() => handleRemovePhoto(index)}><X className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.photo_urls.length === 0 && (
                  <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg mt-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Voeg foto's toe om de voortgang te documenteren</p>
                    <p className="text-xs text-gray-400 mt-1">Selecteer meerdere foto's tegelijk</p>
                  </div>
                )}
              </div>
              {error && (!formData.project_id || !formData.work_notes.trim() || error.includes("geüpload") || error.includes("opgeslagen")) && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </CardContent>
            <CardFooter className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-slate-800/50">
              <Button type="button" variant="outline" onClick={onCancel}>Annuleren</Button>
              <Button type="submit" disabled={isSubmitting || isUploading || !formData.project_id || !formData.work_notes.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? <><InlineSpinner /> Bezig...</> : <><Save className="w-4 h-4 mr-2" /> Update Toevoegen</>}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}
