import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User as UserIcon, Calendar, Edit, Trash2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const paintConnectLogoLightUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function DamageCard({
  damage,
  projects = [],
  currentUser,
  onEdit,
  onDelete,
  onStatusUpdate,
  statusColors,
  statusLabels,
  severityColors
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const project = useMemo(() => {
    if (!damage || !damage?.project_id || !Array.isArray(projects)) return null;
    return projects.find(p => p?.id === damage.project_id);
  }, [damage, damage?.project_id, projects]);

  const formattedDate = useMemo(() => {
    if (!damage || !damage?.created_date) return 'Onbekende datum';
    try {
      return format(new Date(damage.created_date), 'd MMMM yyyy', { locale: nl });
    } catch {
      return 'Ongeldige datum';
    }
  }, [damage, damage?.created_date]);

  if (!damage || !damage.id) {
    return null;
  }

  const mainPhoto = damage?.photo_urls?.[0];
  const displayImage = !imageError && mainPhoto ? mainPhoto : paintConnectLogoLightUrl;

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800 h-full flex flex-col">
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800">
        {!imageLoaded && (
          <div className="absolute inset-0 w-full h-48 bg-gray-200 dark:bg-slate-700 animate-pulse" />
        )}
        <img
          src={displayImage}
          alt={damage.title || "Beschadiging"}
          width={400}
          height={192}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ aspectRatio: '400/192' }}
        />
        {damage.photo_urls?.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            +{damage.photo_urls.length - 1} foto's
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={severityColors[damage.severity] || severityColors.gemiddeld}>
            {damage.severity || 'gemiddeld'}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100 line-clamp-2">
            {damage.title || "Geen titel"}
          </CardTitle>
          {damage.visible_to_client !== undefined && (
            <div className="flex-shrink-0">
              {damage.visible_to_client ? (
                <Eye className="w-4 h-4 text-green-600 dark:text-green-400" title="Zichtbaar voor klant" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400 dark:text-slate-500" title="Niet zichtbaar voor klant" />
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col">
        <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-3 flex-1">
          {damage.description || "Geen beschrijving beschikbaar"}
        </p>

        <div className="space-y-2 text-sm">
          {damage.location && (
            <div className="flex items-start gap-2 text-gray-600 dark:text-slate-400">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{damage.location}</span>
            </div>
          )}

          {damage.reported_by && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
              <UserIcon className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{damage.reported_by}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>

          {project && (
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400">Project:</p>
              <p className="font-medium text-sm text-gray-900 dark:text-slate-100 line-clamp-1">
                {project.project_name}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
          <Badge className={`${statusColors[damage.status] || statusColors.gemeld} border`}>
            {statusLabels[damage.status] || damage.status}
          </Badge>
        </div>

        {damage.status === 'gemeld' && onStatusUpdate && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate(damage.id, 'in_behandeling')}
              className="flex-1 text-xs border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
            >
              In Behandeling
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate(damage.id, 'opgelost')}
              className="flex-1 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              Opgelost
            </Button>
          </div>
        )}

        {damage.status === 'in_behandeling' && onStatusUpdate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusUpdate(damage.id, 'opgelost')}
            className="w-full text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
          >
            Markeer als Opgelost
          </Button>
        )}

        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(damage)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Bewerken
            </Button>
          )}
          {onDelete && (currentUser?.company_role === 'admin' || currentUser?.role === 'admin') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(damage.id)}
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Verwijderen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}