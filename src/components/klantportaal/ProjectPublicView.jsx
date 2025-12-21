import React, { useState, useEffect } from 'react';
import { DailyUpdate, Damage, ChatMessage } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  MessageCircle,
  Send,
  Loader2,
  Heart,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  MapPin,
  Thermometer,
  Wrench,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from "@/utils";

const statusColors = {
  nieuw: "bg-gray-100 text-gray-800",
  planning: "bg-blue-100 text-blue-800",
  in_uitvoering: "bg-emerald-100 text-emerald-800",
  afgerond: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  geannuleerd: "bg-red-100 text-red-800",
  offerte: "bg-purple-100 text-purple-800",
  // Backwards compatibility
  niet_gestart: "bg-gray-100 text-gray-800",
  bijna_klaar: "bg-blue-100 text-blue-800"
};

const statusLabels = {
  nieuw: "Gepland",
  planning: "Planning",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  on_hold: "On Hold",
  geannuleerd: "Geannuleerd",
  offerte: "Offerte",
  // Backwards compatibility
  niet_gestart: "Gepland",
  bijna_klaar: "Planning"
};

const damageStatusColors = {
  gemeld: "bg-red-100 text-red-800 border-red-200",
  in_behandeling: "bg-orange-100 text-orange-800 border-orange-200",
  opgelost: "bg-green-100 text-green-800 border-green-200",
  geaccepteerd: "bg-blue-100 text-blue-800 border-blue-200"
};

const damageStatusLabels = {
  gemeld: "Gemeld",
  in_behandeling: "In behandeling",
  opgelost: "Opgelost",
  geaccepteerd: "Geaccepteerd"
};

const severityLabels = {
  laag: "Laag",
  gemiddeld: "Gemiddeld",
  hoog: "Hoog",
  kritiek: "Kritiek"
};


export default function ProjectPublicView({ project }) {
  const [damages, setDamages] = React.useState([]);
  const [isLoadingDamages, setIsLoadingDamages] = React.useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentPhotoSet, setCurrentPhotoSet] = useState([]);
  const [clientUpdates, setClientUpdates] = React.useState([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = React.useState(true);
  const [chatMessages, setChatMessages] = React.useState([]);
  const [isLoadingChat, setIsLoadingChat] = React.useState(true);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [photoReactions, setPhotoReactions] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    chat: true,
    photos: true,
    updates: true,
    damages: true
  });

  React.useEffect(() => {
    if(project) {
        loadDamages();
        loadClientUpdates();
        loadChatMessages();
        
        const chatInterval = setInterval(loadChatMessages, 5000);
        return () => clearInterval(chatInterval);
    }
  }, [project]);

  const loadDamages = async () => {
    setIsLoadingDamages(true);
    try {
      const allDamages = await Damage.list();
      const projectDamages = allDamages.filter(d =>
        d.project_id === project.id
      );
      setDamages(projectDamages);
    } catch (error) {
      console.error("Error loading damages:", error);
      setDamages([]);
    }
    setIsLoadingDamages(false);
  };

  const loadClientUpdates = async () => {
    setIsLoadingUpdates(true);
    try {
      const allUpdates = await DailyUpdate.list("-work_date");
      const projectUpdates = allUpdates.filter(u =>
        u.project_id === project.id &&
        u.visible_to_client === true &&
        u.check_out_time
      );
      setClientUpdates(projectUpdates);
    } catch (error) {
      console.error("Error loading client updates:", error);
      setClientUpdates([]);
    }
    setIsLoadingUpdates(false);
  };

  const loadChatMessages = async () => {
    setIsLoadingChat(true);
    try {
      const allMessages = await ChatMessage.list("-timestamp");
      const projectMessages = allMessages.filter(m => {
        const isClientMessage = m.sender_email === project.client_email && 
                               m.message && m.message.includes(`[KLANT VRAAG - ${project.project_name}]`);
        
        const isTeamResponse = m.message && m.message.includes(`[ANTWOORD VOOR ${project.client_name.toUpperCase()}]`);
        
        const isInternalNotification = m.message && m.message.startsWith('[TEAM NOTIFICATIE]');

        return (isClientMessage || isTeamResponse) && !isInternalNotification;
      });
      
      setChatMessages(projectMessages.reverse());
    } catch (error) {
      console.error("Error loading chat messages:", error);
      setChatMessages([]);
    }
    setIsLoadingChat(false);
  };

  const calculateProgress = () => {
    if (!project.start_date || !project.expected_end_date) return 0;

    const start = parseISO(project.start_date);
    const end = parseISO(project.expected_end_date);
    const now = new Date();

    if (now < start) return 0;
    if (now >= end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    
    return Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'd MMMM yyyy', { locale: nl });
    } catch (error) {
      return '-';
    }
  };

  const openPhotoViewer = (url, photoList) => {
    setCurrentPhotoSet(photoList || []);
    const index = (photoList || []).indexOf(url);
    if (index !== -1) {
      setCurrentPhotoIndex(index);
      setSelectedPhoto(url);
    }
  };

  const closePhotoViewer = () => {
    setSelectedPhoto(null);
    setCurrentPhotoSet([]);
  };

  const nextPhoto = () => {
    if (currentPhotoSet.length === 0) return;
    const nextIndex = (currentPhotoIndex + 1) % currentPhotoSet.length;
    setCurrentPhotoIndex(nextIndex);
    setSelectedPhoto(currentPhotoSet[nextIndex]);
  };

  const prevPhoto = () => {
    if (currentPhotoSet.length === 0) return;
    const prevIndex = currentPhotoIndex === 0 ? currentPhotoSet.length - 1 : currentPhotoIndex - 1;
    setCurrentPhotoIndex(prevIndex);
    setSelectedPhoto(currentPhotoSet[prevIndex]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      const messageContent = `[KLANT VRAAG - ${project.project_name}] ${newChatMessage}`;
      
      await ChatMessage.create({
        message: messageContent,
        sender_name: project.client_name,
        sender_email: project.client_email || 'klant@project.com',
        timestamp: new Date().toISOString(),
        company_id: project.company_id,
      });

      try {
        const notificationMessage = `[TEAM NOTIFICATIE] Nieuwe vraag van ${project.client_name} voor project "${project.project_name}": "${newChatMessage}"`;
        
        await ChatMessage.create({
          message: notificationMessage,
          sender_name: 'Systeem',
          sender_email: 'systeem@freshdecor.app',
          timestamp: new Date().toISOString(),
          company_id: project.company_id,
        });
      } catch (notificationError) {
          console.error("Failed to create notification:", notificationError);
      }
      
      setNewChatMessage("");
      await loadChatMessages();
      
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Er ging iets mis bij het versturen van uw bericht. Probeer het opnieuw.");
    }
    setIsSendingMessage(false);
  };

  const handlePhotoReaction = async (photoUrl, reactionType) => {
    try {
      const reactionMessage = `[KLANT REACTIE - ${project.project_name}] ${project.client_name} heeft een ${reactionType === 'like' ? '👍' : '❤️'} gegeven op een foto.`;
      
      await ChatMessage.create({
        message: reactionMessage,
        sender_name: project.client_name,
        sender_email: project.client_email || 'klant@project.com',
        timestamp: new Date().toISOString(),
        company_id: project.company_id,
      });

      setPhotoReactions(prev => ({
        ...prev,
        [photoUrl]: reactionType
      }));

      try {
        const notificationMessage = `[TEAM NOTIFICATIE] ${project.client_name} heeft een ${reactionType === 'like' ? 'duimpje 👍' : 'hartje ❤️'} gegeven op een foto in project "${project.project_name}"`;
        
        await ChatMessage.create({
          message: notificationMessage,
          sender_name: 'Systeem',
          sender_email: 'systeem@freshdecor.app',
          timestamp: new Date().toISOString(),
          company_id: project.company_id,
        });
      } catch (notificationError) {
          console.error("Failed to create notification:", notificationError);
      }
    } catch (error) {
      console.error("Error sending photo reaction:", error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const progress = calculateProgress();
  const photos = project.photo_urls || [];

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b p-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                    <span className="truncate">{project.project_name}</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{project.client_name}</p>
                </div>
                <Badge className={`${statusColors[project.status]} font-semibold px-3 py-1 text-sm`}>
                  {statusLabels[project.status]}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Start: {formatDate(project.start_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Klaar: {formatDate(project.expected_end_date)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Voortgang</span>
                  <span className="text-sm font-bold text-emerald-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
            onClick={() => toggleSection('chat')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Chat met het team
                {chatMessages.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 ml-2">{chatMessages.length}</Badge>
                )}
              </CardTitle>
              {expandedSections.chat ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          
          <AnimatePresence>
            {expandedSections.chat && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="p-4 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto space-y-3">
                    {chatMessages.length > 0 ? chatMessages.map((message, index) => {
                      const isClientMessage = message.sender_email === project.client_email;
                      const isTeamResponse = message.message && message.message.includes(`[ANTWOORD VOOR ${project.client_name.toUpperCase()}]`);
                      
                      return (
                        <div key={message.id || index} className={`flex gap-2 ${isClientMessage ? '' : 'flex-row-reverse'}`}>
                          <div className="flex-shrink-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isClientMessage 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-emerald-500 text-white'
                            }`}>
                              {isClientMessage ? 'U' : 'T'}
                            </div>
                          </div>
                          <div className={`max-w-[80%] ${isClientMessage ? '' : 'text-right'}`}>
                            <div className={`rounded-lg p-2 text-sm ${
                              isClientMessage 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'bg-emerald-500 text-white'
                            }`}>
                              <p>
                                {isClientMessage 
                                  ? message.message.replace(/\[KLANT VRAAG -.*?\]\s*/, '')
                                  : message.message.replace(/\[ANTWOORD VOOR .*?\]\s*/, '')
                                }
                              </p>
                            </div>
                            <div className={`mt-1 text-xs text-gray-500 ${
                              isClientMessage ? 'text-left' : 'text-right'
                            }`}>
                              {message.timestamp 
                                ? new Date(message.timestamp).toLocaleString('nl-NL', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'Nu'
                              }
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-4 text-gray-500">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nog geen berichten</p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <Textarea
                      placeholder="Typ uw bericht..."
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newChatMessage.trim() || isSendingMessage}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSendingMessage ? (
                        <InlineSpinner />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Verstuur bericht
                    </Button>
                  </form>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {project.description && (
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Projectbeschrijving</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{project.description}</p>
            </CardContent>
          </Card>
        )}

        {photos.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
              onClick={() => toggleSection('photos')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  Project Foto's
                  <Badge className="bg-purple-100 text-purple-800 ml-2">{photos.length}</Badge>
                </CardTitle>
                {expandedSections.photos ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.photos && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {photos.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="cursor-pointer" onClick={() => openPhotoViewer(url, photos)}>
                            <img 
                              src={url} 
                              alt={`Project foto ${index + 1}`}
                              className="w-full h-24 md:h-32 object-cover rounded-lg border shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white ${photoReactions[url] === 'like' ? 'text-blue-600' : 'text-gray-600'}`}
                              onClick={() => handlePhotoReaction(url, 'like')}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white ${photoReactions[url] === 'heart' ? 'text-red-600' : 'text-gray-600'}`}
                              onClick={() => handlePhotoReaction(url, 'heart')}
                            >
                              <Heart className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {!isLoadingUpdates && clientUpdates.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
              onClick={() => toggleSection('updates')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Werkupdates
                  <Badge className="bg-emerald-100 text-emerald-800 ml-2">{clientUpdates.length}</Badge>
                </CardTitle>
                {expandedSections.updates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.updates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <CardContent className="p-4 space-y-4">
                    {clientUpdates.map((update, index) => (
                      <div key={update.id || index} className="bg-gray-50 border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">{update.painter_name}</h4>
                          <span className="text-xs text-gray-500">
                            {formatDate(update.work_date)}
                          </span>
                        </div>
                        {update.work_notes && (
                          <p className="text-gray-700 mb-3 text-sm">{update.work_notes}</p>
                        )}
                        {update.photo_urls && update.photo_urls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {update.photo_urls.map((url, photoIndex) => (
                              <div key={photoIndex} className="relative group">
                                <img 
                                  src={url} 
                                  alt={`Werkfoto ${photoIndex + 1}`}
                                  className="w-full h-20 object-cover rounded cursor-pointer"
                                  onClick={() => openPhotoViewer(url, update.photo_urls)}
                                />
                                <div className="absolute bottom-1 right-1 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-5 w-5 p-0 rounded-full bg-white/80 hover:bg-white ${photoReactions[url] === 'like' ? 'text-blue-600' : 'text-gray-600'}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePhotoReaction(url, 'like');
                                    }}
                                  >
                                    <ThumbsUp className="w-2.5 h-2.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-5 w-5 p-0 rounded-full bg-white/80 hover:bg-white ${photoReactions[url] === 'heart' ? 'text-red-600' : 'text-gray-600'}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePhotoReaction(url, 'heart');
                                    }}
                                  >
                                    <Heart className="w-2.5 h-2.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {!isLoadingDamages && damages.length > 0 && (
          <Card className="shadow-lg bg-orange-50/30">
            <CardHeader 
              className="cursor-pointer hover:bg-orange-50 transition-colors p-4"
              onClick={() => toggleSection('damages')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Gemelde Beschadigingen
                  <Badge className="bg-orange-100 text-orange-800 ml-2">{damages.length}</Badge>
                </CardTitle>
                {expandedSections.damages ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.damages && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {damages.map((damage, index) => (
                      <div key={damage.id || index} className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-gray-900 text-base">{damage.title}</h4>
                          <Badge className={`${damageStatusColors[damage.status]} font-medium whitespace-nowrap`}>
                            {damageStatusLabels[damage.status]}
                          </Badge>
                        </div>

                        <p className="text-gray-700 text-sm">{damage.description}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 border-t pt-3">
                          {damage.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>Locatie:</span>
                              <span className="font-medium text-gray-800">{damage.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Thermometer className="w-4 h-4 text-gray-400" />
                            <span>Ernst:</span>
                            <span className="font-medium text-gray-800">{severityLabels[damage.severity] || damage.severity}</span>
                          </div>
                        </div>
                        
                        {damage.repair_notes && (
                          <div className="mt-2 bg-green-50 p-3 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-green-800 mb-1 flex items-center gap-2 text-sm">
                              <Wrench className="w-4 h-4" />
                              Notities van het team:
                            </h5>
                            <p className="text-green-700 text-sm">{damage.repair_notes}</p>
                          </div>
                        )}

                        {damage.photo_urls && damage.photo_urls.length > 0 && (
                          <div className="pt-2">
                            <h5 className="text-sm font-semibold text-gray-800 mb-2">Foto's</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {damage.photo_urls.map((url, photoIndex) => (
                                <img 
                                  key={photoIndex}
                                  src={url} 
                                  alt={`Beschadiging foto ${photoIndex + 1}`}
                                  className="w-full h-20 object-cover rounded cursor-pointer border hover:opacity-80 transition"
                                  onClick={() => openPhotoViewer(url, damage.photo_urls)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Contact</h3>
            <p className="text-emerald-700 text-sm">
              Heeft u vragen over uw project? Gebruik de chat hierboven of neem direct contact op met uw schildersbedrijf.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Powered by PaintPro</h3>
            <p className="text-emerald-100 mb-4">
              Uw schildersbedrijf gebruikt PaintPro om u de beste service te bieden.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="secondary" 
                onClick={() => window.location.href = createPageUrl("Help")}
                className="bg-white text-emerald-600 hover:bg-gray-100"
              >
                Meer over PaintPro
              </Button>
              <div className="text-sm text-emerald-100">
                Interesse? <a href="mailto:info@paintpro.app" className="underline">Neem contact op</a>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={closePhotoViewer}
          >
            <div className="relative max-w-5xl max-h-full">
              <motion.img
                key={selectedPhoto}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={selectedPhoto}
                alt="Project foto"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={closePhotoViewer}
              >
                <X className="w-8 h-8" />
              </Button>

              {currentPhotoSet.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevPhoto();
                    }}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextPhoto();
                    }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-2 rounded-full text-white text-sm">
                    {currentPhotoIndex + 1} / {currentPhotoSet.length}
                  </div>
                </>
              )}

              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`bg-white/20 hover:bg-white/30 text-white ${photoReactions[selectedPhoto] === 'like' ? 'bg-blue-600/80' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhotoReaction(selectedPhoto, 'like');
                  }}
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`bg-white/20 hover:bg-white/30 text-white ${photoReactions[selectedPhoto] === 'heart' ? 'bg-red-600/80' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhotoReaction(selectedPhoto, 'heart');
                  }}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}