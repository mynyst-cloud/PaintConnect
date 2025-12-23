import React, { useState, useEffect } from 'react';
import { PlatformUpdate } from '@/api/entities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Zap, Wrench, Megaphone, Gift, X, ArrowRight, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { useTheme } from '@/components/providers/ThemeProvider';

const iconMap = {
  star: { icon: Star, color: 'text-yellow-500 bg-yellow-100' },
  zap: { icon: Zap, color: 'text-blue-500 bg-blue-100' },
  wrench: { icon: Wrench, color: 'text-orange-500 bg-orange-100' },
  megaphone: { icon: Megaphone, color: 'text-purple-500 bg-purple-100' },
  gift: { icon: Gift, color: 'text-pink-500 bg-pink-100' }
};

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
const paintConnectLogoDarkUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png';

export default function PlatformUpdates() {
  const { resolvedTheme } = useTheme();
  const logoUrl = resolvedTheme === 'dark' ? paintConnectLogoDarkUrl : paintConnectLogoUrl;
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if updates were dismissed in this session
    const dismissed = sessionStorage.getItem('dismissedPlatformUpdates');
    if (dismissed === 'true') {
      setIsVisible(false);
      setIsLoading(false);
      return;
    }

    const fetchUpdates = async () => {
      try {
        const fetchedUpdates = await PlatformUpdate.filter(
          {
            is_active: true,
            deleted: { $ne: true }
          },
          '-priority',
          10
        );

        setUpdates((fetchedUpdates || []).slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch platform updates:", error);
        setUpdates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('dismissedPlatformUpdates', 'true');
  };

  // Helper functie om HTML te strippen voor preview
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (isLoading || !isVisible || updates.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="PaintConnect" className="h-7 w-auto" />
              <span className="text-gray-800 font-medium opacity-85 dark:text-gray-200">Platform Updates</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {updates.map((update) => {
              const IconData = iconMap[update.icon] || iconMap.megaphone;
              const IconComponent = IconData.icon;
              const plainText = stripHtml(update.message);
              const previewText = plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText;

              return (
                <Link
                  key={update.id}
                  to={createPageUrl('PlatformUpdates')}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className={`p-2 rounded-full ${IconData.color} flex-shrink-0`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                      {update.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {previewText}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(update.created_date).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
            <div className="pt-2 border-t">
              <Link
                to={createPageUrl('PlatformUpdates')}
                className="flex items-center justify-center text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
              >
                Bekijk alle updates
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}