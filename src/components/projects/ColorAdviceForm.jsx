
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Still imported, but its usage is removed from the component's root
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Loader2, Upload } from 'lucide-react';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';

const colorTypes = ['RAL', 'NCS', 'HEX'];
const statusOptions = ['concept', 'definitief', 'goedgekeurd_klant'];

export default function ColorAdviceForm({ advice, project, onSubmit, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [errors, setErrors] = useState({});

  const safeAdvice = advice && typeof advice === 'object' ? advice : {};

  const [formData, setFormData] = useState({
    room_name: safeAdvice.room_name || '',
    color_code: safeAdvice.color_code || '',
    color_type: safeAdvice.color_type || 'RAL',
    paint_brand: safeAdvice.paint_brand || '',
    paint_name: safeAdvice.paint_name || '',
    color_hex: safeAdvice.color_hex || '#FFFFFF',
    notes: safeAdvice.notes || '',
    photo_urls: safeAdvice.photo_urls || [],
    assigned_painters: safeAdvice.assigned_painters || [],
    status: safeAdvice.status || 'concept',
    client_approved: safeAdvice.client_approved || false,
    version: safeAdvice.version || 1
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    fetchUser();
  }, []);

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
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map(result => result.file_url);
      
      setFormData(prev => ({
        ...prev,
        photo_urls: [...(prev.photo_urls || []), ...newPhotoUrls]
      }));
    } catch (error) {
      console.error('Error uploading photos:', error);
      setErrors(prev => ({ ...prev, photos: 'Foto\'s uploaden mislukt.' }));
    } finally {
      setUploadingPhotos(false);
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
    
    if (!formData.room_name?.trim()) newErrors.room_name = 'Ruimtenaam is verplicht';
    if (!formData.color_code?.trim()) newErrors.color_code = 'Kleurcode is verplicht';
    if (!formData.paint_brand?.trim()) newErrors.paint_brand = 'Verfmerk is verplicht';
    if (!formData.color_hex?.trim()) newErrors.color_hex = 'HEX-code is verplicht';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!currentUser || !project) return;

    setIsSubmitting(true);

    try {
      const submissionData = {
        company_id: project.company_id,
        project_id: project.id,
        room_name: formData.room_name.trim(),
        color_code: formData.color_code.trim(),
        color_type: formData.color_type,
        paint_brand: formData.paint_brand.trim(),
        paint_name: formData.paint_name?.trim() || null,
        color_hex: formData.color_hex.trim(),
        notes: formData.notes?.trim() || null,
        photo_urls: formData.photo_urls || [],
        assigned_painters: formData.assigned_painters || [],
        status: formData.status,
        client_approved: formData.client_approved,
        version: formData.version,
        created_by: advice?.id ? (advice.created_by || currentUser.email) : currentUser.email,
        updated_by: advice?.id ? currentUser.email : null
      };

      console.log('[ColorAdviceForm] Submitting data:', submissionData);

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting color advice form:', error);
      setErrors(prev => ({ ...prev, submit: error.message || 'Fout bij opslaan' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Scrollable Content */}
      <div className="p-6 space-y-4 flex-grow overflow-y-auto">
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        <div>
          <Label htmlFor="room_name">Ruimte *</Label>
          <Input
            id="room_name"
            value={formData.room_name}
            onChange={(e) => handleChange('room_name', e.target.value)}
            className={errors.room_name ? 'border-red-300' : ''}
            placeholder="Bijv. Woonkamer, Slaapkamer, Keuken"
          />
          {errors.room_name && <p className="text-red-500 text-sm mt-1">{errors.room_name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="color_type">Type Kleurcode</Label>
            <Select
              value={formData.color_type}
              onValueChange={(value) => handleChange('color_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer type" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 100001 }}>
                {colorTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color_code">Kleurcode *</Label>
            <Input
              id="color_code"
              value={formData.color_code}
              onChange={(e) => handleChange('color_code', e.target.value)}
              className={errors.color_code ? 'border-red-300' : ''}
              placeholder="Bijv. RAL 9010, NCS S 0502-Y"
            />
            {errors.color_code && <p className="text-red-500 text-sm mt-1">{errors.color_code}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="paint_brand">Verfmerk *</Label>
            <Input
              id="paint_brand"
              value={formData.paint_brand}
              onChange={(e) => handleChange('paint_brand', e.target.value)}
              className={errors.paint_brand ? 'border-red-300' : ''}
              placeholder="Bijv. Sigma, Histor, Sikkens"
            />
            {errors.paint_brand && <p className="text-red-500 text-sm mt-1">{errors.paint_brand}</p>}
          </div>

          <div>
            <Label htmlFor="paint_name">Verfnaam (Optioneel)</Label>
            <Input
              id="paint_name"
              value={formData.paint_name}
              onChange={(e) => handleChange('paint_name', e.target.value)}
              placeholder="Bijv. S2U Clean Matt"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="color_hex">HEX Kleurcode * (voor preview)</Label>
          <div className="flex gap-2">
            <Input
              id="color_hex"
              type="text"
              value={formData.color_hex}
              onChange={(e) => handleChange('color_hex', e.target.value)}
              className={errors.color_hex ? 'border-red-300 flex-1' : 'flex-1'}
              placeholder="#FFFFFF"
            />
            <Input
              type="color"
              value={formData.color_hex}
              onChange={(e) => handleChange('color_hex', e.target.value)}
              className="w-20 h-10"
            />
          </div>
          {errors.color_hex && <p className="text-red-500 text-sm mt-1">{errors.color_hex}</p>}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer status" />
            </SelectTrigger>
            <SelectContent style={{ zIndex: 100001 }}>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'concept' ? 'Concept' : status === 'definitief' ? 'Definitief' : 'Goedgekeurd door klant'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notities (Optioneel)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Extra informatie, bijvoorbeeld locatie van een accentmuur..."
            rows={3}
          />
        </div>

        <div>
          <Label>Foto's (Optioneel)</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('color-photo-upload').click()}
                disabled={uploadingPhotos}
              >
                {uploadingPhotos ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Foto's Toevoegen
              </Button>
              <input
                id="color-photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {uploadingPhotos && <span className="text-sm text-gray-600">Uploaden...</span>}
            </div>
            
            {formData.photo_urls && formData.photo_urls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {formData.photo_urls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Kleuradvies foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-slate-800 border-t flex-shrink-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuleren
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting || !currentUser}>
          {isSubmitting && <Loader2 className="animate-spin mr-2 w-4 h-4" />}
          {advice?.id ? 'Opslaan' : 'Toevoegen'}
        </Button>
      </div>
    </form>
  );
}
