
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LogOut, , CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CheckOutButton({ currentUser, onCheckOutSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    checkActiveCheckIn();
    
    // Update duration every minute
    const interval = setInterval(() => {
      if (activeCheckIn) {
        updateDuration();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (activeCheckIn) {
      updateDuration();
    }
  }, [activeCheckIn]);

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
    try {
      const checkIns = await base44.entities.CheckInRecord.filter({
        user_id: currentUser.id,
        status: 'checked_in'
      });
      
      if (checkIns && checkIns.length > 0) {
        setActiveCheckIn(checkIns[0]);
      } else {
        setActiveCheckIn(null);
      }
    } catch (error) {
      console.error('[CheckOutButton] Error checking active check-in:', error);
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

    try {
      const response = await base44.functions.invoke('checkOut', { notes });

      if (response.data.success) {
        setStatus('success');
        toast.success(response.data.message);
        setTimeout(() => {
          setShowModal(false);
          setActiveCheckIn(null);
          if (onCheckOutSuccess) onCheckOutSuccess(response.data.record);
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
    return null;
  }

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
