import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, User as UserIcon, Calendar, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const paintConnectLogoLightUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function DamageListItem({
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
    <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="relative w-full sm:w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 rounded-lg overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-slate-700 animate-pulse rounded-lg" />
        )}
        <img
          src={displayImage}
          alt={damage.title || "Beschadiging"}
          width={128}
          height={128}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ aspectRatio: '1/1' }}
        />
        {damage.photo_urls?.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            +{damage.photo_urls.length - 1}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 line-clamp-1">
                {damage.title || "Geen titel"}
              </h3>
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
            <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 mb-3">
              {damage.description || "Geen beschrijving beschikbaar"}
            </p>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-slate-400">
              {damage.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="line-clamp-1">{damage.location}</span>
                </div>
              )}
              {damage.reported_by && (
                <div className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="line-clamp-1">{damage.reported_by}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {project && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500 dark:text-slate-400">Project: </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">{project.project_name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 items-end">
            <Badge className={severityColors[damage.severity] || severityColors.gemiddeld}>
              {damage.severity || 'gemiddeld'}
            </Badge>
            <Badge className={`${statusColors[damage.status] || statusColors.gemeld} border`}>
              {statusLabels[damage.status] || damage.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {damage.status === 'gemeld' && onStatusUpdate && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusUpdate(damage.id, 'in_behandeling')}
                className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
              >
                In Behandeling
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusUpdate(damage.id, 'opgelost')}
                className="text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
              >
                Opgelost
              </Button>
            </>
          )}

          {damage.status === 'in_behandeling' && onStatusUpdate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusUpdate(damage.id, 'opgelost')}
              className="text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              Markeer als Opgelost
            </Button>
          )}

          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(damage)}
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
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Verwijderen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}