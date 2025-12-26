import LoadingSpinner from '@/components/ui/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlatformUpdate } from '@/api/entities';
import { Star, Zap, Wrench, Megaphone, Gift, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format, differenceInDays, isFuture } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useTheme } from '@/components/providers/ThemeProvider';

const paintConnectLogoLightUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
const paintConnectLogoDarkUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png';

const iconMap = {
    star: Star,
    zap: Zap,
    wrench: Wrench,
    megaphone: Megaphone,
    gift: Gift
};

const typeColors = {
    feature: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    improvement: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    maintenance: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    announcement: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
};

const iconBgColors = {
    feature: "bg-green-500",
    improvement: "bg-blue-500",
    maintenance: "bg-orange-500",
    announcement: "bg-purple-500"
};

const typeLabels = {
    feature: "Nieuwe Functie",
    improvement: "Verbetering", 
    maintenance: "Onderhoud",
    announcement: "Aankondiging"
};

// Timeline Update Item Component
function TimelineUpdate({ update, index, isFutureUpdate = false, isLast = false }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const IconComponent = iconMap[update.icon] || Megaphone;
    
    const stripHtml = (html) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };
    
    const plainText = stripHtml(update.message);
    const isLong = plainText.length > 200;
    const previewText = isLong ? update.message.substring(0, 200) + '...' : update.message;
    
    const getDateDisplay = () => {
        if (isFutureUpdate && update.release_date) {
            const date = new Date(update.release_date);
            return format(date, 'd MMMM yyyy', { locale: nl });
        }
        if (update.created_date) {
            const date = new Date(update.created_date);
            return format(date, 'd MMMM yyyy', { locale: nl });
        }
        return null;
    };

    const getTimeAgo = () => {
        if (!isFutureUpdate && update.created_date) {
            return formatDistanceToNow(new Date(update.created_date), { locale: nl, addSuffix: true });
        }
        return null;
    };
    
    const dateDisplay = getDateDisplay();
    const timeAgo = getTimeAgo();
    const updateType = update.type || 'announcement';
    
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-6 pb-8"
        >
            {/* Timeline line connector */}
            {!isLast && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-gray-300 to-gray-200 dark:from-emerald-400 dark:via-gray-600 dark:to-gray-700" />
            )}
            
            {/* Icon dot */}
            <div className="relative z-10 flex-shrink-0">
                <div className={`w-12 h-12 rounded-full ${iconBgColors[updateType]} flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-900`}>
                    <IconComponent className="w-6 h-6 text-white" />
                </div>
            </div>
            
            {/* Content card */}
            <div className="flex-1 pt-1">
                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500 dark:border-gray-800">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {update.title}
                                </h3>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Badge className={`text-xs ${typeColors[updateType]}`}>
                                        {typeLabels[updateType]}
                                    </Badge>
                                    {dateDisplay && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-4 h-4 mr-1.5" />
                                            <span>{dateDisplay}</span>
                                        </div>
                                    )}
                                    {timeAgo && (
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-500">
                                            <Clock className="w-4 h-4 mr-1.5" />
                                            <span>{timeAgo}</span>
                                        </div>
                                    )}
                                    {isFutureUpdate && (
                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Gepland
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div 
                                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{ 
                                    __html: isExpanded ? update.message : previewText 
                                }}
                            />
                        </div>
                        
                        {isLong && (
                            <div className="mt-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/20"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="w-4 h-4 mr-1" />
                                            Minder tonen
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4 mr-1" />
                                            Lees meer
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

export default function PlatformUpdates() {
    const [allUpdates, setAllUpdates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { resolvedTheme } = useTheme();
    const paintConnectLogoUrl = resolvedTheme === 'dark' ? paintConnectLogoDarkUrl : paintConnectLogoLightUrl;

    useEffect(() => {
        loadUpdates();
    }, []);

    const loadUpdates = async () => {
        setIsLoading(true);
        try {
            const fetchedUpdates = await PlatformUpdate.filter({
                is_active: true,
                deleted: { $ne: true }
            }, '-priority');
            
            // Sorteer op datum: toekomstige updates eerst, dan recente (nieuwste eerst)
            const sorted = fetchedUpdates.sort((a, b) => {
                const dateA = a.release_date || a.created_date;
                const dateB = b.release_date || b.created_date;
                
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                
                const dateAObj = new Date(dateA);
                const dateBObj = new Date(dateB);
                const now = new Date();
                
                const aIsFuture = dateAObj > now;
                const bIsFuture = dateBObj > now;
                
                // Toekomstige updates eerst
                if (aIsFuture && !bIsFuture) return -1;
                if (!aIsFuture && bIsFuture) return 1;
                
                // Binnen dezelfde categorie, sorteer op datum (nieuwste eerst voor verleden, oudste eerst voor toekomst)
                if (aIsFuture) {
                    return dateAObj - dateBObj; // Toekomst: oudste eerst
                } else {
                    return dateBObj - dateAObj; // Verleden: nieuwste eerst
                }
            });
            
            setAllUpdates(sorted);
        } catch (error) {
            console.error('Error loading platform updates:', error);
            setAllUpdates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const futureUpdates = allUpdates.filter(update => {
        const date = update.release_date || update.created_date;
        return date && isFuture(new Date(date));
    });

    const recentUpdates = allUpdates.filter(update => {
        const date = update.release_date || update.created_date;
        return !date || !isFuture(new Date(date));
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <img
                            src={paintConnectLogoUrl}
                            alt="PaintConnect Logo"
                            className="h-20 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                        Platform Updates
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Blijf op de hoogte van alle nieuwe functies, verbeteringen en aankondigingen van PaintConnect
                    </p>
                </div>

                {isLoading ? (
                    <div className="text-center py-16">
                        <LoadingSpinner size="default" />
                        <p className="text-gray-600 dark:text-gray-400 mt-4">Updates laden...</p>
                    </div>
                ) : allUpdates.length === 0 ? (
                    <Card className="text-center py-16 dark:border-gray-800">
                        <CardContent>
                            <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Geen updates beschikbaar
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Er zijn momenteel geen platform updates om te tonen.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="relative">
                        {/* Timeline container */}
                        <div className="space-y-0">
                            {/* Section header voor toekomstige updates */}
                            {futureUpdates.length > 0 && (
                                <>
                                    <div className="mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                Komende Updates
                                            </h2>
                                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {futureUpdates.length}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    {futureUpdates.map((update, index) => (
                                        <TimelineUpdate
                                            key={update.id}
                                            update={update}
                                            index={index}
                                            isFutureUpdate={true}
                                            isLast={index === futureUpdates.length - 1 && recentUpdates.length === 0}
                                        />
                                    ))}
                                </>
                            )}

                            {/* Section header voor recente updates */}
                            {recentUpdates.length > 0 && (
                                <>
                                    {futureUpdates.length > 0 && (
                                        <div className="mb-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    Recente Updates
                                                </h2>
                                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    {recentUpdates.length}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {recentUpdates.map((update, index) => (
                                        <TimelineUpdate
                                            key={update.id}
                                            update={update}
                                            index={index + futureUpdates.length}
                                            isFutureUpdate={false}
                                            isLast={index === recentUpdates.length - 1}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer CTA */}
                <Card className="mt-12 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="text-center py-8">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Suggesties voor nieuwe functies?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Wij waarderen uw feedback! Laat ons weten welke functies u graag zou zien in PaintConnect.
                        </p>
                        <a
                            href="mailto:support@paintconnect.be?subject=Functie%20Suggestie"
                            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Megaphone className="w-5 h-5 mr-2" />
                            Stuur uw suggestie
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
