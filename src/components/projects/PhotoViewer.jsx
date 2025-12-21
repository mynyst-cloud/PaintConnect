import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut,  } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function PhotoViewer({ photos, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Validate photos array
  const validPhotos = Array.isArray(photos) 
    ? photos.filter(p => p && (p.url || p.photo_url)) 
    : [];

  const currentPhoto = validPhotos[currentIndex];
  const photoUrl = currentPhoto?.url || currentPhoto?.photo_url;

  // Function to get signed URL for private files
  const getSignedUrl = async (url) => {
    if (!url) return null;
    if (url.includes('/private/')) {
      try {
        const result = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: url,
          expires_in: 300
        });
        return result?.signed_url || url;
      } catch (error) {
        console.error('Error creating signed URL:', error);
        return url;
      }
    }
    return url;
  };

  // Load signed URL when photo changes
  useEffect(() => {
    const loadSignedUrl = async () => {
      if (!photoUrl) {
        setSignedUrl(null);
        return;
      }
      
      if (photoUrl.includes('/private/')) {
        setIsLoadingUrl(true);
        const url = await getSignedUrl(photoUrl);
        setSignedUrl(url);
        setIsLoadingUrl(false);
      } else {
        setSignedUrl(photoUrl);
      }
    };
    
    loadSignedUrl();
  }, [photoUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when viewer is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex, validPhotos.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validPhotos.length - 1));
    setIsZoomed(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < validPhotos.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  };

  const handleDownload = async () => {
    if (!signedUrl) return;
    
    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foto-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Show error if no valid photos
  if (validPhotos.length === 0) {
    return (
      <div 
        className="fixed inset-0 bg-black/95 flex items-center justify-center p-4"
        style={{ zIndex: 100000 }}
        onClick={onClose}
      >
        <div className="text-center text-white">
          <p className="text-lg mb-4">Geen foto's beschikbaar</p>
          <Button variant="outline" onClick={onClose} className="text-white border-white hover:bg-white/10">
            Sluiten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 flex flex-col"
        style={{ 
          zIndex: 100000,
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
        onClick={onClose}
      >
        {/* Top Controls - AANGEPAST: Extra padding voor mobiel + safe areas */}
        <div 
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent"
          style={{
            paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 0.5rem))',
            paddingBottom: '1.5rem',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-white font-medium text-sm md:text-base">
              {currentIndex + 1} / {validPhotos.length}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
              className="text-white hover:bg-white/20 w-9 h-9 md:w-10 md:h-10"
            >
              {isZoomed ? <ZoomOut className="w-4 h-4 md:w-5 md:h-5" /> : <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="text-white hover:bg-white/20 w-9 h-9 md:w-10 md:h-10"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white hover:bg-white/20 bg-white/10 w-9 h-9 md:w-10 md:h-10 ml-1"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </div>

        {/* Main Photo */}
        <div 
          className="flex-1 flex items-center justify-center p-4 md:p-8"
          style={{
            marginTop: 'max(4rem, calc(env(safe-area-inset-top) + 3rem))'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
            >
              {isLoadingUrl ? (
                <div className="w-64 h-64 bg-gray-800 rounded-lg flex items-center justify-center text-white">
                  <LoadingSpinner size="default" />
                </div>
              ) : signedUrl ? (
                <img
                  src={signedUrl}
                  alt={`Foto ${currentIndex + 1}`}
                  className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                  style={{
                    maxHeight: 'calc(100vh - 200px)',
                    maxWidth: 'calc(100vw - 64px)'
                  }}
                  onError={(e) => {
                    console.error('Failed to load image:', signedUrl);
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23fff" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto niet beschikbaar%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="w-64 h-64 bg-gray-800 rounded-lg flex items-center justify-center text-white">
                  <p>Foto niet beschikbaar</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons - AANGEPAST: Safe area padding voor mobiel */}
        {validPhotos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all z-10"
              style={{
                left: 'max(0.5rem, calc(env(safe-area-inset-left) + 0.5rem))'
              }}
              aria-label="Vorige foto"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all z-10"
              style={{
                right: 'max(0.5rem, calc(env(safe-area-inset-right) + 0.5rem))'
              }}
              aria-label="Volgende foto"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Bottom Info */}
        {currentPhoto?.description && (
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent"
            style={{
              paddingTop: '1.5rem',
              paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
              paddingLeft: 'max(1rem, env(safe-area-inset-left))',
              paddingRight: 'max(1rem, env(safe-area-inset-right))'
            }}
          >
            <p className="text-white text-center text-sm md:text-base">{currentPhoto.description}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}