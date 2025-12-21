import LoadingSpinner from '@/components/ui/LoadingSpinner';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    feature: "bg-green-100 text-green-800 border-green-200",
    improvement: "bg-blue-100 text-blue-800 border-blue-200",
    maintenance: "bg-orange-100 text-orange-800 border-orange-200",
    announcement: "bg-purple-100 text-purple-800 border-purple-200"
};

const typeLabels = {
    feature: "Nieuwe Functie",
    improvement: "Verbetering", 
    maintenance: "Onderhoud",
    announcement: "Aankondiging"
};

// Uitklapbare Update Card Component
function UpdateCard({ update, index, isFutureUpdate = false }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const IconComponent = iconMap[update.icon] || Megaphone;
    
    // Helper functie om HTML te strippen voor lengtecontrole
    const stripHtml = (html) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };
    
    const plainText = stripHtml(update.message);
    const isLong = plainText.length > 200; // Langer dan 200 karakters = uitklapbaar
    const previewText = isLong ? update.message.substring(0, 200) + '...' : update.message;
    
    const getReleaseDateLabel = (releaseDate) => {
        if (!releaseDate) return null;
        
        const date = new Date(releaseDate);
        const daysUntil = differenceInDays(date, new Date());
        
        if (daysUntil <= 7) {
            return `Gepland voor ${format(date, 'd MMMM yyyy', { locale: nl })}`;
        } else {
            return "Binnenkort";
        }
    };
    
    return (
        <motion.div
            key={update.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className={`hover:shadow-lg transition-shadow duration-200 ${isFutureUpdate ? 'border-2 border-blue-200 bg-blue-50/30' : ''}`}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${typeColors[update.type]}`}>
                                <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    {update.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge className={`text-xs ${typeColors[update.type]}`}>
                                        {typeLabels[update.type]}
                                    </Badge>
                                    {isFutureUpdate && update.release_date && (
                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {getReleaseDateLabel(update.release_date)}
                                        </Badge>
                                    )}
                                    {!isFutureUpdate && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {formatDistanceToNow(new Date(update.created_date), { locale: nl, addSuffix: true })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {update.priority > 1 && (
                            <Badge variant="outline" className="text-xs">
                                Prioriteit: {update.priority}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm max-w-none">
                        <div 
                            className="text-gray-700 leading-relaxed"
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
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
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
        </motion.div>
    );
}

export default function PlatformUpdates() {
    const [recentUpdates, setRecentUpdates] = useState([]);
    const [futureUpdates, setFutureUpdates] = useState([]);
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
            
            const now = new Date();
            
            const recent = [];
            const future = [];
            
            fetchedUpdates.forEach(update => {
                if (update.release_date) {
                    const releaseDate = new Date(update.release_date);
                    
                    if (isFuture(releaseDate)) {
                        future.push(update);
                    } else {
                        recent.push(update);
                    }
                } else {
                    recent.push(update);
                }
            });
            
            future.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
            
            setRecentUpdates(recent);
            setFutureUpdates(future);
        } catch (error) {
            console.error('Error loading platform updates:', error);
            setRecentUpdates([]);
            setFutureUpdates([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Card className="mb-8">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <img
                                src={paintConnectLogoUrl}
                                alt="PaintConnect Logo"
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                        <CardTitle className="text-3xl font-bold text-gray-900">Platform Updates</CardTitle>
                        <p className="text-gray-600 mt-2">
                            Blijf op de hoogte van alle nieuwe functies, verbeteringen en aankondigingen van PaintConnect
                        </p>
                    </CardHeader>
                </Card>

                {isLoading ? (
                    <div className="text-center py-8">
                        <LoadingSpinner size="default" />
                        <p className="text-gray-600 mt-2">Updates laden...</p>
                    </div>
                ) : (
                    <>
                        {/* Toekomstige Updates Sectie */}
                        {futureUpdates.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-2xl font-bold text-gray-900">Komende Updates</h2>
                                </div>
                                <div className="space-y-6">
                                    {futureUpdates.map((update, index) => (
                                        <UpdateCard 
                                            key={update.id} 
                                            update={update} 
                                            index={index} 
                                            isFutureUpdate={true} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recente Updates Sectie */}
                        <div>
                            {futureUpdates.length > 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-2xl font-bold text-gray-900">Recente Updates</h2>
                                </div>
                            )}
                            <div className="space-y-6">
                                {recentUpdates.length === 0 && futureUpdates.length === 0 ? (
                                    <Card>
                                        <CardContent className="text-center py-12">
                                            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen updates beschikbaar</h3>
                                            <p className="text-gray-600">Er zijn momenteel geen platform updates om te tonen.</p>
                                        </CardContent>
                                    </Card>
                                ) : recentUpdates.length === 0 ? (
                                    <Card>
                                        <CardContent className="text-center py-8">
                                            <p className="text-gray-600">Nog geen gepubliceerde updates</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    recentUpdates.map((update, index) => (
                                        <UpdateCard 
                                            key={update.id} 
                                            update={update} 
                                            index={index} 
                                            isFutureUpdate={false} 
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
                    <CardContent className="text-center py-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Suggesties voor nieuwe functies?</h3>
                        <p className="text-gray-600 mb-4">
                            Wij waarderen uw feedback! Laat ons weten welke functies u graag zou zien in PaintConnect.
                        </p>
                        <a
                            href="mailto:support@paintconnect.be?subject=Functie%20Suggestie"
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                        >
                            <Megaphone className="w-4 h-4 mr-2" />
                            Stuur uw suggestie
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}