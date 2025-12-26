
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LogOut, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { debugLog } from '@/utils/debugLog';

export default function CheckOutButton({ currentUser, onCheckOutSuccess, onCheckOutComplete, refreshTrigger }) {
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    checkActiveCheckIn();
  }, [currentUser?.id]); // Use ID to prevent unnecessary re-runs

  // Respond to refresh trigger from parent (e.g., after check-in)
  useEffect(() => {
    if (currentUser?.id && refreshTrigger !== undefined && refreshTrigger !== null) {
      debugLog({
        location: 'CheckOutButton.jsx:refreshTrigger',
        message: 'Refresh trigger changed, checking active check-in',
        data: { refreshTrigger, hasActiveCheckIn: !!activeCheckIn },
        hypothesisId: 'E'
      });
      checkActiveCheckIn();
    }
  }, [refreshTrigger, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeCheckIn) {
      updateDuration();
      
      // Update duration every minute
      const interval = setInterval(() => {
        updateDuration();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [activeCheckIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDuration = () => {
    if (!activeCheckIn) return;
    
    const checkInTime = new Date(activeCheckIn.check_in_time);
    const now = new Date();
    const diffMs = now.getTime() - checkInTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    setDuration(hours > 0 ? `${hours}u ${minutes}min` : `${minutes}min`);
  };

  const checkActiveCheckIn = async () => {
    debugLog({
      location: 'CheckOutButton.jsx:checkActiveCheckIn:entry',
      message: 'Checking active check-in',
      data: { userId: currentUser?.id, currentActiveCheckIn: !!activeCheckIn },
      hypothesisId: 'D'
    });
    try {
      const checkIns = await base44.entities.CheckInRecord.filter({
        user_id: currentUser.id,
        status: 'checked_in'
      });
      
      debugLog({
        location: 'CheckOutButton.jsx:checkActiveCheckIn:result',
        message: 'Active check-in query result',
        data: { foundCount: checkIns?.length || 0, willSet: !!(checkIns && checkIns.length > 0) },
        hypothesisId: 'D'
      });
      
      if (checkIns && checkIns.length > 0) {
        setActiveCheckIn(checkIns[0]);
        debugLog({
          location: 'CheckOutButton.jsx:checkActiveCheckIn:set',
          message: 'Setting activeCheckIn to found record',
          data: {},
          hypothesisId: 'D'
        });
      } else {
        setActiveCheckIn(null);
        debugLog({
          location: 'CheckOutButton.jsx:checkActiveCheckIn:clear',
          message: 'Setting activeCheckIn to null',
          data: {},
          hypothesisId: 'D'
        });
      }
    } catch (error) {
      console.error('[CheckOutButton] Error checking active check-in:', error);
      debugLog({
        location: 'CheckOutButton.jsx:checkActiveCheckIn:error',
        message: 'Error checking active check-in',
        data: { error: error.message },
        hypothesisId: 'D'
      });
    }
  };

  const handleOpenModal = () => {
    if (!activeCheckIn) {
      toast.error('Geen actieve check-in gevonden');
      return;
    }
    
    setShowModal(true);
    setStatus('idle');
    setErrorMessage('');
    setNotes('');
  };

  const handleCheckOut = async () => {
    setStatus('submitting');
    setErrorMessage('');

    debugLog({
      location: 'CheckOutButton.jsx:handleCheckOut:entry',
      message: 'Check-out starting',
      data: { userId: currentUser?.id, hasActiveCheckIn: !!activeCheckIn, hasCallback: !!onCheckOutSuccess },
      hypothesisId: 'A'
    });

    try {
      const response = await base44.functions.invoke('checkOut', { notes });

      debugLog({
        location: 'CheckOutButton.jsx:handleCheckOut:response',
        message: 'Check-out response received',
        data: { success: response.data.success, hasRecord: !!response.data.record, hasCallback: !!onCheckOutSuccess },
        hypothesisId: 'A'
      });

      if (response.data.success) {
        setStatus('success');
        toast.success(response.data.message);
        setTimeout(() => {
          debugLog({
            location: 'CheckOutButton.jsx:handleCheckOut:beforeClear',
            message: 'Before clearing activeCheckIn and callback',
            data: { activeCheckInBefore: !!activeCheckIn, hasCallback: !!onCheckOutSuccess },
            hypothesisId: 'B'
          });
          setShowModal(false);
          setActiveCheckIn(null);
          debugLog({
            location: 'CheckOutButton.jsx:handleCheckOut:afterClear',
            message: 'After clearing activeCheckIn, before callback',
            data: { hasCallback: !!onCheckOutSuccess },
            hypothesisId: 'B'
          });
          if (onCheckOutSuccess) {
            debugLog({
              location: 'CheckOutButton.jsx:handleCheckOut:callback',
              message: 'Calling onCheckOutSuccess callback',
              data: {},
              hypothesisId: 'C'
            });
            onCheckOutSuccess(response.data.record);
          }
          // Also re-check to ensure state is synced
          checkActiveCheckIn();
          // Trigger refresh in CheckInButton
          if (onCheckOutComplete) {
            debugLog({
              location: 'CheckOutButton.jsx:handleCheckOut:onComplete',
              message: 'Calling onCheckOutComplete to trigger CheckInButton refresh',
              data: {},
              hypothesisId: 'E'
            });
            onCheckOutComplete();
          }
        }, 1500);
      } else {
        setStatus('error');
        setErrorMessage(response.data.error || 'Check-out mislukt');
      }
    } catch (error) {
      setStatus('error');
      const errorMsg = error.response?.data?.error || error.message || 'Check-out mislukt. Probeer opnieuw.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Don't show button if no active check-in
  if (!activeCheckIn) {
    debugLog({
      location: 'CheckOutButton.jsx:render',
      message: 'CheckOutButton: returning null (no active check-in)',
      data: { hasActiveCheckIn: false, refreshTrigger },
      hypothesisId: 'F'
    });
    return null;
  }
  
  debugLog({
    location: 'CheckOutButton.jsx:render',
    message: 'CheckOutButton: rendering button (has active check-in)',
    data: { hasActiveCheckIn: true, refreshTrigger, projectName: activeCheckIn?.project_name },
    hypothesisId: 'F'
  });

  return (
    <>
      <Button 
        onClick={handleOpenModal}
        className="bg-red-600 hover:bg-red-700 text-white gap-2"
      >
        <LogOut className="w-4 h-4" />
        Check-out
        {duration && <span className="text-xs">({duration})</span>}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-out van werf</DialogTitle>
            <DialogDescription>
              Bevestig je check-out voor {activeCheckIn?.project_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeCheckIn && (
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Gewerkte tijd:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{duration}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ingecheckt om {new Date(activeCheckIn.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notities (optioneel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bijv. werk voltooid, morgen verder..."
                rows={3}
              />
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {status === 'submitting' && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <InlineSpinner />
                <span>Check-out wordt verwerkt...</span>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Check-out succesvol!</span>
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
              onClick={handleCheckOut}
              disabled={status === 'submitting' || status === 'success'}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {status === 'submitting' ? (
                <>
                  <InlineSpinner />
                  Bezig...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Bevestig Check-out
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
