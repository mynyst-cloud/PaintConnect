import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Camera, Package, User, MessageSquare, Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { nl } from 'date-fns/locale';
import PhotoViewer from './PhotoViewer';

const placeholderLogo = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/39a5a0d42_Colorlogo-nobackground.png';

export default function ProjectDetailsActivityFeed({ updates = [], photos = [], requests = [] }) {
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return 'Onbekende datum';
        try {
            const date = parseISO(dateString);
            if (!isValid(date)) {
                const fallbackDate = new Date(dateString);
                return isValid(fallbackDate) ? format(fallbackDate, 'd MMM', { locale: nl }) : 'Onbekende datum';
            }
            return format(date, 'd MMM', { locale: nl });
        } catch {
            return 'Onbekende datum';
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handlePhotoClick = (photoUrl) => {
        const photoIndex = photos.findIndex(p => p === photoUrl);
        setSelectedPhotoIndex(photoIndex !== -1 ? photoIndex : 0);
    };

    // Sort updates by date
    const sortedUpdates = [...updates].sort((a, b) => 
        new Date(b.work_date || b.created_date) - new Date(a.work_date || a.created_date)
    ).slice(0, 3);

    // Get recent photos (last 6)
    const recentPhotos = photos.slice(-6);

    return (
        <div className="space-y-6">
            {/* Recente Updates */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Recente Updates
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-1">
                        Alles <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    {sortedUpdates.length > 0 ? (
                        <div className="space-y-3">
                            {sortedUpdates.map((update, index) => (
                                <motion.div
                                    key={update.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                        {getInitials(update.painter_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                {update.painter_name || 'Onbekend'}
                                            </p>
                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                {formatDate(update.work_date || update.created_date)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                                            {update.work_notes || 'Geen notities'}
                                        </p>
                                        {update.photo_urls && update.photo_urls.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                                                <Camera className="w-3 h-3" />
                                                <span>{update.photo_urls.length} foto{update.photo_urls.length !== 1 ? "'s" : ""}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Nog geen updates</p>
                            <p className="text-sm">Updates verschijnen hier zodra ze worden toegevoegd.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Projectfoto's */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Camera className="w-5 h-5 text-green-600" />
                        Projectfoto's
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 p-1">
                        Alles <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    {recentPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {recentPhotos.map((photo, index) => (
                                <motion.div
                                    key={`${photo}-${index}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-sm"
                                    onClick={() => handlePhotoClick(photo)}
                                >
                                    <img
                                        src={photo}
                                        alt={`Projectfoto ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = placeholderLogo;
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Nog geen foto's</p>
                            <p className="text-sm">Foto's verschijnen hier zodra ze worden geüpload.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Materiaalaanvragen */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Package className="w-5 h-5 text-orange-600" />
                        Materiaalaanvragen
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 p-1">
                        Alles <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    {requests.length > 0 ? (
                        <div className="space-y-3">
                            {requests.slice(0, 3).map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                            {request.material_name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {request.quantity} {request.unit} - {request.requested_by}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        request.status === 'aangevraagd' ? 'bg-yellow-100 text-yellow-800' :
                                        request.status === 'goedgekeurd' ? 'bg-green-100 text-green-800' :
                                        request.status === 'afgewezen' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {request.status}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Geen aanvragen</p>
                            <p className="text-sm">Materiaalaanvragen verschijnen hier zodra ze worden ingediend.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Photo Viewer Modal */}
            <AnimatePresence>
                {selectedPhotoIndex !== null && (
                    <PhotoViewer
                        photos={photos}
                        initialIndex={selectedPhotoIndex}
                        onClose={() => setSelectedPhotoIndex(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}