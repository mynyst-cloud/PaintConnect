import React, { useState, useEffect } from 'react';
import { DailyUpdate, DailyUpdateInteraction, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, MessageSquare, Heart, Send, X, Image as ImageIcon,  } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import PhotoViewer from '@/components/projects/PhotoViewer';
import { createDailyUpdateInteraction, notifyUpdateReply } from '@/api/functions';

const getInitials = (name) => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

const DailyUpdateCard = ({ update, currentUser, onInteractionChange }) => {
  const [interactions, setInteractions] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

  const loadInteractions = async () => {
    try {
      const data = await DailyUpdateInteraction.filter({ daily_update_id: update.id }, '-timestamp');
      setInteractions(data || []);
    } catch (error) {
      console.error('Failed to load interactions:', error);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, [update.id]);

  const likes = interactions.filter(i => i.interaction_type === 'like');
  const comments = interactions.filter(i => i.interaction_type === 'comment');
  const hasLiked = likes.some(like => like.actor_email === currentUser?.email);

  const handleLike = async () => {
    if (!currentUser || isLiking) return;
    
    setIsLiking(true);
    try {
      const { data } = await createDailyUpdateInteraction({
        daily_update_id: update.id,
        interaction_type: 'like',
        actor_type: 'user',
        actor_name: currentUser.full_name || currentUser.email,
        actor_email: currentUser.email
      });

      if (data?.success) {
        await loadInteractions();
        if (onInteractionChange) onInteractionChange();
      }
    } catch (error) {
      console.error('Failed to like update:', error);
      alert('Kon niet liken. Probeer het opnieuw.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!currentUser || !commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { data } = await createDailyUpdateInteraction({
        daily_update_id: update.id,
        interaction_type: 'comment',
        comment_text: commentText.trim(),
        actor_type: 'user',
        actor_name: currentUser.full_name || currentUser.email,
        actor_email: currentUser.email
      });

      if (data?.success) {
        // Notify the painter if the commenter is not the painter
        if (update.painter_email && update.painter_email.toLowerCase() !== currentUser.email.toLowerCase()) {
          notifyUpdateReply({
            company_id: update.company_id,
            project_id: update.project_id,
            project_name: update.project_name,
            replier_name: currentUser.full_name || currentUser.email,
            reply_preview: commentText.trim(),
            painter_email: update.painter_email
          }).catch(err => console.warn('Update reply notification failed:', err));
        }
        
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

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'EEEE d MMMM yyyy', { locale: nl });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-4"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                {getInitials(update.painter_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">{update.painter_name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(update.work_date)}
                </Badge>
                {update.hours_worked && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {update.hours_worked} uur
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {update.work_notes}
          </p>

          {/* Photos */}
          {update.photo_urls && update.photo_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {update.photo_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                >
                  <img 
                    src={url} 
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interactions */}
        <div className="px-4 md:px-6 pb-4 space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
            {likes.length > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                {likes.length} {likes.length === 1 ? 'like' : 'likes'}
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
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`flex-1 ${hasLiked ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-slate-400'}`}
            >
              {isLiking ? (
                <InlineSpinner />
              ) : (
                <Heart className={`w-4 h-4 mr-2 ${hasLiked ? 'fill-red-600 dark:fill-red-400' : ''}`} />
              )}
              {hasLiked ? 'Geliked' : 'Like'}
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
                className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-700"
              >
                {/* Comment Input */}
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-slate-300 text-xs">
                      {getInitials(currentUser?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Schrijf een reactie..."
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
                        <InlineSpinner />
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
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {getInitials(comment.actor_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900 dark:text-slate-100">
                              {comment.actor_name}
                            </span>
                            {comment.actor_type === 'client' && (
                              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                Klant
                              </Badge>
                            )}
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
      {selectedPhotoIndex !== null && update.photo_urls && (
        <PhotoViewer
          photos={update.photo_urls.map(url => ({ url }))}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </>
  );
};

export default function DailyUpdatesTab({ project, onDataRefresh }) {
  const [updates, setUpdates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [user, updatesData] = await Promise.all([
        User.me(),
        DailyUpdate.filter({ project_id: project.id }, '-work_date')
      ]);
      
      setCurrentUser(user);
      setUpdates(updatesData || []);
    } catch (error) {
      console.error('Failed to load daily updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="default" />
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Nog geen dagelijkse updates
        </h3>
        <p className="text-gray-600 dark:text-slate-400">
          Updates verschijnen hier zodra schilders hun werkzaamheden registreren
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updates.map((update) => (
        <DailyUpdateCard
          key={update.id}
          update={update}
          currentUser={currentUser}
          onInteractionChange={loadData}
        />
      ))}
    </div>
  );
}