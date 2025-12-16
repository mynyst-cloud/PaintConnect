import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SafeComponent wrapper dat React errors vangt op component niveau
 * en fallback UI toont zonder de hele app te crashen
 */
export const SafeComponent = ({ 
  children, 
  fallback = null, 
  componentName = 'Component',
  showErrorDetails = false 
}) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset error state when children change
    setError(null);
  }, [children]);

  const handleRetry = () => {
    setError(null);
  };

  if (error) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="font-semibold text-red-800 mb-2">
          {componentName} kon niet laden
        </h3>
        <p className="text-red-600 text-sm mb-3">
          Er is een fout opgetreden bij het laden van dit onderdeel.
        </p>
        {showErrorDetails && error.message && (
          <p className="text-xs text-red-500 mb-3 font-mono bg-red-100 p-2 rounded">
            {error.message}
          </p>
        )}
        <Button size="sm" onClick={handleRetry} variant="outline">
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  try {
    return children;
  } catch (catchError) {
    // Catch synchronous errors
    setError(catchError);
    return null;
  }
};

/**
 * Hook om errors te vangen in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const handleError = (error) => {
    console.error('Component Error:', error);
    setError(error);
  };

  const clearError = () => {
    setError(null);
  };

  return { error, handleError, clearError };
};

/**
 * Async operation wrapper met error handling
 */
export const safeAsync = async (asyncFunction, errorHandler) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Async operation failed:', error);
    if (errorHandler) {
      errorHandler(error);
    }
    return null;
  }
};

export default SafeComponent;