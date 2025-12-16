import { useEffect } from 'react';
import { errorTracker } from './errorTracker';

// React Hook for manual error tracking
export function useErrorTracking() {
  const captureError = (error, type = 'custom', metadata = {}) => {
    if (error instanceof Error) {
      errorTracker.captureError({
        type,
        message: error.message,
        stack: error.stack,
        metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    } else {
      errorTracker.captureCustomError(String(error), type, metadata);
    }
  };

  const captureAsyncError = async (asyncFunction, type = 'async_error', metadata = {}) => {
    try {
      return await asyncFunction();
    } catch (error) {
      captureError(error, type, metadata);
      throw error; // Re-throw so the caller can handle it
    }
  };

  const captureNetworkError = (url, error, response = null) => {
    errorTracker.captureError({
      type: 'network_error',
      message: error.message || `Network error: ${url}`,
      url,
      stack: error.stack,
      status: response?.status,
      statusText: response?.statusText,
      timestamp: new Date().toISOString(),
      requestUrl: window.location.href
    });
  };

  return {
    captureError,
    captureAsyncError,
    captureNetworkError,
    tracker: errorTracker
  };
}

// HOC for automatic error tracking in components
export function withErrorBoundary(Component, errorFallback = null) {
  return function ErrorBoundaryWrapper(props) {
    const componentName = Component.name || 'Anonymous';
    const propsKeys = Object.keys(props);
    
    useEffect(() => {
      // Track component mount
      errorTracker.captureCustomError(
        `Component ${componentName} mounted`,
        'component_lifecycle',
        { component: componentName, props: propsKeys }
      );

      return () => {
        // Track component unmount
        errorTracker.captureCustomError(
          `Component ${componentName} unmounted`,
          'component_lifecycle',
          { component: componentName }
        );
      };
    }, [componentName, propsKeys.length]); // Fixed dependency

    const ErrorFallback = errorFallback || (({ error, resetError }) => (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Something went wrong</h3>
        <p className="text-red-600 text-sm mt-1">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button 
          onClick={resetError}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    ));

    try {
      return <Component {...props} />;
    } catch (error) {
      errorTracker.captureError({
        type: 'react_render',
        message: error.message,
        stack: error.stack,
        component: componentName,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      return <ErrorFallback error={error} resetError={() => window.location.reload()} />;
    }
  };
}