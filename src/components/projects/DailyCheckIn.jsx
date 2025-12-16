
import React, { useState, useEffect } from "react";
import { DailyUpdate } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Camera, 
  Upload,
  CheckCircle,
  User as UserIcon,
  Calendar,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyCheckIn({ project }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [todayUpdate, setTodayUpdate] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkOutData, setCheckOutData] = useState({
    work_notes: "",
    photo_urls: [],
    visible_to_client: false
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadUserAndUpdate();
  }, [project?.id]); // Add project?.id to dependency array for re-fetch if project changes

  const loadUserAndUpdate = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const today = new Date().toISOString().split('T')[0];
      const updates = await DailyUpdate.list();
      const todayUpdateForProject = updates.find(u => 
        u.project_id === project.id && 
        u.painter_email === user.email && 
        u.work_date === today
      );
      
      setTodayUpdate(todayUpdateForProject);
      setIsCheckedIn(todayUpdateForProject && todayUpdateForProject.check_in_time && !todayUpdateForProject.check_out_time);
      
      if (todayUpdateForProject?.work_notes) {
        setCheckOutData(prev => ({
          ...prev,
          work_notes: todayUpdateForProject.work_notes,
          photo_urls: todayUpdateForProject.photo_urls || [],
          visible_to_client: todayUpdateForProject.visible_to_client || false
        }));
      }
    } catch (error) {
      console.error("Error loading user and update:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const newUpdate = {
        project_id: project.id,
        company_id: project.company_id, // Added company_id
        painter_name: currentUser.full_name || currentUser.email,
        painter_email: currentUser.email,
        check_in_time: new Date().toISOString(),
        work_date: today,
        visible_to_client: false
      };
      
      await DailyUpdate.create(newUpdate);
      // After check-in, reload the user and update status
      // The outline suggested `checkExistingCheckIn();`, which is equivalent to calling `loadUserAndUpdate()` here.
      loadUserAndUpdate(); 
    } catch (error) {
      console.error("Error checking in:", error);
    }
    setIsLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setCheckOutData(prev => ({
        ...prev,
        photo_urls: [...(prev.photo_urls || []), file_url]
      }));
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setIsUploading(false);
  };

  const handleCheckOut = async () => {
    if (!todayUpdate) return;
    
    setIsLoading(true);
    try {
      const checkInTime = new Date(todayUpdate.check_in_time);
      const checkOutTime = new Date();
      const hoursWorked = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(1);
      
      await DailyUpdate.update(todayUpdate.id, {
        check_out_time: checkOutTime.toISOString(),
        work_notes: checkOutData.work_notes || null,
        photo_urls: checkOutData.photo_urls,
        hours_worked: parseFloat(hoursWorked),
        visible_to_client: checkOutData.visible_to_client
      });
      
      setIsCheckedIn(false);
      setShowCheckOut(false);
      loadUserAndUpdate();
    } catch (error) {
      console.error("Error checking out:", error);
    }
    setIsLoading(false);
  };

  const removePhoto = (indexToRemove) => {
    setCheckOutData(prev => ({
      ...prev,
      photo_urls: (prev.photo_urls || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  // Defensive check for project prop
  if (!project) return null;

  if (!currentUser) return null;

  const today = new Date().toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Dagelijkse Check-in
        </CardTitle>
        <p className="text-sm text-gray-600">{today}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCheckedIn && !todayUpdate?.check_out_time ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button 
              onClick={handleCheckIn} 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Inchecken voor vandaag
            </Button>
          </motion.div>
        ) : isCheckedIn ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between p-3 bg-emerald-100 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">Ingecheckt</span>
              </div>
              <span className="text-sm text-emerald-700">
                {todayUpdate?.check_in_time ? new Date(todayUpdate.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            
            <Button 
              onClick={() => setShowCheckOut(true)} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Uitchecken & Update toevoegen
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-3 bg-gray-100 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium text-gray-700">Uitgecheckt voor vandaag</p>
              <p className="text-sm text-gray-600">
                {todayUpdate?.hours_worked ? `${todayUpdate.hours_worked} uur gewerkt` : ''}
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showCheckOut && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t pt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="work_notes">Wat heb je vandaag gedaan?</Label>
                <Textarea
                  id="work_notes"
                  placeholder="Bijv. Tweede laag verf aangebracht in de woonkamer, plafond afgewerkt..."
                  value={checkOutData.work_notes}
                  onChange={(e) => setCheckOutData(prev => ({...prev, work_notes: e.target.value}))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto's van het werk (optioneel)</Label>
                <Button variant="outline" asChild className="cursor-pointer w-full">
                  <label>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Uploaden..." : "Foto toevoegen"}
                    <Input 
                      type="file" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                      accept="image/*" 
                      disabled={isUploading}
                    />
                  </label>
                </Button>

                {(checkOutData.photo_urls || []).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {(checkOutData.photo_urls || []).map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Werk foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {checkOutData.visible_to_client ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                  <Label htmlFor="visible_to_client" className="text-sm font-medium">
                    Zichtbaar voor klant in portaal
                  </Label>
                </div>
                <Switch
                  id="visible_to_client"
                  checked={checkOutData.visible_to_client}
                  onCheckedChange={(checked) => setCheckOutData(prev => ({...prev, visible_to_client: checked}))}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCheckOut(false)}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button 
                  onClick={handleCheckOut}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Uitchecken
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
