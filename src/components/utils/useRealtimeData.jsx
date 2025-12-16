import { useEffect, useRef } from 'react';

/**
 * A custom hook for polling data at a regular interval with rate limit protection.
 * @param {function} callback - The function to call to fetch data.
 * @param {number} delay - The polling interval in milliseconds.
 */
export function useRealtimeData(callback, delay) {
  const savedCallback = useRef();
  const isPolling = useRef(false);
  const consecutiveErrors = useRef(0);
  const maxConsecutiveErrors = 3;

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    async function tick() {
      if (isPolling.current) {
        console.log('[useRealtimeData] Skipping poll, previous one still running');
        return;
      }
      
      // Stop polling if too many consecutive errors
      if (consecutiveErrors.current >= maxConsecutiveErrors) {
        console.warn('[useRealtimeData] Too many consecutive errors, stopping polling');
        return;
      }
      
      if (savedCallback.current) {
        isPolling.current = true;
        try {
          await savedCallback.current();
          consecutiveErrors.current = 0; // Reset on success
        } catch (error) {
          consecutiveErrors.current++;
          
          // Only log non-rate-limit errors
          if (error.response?.status !== 429 && !error.message?.includes('Network Error')) {
            console.error('[useRealtimeData] Polling error:', error);
          } else {
            console.warn('[useRealtimeData] Temporary network issue, will retry');
          }
        } finally {
          isPolling.current = false;
        }
      }
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => {
        clearInterval(id);
        consecutiveErrors.current = 0; // Reset on unmount
      };
    }
  }, [delay]);
}