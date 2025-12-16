
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/api/entities';

// --- General Purpose Hooks (Can be kept as they are) ---

export const useSafeState = (initialState, stateName = 'state') => {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState) => {
    if (!mountedRef.current) {
      return;
    }

    try {
      if (typeof newState === 'function') {
        setState(prevState => {
          try {
            return newState(prevState);
          } catch (error) {
            console.error(`State update function failed for ${stateName}:`, error);
            setError(error);
            return prevState;
          }
        });
      } else {
        setState(newState);
      }
      setError(null);
    } catch (error) {
      console.error(`Failed to set state for ${stateName}:`, error);
      setError(error);
    }
  }, [stateName]);

  const setLoadingState = useCallback((isLoading) => {
    if (mountedRef.current) {
      setLoading(isLoading);
    }
  }, []);

  const setErrorState = useCallback((error) => {
    if (mountedRef.current) {
      setError(error);
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    if (mountedRef.current) {
      setError(null);
    }
  }, []);

  return {
    state,
    setState: safeSetState,
    loading,
    setLoading: setLoadingState,
    error,
    setError: setErrorState,
    clearError,
    isMounted: mountedRef.current
  };
};

export const useSafeApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const executeApiCall = useCallback(async (apiFunction, errorMessage = 'API call failed') => {
    if (!mountedRef.current) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      if (mountedRef.current) {
        setLoading(false);
      }
      return result;
    } catch (error) {
      console.error(errorMessage, error);
      if (mountedRef.current) {
        setError({
          message: error.message || errorMessage,
          code: error.code || 'UNKNOWN_ERROR',
          original: error
        });
        setLoading(false);
      }
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    if (mountedRef.current) {
      setError(null);
    }
  }, []);

  return {
    loading,
    error,
    executeApiCall,
    clearError
  };
};

export const useFormState = (initialFormData = {}) => {
  const {
    state: formData,
    setState: setFormData,
    loading: submitting,
    setLoading: setSubmitting,
    error: formError,
    setError: setFormError,
    clearError: clearFormError
  } = useSafeState(initialFormData, 'form');

  const updateField = useCallback((fieldName, value) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldName]: value
    }));
  }, [setFormData]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    clearFormError();
  }, [setFormData, clearFormError, initialFormData]);
  
  return {
    formData,
    setFormData,
    updateField,
    resetForm,
    submitting,
    setSubmitting,
    formError,
    setFormError,
    clearFormError
  };
};

// --- New User State Management using React Context ---

const UserStateContext = createContext(undefined);

export function UserStateProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [fetchAttempts, setFetchAttempts] = useState(0);

    const fetchUser = useCallback(async (forceRefresh = false) => {
        // Skip if already fetched and not forcing refresh, and if there's at least one fetch attempt.
        // This prevents re-fetching on subsequent renders if authChecked is true and not explicitly forced.
        if (authChecked && !forceRefresh && fetchAttempts > 0) {
            return user;
        }

        setUserLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            setAuthChecked(true);
            setFetchAttempts(prev => prev + 1);
            console.log('User fetched successfully:', currentUser.email);
            return currentUser;
        } catch (error) {
            // Treat any error during User.me() as an unauthenticated state or a general fetch error.
            console.warn('User not authenticated or error fetching user:', error.message);
            setUser(null);
            setAuthChecked(true); // Mark as checked even if unauthenticated
            setFetchAttempts(prev => prev + 1);
            return null;
        } finally {
            setUserLoading(false);
        }
    }, [authChecked, fetchAttempts, user]); // Include user in deps to allow returning current user

    useEffect(() => {
        // Only fetch once on initial load if auth hasn't been checked yet
        // and no fetch attempts have been made.
        if (!authChecked && fetchAttempts === 0) {
            fetchUser();
        }
    }, [authChecked, fetchAttempts, fetchUser]);

    const contextValue = {
        user,
        userLoading,
        authChecked,
        fetchUser,
        // Add helper to invalidate auth when needed
        invalidateAuth: () => {
            setAuthChecked(false);
            setFetchAttempts(0);
            setUser(null); // Clear user data
        },
        // Preserve existing derived states for convenience
        isAuthenticated: !!user,
        isAdmin: user?.company_role === 'admin' || user?.role === 'admin',
        hasCompany: !!user?.company_id,
    };

    return (
        <UserStateContext.Provider value={contextValue}>
            {children}
        </UserStateContext.Provider>
    );
}

export const useUserState = () => {
    const context = useContext(UserStateContext);
    if (context === undefined) {
        throw new Error('useUserState must be used within a UserStateProvider');
    }
    return context;
};

// Default export for compatibility
export default {
  useSafeState,
  useSafeApiCall,
  useUserState,
  useFormState,
};
