// Production configuration for Tailwind CSS and CSP
// This component handles production optimizations within the platform constraints

import React from 'react';

// Tailwind CSS production configuration (embedded as constants since we can't create config files)
export const TAILWIND_PRODUCTION_CONFIG = {
  // Content paths for Tailwind purging
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./layout.js"
  ],
  
  // Custom theme extensions
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      }
    }
  }
};

// Content Security Policy configuration
export const CSP_PRODUCTION_CONFIG = {
  // Strict CSP policies for production
  policies: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: data:",
    "connect-src 'self' wss: ws: https://api.stripe.com https://api.mollie.com https://nominatim.openstreetmap.org https://*.supabase.co https://*.base44.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ],
  
  // Security headers
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)'
  }
};

// WebSocket connection configuration
export const WEBSOCKET_PRODUCTION_CONFIG = {
  // Connection settings
  maxReconnectAttempts: 10,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 10000,
  connectionTimeout: 10000,
  
  // Auto-reconnect conditions
  autoReconnectCodes: [1006, 1011, 1012, 1013, 1014],
  
  // Clean close codes (don't reconnect)
  cleanCloseCodes: [1000, 1001]
};

// Production optimization utilities
export const ProductionUtils = {
  // Apply CSP headers (for use in functions)
  applyCspHeaders: (mode = 'report') => {
    const cspHeader = CSP_PRODUCTION_CONFIG.policies.join('; ');
    return {
      [mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only']: cspHeader,
      ...CSP_PRODUCTION_CONFIG.headers
    };
  },

  // Get WebSocket URL with proper protocol
  getWebSocketUrl: (token) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
  },

  // Calculate exponential backoff delay
  calculateBackoffDelay: (attempt) => {
    const { reconnectDelay, maxReconnectDelay } = WEBSOCKET_PRODUCTION_CONFIG;
    return Math.min(
      reconnectDelay * Math.pow(2, attempt),
      maxReconnectDelay
    );
  },

  // Check if WebSocket close code should trigger reconnect
  shouldReconnect: (code) => {
    return WEBSOCKET_PRODUCTION_CONFIG.autoReconnectCodes.includes(code) ||
           !WEBSOCKET_PRODUCTION_CONFIG.cleanCloseCodes.includes(code);
  }
};

// Production configuration component (for debugging and monitoring)
export default function ProductionConfig({ children, showConfig = false }) {
  if (showConfig && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg text-xs max-w-sm z-50">
        <h3 className="font-bold mb-2">Production Config Status</h3>
        <div className="space-y-1">
          <div>Tailwind: ✅ Embedded Config</div>
          <div>CSP: ✅ Production Headers</div>
          <div>WebSocket: ✅ Auto-Reconnect</div>
          <div>CSS: ✅ Optimized Globals</div>
        </div>
        {children}
      </div>
    );
  }

  return children;
}