import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, CheckCircle2, AlertCircle, Navigation } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CheckInButton({ currentUser, onCheckInSuccess, refreshTrigger }) {
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [activeCheckIn, setActiveCheckIn] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      checkActiveCheckIn();
    }
  }, [currentUser?.id]); // Use ID to prevent unnecessary re-runs

  // Refresh when refreshTrigger changes (e.g., after check-out in CheckOutButton)
  // Only refresh when refreshTrigger > 0 (initial value is 0, so we skip the first render)
  useEffect(() => {
    if (currentUser?.id && refreshTrigger > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:refreshTrigger',message:'Refresh trigger changed, checking active check-in',data:{refreshTrigger,hasActiveCheckIn:!!activeCheckIn},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      checkActiveCheckIn();
    }
  }, [refreshTrigger, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkActiveCheckIn = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:checkActiveCheckIn:entry',message:'Checking active check-in',data:{userId:currentUser?.id,currentActiveCheckIn:!!activeCheckIn},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      const checkIns = await base44.entities.CheckInRecord.filter({
        user_id: currentUser.id,
        status: 'checked_in'
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:checkActiveCheckIn:result',message:'Active check-in query result',data:{foundCount:checkIns?.length || 0,willSet:!!(checkIns && checkIns.length > 0)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (checkIns && checkIns.length > 0) {
        setActiveCheckIn(checkIns[0]);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:checkActiveCheckIn:set',message:'Setting activeCheckIn to found record',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } else {
        setActiveCheckIn(null);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:checkActiveCheckIn:clear',message:'Setting activeCheckIn to null',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
    } catch (error) {
      console.error('[CheckInButton] Error checking active check-in:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:checkActiveCheckIn:error',message:'Error checking active check-in',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
  };

  const loadProjects = async () => {
    try {
      const response = await base44.functions.invoke('getCompanyProjects', {});
      const projects = response.data?.projects || [];
      
      console.log('[CheckInButton] Loaded projects:', projects.length);
      
      setProjects(projects);
    } catch (error) {
      console.error('[CheckInButton] Error loading projects:', error);
      toast.error('Kon projecten niet laden');
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setStatus('idle');
    setErrorMessage('');
    setNotes('');
    setSelectedProject('');
    loadProjects();
  };

  const requestLocation = () => {
    if (!selectedProject) {
      setErrorMessage('Selecteer eerst een project');
      return;
    }

    setStatus('locating');
    setErrorMessage('');

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('GPS is niet beschikbaar in deze browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setStatus('idle');
        toast.success('Locatie gevonden!');
      },
      (error) => {
        setStatus('error');
        switch (error.code) {
          case 1:
            setErrorMessage('Locatietoegang geweigerd. Schakel GPS in via browserinstellingen.');
            break;
          case 2:
            setErrorMessage('Locatie kon niet worden bepaald. Controleer je GPS-ontvangst.');
            break;
          case 3:
            setErrorMessage('Locatiebepaling duurde te lang. Probeer opnieuw.');
            break;
          default:
            setErrorMessage('Onbekende fout bij locatiebepaling.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleCheckIn = async () => {
    if (!location) {
      requestLocation();
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:handleCheckIn:entry',message:'Check-in starting',data:{userId:currentUser?.id,projectId:selectedProject,hasCallback:!!onCheckInSuccess},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    try {
      const response = await base44.functions.invoke('checkIn', {
        project_id: selectedProject,
        latitude: location.latitude,
        longitude: location.longitude,
        notes
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:handleCheckIn:response',message:'Check-in response received',data:{success:response.data.success,hasRecord:!!response.data.record,hasCallback:!!onCheckInSuccess},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (response.data.success) {
        setStatus('success');
        toast.success(response.data.message);
        setTimeout(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:handleCheckIn:beforeCheck',message:'Before checkActiveCheckIn and callback',data:{activeCheckInBefore:!!activeCheckIn,hasCallback:!!onCheckInSuccess},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setShowModal(false);
          checkActiveCheckIn();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:handleCheckIn:afterCheck',message:'After checkActiveCheckIn, before callback',data:{hasCallback:!!onCheckInSuccess},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (onCheckInSuccess) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:handleCheckIn:callback',message:'Calling onCheckInSuccess callback',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            onCheckInSuccess(response.data.record);
          }
        }, 1500);
      } else {
        setStatus('error');
        setErrorMessage(response.data.error || 'Check-in mislukt');
      }
    } catch (error) {
      setStatus('error');
      const errorMsg = error.response?.data?.error || error.message || 'Check-in mislukt. Probeer opnieuw.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  // #region agent log
  // Log render decision
  if (activeCheckIn) {
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:render',message:'CheckInButton: returning null (has active check-in)',data:{hasActiveCheckIn:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    return null;
  }
  fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInButton.jsx:render',message:'CheckInButton: rendering button (no active check-in)',data:{hasActiveCheckIn:false,refreshTrigger},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
  // #endregion

  return (
    <>
      <Button 
        onClick={handleOpenModal}
        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
      >
        <MapPin className="w-4 h-4" />
        Check-in
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in op werf</DialogTitle>
            <DialogDescription>
              Selecteer een project en bevestig je locatie om in te checken.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">Geen actieve projecten gevonden</div>
                  ) : (
                    projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name} - {project.client_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {location && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <Navigation className="w-4 h-4" />
                <span>Locatie gevonden</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notities (optioneel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bijv. parkeren op straat, extra materiaal nodig..."
                rows={3}
              />
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {status === 'locating' && (
              <div className="flex flex-col items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-2">
                  <InlineSpinner />
                  <span>Locatie wordt bepaald...</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Je locatie wordt nu eenmalig bepaald voor projectregistratie.
                </p>
              </div>
            )}

            {status === 'submitting' && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <InlineSpinner />
                <span>Check-in wordt verwerkt...</span>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Check-in succesvol!</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowModal(false)}
              className="flex-1"
              disabled={status === 'submitting'}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={!selectedProject || status === 'submitting' || status === 'success'}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {status === 'submitting' ? (
                <>
                  <InlineSpinner />
                  Bezig...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  {location ? 'Bevestig Check-in' : 'Bepaal Locatie'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}