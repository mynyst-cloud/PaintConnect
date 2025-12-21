import React, { useState, useEffect } from 'react';
import { Damage, DamageInteraction, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, MapPin, MessageSquare, Heart, Send, Image as ImageIcon, Calendar } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import PhotoViewer from '@/components/projects/PhotoViewer';
import { createDamageInteraction } from '@/api/functions';
import DamageForm from '@/components/damages/DamageForm';

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

const DamageCard = ({ damage, currentUser, onInteractionChange, onEdit, isAdmin }) => {
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
  const hasLiked = likes.some(like => like.actor_email === currentUser?.email);

  const handleLike = async () => {
    if (!currentUser || isLiking) return;
    
    setIsLiking(true);
    try {
      const { data } = await createDamageInteraction({
        damage_id: damage.id,
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
      console.error('Failed to like damage:', error);
      alert('Kon niet liken. Probeer het opnieuw.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!currentUser || !commentText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { data } = await createDamageInteraction({
        damage_id: damage.id,
        interaction_type: 'comment',
        comment_text: commentText.trim(),
        actor_type: 'user',
        actor_name: currentUser.full_name || currentUser.email,
        actor_email: currentUser.email
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
              <AvatarFallback className="bg-red-600 text-white text-sm font-semibold">
                <AlertTriangle className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{damage.title}</h3>
                {isAdmin && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(damage)}
                    className="flex-shrink-0"
                  >
                    Bewerken
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={severityColors[damage.severity] || severityColors.gemiddeld}>
                  {damage.severity}
                </Badge>
                <Badge className={statusColors[damage.status] || statusColors.gemeld}>
                  {damage.status?.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  Gemeld door {damage.reported_by}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-3">
            {damage.description}
          </p>

          {damage.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-3">
              <MapPin className="w-4 h-4" />
              <span>{damage.location}</span>
            </div>
          )}

          {damage.repair_notes && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Reparatie notities:</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{damage.repair_notes}</p>
            </div>
          )}

          {/* Photos */}
          {damage.photo_urls && damage.photo_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
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
          )}
        </div>

        {/* Interactions */}
        <div className="px-4 md:px-6 pb-4 space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
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

export default function DamagesTab({ project, onDataRefresh, isAdmin }) {
  const [damages, setDamages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDamage, setEditingDamage] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [user, damagesData] = await Promise.all([
        User.me(),
        Damage.filter({ project_id: project.id }, '-created_date')
      ]);
      
      setCurrentUser(user);
      setDamages(damagesData || []);
    } catch (error) {
      console.error('Failed to load damages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id]);

  const handleEdit = (damage) => {
    setEditingDamage(damage);
  };

  const handleFormSubmit = async () => {
    setEditingDamage(null);
    await loadData();
    if (onDataRefresh) onDataRefresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="default" />
      </div>
    );
  }

  if (damages.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Geen beschadigingen gemeld
        </h3>
        <p className="text-gray-600 dark:text-slate-400">
          Beschadigingen worden hier getoond zodra ze worden gemeld
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {damages.map((damage) => (
          <DamageCard
            key={damage.id}
            damage={damage}
            currentUser={currentUser}
            onInteractionChange={loadData}
            onEdit={isAdmin ? handleEdit : null}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {editingDamage && (
        <DamageForm
          damage={editingDamage}
          projects={[project]}
          currentUser={currentUser}
          onSubmit={handleFormSubmit}
          onClose={() => setEditingDamage(null)}
        />
      )}
    </>
  );
}