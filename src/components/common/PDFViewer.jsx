import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize2, 
  Minimize2,
  FileText,
  ExternalLink,
  X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PDFViewer({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  title = "PDF Viewer",
  allowDownload = true 
}) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen && pdfUrl) {
      loadPdf();
    }
    
    if (!isOpen) {
      setSignedUrl(null);
      setIsLoading(true);
      setError(null);
      setZoom(100);
      setIsFullscreen(false);
    }
  }, [isOpen, pdfUrl]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadPdf = async () => {
    if (!pdfUrl) {
      setError('Geen PDF URL opgegeven');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let url = pdfUrl;
      
      // Check if it's a private file that needs a signed URL
      if (pdfUrl.includes('/private/')) {
        // Extract the file_uri correctly - it should be the full path after /private/
        const privatePart = pdfUrl.split('/private/')[1];
        const fileUri = `private/${privatePart}`;
        
        console.log('Getting signed URL for:', fileUri);
        
        const result = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: fileUri,
          expires_in: 300
        });
        
        console.log('Signed URL result:', result);
        
        if (result?.signed_url) {
          url = result.signed_url;
        } else {
          throw new Error('Kon geen toegang krijgen tot het bestand');
        }
      }
      
      // For public URLs, use directly
      console.log('Final PDF URL:', url);
      
      setSignedUrl(url);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'Kon PDF niet laden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 999999 }}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`
              relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden
              ${isFullscreen ? 'w-full h-full rounded-none' : 'w-[95vw] max-w-5xl h-[90vh]'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <FileText className="w-5 h-5 text-emerald-600" />
                </motion.div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <motion.div 
                  className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="h-8 w-8"
                    title="Zoom uit"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-xs font-medium px-2 min-w-[3rem] text-center text-gray-700 dark:text-gray-300">
                    {zoom}%
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="h-8 w-8"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-1"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-8 w-8"
                    title={isFullscreen ? "Verklein" : "Volledig scherm"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenInNewTab}
                    disabled={!signedUrl}
                    className="h-8 w-8"
                    title="Open in nieuw tabblad"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>

                  {allowDownload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      disabled={!signedUrl}
                      className="h-8 w-8"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 ml-2"
                  title="Sluiten"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 w-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-10 h-10 text-emerald-600" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      PDF laden...
                    </motion.p>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center h-full gap-4"
                  >
                    <div className="text-red-500 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Kon PDF niet laden</p>
                      <p className="text-sm text-gray-500 mt-1">{error}</p>
                    </div>
                    <Button variant="outline" onClick={loadPdf}>
                      <RotateCw className="w-4 h-4 mr-2" />
                      Opnieuw proberen
                    </Button>
                  </motion.div>
                ) : signedUrl ? (
                  <motion.div
                    key="pdf"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
                      className="w-full h-full border-none bg-white"
                      title={title}
                      style={{ 
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top left',
                        width: `${10000 / zoom}%`,
                        height: `${10000 / zoom}%`
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gebruik de knoppen hierboven om in te zoomen of te downloaden
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Sluiten
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render directly without portal to avoid SSR issues
  return modalContent;
}