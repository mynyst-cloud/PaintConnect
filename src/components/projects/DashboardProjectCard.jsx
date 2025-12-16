import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Edit, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { imageOptimizer } from '@/components/utils/performanceOptimizer';

const placeholderLogoLight = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
const placeholderLogoDark = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png';

export default function DashboardProjectCard({ project, calculateProgress, onViewDetails, onDelete, onEdit, isAdmin, isDeleting = false }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState({});
  const { progress } = calculateProgress(project);
  const { resolvedTheme } = useTheme();
  const placeholderLogo = resolvedTheme === 'dark' ? placeholderLogoDark : placeholderLogoLight;
  
  const images = useMemo(() => {
    const allPhotoUrls = [
      project.cover_photo_url,
      project.thumbnail_url,
      ...(project.photo_urls || [])
    ];
    
    const responsiveOptions = imageOptimizer.getResponsiveImageOptions();
    
    return [...new Set(allPhotoUrls.filter(Boolean))].slice(0, 4).map(url => 
      imageOptimizer.getOptimizedImageUrl(url, responsiveOptions)
    );
  }, [project.cover_photo_url, project.thumbnail_url, project.photo_urls]);

  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex];



  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoadStates({});
  }, [project.id]);

  useEffect(() => {
    if (currentImage && !imageLoadStates[currentImage]) {
      const img = new Image();
      img.src = currentImage;
      
      setImageLoadStates(prev => ({ ...prev, [currentImage]: { status: 'loading' } }));
      
      img.onload = () => {
        setImageLoadStates(prev => ({ ...prev, [currentImage]: { status: 'loaded' } }));
      };
      img.onerror = () => {
        setImageLoadStates(prev => ({ ...prev, [currentImage]: { status: 'error' } }));
      };
    }
  }, [currentImage, imageLoadStates]);



  const changeImage = (direction) => {
    const newIndex = (currentImageIndex + direction + images.length) % images.length;
    setCurrentImageIndex(newIndex);
  };

  const isLoaded = currentImage && imageLoadStates[currentImage]?.status === 'loaded';

  const handleDelete = (e) => {
    e.stopPropagation();

    // Prevent multiple delete attempts
    if (isDeleting) {
      return;
    }

    onDelete(project.id);
  };

  return (
    <div className="relative w-full max-w-full">
      <button
        type="button"
        onClick={(e) => onViewDetails(project, e)}
        className="w-full max-w-full text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 rounded-xl p-0 border-none bg-transparent"
        disabled={isDeleting}
        aria-label={`Bekijk details van ${project.project_name}`}
      >
        <motion.div 
          className={`relative w-full max-w-full aspect-[4/3] rounded-xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100 dark:bg-slate-800 ${
            isDeleting ? 'opacity-50 pointer-events-none' : ''
          }`}
          whileHover={{ scale: isDeleting ? 1 : 1.02 }}
        >
          {/* Placeholder background */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <img 
              src={placeholderLogo} 
              alt="PaintConnect" 
              className="w-1/3 h-1/3 max-w-24 max-h-24 object-contain opacity-60"
            />
          </div>
          
          {/* Current image */}
          <AnimatePresence>
            {currentImage && (
              <motion.img 
                key={currentImage}
                src={currentImage}
                alt={project.project_name} 
                className="absolute inset-0 w-full max-w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                loading="lazy"
                decoding="async"
              />
            )}
          </AnimatePresence>
          
          {/* Image navigation buttons */}
          {hasMultipleImages && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-black/20 hover:bg-black/40 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => { e.stopPropagation(); changeImage(-1); }}
                disabled={isDeleting}
                aria-label="Vorige foto"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-black/20 hover:bg-black/40 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => { e.stopPropagation(); changeImage(1); }}
                disabled={isDeleting}
                aria-label="Volgende foto"
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </>
          )}
          
          {/* Project info overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 lg:p-4 text-white max-w-full">
            <h3 className="font-bold text-sm sm:text-base lg:text-lg truncate">{project.project_name}</h3>
            <p className="text-xs sm:text-sm opacity-90 truncate">{project.client_name}</p>
            <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
               <Progress 
                 value={progress} 
                 className="h-1.5 sm:h-2 flex-grow bg-white/20 [&>div]:bg-emerald-400" 
               />
               <span className="text-xs font-semibold">{progress}%</span>
            </div>
          </div>
        </motion.div>
      </button>

      {/* Admin action buttons */}
      {isAdmin && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onEdit && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              disabled={isDeleting}
              aria-label="Bewerk project"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 shadow-md"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Verwijder project"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}