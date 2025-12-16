
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Briefcase, Navigation, CheckCircle2, AlertCircle, Car } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function RecordDetailsDrawer({ record, isOpen, onClose }) {
  if (!record) return null;

  const formatDuration = (minutes) => {
    if (minutes === undefined || minutes === null) return '-'; // Handle null or undefined
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0 && mins === 0) return '0m'; // For 0 duration
    
    let durationString = '';
    if (hours > 0) {
      durationString += `${hours}u `;
    }
    if (mins > 0 || (hours === 0 && minutes > 0)) { // Display mins if > 0 or if total minutes > 0 but hours is 0
      durationString += `${mins}m`;
    }
    return durationString.trim();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Check-in Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {record.is_on_time ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Op tijd
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Te laat
              </Badge>
            )}
            {record.status === 'checked_in' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Actief
              </Badge>
            )}
          </div>

          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold">
                {record.user_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{record.user_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{record.user_email}</p>
              </div>
            </div>
          </div>

          {/* Time Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tijden
            </h3>
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(record.check_in_time), 'dd MMM yyyy HH:mm', { locale: nl })}
                </span>
              </div>
              {record.check_out_time && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(record.check_out_time), 'dd MMM yyyy HH:mm', { locale: nl })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600 dark:text-gray-400">Totale duur:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatDuration(record.duration_minutes)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Project
            </h3>
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{record.project_name}</p>
              {record.project_address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{record.project_address}</p>
              )}
            </div>
          </div>

          {/* Location Info */}
          {record.location_name && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Locatie
              </h3>
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-900 dark:text-gray-100">{record.location_name}</p>
                {record.distance_from_site !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {Math.round(record.distance_from_site)}m van werf
                    </span>
                    {record.within_range && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                )}
                {record.latitude && record.longitude && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    GPS: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* NIEUW: Travel Information */}
          {(record.travel_outbound || record.travel_return) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Woon-werkverkeer
              </h3>
              
              {record.travel_outbound && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
                    <Navigation className="w-4 h-4" />
                    Heenreis
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Afstand:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {record.travel_outbound.distance_km.toFixed(1)} km
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reistijd:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDuration(record.travel_outbound.duration_min)}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <p>Van: {record.travel_outbound.start_address}</p>
                    <p>Naar: {record.travel_outbound.end_address}</p>
                  </div>
                </div>
              )}

              {record.travel_return && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-900 dark:text-green-200">
                    <Navigation className="w-4 h-4 transform rotate-180" />
                    Terugreis
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Afstand:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {record.travel_return.distance_km.toFixed(1)} km
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reistijd:</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDuration(record.travel_return.duration_min)}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-green-200 dark:border-green-700">
                    <p>Van: {record.travel_return.start_address}</p>
                    <p>Naar: {record.travel_return.end_address}</p>
                  </div>
                </div>
              )}

              {record.total_travel_time > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-purple-900 dark:text-purple-200">Totaal woon-werkverkeer:</span>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        {record.total_travel_distance.toFixed(1)} km
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDuration(record.total_travel_time)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notities</h3>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">{record.notes}</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
