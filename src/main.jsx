import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import QueryProvider from '@/components/providers/QueryProvider.jsx' // als je die hebt
import AuthProvider from '@/components/providers/AuthProvider.jsx'

// Global error handlers for debugging
window.addEventListener('error', (event) => {
  console.error('🔴 GLOBAL ERROR HANDLER:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
  
  // Also log to window for debugging
  window.lastGlobalError = {
    message: event.message,
    error: event.error,
    timestamp: new Date().toISOString()
  };
}, true);

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 GLOBAL UNHANDLED PROMISE REJECTION:', {
    reason: event.reason,
    promise: event.promise
  });
  
  window.lastUnhandledRejection = {
    reason: event.reason,
    timestamp: new Date().toISOString()
  };
});

console.log('🚀 Main.jsx - Starting app render');
console.log('🔍 To debug infinite loops, check console for [Analytics], [CompanyDashboard], or [useFeatureAccess] logs');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
)

console.log('✅ Main.jsx - App render initiated');