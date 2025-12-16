
import React, { useState, useEffect } from "react";
import { DailyUpdate } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  User,
  Camera,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyTimeline({ project }) {
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUpdate, setExpandedUpdate] = useState(null);

  useEffect(() => {
    if (project && project.id) {
      loadUpdates();
    }
  }, [project?.id]); // Safe access with optional chaining

  const loadUpdates = async () => {
    if (!project || !project.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const allUpdates = await DailyUpdate.list("-work_date");
      const projectUpdates = allUpdates.filter(u => 
        u.project_id === project.id && u.check_out_time
      );
      setUpdates(projectUpdates);
    } catch (error) {
      console.error("Error loading daily updates:", error);
      setUpdates([]);
    }
    setIsLoading(false);
  };

  // Early return if no project
  if (!project) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dagelijkse Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dagelijkse Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nog geen dagelijkse updates</p>
            <p className="text-sm">Updates verschijnen hier wanneer schilders uitchecken</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Dagelijkse Updates ({(updates || []).length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(updates || []).map((update, index) => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">
                      {update.painter_name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {update.hours_worked}u gewerkt
                  </Badge>
                  {update.visible_to_client && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Klant zichtbaar
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(parseISO(update.work_date), 'EEEE d MMMM yyyy', { locale: nl })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(update.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(update.check_out_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {update.work_notes && (
                  <p className="text-gray-700 mb-3">{update.work_notes}</p>
                )}

                {update.photo_urls && update.photo_urls.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {update.photo_urls.length} foto{update.photo_urls.length !== 1 ? "'s" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedUpdate(expandedUpdate === update.id ? null : update.id)}
                    >
                      {expandedUpdate === update.id ? (
                        <>Verberg <ChevronUp className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>Bekijk <ChevronDown className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {expandedUpdate === update.id && ( // Condition for visibility
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {(update.photo_urls || []).map((photo, photoIndex) => (
                    <img
                      key={photoIndex}
                      src={photo}
                      alt={`Werk van ${update.painter_name} op ${update.work_date}`}
                      className="w-full h-32 object-cover rounded-lg shadow-sm"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
