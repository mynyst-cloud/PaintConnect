import React, { lazy } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy load heavy components with better error boundaries
export const createLazyComponent = (importFunction, fallback = null) => {
  const LazyComponent = lazy(importFunction);
  
  return (props) => (
    <React.Suspense 
      fallback={fallback || <div className="flex items-center justify-center p-8"><LoadingSpinner size="sm" /></div>}
    >
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Lazy load with retry functionality
export const createRetryableLazyComponent = (importFunction, maxRetries = 3) => {
  let retryCount = 0;
  
  const RetryWrapper = ({ onRetry, ...props }) => {
    const [hasError, setHasError] = React.useState(false);
    
    React.useEffect(() => {
      if (hasError) {
        setHasError(false);
      }
    }, [hasError, props]);
    
    if (hasError && retryCount < maxRetries) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-gray-600 mb-4">Er ging iets mis bij het laden van deze component.</p>
          <button 
            onClick={() => {
              retryCount++;
              setHasError(false);
              window.location.reload();
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Opnieuw proberen
          </button>
        </div>
      );
    }
    
    return null;
  };
  
  return createLazyComponent(
    () => importFunction().catch(error => {
      console.error('Lazy loading failed:', error);
      throw error;
    }),
    <RetryWrapper />
  );
};

// Pre-load components when user hovers or scrolls near them
export const usePreloadComponent = (importFunction, trigger = 'hover') => {
  const [preloaded, setPreloaded] = React.useState(false);
  
  const preload = React.useCallback(() => {
    if (!preloaded) {
      importFunction().catch(console.error);
      setPreloaded(true);
    }
  }, [importFunction, preloaded]);
  
  const triggerProps = React.useMemo(() => {
    if (trigger === 'hover') {
      return { onMouseEnter: preload };
    } else if (trigger === 'focus') {
      return { onFocus: preload };
    }
    return {};
  }, [trigger, preload]);
  
  return { preload, triggerProps, preloaded };
};

// Intersection observer for lazy loading when component enters viewport
export const useLazyLoadOnVisible = (importFunction) => {
  const [component, setComponent] = React.useState(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef(null);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !component) {
          setIsVisible(true);
          importFunction().then(module => {
            setComponent(() => module.default);
          }).catch(console.error);
        }
      },
      { threshold: 0.1 }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, [importFunction, component]);
  
  return { elementRef, component, isVisible };
};