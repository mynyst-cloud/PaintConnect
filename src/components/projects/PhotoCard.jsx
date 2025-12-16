import React from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

export default function PhotoCard({ project, onClick }) {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  if (!project || typeof project !== 'object') {
    console.warn('[PhotoCard] Invalid project prop:', project);
    return null;
  }

  const photoUrl = project?.cover_photo_url || 
                   project?.thumbnail_url || 
                   (Array.isArray(project?.photo_urls) && project.photo_urls[0]) || 
                   null;
  
  const projectName = project?.project_name || 'Unnamed Project';
  const clientName = project?.client_name || 'Unknown Client';

  const handleClick = () => {
    if (onClick && typeof onClick === 'function' && project?.id) {
      onClick(project);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-200 dark:bg-gray-700"
      onClick={handleClick}
    >
      {photoUrl ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          <img 
            src={photoUrl} 
            alt={projectName}
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ aspectRatio: '1/1' }}
            onError={(e) => {
              console.warn('[PhotoCard] Image failed to load:', photoUrl);
              e.target.style.display = 'none';
              e.target.parentElement?.classList.add('bg-gradient-to-br', 'from-gray-200', 'to-gray-300');
            }}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-semibold text-sm mb-1 truncate">{projectName}</h3>
          <p className="text-xs opacity-90 truncate">{clientName}</p>
        </div>
      </div>
    </motion.div>
  );
}