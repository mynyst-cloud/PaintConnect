import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, User, Project } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Clock, RefreshCw, User as UserIcon, Paintbrush2, Building, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { AnimatePresence, motion } from "framer-motion";
import { notifyAdmins } from "@/components/utils/notificationManager";
import { createPageUrl } from "@/components/utils";
import { format, parseISO, isValid } from "date-fns";
import { nl } from "date-fns/locale";
import { clearTeamChat, notifyTeamChatMessage } from "@/api/functions";
import { base44 } from "@/api/base44Client";

const MESSAGES_PER_PAGE = 20; // Reduced from 50 to 20 for better performance

const getInitials = (name) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const MessageBubble = React.memo(({ message, isCurrentUser, projects }) => {
  const isClient = message.sender_type === 'client';
  const project = projects.find(p => p.id === message.project_id);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = parseISO(timestamp);
      return isValid(date) ? format(date, 'HH:mm', { locale: nl }) : '';
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex items-end gap-3 mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className={`text-white font-semibold text-xs ${
            isClient ? 'bg-blue-600' : 'bg-emerald-600'
          }`}>
            {getInitials(message.sender_name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-xs md:max-w-md lg:max-w-lg ${isCurrentUser ? 'order-1' : ''}`}>
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
              {message.sender_name}
            </span>
            <Badge 
              variant="outline" 
              className={`text-xs px-1.5 py-0.5 ${
                isClient 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {isClient ? (
                <>
                  <UserIcon className="w-3 h-3 mr-1" />
                  Klant
                </>
              ) : (
                <>
                  <Paintbrush2 className="w-3 h-3 mr-1" />
                  Schilder
                </>
              )}
            </Badge>
            {project && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600">
                <Building className="w-3 h-3 mr-1" />
                {project.project_name}
              </Badge>
            )}
          </div>
        )}

        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          isCurrentUser
            ? 'bg-emerald-600 text-white rounded-br-md'
            : isClient 
              ? 'bg-blue-50 text-blue-900 border border-blue-200 rounded-bl-md dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
          
          <div className={`flex items-center justify-end gap-2 text-xs mt-2 ${
            isCurrentUser ? 'text-emerald-200' : 'text-gray-500 dark:text-slate-400'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>

      {isCurrentUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-emerald-600 text-white font-semibold text-xs">
            {getInitials(message.sender_name)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default function TeamChat() {
  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const chatEndRef = useRef(null);
  const chatStartRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const lastMessageIdRef = useRef(null);

  const isAdmin = currentUser?.company_role === 'admin' || currentUser?.role === 'admin';

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Load initial user data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (!user?.company_id) {
          setError('U moet deel uitmaken van een bedrijf om de chat te gebruiken.');
          setIsLoading(false);
          return;
        }

        const projectsData = await Project.filter({ company_id: user.company_id }, '', 500);
        setProjects(projectsData || []);
        
        // Load initial messages
        await loadMessages(user.company_id, 0, true);
      } catch (e) {
        setError('Kon chatgegevens niet laden.');
        console.error(e);
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    };

    loadInitialData();
  }, []);

  // Load messages with pagination
  const loadMessages = useCallback(async (companyId, currentOffset, isInitial = false) => {
    if (!companyId) return;
    
    setIsLoadingMore(!isInitial);
    
    try {
      // Fetch messages with limit and offset
      const [teamMessages, clientMessages] = await Promise.all([
        ChatMessage.filter(
          { company_id: companyId, project_id: null }, 
          '-timestamp', 
          MESSAGES_PER_PAGE,
          currentOffset
        ),
        ChatMessage.filter(
          { company_id: companyId, sender_type: 'client' }, 
          '-timestamp', 
          MESSAGES_PER_PAGE,
          currentOffset
        )
      ]);
      
      const newMessages = [...(teamMessages || []), ...(clientMessages || [])];
      const sortedNewMessages = newMessages.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      if (sortedNewMessages.length < MESSAGES_PER_PAGE) {
        setHasMore(false);
      }

      if (isInitial) {
        setMessages(sortedNewMessages);
        setOffset(MESSAGES_PER_PAGE);
        // Scroll to bottom on initial load after a short delay
        setTimeout(() => scrollToBottom('auto'), 100);
      } else {
        // Prepend older messages
        setMessages(prev => [...sortedNewMessages, ...prev]);
        setOffset(currentOffset + MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [scrollToBottom]);

  // Intersection Observer for lazy loading older messages
  useEffect(() => {
    if (!chatStartRef.current || !currentUser?.company_id || initialLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          console.log('Loading more messages...');
          loadMessages(currentUser.company_id, offset);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observer.observe(chatStartRef.current);

    return () => observer.disconnect();
  }, [currentUser, offset, isLoadingMore, hasMore, loadMessages, initialLoad]);

  // Realtime polling for new messages (only check for newer messages than what we have)
  useEffect(() => {
    if (!currentUser?.company_id || messages.length === 0) return;

    const pollNewMessages = async () => {
      try {
        const latestTimestamp = messages[messages.length - 1]?.timestamp;
        if (!latestTimestamp) return;

        const [newTeamMessages, newClientMessages] = await Promise.all([
          ChatMessage.filter({ 
            company_id: currentUser.company_id, 
            project_id: null 
          }, '-timestamp', 10),
          ChatMessage.filter({ 
            company_id: currentUser.company_id, 
            sender_type: 'client' 
          }, '-timestamp', 10)
        ]);

        const allNewMessages = [...(newTeamMessages || []), ...(newClientMessages || [])];
        const newerMessages = allNewMessages.filter(msg => 
          new Date(msg.timestamp) > new Date(latestTimestamp)
        );

        if (newerMessages.length > 0) {
          const sortedNewMessages = newerMessages.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
          setMessages(prev => [...prev, ...sortedNewMessages]);
          scrollToBottom();
        }
      } catch (error) {
        // Skip rate limit errors (status 429), otherwise log
        if (error.response?.status !== 429) {
          console.error('Error polling new messages:', error);
        }
      }
    };

    const interval = setInterval(pollNewMessages, 15000); 
    return () => clearInterval(interval);
  }, [currentUser, messages, scrollToBottom]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || isSending) return;

    setIsSending(true);
    
    try {
        const messageData = {
            company_id: currentUser.company_id,
            project_id: selectedProject?.id || null, 
            message: newMessage.trim(),
            sender_name: currentUser.full_name || currentUser.email,
            sender_email: currentUser.email,
            sender_type: 'team',
            timestamp: new Date().toISOString()
        };

        const createdMessage = await ChatMessage.create(messageData);
        
        setMessages(prev => [...prev, createdMessage]);
        setNewMessage(''); 
        scrollToBottom(); 

        // Send notification to other team members
        try {
            const teamMembers = await User.filter({ 
                company_id: currentUser.company_id, 
                status: 'active' 
            });
            
            if (teamMembers && teamMembers.length > 0) {
                const recipientEmails = teamMembers
                    .map(u => u.email)
                    .filter(email => email && email.toLowerCase() !== currentUser.email.toLowerCase());
                
                if (recipientEmails.length > 0) {
                    await notifyTeamChatMessage({
                        company_id: currentUser.company_id,
                        sender_name: currentUser.full_name || currentUser.email,
                        message_preview: newMessage.trim(),
                        recipient_emails: recipientEmails,
                        sender_email: currentUser.email
                    });
                }
            }
        } catch (notifError) {
            console.error('Failed to send team chat notification:', notifError);
        }
    } catch (error) {
        console.error("Error sending message:", error);
        setError('Bericht kon niet worden verzonden.');
    } finally {
        setIsSending(false);
        messageInputRef.current?.focus();
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Weet u zeker dat u ALLE chatberichten wilt verwijderen? Dit kan niet ongedaan worden gemaakt!')) {
      return;
    }

    setIsClearing(true);
    try {
      const { data } = await clearTeamChat();
      
      if (data?.success) {
        setMessages([]);
        setOffset(0);
        setHasMore(true);
        alert(`✅ ${data.deletedCount} berichten succesvol verwijderd`);
      } else {
        throw new Error(data?.error || 'Failed to clear chat');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('❌ Fout bij het verwijderen van berichten: ' + error.message);
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner overlay text="Team Chat laden..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 text-center text-red-600 dark:text-red-400">
        <div className="max-w-md">
          <MessageCircle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Fout</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Probeer opnieuw
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 flex-shrink-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-3 py-2 md:px-4 md:py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="truncate">Team Chat</span>
            </h1>
            <p className="hidden sm:block text-sm text-gray-600 dark:text-slate-400 mt-1">
              Communiceer met het hele team en bekijk klantberichten
            </p>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                disabled={isClearing || messages.length === 0}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 h-8 px-2 md:px-3"
              >
                {isClearing ? (
                  <>
                    <InlineSpinner />
                    <span className="hidden md:inline">Verwijderen...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                    <span className="hidden md:inline">Chat Wissen</span>
                  </>
                )}
              </Button>
            )}
            <Button 
              onClick={() => {
                setMessages([]);
                setOffset(0);
                setHasMore(true);
                loadMessages(currentUser.company_id, 0, true);
              }}
              variant="outline" 
              size="sm" 
              disabled={isSending}
              className="h-8 px-2 md:px-3"
            >
              <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${isSending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Vernieuwen</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-3 md:p-4">
          {/* Loading indicator for older messages */}
          <div ref={chatStartRef} className="flex justify-center py-3 md:py-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <InlineSpinner />
                Oudere berichten laden...
              </div>
            )}
            {!hasMore && messages.length > 0 && (
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Begin van het gesprek
              </p>
            )}
          </div>

          {/* Messages */}
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 dark:text-slate-500"
            >
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-200">Nog geen berichten</h3>
              <p className="text-sm">Start een gesprek met het team</p>
            </motion.div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={currentUser && message.sender_email === currentUser.email}
                projects={projects}
              />
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Message Input - Sticky */}
      <div className="sticky bottom-0 z-10 flex-shrink-0 bg-white dark:bg-slate-900 border-t dark:border-slate-700 px-3 py-2 md:px-4 md:py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 relative">
              <Input
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Typ uw bericht..."
                className="pr-4 py-2 md:py-3 text-sm"
                autoComplete="off"
                disabled={isSending}
                maxLength={1000}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500">
                {newMessage.length}/1000
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isSending} 
              className="bg-emerald-600 hover:bg-emerald-700 px-3 md:px-6 h-9 md:h-10"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden sm:inline">Versturen</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}