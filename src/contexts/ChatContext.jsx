import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, User } from '@/api/entities';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [showTeamChatSidebar, setShowTeamChatSidebar] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const previousUnreadCount = useRef(0);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user for chat:', error);
      }
    };
    loadUser();
  }, []);

  const loadUnreadMessages = useCallback(async () => {
    if (!currentUser?.company_id) return;
    
    try {
      const lastViewed = sessionStorage.getItem('teamchat_last_viewed');
      const companyId = currentUser.current_company_id || currentUser.company_id;
      
      const messages = await ChatMessage.filter(
        { company_id: companyId },
        '-timestamp',
        50
      );
      
      if (lastViewed && messages) {
        const lastViewedDate = new Date(lastViewed);
        const unread = messages.filter(m => {
          const msgDate = new Date(m.timestamp || m.created_date);
          return msgDate > lastViewedDate && m.sender_email !== currentUser.email;
        });
        setUnreadMessages(unread.length);
      } else if (messages) {
        // Als er nog nooit gekeken is, alleen recente berichten van anderen
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const unread = messages.filter(m => {
          const msgDate = new Date(m.timestamp || m.created_date);
          return msgDate > oneDayAgo && m.sender_email !== currentUser.email;
        });
        setUnreadMessages(unread.length);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadUnreadMessages();
      const interval = setInterval(loadUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, loadUnreadMessages]);

  const openTeamChat = useCallback(() => {
    sessionStorage.setItem('teamchat_last_viewed', new Date().toISOString());
    setUnreadMessages(0);
    setShowTeamChatSidebar(true);
  }, []);

  const closeTeamChat = useCallback(() => {
    setShowTeamChatSidebar(false);
  }, []);

  return (
    <ChatContext.Provider value={{
      showTeamChatSidebar,
      unreadMessages,
      openTeamChat,
      closeTeamChat,
      loadUnreadMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    // Return default values if not in provider
    return {
      showTeamChatSidebar: false,
      unreadMessages: 0,
      openTeamChat: () => {},
      closeTeamChat: () => {},
      loadUnreadMessages: () => {}
    };
  }
  return context;
}




