import React, { useState, useEffect } from 'react';
import { Damage, DamageInteraction } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, MapPin, MessageSquare, Heart, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import PhotoViewer from '@/components/projects/PhotoViewer';
import { createDamageInteraction } from '@/api/functions';

const getInitials = (name) => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

const severityColors = {
  laag: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  gemiddeld: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  hoog: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  kritiek: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

const statusColors = {
  gemeld: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  in_behandeling: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  opgelost: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  geaccepteerd: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

const DamageCard = ({ damage, clientInfo, onInteractionChange }) => {
  const [interactions, setInteractions] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

  const loadInteractions = async () => {
    try {
      const data = await DamageInteraction.filter({ damage_id: damage.id }, '-timestamp');
      setInteractions(data || []);
    } catch (error) {
      console.error('Failed to load interactions:', error);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, [damage.id]);

  const likes = interactions.filter(i => i.interaction_type === 'like');
  const comments = interactions.filter(i => i.interaction_type === 'comment');
  const hasLiked = clientInfo && likes.some(like => like.actor_email === clientInfo.client_email);

  const handleLike = async () => {
    if (!clientInfo || isLiking) return;
    
    setIsLiking(true);
    try {
      const { data } = await createDamageInteraction({
        damage_id: damage.id,
        interaction_type: 'like',
        actor_type: 'client',
        actor_name: clientInfo.client_name || clientInfo.client_email,
        actor_email: clientInfo.client_email
      });

      if (data?.success) {
        await loadInteractions();
        if (onInteractionChange) onInteractionChange();
      }
    } catch (error) {
      console.error('Failed to like damage:', error);
      alert('Kon niet liken. Probeer het opnieuw.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!clientInfo || !commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { data } = await createDamageInteraction({
        damage_id: damage.id,
        interaction_type: 'comment',
        comment_text: commentText.trim(),
        actor_type: 'client',
        actor_name: clientInfo.client_name || clientInfo.client_email,
        actor_email: clientInfo.client_email
      });

      if (data?.success) {
        setCommentText('');
        await loadInteractions();
        if (onInteractionChange) onInteractionChange();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Kon commentaar niet plaatsen. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show damages marked as not visible to client
  if (damage.visible_to_client === false) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-red-600 text-white text-sm font-semibold">
                <AlertTriangle className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{damage.title}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={severityColors[damage.severity] || severityColors.gemiddeld}>
                  {damage.severity}
                </Badge>
                <Badge className={statusColors[damage.status] || statusColors.gemeld}>
                  {damage.status?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Beschrijving:</h4>
          <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-3">
            {damage.description}
          </p>

          {damage.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-3">
              <MapPin className="w-4 h-4" />
              <span><strong>Locatie:</strong> {damage.location}</span>
            </div>
          )}

          {damage.repair_notes && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Update van het team:
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{damage.repair_notes}</p>
            </div>
          )}

          {/* Photos */}
          {damage.photo_urls && damage.photo_urls.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Foto's ({damage.photo_urls.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {damage.photo_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <img 
                      src={url} 
                      alt={`Schade foto ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interactions */}
        <div className="px-4 md:px-6 pb-4 space-y-3 border-t border-gray-100 dark:border-slate-700">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400 pt-3">
            {likes.length > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                {likes.length} {likes.length === 1 ? 'waardering' : 'waarderingen'}
              </span>
            )}
            {comments.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {comments.length} {comments.length === 1 ? 'reactie' : 'reacties'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`flex-1 ${hasLiked ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-slate-400'}`}
            >
              {isLiking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 mr-2 ${hasLiked ? 'fill-red-600 dark:fill-red-400' : ''}`} />
              )}
              {hasLiked ? 'Gewaardeerd' : 'Waardeer'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex-1 text-gray-600 dark:text-slate-400"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Reageer
            </Button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {/* Comment Input */}
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(clientInfo?.client_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Plaats een reactie..."
                      rows={2}
                      className="resize-none text-sm"
                      disabled={isSubmitting}
                    />
                    <Button
                      size="sm"
                      onClick={handleComment}
                      disabled={!commentText.trim() || isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 self-end"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                {comments.length > 0 && (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={`text-white text-xs ${
                            comment.actor_type === 'client' ? 'bg-blue-600' : 'bg-emerald-600'
                          }`}>
                            {getInitials(comment.actor_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">
                              {comment.actor_name}
                            </span>
                            <Badge variant="outline" className={`text-xs ${
                              comment.actor_type === 'client'
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {comment.actor_type === 'client' ? 'U' : 'Team'}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-slate-400 ml-auto">
                              {format(parseISO(comment.timestamp), 'HH:mm', { locale: nl })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                            {comment.comment_text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Photo Viewer */}
      {selectedPhotoIndex !== null && damage.photo_urls && (
        <PhotoViewer
          photos={damage.photo_urls.map(url => ({ url }))}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </>
  );
};

export default function EnhancedDamageList({ project, clientInfo }) {
  const [damages, setDamages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDamages = async () => {
    setIsLoading(true);
    try {
      const damagesData = await Damage.filter(
        { project_id: project.id, visible_to_client: true },
        '-created_date'
      );
      setDamages(damagesData || []);
    } catch (error) {
      console.error('Failed to load damages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDamages();
  }, [project.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (damages.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Geen beschadigingen
        </h3>
        <p className="text-gray-600 dark:text-slate-400">
          Er zijn momenteel geen beschadigingen gemeld voor dit project
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {damages.map((damage) => (
        <DamageCard
          key={damage.id}
          damage={damage}
          clientInfo={clientInfo}
          onInteractionChange={loadDamages}
        />
      ))}
    </div>
  );
}