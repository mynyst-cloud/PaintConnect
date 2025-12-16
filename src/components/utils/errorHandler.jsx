// Centralized error handling utility
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

export class ErrorHandler {
  static handle(error, context = {}) {
    const errorInfo = {
      message: error.message,
      code: error.code || ERROR_CODES.UNKNOWN_ERROR,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator?.userAgent,
      url: window?.location?.href
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught:', errorInfo);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorInfo);
    }

    return this.getUserFriendlyMessage(error);
  }

  static getUserFriendlyMessage(error) {
    const messages = {
      [ERROR_CODES.NETWORK_ERROR]: 'Netwerkverbinding is verloren. Controleer uw internetverbinding.',
      [ERROR_CODES.AUTH_ERROR]: 'Uw sessie is verlopen. Log opnieuw in.',
      [ERROR_CODES.VALIDATION_ERROR]: 'De ingevoerde gegevens zijn niet geldig.',
      [ERROR_CODES.NOT_FOUND]: 'De gevraagde informatie kon niet worden gevonden.',
      [ERROR_CODES.PERMISSION_DENIED]: 'U heeft geen toegang tot deze functie.',
      [ERROR_CODES.RATE_LIMITED]: 'Te veel verzoeken. Probeer het over een moment opnieuw.',
      [ERROR_CODES.SERVER_ERROR]: 'Er is een serverfout opgetreden. Probeer het later opnieuw.',
      [ERROR_CODES.DATABASE_ERROR]: 'Database is tijdelijk niet beschikbaar.'
    };

    return messages[error.code] || 'Er is een onverwachte fout opgetreden.';
  }

  static sendToMonitoring(errorInfo) {
    // In real implementation, send to Sentry, DataDog, etc.
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo)
      }).catch(() => {
        // Silent fail for error reporting
      });
    } catch (e) {
      // Silent fail
    }
  }

  static async withErrorHandling(asyncFn, context = {}) {
    try {
      return await asyncFn();
    } catch (error) {
      throw new AppError(
        this.handle(error, context),
        this.determineErrorCode(error),
        this.determineStatusCode(error)
      );
    }
  }

  static determineErrorCode(error) {
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return ERROR_CODES.NETWORK_ERROR;
    }
    if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
      return ERROR_CODES.AUTH_ERROR;
    }
    if (error.message?.includes('404')) {
      return ERROR_CODES.NOT_FOUND;
    }
    if (error.message?.includes('403')) {
      return ERROR_CODES.PERMISSION_DENIED;
    }
    if (error.message?.includes('429')) {
      return ERROR_CODES.RATE_LIMITED;
    }
    if (error.message?.includes('500')) {
      return ERROR_CODES.SERVER_ERROR;
    }
    return ERROR_CODES.SERVER_ERROR;
  }

  static determineStatusCode(error) {
    if (error.status) return error.status;
    if (error.message?.includes('401')) return 401;
    if (error.message?.includes('403')) return 403;
    if (error.message?.includes('404')) return 404;
    if (error.message?.includes('429')) return 429;
    return 500;
  }
}

// React Hook for error handling
export function useErrorHandler() {
  return React.useCallback((error, context = {}) => {
    return ErrorHandler.handle(error, context);
  }, []);
}