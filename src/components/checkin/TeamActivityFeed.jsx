
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Users, MapPin, Clock, Navigation, RefreshCw, AlertCircle, CheckCircle, Briefcase } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { base44 } from '@/api/base44Client';
import ProjectsMap from '@/components/projects/ProjectsMap';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns'; // Import format from date-fns
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';

// Helper functions
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error("Error formatting time:", e);
    return '--:--';
  }
};

const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}u ${mins}m`;
  }
  return `${mins}m`;
};


export default function TeamActivityFeed({ isCompactIcon = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCheckIns, setActiveCheckIns] = useState([]);
  const [completedCheckIns, setCompletedCheckIns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date()); // NIEUW: lastRefresh state

  const loadCheckIns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[TeamActivityFeed] Calling getActiveCheckIns...');
      const response = await base44.functions.invoke('getActiveCheckIns', {});
      console.log('[TeamActivityFeed] Raw response:', response);
      console.log('[TeamActivityFeed] Response data:', response.data);
      
      if (response.data?.success) {
        console.log('[TeamActivityFeed] Active check-ins:', response.data.active?.length || 0);
        console.log('[TeamActivityFeed] Completed check-ins:', response.data.completed?.length || 0);
        
        setActiveCheckIns(response.data.active || []);
        setCompletedCheckIns(response.data.completed || []);
        setLastRefresh(new Date()); // Update lastRefresh on successful manual load as well
      } else {
        console.error('[TeamActivityFeed] Response not successful:', response.data);
        setError(response.data?.error || 'Kon check-ins niet laden');
      }
    } catch (err) {
      console.error('[TeamActivityFeed] Error loading check-ins:', err);
      setError(`Fout bij laden: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load check-ins on mount and when sheet opens
  useEffect(() => {
    // Load immediately on mount to show badge count
    loadCheckIns();
    
    // Also reload when sheet opens (for detailed view)
    if (isOpen) {
      console.log('[TeamActivityFeed] Sheet opened, reloading check-ins');
      loadCheckIns();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh timer - always active (not just when sidebar is open)
  // This ensures the badge count stays up-to-date even when sidebar is closed
  useEffect(() => {
    // Initial load is handled by the useEffect above, so start interval immediately
    const refreshInterval = setInterval(() => {
      console.log('[TeamActivityFeed] Auto-refreshing check-ins (background)');
      loadCheckIns();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds (more frequent than before for better UX)

    return () => clearInterval(refreshInterval);
  }, []); // Run once on mount, interval continues regardless of sidebar state

  // New renderCheckInCard function
  const renderCheckInCard = (checkIn, isCompleted = false) => (
    <div key={checkIn.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={isCompleted ? "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300" : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"}>
            {getInitials(checkIn.user_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-slate-100">
              {checkIn.user_name}
            </h4>
            {isCompleted ? (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Uitgecheckt
              </Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Actief
              </Badge>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="truncate">{checkIn.project_name}</span>
            </div>
            
            {checkIn.location_name && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="text-xs line-clamp-2">{checkIn.location_name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 text-xs pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(checkIn.check_in_time)}
              </span>
              {isCompleted && checkIn.check_out_time && (
                <>
                  <span>→</span>
                  <span>{formatTime(checkIn.check_out_time)}</span>
                  {checkIn.duration_minutes !== null && checkIn.duration_minutes !== undefined && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ({formatDuration(checkIn.duration_minutes)})
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCompleted && checkIn.distance_from_site !== undefined && (
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {Math.round(checkIn.distance_from_site)}m van werf
                  {checkIn.within_range && <CheckCircle className="w-3 h-3 text-emerald-600 ml-1" />}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {isCompactIcon ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 relative"
            title="Team Activiteit"
          >
            <Users className="w-4 h-4" />
            {activeCheckIns.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-[8px] bg-emerald-600 text-white rounded-full">
                {activeCheckIns.length}
              </Badge>
            )}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            Team Activiteit
            {activeCheckIns.length > 0 && (
              <Badge className="ml-1 bg-emerald-600 text-white hover:bg-emerald-600">
                {activeCheckIns.length}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Activiteit
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Link 
                to={createPageUrl('TeamActiviteit')} 
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mr-2"
                onClick={() => setIsOpen(false)} // Close sheet when clicking the link
              >
                Bekijk alles
              </Link>
              <span className="text-xs text-gray-500">
                {format(lastRefresh, 'HH:mm')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCheckIns}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Loading State */}
          {isLoading && activeCheckIns.length === 0 && completedCheckIns.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-slate-400">
              <LoadingSpinner size="default" />
              <p className="text-sm">Check-ins laden...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-red-600 dark:text-red-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={loadCheckIns} className="mt-4">
                Opnieuw proberen
              </Button>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Active Check-ins */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Actief Ingecheckt ({activeCheckIns.length})
                </h3>
                
                {activeCheckIns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Niemand is momenteel ingecheckt</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCheckIns.map(checkIn => renderCheckInCard(checkIn, false))}
                  </div>
                )}
              </div>

              {/* Completed Check-ins */}
              {completedCheckIns.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                    Vandaag Voltooid ({completedCheckIns.length})
                  </h3>
                  <div className="space-y-3">
                    {completedCheckIns.map(checkIn => renderCheckInCard(checkIn, true))}
                  </div>
                </div>
              )}

              {/* No activity message */}
              {activeCheckIns.length === 0 && completedCheckIns.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Geen teamactiviteit vandaag</p>
                  <p className="text-xs text-gray-400 mt-1">Check-ins verschijnen hier automatisch</p>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
