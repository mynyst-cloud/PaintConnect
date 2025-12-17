import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trash2, Upload, Loader2, Camera, User, Calendar, Image as ImageIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Project } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import PhotoViewer from './PhotoViewer';

const placeholderLogo = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

const PhotoCard = ({ photo, project, onSetCover, onDelete, onOpenViewer, isAdmin, index }) => {
    const isCover = project?.cover_photo_url === photo?.url;
    const [signedUrl, setSignedUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadSignedUrl = async () => {
            if (!photo?.url) return;
            
            if (photo.url.includes('/private/')) {
                setIsLoading(true);
                try {
                    const result = await base44.integrations.Core.CreateFileSignedUrl({
                        file_uri: photo.url,
                        expires_in: 300
                    });
                    setSignedUrl(result?.signed_url || photo.url);
                } catch (error) {
                    console.error('Error creating signed URL:', error);
                    setSignedUrl(photo.url);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSignedUrl(photo.url);
            }
        };
        
        loadSignedUrl();
    }, [photo?.url]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Onbekende datum';
        try {
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'd MMM yyyy', { locale: nl }) : 'Onbekende datum';
        } catch {
            return 'Onbekende datum';
        }
    };

    const getUploaderName = () => {
        if (photo?.uploader) {
            if (photo.uploader.includes('@')) {
                return photo.uploader.split('@')[0];
            }
            return photo.uploader;
        }
        return 'Onbekend';
    };

    if (!photo || !photo.url) {
        return null;
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative group"
            onClick={() => onOpenViewer(index)}
        >
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="relative aspect-square">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <img
                            src={signedUrl || photo.url}
                            alt={`Projectfoto door ${getUploaderName()}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {isCover && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Cover
                        </div>
                    )}

                    {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                                size="sm"
                                variant={isCover ? 'default' : 'secondary'}
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetCover(photo.url);
                                }}
                                title="Instellen als coverfoto"
                            >
                                <Star className={`w-3 h-3 ${isCover ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(photo, index);
                                }}
                                title="Verwijderen"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                    {/* Close the conditional rendering block for the image */}
                </div>
                
                <CardContent className="p-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{getUploaderName()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{formatDate(photo.date)}</span>
                        </div>
                        {photo.source_type && (
                            <div className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 shrink-0" />
                                {photo.source_type}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default function ProjectPhotosTab({ project, relatedData, onDataRefresh, isAdmin }) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

    // Collect all photos from various sources
    const allPhotos = useMemo(() => {
        if (!project) return [];

        const photos = [];
        const seenUrls = new Set();

        // Helper to add photo with deduplication
        const addPhoto = (url, uploader, date, source_id, source_type) => {
            if (url && !seenUrls.has(url)) {
                seenUrls.add(url);
                photos.push({ url, uploader, date, source_id, source_type });
            }
        };

        // Add project's main photos
        if (project.thumbnail_url) {
            addPhoto(project.thumbnail_url, project.created_by, project.created_date, project.id, 'Project (Thumbnail)');
        }
        if (project.cover_photo_url && project.cover_photo_url !== project.thumbnail_url) {
            addPhoto(project.cover_photo_url, project.created_by, project.created_date, project.id, 'Project (Cover)');
        }
        if (Array.isArray(project.photo_urls)) {
            project.photo_urls.forEach(url => {
                addPhoto(url, project.created_by, project.created_date, project.id, 'Project');
            });
        }

        // Add photos from related data if available
        if (relatedData) {
            // Daily updates photos
            if (Array.isArray(relatedData.updates)) {
                relatedData.updates.forEach(update => {
                    if (Array.isArray(update.photo_urls)) {
                        update.photo_urls.forEach(url => {
                            addPhoto(url, update.painter_name, update.work_date, update.id, 'Daily Update');
                        });
                    }
                });
            }

            // Damage photos
            if (Array.isArray(relatedData.damages)) {
                relatedData.damages.forEach(damage => {
                    if (Array.isArray(damage.photo_urls)) {
                        damage.photo_urls.forEach(url => {
                            addPhoto(url, damage.reported_by, damage.created_date, damage.id, 'Beschadiging');
                        });
                    }
                });
            }

            // Color advice photos
            if (Array.isArray(relatedData.colorAdvices)) {
                relatedData.colorAdvices.forEach(advice => {
                    if (Array.isArray(advice.photo_urls)) {
                        advice.photo_urls.forEach(url => {
                            addPhoto(url, advice.created_by, advice.created_date, advice.id, 'Kleuradvies');
                        });
                    }
                });
            }
        }

        return photos;
    }, [project, relatedData]);

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0 || !project?.id) return;

        setIsUploading(true);
        try {
            const uploadPromises = files.map(file => UploadFile({ file }));
            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(res => res.file_url).filter(Boolean);

            if (newUrls.length > 0) {
                const updatedPhotoUrls = [...(project.photo_urls || []), ...newUrls];
                await Project.update(project.id, {
                    photo_urls: updatedPhotoUrls,
                    cover_photo_url: project.cover_photo_url || newUrls[0],
                    thumbnail_url: project.thumbnail_url || newUrls[0]
                });

                if (onDataRefresh) {
                    await onDataRefresh({ 
                        ...project, 
                        photo_urls: updatedPhotoUrls 
                    });
                }
            }
        } catch (error) {
            console.error('Error uploading photos:', error);
            alert('Fout bij uploaden van foto\'s');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSetCover = async (url) => {
        if (!project?.id) return;

        try {
            await Project.update(project.id, {
                cover_photo_url: url,
                thumbnail_url: url
            });

            if (onDataRefresh) {
                await onDataRefresh({ 
                    ...project, 
                    cover_photo_url: url, 
                    thumbnail_url: url 
                });
            }
        } catch (error) {
            console.error('Error setting cover photo:', error);
            alert('Fout bij instellen van coverfoto');
        }
    };

    const handleDeletePhoto = async (photo, index) => {
        if (!project?.id || !photo?.url) return;

        if (!confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return;

        try {
            const updatedPhotoUrls = (project.photo_urls || []).filter(url => url !== photo.url);
            
            const updateData = { photo_urls: updatedPhotoUrls };
            
            if (project.cover_photo_url === photo.url) {
                updateData.cover_photo_url = updatedPhotoUrls[0] || '';
                updateData.thumbnail_url = updatedPhotoUrls[0] || '';
            }

            await Project.update(project.id, updateData);

            if (onDataRefresh) {
                await onDataRefresh({ ...project, ...updateData });
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Fout bij verwijderen van foto');
        }
    };

    // Show loading state if project is not yet loaded
    if (!project) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Foto's laden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projectfoto's</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {allPhotos.length} {allPhotos.length === 1 ? 'foto' : 'foto\'s'}
                    </p>
                </div>

                {isAdmin && (
                    <div>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                            disabled={isUploading}
                        />
                        <label htmlFor="photo-upload">
                            <Button
                                as="span"
                                disabled={isUploading}
                                className="cursor-pointer"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploaden...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Foto's Uploaden
                                    </>
                                )}
                            </Button>
                        </label>
                    </div>
                )}
            </div>

            {/* Photo Grid */}
            {allPhotos.length === 0 ? (
                <div className="text-center py-16">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Nog geen foto's toegevoegd</p>
                    {isAdmin && (
                        <label htmlFor="photo-upload">
                            <Button as="span" variant="outline" className="cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload eerste foto
                            </Button>
                        </label>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allPhotos.map((photo, index) => (
                        <PhotoCard
                            key={`${photo.url}-${index}`}
                            photo={photo}
                            project={project}
                            onSetCover={handleSetCover}
                            onDelete={handleDeletePhoto}
                            onOpenViewer={() => setSelectedPhotoIndex(index)}
                            isAdmin={isAdmin}
                            index={index}
                        />
                    ))}
                </div>
            )}

            {/* Photo Viewer Modal */}
            <AnimatePresence>
                {selectedPhotoIndex !== null && allPhotos[selectedPhotoIndex] && (
                    <PhotoViewer
                        photos={allPhotos}
                        initialIndex={selectedPhotoIndex}
                        onClose={() => setSelectedPhotoIndex(null)}
                        project={project}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}