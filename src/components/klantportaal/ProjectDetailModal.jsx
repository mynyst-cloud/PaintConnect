
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, MessageCircle, Camera, AlertTriangle, Palette, FileText, Download } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyUpdate, Damage, ColorAdvice, ChatMessage, PhotoReaction } from '@/api/entities';
import UpdateFeed from '@/components/klantportaal/UpdateFeed';
import InteractivePhotoGallery from '@/components/klantportaal/InteractivePhotoGallery';
import EnhancedDamageList from '@/components/klantportaal/EnhancedDamageList';
import ColorAdviceView from '@/components/klantportaal/ColorAdviceView';
import ProjectChat from '@/components/klantportaal/ProjectChat';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusColors = {
    'niet_gestart': 'bg-gray-100 text-gray-700',
    'in_uitvoering': 'bg-blue-100 text-blue-700',
    'bijna_klaar': 'bg-orange-100 text-orange-700',
    'afgerond': 'bg-green-100 text-green-700'
};

const statusLabels = {
    'niet_gestart': 'Niet gestart',
    'in_uitvoering': 'In uitvoering',
    'bijna_klaar': 'Bijna klaar',
    'afgerond': 'Afgerond'
};

export default function ProjectDetailModal({ project, clientInfo, company, onClose }) {
    const [activeTab, setActiveTab] = useState('updates');
    const [isLoading, setIsLoading] = useState(true);
    const [updates, setUpdates] = useState([]);
    const [damages, setDamages] = useState([]);
    const [colorAdvices, setColorAdvices] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [photos, setPhotos] = useState([]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        const loadProjectData = async () => {
            setIsLoading(true);
            try {
                const [
                    updatesData,
                    damagesData,
                    colorAdvicesData,
                    chatData
                ] = await Promise.all([
                    DailyUpdate.filter({ project_id: project.id, visible_to_client: true }, '-work_date'),
                    Damage.filter({ project_id: project.id, visible_to_client: true }, '-created_date'),
                    ColorAdvice.filter({ project_id: project.id }, '-created_date'),
                    ChatMessage.filter({ project_id: project.id }, '-timestamp')
                ]);

                setUpdates(updatesData || []);
                setDamages(damagesData || []);
                setColorAdvices(colorAdvicesData || []);
                setChatMessages(chatData || []);

                // Collect all photos from updates
                const allPhotos = [];
                (updatesData || []).forEach(update => {
                    if (update.photo_urls && Array.isArray(update.photo_urls)) {
                        allPhotos.push(...update.photo_urls);
                    }
                });
                // Add project photos if available
                if (project.photo_urls && Array.isArray(project.photo_urls)) {
                    allPhotos.push(...project.photo_urls);
                }
                setPhotos([...new Set(allPhotos)]); // Remove duplicates

            } catch (error) {
                console.error('Error loading project data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (project?.id) {
            loadProjectData();
        }
    }, [project]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [handleKeyDown]);

    if (!project) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Cover Photo */}
                    <div className="relative h-64 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 overflow-hidden">
                        {project.cover_photo_url ? (
                            <img
                                src={project.cover_photo_url}
                                alt={project.project_name}
                                className="w-full h-full object-cover"
                            />
                        ) : project.thumbnail_url ? (
                            <img
                                src={project.thumbnail_url}
                                alt={project.project_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800" />
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                        
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* Project Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={statusColors[project.status] + ' text-sm font-medium'}>
                                    {statusLabels[project.status]}
                                </Badge>
                                <span className="text-white/80 text-sm">
                                    {project.progress_percentage || 0}% voltooid
                                </span>
                            </div>
                            
                            <h1 className="text-3xl font-bold mb-2">{project.project_name}</h1>
                            <p className="text-white/90 flex items-center gap-2">
                                <span>{project.address}</span>
                            </p>
                            
                            {company && (
                                <p className="text-white/80 text-sm mt-2">
                                    Uitgevoerd door {company.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start bg-transparent h-auto p-0 space-x-0">
                                <TabsTrigger 
                                    value="updates" 
                                    className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 py-4"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Updates ({updates.length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="photos" 
                                    className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 py-4"
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Foto's ({photos.length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="damages" 
                                    className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 py-4"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Beschadigingen ({damages.length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="colors" 
                                    className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 py-4"
                                >
                                    <Palette className="w-4 h-4 mr-2" />
                                    Kleuradvies
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="chat" 
                                    className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 py-4"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Chat
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Tab Content */}
                    <div className="h-[calc(90vh-20rem)] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner text="Projectgegevens laden..." />
                            </div>
                        ) : (
                            <Tabs value={activeTab} className="w-full">
                                <TabsContent value="updates" className="p-6 mt-0">
                                    <UpdateFeed updates={updates} project={project} />
                                </TabsContent>

                                <TabsContent value="photos" className="p-6 mt-0">
                                    <InteractivePhotoGallery 
                                        photos={photos} 
                                        project={project} 
                                        clientInfo={clientInfo}
                                    />
                                </TabsContent>

                                <TabsContent value="damages" className="p-6 mt-0">
                                    <EnhancedDamageList 
                                        damages={damages} 
                                        clientInfo={clientInfo}
                                        project={project}
                                    />
                                </TabsContent>

                                <TabsContent value="colors" className="p-6 mt-0">
                                    <ColorAdviceView 
                                        colorAdvices={colorAdvices} 
                                        project={project}
                                    />
                                </TabsContent>

                                <TabsContent value="chat" className="p-6 mt-0">
                                    <ProjectChat 
                                        project={project}
                                        clientInfo={clientInfo}
                                        messages={chatMessages}
                                        onNewMessage={(newMessages) => setChatMessages(newMessages)}
                                    />
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
