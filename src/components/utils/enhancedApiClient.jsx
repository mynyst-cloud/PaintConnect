import axios from 'axios';
import { errorTracker } from './errorTracker';

// Create axios instance with interceptors
const apiClient = axios.create();

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - behandel 404 op delete als success
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check of dit een Project DELETE 404 is
    const isProjectDelete = 
      error.config?.method?.toLowerCase() === 'delete' &&
      error.config?.url?.includes('/entities/Project/') &&
      error.response?.status === 404;

    if (isProjectDelete) {
      console.log('[API Client] Project DELETE returned 404 - treating as success, not logging error');
      // Return een succesvolle response in plaats van error
      return Promise.resolve({
        data: { success: true, alreadyDeleted: true },
        status: 200,
        statusText: 'OK (was already deleted)',
        config: error.config
      });
    }

    // Voor alle andere errors, log ze normaal
    if (error.response) {
      errorTracker.captureError({
        type: 'api_error',
        message: error.message,
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        originalError: error,
        timestamp: new Date().toISOString()
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;