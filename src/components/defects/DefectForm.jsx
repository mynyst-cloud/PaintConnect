import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";
import { X, Save, Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";

const severities = ["laag", "gemiddeld", "hoog", "kritiek"];
const categories = ["materiaal_defect", "schade_bestaand", "nieuwe_schade", "kwaliteit_probleem", "veiligheid", "anders"];
const statuses = ["gemeld", "in_behandeling", "opgelost", "geaccepteerd"];

export default function DefectForm({ defect, projects, onSubmit, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: defect?.project_id || "",
    title: defect?.title || "",
    description: defect?.description || "",
    severity: defect?.severity || "gemiddeld",
    category: defect?.category || "anders",
    location: defect?.location || "",
    photo_urls: defect?.photo_urls || [],
    status: defect?.status || "gemeld",
  });

  const handleChange = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleChange("photo_urls", [...formData.photo_urls, file_url]);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const cleanedData = {
      ...formData,
      location: formData.location || null
    };
    
    await onSubmit(cleanedData);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{defect ? "Defect Bewerken" : "Nieuw Defect Melden"}</CardTitle>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}><X/></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Project *</Label><Select required value={formData.project_id} onValueChange={(v) => handleChange("project_id", v)}><SelectTrigger><SelectValue placeholder="Selecteer een project"/></SelectTrigger><SelectContent>{projects.map(p=><SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Titel *</Label><Input required value={formData.title} onChange={(e)=>handleChange("title", e.target.value)} placeholder="Bijv. Verfdruppels op de vloer"/></div>
              <div className="space-y-2"><Label>Beschrijving *</Label><Textarea required value={formData.description} onChange={(e)=>handleChange("description", e.target.value)} placeholder="Gedetailleerde beschrijving van het defect"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ernst</Label><Select value={formData.severity} onValueChange={(v)=>handleChange("severity", v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{severities.map(s=><SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Categorie</Label><Select value={formData.category} onValueChange={(v)=>handleChange("category", v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v)=>handleChange("status", v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{statuses.map(s=><SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Locatie</Label><Input value={formData.location} onChange={(e)=>handleChange("location", e.target.value)} placeholder="Bijv. Woonkamer, naast de deur"/></div>
              
              <div className="space-y-2">
                <Label>Foto's</Label>
                <div className="flex items-center gap-4">
                  {formData.photo_urls.map(url => <img key={url} src={url} className="w-16 h-16 rounded-md object-cover"/>)}
                  <Button type="button" variant="outline" asChild className="h-16 w-16">
                    <label className="cursor-pointer">
                      {isUploading ? <Loader2 className="animate-spin"/> : <UploadCloud/>}
                      <Input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  </Button>
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel}>Annuleren</Button><Button type="submit" disabled={isSubmitting || isUploading} className="bg-red-600 hover:bg-red-700">{isSubmitting?<Loader2 className="animate-spin"/>:<Save/>}<span className="ml-2">{defect ? "Bijwerken" : "Melden"}</span></Button></CardFooter>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}