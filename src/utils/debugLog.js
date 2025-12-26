/**
 * Debug logging helper - alleen actief in development mode
 * Voorkomt ERR_CONNECTION_REFUSED errors in productie
 */

export const debugLog = (data) => {
  // Alleen in development mode (localhost of 127.0.0.1)
  const isDevelopment = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));

  if (!isDevelopment) {
    // Silent fail in production - geen errors in console
    return;
  }

  try {
    // Fire and forget - niet wachten op response
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: data.timestamp || Date.now(),
        sessionId: data.sessionId || 'debug-session'
      })
    }).catch(() => {
      // Silent fail - debug server niet beschikbaar is geen probleem
    });
  } catch (e) {
    // Silent fail - voorkom errors in console
  }
};

