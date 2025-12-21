import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, , Trash2 } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

export default function SpeechRecognitionComponent({ onTranscriptUpdate, isProcessing, isCorrectingMode = false, correctingMetingNumber = null }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Spraakherkenning wordt niet ondersteund in deze browser. Gebruik Chrome, Edge of Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'nl-NL';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setTranscript(prev => {
          const updated = prev + final;
          // Send final transcript to parent for processing
          onTranscriptUpdate(updated, final.trim());
          return updated;
        });
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        toast.error('Geen spraak gedetecteerd. Probeer het opnieuw.');
      } else if (event.error === 'not-allowed') {
        toast.error('Microfoon toegang geweigerd. Geef toestemming in uw browser.');
      } else {
        toast.error(`Spraakherkenning fout: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if it ended unexpectedly
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, onTranscriptUpdate]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success('Spraakopname gestart');
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Kon spraakopname niet starten');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info('Spraakopname gestopt');
    }
  };

  const clearTranscript = () => {
    if (window.confirm('Weet u zeker dat u het transcript wilt wissen?')) {
      setTranscript('');
      setInterimTranscript('');
      toast.success('Transcript gewist');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🎤 Spraakopname voor Metingen</span>
          <div className="flex items-center gap-3">
            {isCorrectingMode && (
              <span className="text-sm font-normal text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                🔄 Correctie Modus - Meting #{correctingMetingNumber}
              </span>
            )}
            {isProcessing && (
              <span className="flex items-center gap-2 text-sm text-blue-600 font-normal">
                <InlineSpinner />
                AI verwerkt...
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          {!isListening ? (
            <Button
              onClick={startListening}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isProcessing}
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Opname
            </Button>
          ) : (
            <Button
              onClick={stopListening}
              variant="destructive"
            >
              <MicOff className="w-4 h-4 mr-2" />
              Stop Opname
            </Button>
          )}
          {transcript && (
            <Button
              onClick={clearTranscript}
              variant="outline"
              disabled={isListening || isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Wis Transcript
            </Button>
          )}
        </div>

        {isListening && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">Opname actief - spreek vrijuit</span>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live Transcript:</p>
          <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {transcript}
            {interimTranscript && (
              <span className="text-gray-500 italic">{interimTranscript}</span>
            )}
            {!transcript && !interimTranscript && (
              <span className="text-gray-400">Begin met spreken om metingen in te spreken...</span>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>💡 Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Spreek duidelijk en in een rustig tempo</li>
            <li>Vermeld ruimte, type (wand/plafond/etc.), afmetingen en behandeling</li>
            <li>Voorbeeld: "Woonkamer wand 4 bij 2 meter 60 latex spuiten"</li>
            <li>Zeg "nu naar de keuken" om van ruimte te wisselen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}