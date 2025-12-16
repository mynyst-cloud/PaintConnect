import React from 'react';
import { motion } from 'framer-motion';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/1dd4cacfc_Android.png';

/**
 * GlobalLoader - Subtiele, merkconforme splash loader voor app initialisatie
 * Pulse-animatie met PaintConnect logo
 */
export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0.9, 1, 0.9],
          scale: [0.9, 1.05, 0.9]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex flex-col items-center"
      >
        <img 
          src={paintConnectLogoUrl} 
          alt="PaintConnect" 
          className="w-32 h-32 object-contain"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(255, 107, 0, 0.2))' }}
        />
      </motion.div>
    </div>
  );
}