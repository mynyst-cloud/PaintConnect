
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageCircle, Briefcase } from 'lucide-react';
import { ChatMessage, User, Project } from '@/api/entities';
import { notifyTeamChatMessage } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const paintConnectIconUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png';

// Ping sound for new messages
const playPingSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play ping sound:', error);
  }
};

export default function TeamChatSidebar({ isOpen, onClose, currentUser, onOpen }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  const scrollToBottom = () => {
    // Use ScrollArea's scroll position instead of scrollIntoView
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
    // Fallback to scrollIntoView if ScrollArea method doesn't work
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const loadMessages = useCallback(async () => {
    if (!currentUser?.company_id) return;

    try {
      const companyId = currentUser.current_company_id || currentUser.company_id;
      const chatMessages = await ChatMessage.filter(
        { company_id: companyId },
        '-timestamp',
        50
      );
      const reversedMessages = (chatMessages || []).reverse();
      
      // Play ping sound if new messages arrived (not on first load, not own messages)
      if (!isFirstLoadRef.current && reversedMessages.length > previousMessageCountRef.current) {
        const newestMessage = reversedMessages[reversedMessages.length - 1];
        // Only play sound if the newest message is not from the current user
        if (newestMessage && newestMessage.sender_email !== currentUser.email) {
          playPingSound();
        }
      }
      
      previousMessageCountRef.current = reversedMessages.length;
      isFirstLoadRef.current = false;
      setMessages(reversedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const loadProjects = useCallback(async () => {
    if (!currentUser?.company_id) return;

    try {
      const companyId = currentUser.current_company_id || currentUser.company_id;
      const projectsList = await Project.filter({ company_id: companyId });
      setProjects(projectsList || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      setIsLoading(true);
      loadMessages();
      loadProjects();
      
      // Update last viewed time to reset unread count
      sessionStorage.setItem('teamchat_last_viewed', new Date().toISOString());
      
      // Notify parent component that sidebar was opened (to refresh unread count)
      if (onOpen) {
        onOpen();
      }
      
      // Scroll to bottom after a short delay to ensure messages are rendered
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [isOpen, currentUser, loadMessages, loadProjects, onOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadMessages();
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen, loadMessages]);

  useEffect(() => {
    if (messages.length > 0 && isOpen) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setIsSending(true);
    try {
      const companyId = currentUser.current_company_id || currentUser.company_id;
      
      const messageData = {
        company_id: companyId,
        message: newMessage.trim(),
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        sender_type: 'team',
        timestamp: new Date().toISOString(),
      };

      if (selectedProject && selectedProject !== 'all') {
        messageData.project_id = selectedProject;
      }

      await ChatMessage.create(messageData);
      
      // Send notification to other team members (fire and forget)
      User.filter({ company_id: companyId, status: 'active' })
        .then(teamMembers => {
          if (teamMembers && teamMembers.length > 0) {
            const recipientEmails = teamMembers
              .map(u => u.email)
              .filter(email => email && email.toLowerCase() !== currentUser.email.toLowerCase());
            
            if (recipientEmails.length > 0) {
              notifyTeamChatMessage({
                company_id: companyId,
                sender_name: currentUser.full_name || currentUser.email,
                message_preview: newMessage.trim(),
                recipient_emails: recipientEmails,
                sender_email: currentUser.email
              }).catch(err => console.warn('Chat notification failed:', err));
            }
          }
        })
        .catch(err => console.warn('Failed to fetch team members for notification:', err));
      
      setNewMessage('');
      setSelectedProject('all');
      await loadMessages();
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = selectedProject === 'all'
    ? messages
    : messages.filter(m => m.project_id === selectedProject);

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.project_name || 'Onbekend project';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return `Gisteren ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header - AANGEPAST: PaintChat met favicon logo */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center p-1.5">
                  <img 
                    src={paintConnectIconUrl} 
                    alt="PaintConnect" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">PaintChat</h2>
                  <p className="text-xs text-emerald-100">
                    {filteredMessages.length} {filteredMessages.length === 1 ? 'bericht' : 'berichten'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Project Filter */}
            <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Filter op project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Alle berichten
                    </div>
                  </SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {project.project_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {filteredMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {selectedProject === 'all' 
                            ? 'Nog geen berichten. Start een gesprek!' 
                            : 'Geen berichten voor dit project.'}
                        </p>
                      </div>
                    ) : (
                      filteredMessages.map((message) => {
                        const isCurrentUser = message.sender_email === currentUser?.email;
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                              {!isCurrentUser && (
                                <div className="flex items-center gap-2 mb-1 px-1">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                      {message.sender_name?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {message.sender_name}
                                  </span>
                                </div>
                              )}

                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isCurrentUser
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                  {message.message}
                                </p>
                                
                                {message.project_id && (
                                  <div className={`mt-2 flex items-center gap-1 text-xs ${
                                    isCurrentUser ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    <Briefcase className="w-3 h-3" />
                                    {getProjectName(message.project_id)}
                                  </div>
                                )}

                                <div className={`text-xs mt-1 ${
                                  isCurrentUser ? 'text-emerald-100' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {formatTime(message.timestamp || message.created_date)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input Form */}
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {projects.length > 0 && (
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Koppel aan project (optioneel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2 text-xs">
                          <MessageCircle className="w-3 h-3" />
                          Geen specifiek project
                        </div>
                      </SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2 text-xs">
                            <Briefcase className="w-3 h-3" />
                            {project.project_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Typ je bericht..."
                    disabled={isSending}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
