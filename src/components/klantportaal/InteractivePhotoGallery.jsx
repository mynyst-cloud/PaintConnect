import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, X, ChevronLeft, ChevronRight, Send, Camera,  } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { PhotoReaction } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import PhotoViewer from '@/components/projects/PhotoViewer';

export default function InteractivePhotoGallery({ photos = [], project, clientInfo }) {
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
    const [reactions, setReactions] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [showCommentInput, setShowCommentInput] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [signedUrls, setSignedUrls] = useState({});
    const [loadingUrls, setLoadingUrls] = useState({});

    // Load signed URLs for private photos
    useEffect(() => {
        const loadSignedUrls = async () => {
            const urls = {};
            const loading = {};
            
            for (const photo of photos) {
                if (photo && photo.includes('/private/')) {
                    loading[photo] = true;
                    setLoadingUrls(prev => ({ ...prev, [photo]: true }));
                    
                    try {
                        const result = await base44.integrations.Core.CreateFileSignedUrl({
                            file_uri: photo,
                            expires_in: 300
                        });
                        urls[photo] = result?.signed_url || photo;
                    } catch (error) {
                        console.error('Error creating signed URL:', error);
                        urls[photo] = photo;
                    }
                    
                    setLoadingUrls(prev => ({ ...prev, [photo]: false }));
                } else {
                    urls[photo] = photo;
                }
            }
            
            setSignedUrls(urls);
        };
        
        if (photos.length > 0) {
            loadSignedUrls();
        }
    }, [photos]);

    const loadReactions = useCallback(async () => {
        if (!photos.length || !project?.id) return;

        try {
            const allReactions = await PhotoReaction.filter({ project_id: project.id });
            
            const reactionsByPhoto = {};
            const commentsByPhoto = {};

            allReactions.forEach(reaction => {
                if (!reactionsByPhoto[reaction.photo_url]) {
                    reactionsByPhoto[reaction.photo_url] = { likes: 0, hasLiked: false };
                }
                if (!commentsByPhoto[reaction.photo_url]) {
                    commentsByPhoto[reaction.photo_url] = [];
                }

                if (reaction.reaction_type === 'like') {
                    reactionsByPhoto[reaction.photo_url].likes++;
                    if (reaction.client_email === clientInfo?.email) {
                        reactionsByPhoto[reaction.photo_url].hasLiked = true;
                    }
                } else if (reaction.reaction_type === 'comment' && reaction.comment_text) {
                    commentsByPhoto[reaction.photo_url].push({
                        text: reaction.comment_text,
                        client_name: reaction.client_name,
                        created_date: reaction.created_date
                    });
                }
            });

            setReactions(reactionsByPhoto);
            setComments(commentsByPhoto);
        } catch (error) {
            console.error('Error loading reactions:', error);
        }
    }, [photos.length, project?.id, clientInfo?.email]);

    useEffect(() => {
        loadReactions();
    }, [loadReactions]);

    const handleLike = async (photoUrl) => {
        if (!clientInfo) return;
        
        setIsLoading(true);
        try {
            const currentReaction = reactions[photoUrl];
            if (currentReaction?.hasLiked) {
                // Unlike - would need to implement deletion
                return;
            }

            await PhotoReaction.create({
                project_id: project.id,
                photo_url: photoUrl,
                client_email: clientInfo.email,
                client_name: clientInfo.name || 'Klant',
                reaction_type: 'like'
            });

            await loadReactions();
        } catch (error) {
            console.error('Error liking photo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComment = async (photoUrl) => {
        if (!clientInfo || !newComment.trim()) return;
        
        setIsLoading(true);
        try {
            await PhotoReaction.create({
                project_id: project.id,
                photo_url: photoUrl,
                client_email: clientInfo.email,
                client_name: clientInfo.name || 'Klant',
                reaction_type: 'comment',
                comment_text: newComment.trim()
            });

            setNewComment('');
            setShowCommentInput(null);
            await loadReactions();
        } catch (error) {
            console.error('Error commenting on photo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!photos || photos.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Nog geen foto's beschikbaar voor dit project.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo, index) => {
                    const photoReactions = reactions[photo] || { likes: 0, hasLiked: false };
                    const photoComments = comments[photo] || [];

                    return (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                <div className="relative">
                                    {loadingUrls[photo] ? (
                                        <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                            <LoadingSpinner size="sm" />
                                        </div>
                                    ) : (
                                        <img
                                            src={signedUrls[photo] || photo}
                                            alt={`Project foto ${index + 1}`}
                                            className="w-full h-48 object-cover cursor-pointer transition-transform group-hover:scale-105"
                                            onClick={() => setSelectedPhotoIndex(index)}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                                
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleLike(photo)}
                                            disabled={isLoading}
                                            className={`${photoReactions.hasLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                                        >
                                            <Heart className={`w-4 h-4 mr-2 ${photoReactions.hasLiked ? 'fill-current' : ''}`} />
                                            {photoReactions.likes}
                                        </Button>
                                        
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowCommentInput(showCommentInput === photo ? null : photo)}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            {photoComments.length}
                                        </Button>
                                    </div>

                                    {photoComments.length > 0 && (
                                        <div className="space-y-2">
                                            {photoComments.slice(-2).map((comment, commentIndex) => (
                                                <div key={commentIndex} className="text-sm bg-gray-50 p-2 rounded">
                                                    <span className="font-medium text-gray-800">{comment.client_name}:</span>
                                                    <span className="text-gray-600 ml-2">{comment.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <AnimatePresence>
                                        {showCommentInput === photo && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex gap-2 pt-2">
                                                    <Textarea
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder="Voeg een reactie toe..."
                                                        rows={2}
                                                        className="flex-1 text-sm"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleComment(photo)}
                                                        disabled={!newComment.trim() || isLoading}
                                                    >
                                                        <Send className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedPhotoIndex !== null && (
                    <PhotoViewer
                        photos={photos.map(p => ({ url: p }))}
                        initialIndex={selectedPhotoIndex}
                        onClose={() => setSelectedPhotoIndex(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}