import React, { useState, useEffect } from 'react';
import { PlatformUpdate } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { Star, Zap, Wrench, Megaphone, Gift, X, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap = {
    star: { icon: Star, color: 'text-yellow-500 bg-yellow-100/80' },
    zap: { icon: Zap, color: 'text-blue-500 bg-blue-100/80' },
    wrench: { icon: Wrench, color: 'text-orange-500 bg-orange-100/80' },
    megaphone: { icon: Megaphone, color: 'text-purple-500 bg-purple-100/80' },
    gift: { icon: Gift, color: 'text-pink-500 bg-pink-100/80' }
};

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function RecentUpdatesList() {
    const [updates, setUpdates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem('dismissedPlatformUpdates') === 'true') {
            setIsVisible(false);
            setIsLoading(false);
        } else {
            setIsVisible(true);
        }
    }, []);

    useEffect(() => {
        const fetchUpdates = async () => {
            if (!isVisible) return;

            setIsLoading(true);
            try {
                const fetchedUpdates = await PlatformUpdate.filter(
                    { is_active: true }, 
                    '-priority, -created_date', 
                    3
                );
                
                const now = new Date();
                const relevantUpdates = (fetchedUpdates || []).filter(u => 
                    (!u.start_date || new Date(u.start_date) <= now) &&
                    (!u.end_date || new Date(u.end_date) >= now)
                );

                setUpdates(relevantUpdates);
            } catch (error) {
                console.error("Failed to fetch platform updates:", error);
                setUpdates([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUpdates();
    }, [isVisible]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('dismissedPlatformUpdates', 'true');
    };

    if (isLoading || !isVisible || updates.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 50, marginBottom: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-gray-200/50 dark:border-slate-700/50">
                        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-gray-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <img src={paintConnectLogoUrl} alt="PaintConnect" className="h-5 w-auto" />
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Platform Updates</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
                                <X className="h-4 w-4 text-gray-500" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {updates.map(update => {
                                const IconData = iconMap[update.icon] || iconMap.megaphone;
                                const IconComponent = IconData.icon;
                                return (
                                    <Link 
                                        to={createPageUrl('PlatformUpdates')} 
                                        key={update.id} 
                                        className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${IconData.color}`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{update.title}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">{update.message}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {formatDistanceToNow(new Date(update.created_date), { addSuffix: true, locale: nl })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </CardContent>
                        <div className="border-t border-gray-200/50 dark:border-slate-700/50 px-4 py-2">
                            <Link to={createPageUrl('PlatformUpdates')} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors">
                                Bekijk alle updates <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}