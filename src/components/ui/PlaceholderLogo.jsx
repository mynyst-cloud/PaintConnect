import React from 'react';

// De centraal beheerde, correcte en werkende logo URL
const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

/**
 * Een robuuste, herbruikbare component voor het PaintConnect logo met fallback.
 * @param {{className: string}} props - Standaard className prop voor styling.
 */
export default function PlaceholderLogo({ className = 'h-10 object-contain' }) {
  
  /**
   * Deze functie wordt aangeroepen als het logo niet kan laden.
   * Het verbergt de afbeelding om een 'gebroken icoon' te voorkomen.
   * @param {React.SyntheticEvent<HTMLImageElement, Event>} e - Het error event.
   */
  const handleImageError = (e) => {
    e.target.onerror = null; // Voorkom een oneindige loop als de fallback ook faalt
    e.target.style.display = 'none'; // Verberg de gebroken afbeelding
  };

  return (
    <img 
      src={paintConnectLogoUrl} 
      alt="PaintConnect Logo" 
      className={className}
      onError={handleImageError}
    />
  );
}