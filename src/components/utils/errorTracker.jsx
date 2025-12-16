import { base44 } from '@/api/base44Client';

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.isInitialized = false;
    this.errorListeners = new Set();
  }

  // Helper om te bepalen of een error genegeerd moet worden
  shouldIgnoreError(error) {
    // We loggen nu ALLES, zodat de super admin volledige inzage heeft.
    // Geen filters meer op 404s of specifieke entiteiten.
    return false;
  }

  init() {
    if (this.isInitialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'uncaught_error',
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    });

    // Global promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const error = {
        type: 'unhandled_rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        originalError: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      
      // Check of we deze error moeten negeren
      if (this.shouldIgnoreError(error)) {
        return;
      }
      
      this.captureError(error);
    });

    this.isInitialized = true;
  }

  captureError(error) {
    // Check of we deze error moeten negeren
    if (this.shouldIgnoreError(error)) {
      return;
    }

    const errorEntry = {
      ...error,
      id: Date.now() + Math.random(),
      timestamp: error.timestamp || new Date().toISOString()
    };

    this.errors.unshift(errorEntry);
    
    // Keep only last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Notify listeners
    this.notifyListeners(errorEntry);

    // Log to console in development
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDevelopment) {
      console.warn('[ErrorTracker] Captured error:', errorEntry);
    }

    // Log to backend
    try {
      // Avoid logging errors from the logging mechanism itself to prevent loops
      if (error.type !== 'log_error') {
          // Fire and forget
          base44.functions.invoke('logAppError', {
            error_message: error.message || (typeof error === 'string' ? error : 'Unknown error'),
            error_details: JSON.stringify(errorEntry),
            component_page: window.location.pathname
          }).catch(err => console.error('[ErrorTracker] Failed to log to backend:', err));
      }
    } catch (e) {
        console.error('[ErrorTracker] Failed to log to backend:', e);
    }
  }

  captureCustomError(message, type = 'custom', metadata = {}) {
    const error = {
      type,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    // Check of we deze error moeten negeren
    if (!this.shouldIgnoreError(error)) {
      this.captureError(error);
    }
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    this.notifyListeners(null);
  }

  subscribe(listener) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  notifyListeners(error) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  // Get error statistics
  getStats() {
    const errorTypes = {};
    this.errors.forEach(error => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byType: errorTypes,
      last24Hours: this.errors.filter(e => {
        const errorTime = new Date(e.timestamp).getTime();
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return errorTime > dayAgo;
      }).length
    };
  }

  // Export errors as JSON
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }
}

export const errorTracker = new ErrorTracker();