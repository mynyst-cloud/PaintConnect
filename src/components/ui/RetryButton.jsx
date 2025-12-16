import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function RetryButton({ onRetry, loading = false, className = '' }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button 
      onClick={handleRetry} 
      disabled={loading || isRetrying}
      className={`bg-emerald-600 hover:bg-emerald-700 ${className}`}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${(loading || isRetrying) ? 'animate-spin' : ''}`} />
      {loading || isRetrying ? 'Bezig...' : 'Opnieuw Proberen'}
    </Button>
  );
}