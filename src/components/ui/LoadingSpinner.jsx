import React from 'react';

// PaintConnect Logo URLs
const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";
const LOGO_ICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png";

/**
 * Unified Loading Spinner using PaintConnect logo
 * Use this component throughout the app for consistent loading states
 */
export default function LoadingSpinner({ 
  size = 'default', 
  className = '', 
  text = null,
  overlay = false,
  fullScreen = false,
  useIcon = true // Use the icon version (square) vs full logo
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Detect dark mode
  const isDarkMode = typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const logoSrc = useIcon ? LOGO_ICON : (isDarkMode ? LOGO_DARK : LOGO_LIGHT);

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Logo with pulse animation */}
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-emerald-500/20 dark:bg-emerald-400/20 rounded-full blur-xl animate-pulse`} />
        
        {/* Logo */}
        <img 
          src={logoSrc}
          alt="Laden..."
          className={`${sizeClasses[size]} object-contain relative z-10 animate-pulse`}
          style={{
            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
        
        {/* Spinning ring around logo */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin`}
          style={{
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>
      
      {text && (
        <p className="text-sm font-medium text-gray-600 dark:text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  // Full screen overlay (for page loads)
  if (fullScreen || overlay) {
    return (
      <div className="fixed inset-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Simple inline spinner for buttons, etc.
 * Uses a subtle animation
 */
export function InlineSpinner({ className = '' }) {
  return (
    <img 
      src={LOGO_ICON}
      alt="..."
      className={`w-5 h-5 object-contain animate-spin ${className}`}
    />
  );
}

/**
 * Page loading component - centered with full height
 */
export function PageLoader({ text = 'Laden...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * Section loading - for loading parts of a page
 */
export function SectionLoader({ text = null, className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="default" text={text} />
    </div>
  );
}
