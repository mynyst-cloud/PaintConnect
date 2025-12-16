import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
// import { InvokeLLM } from '@/api/integrations'; // VERWIJDERD – Base44 afhankelijkheid
import { User } from '@/api/entities';

export default function SupportChatModal({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await User.me();
        setCurrentUser(user);
        setMessages([{
          sender: 'bot',
          text: `Hallo ${user.full_name.split(' ')[0] || 'daar'}, welkom bij de Enterprise Support.\n\nDe AI-chat is tijdelijk niet beschikbaar tijdens de migratie naar onze nieuwe backend.\n\nStuur uw vraag naar support@paintconnect.be of maak een ticket aan via de knop "Neem Contact Op" in de Help-sectie. We helpen u graag verder!`
        }]);
      } catch (error) {
        console.error("Kon gebruiker niet laden voor support chat", error);
        setMessages([{
          sender: 'bot',
          text: `Hallo, welkom bij de Enterprise Support.\n\nDe AI-chat is tijdelijk niet beschikbaar tijdens de migratie naar onze nieuwe backend.\n\nStuur uw vraag naar support@paintconnect.be of maak een ticket aan via de knop "Neem Contact Op" in de Help-sectie. We helpen u graag verder!`
        }]);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Tijdelijke reactie – AI is uitgeschakeld
    setTimeout(() => {
      const botMessage = {
        sender: 'bot',
        text: "Bedankt voor uw bericht!\n\nDe AI-support is momenteel in onderhoud tijdens de overstap naar onze nieuwe infrastructuur.\n\nOns team neemt zo snel mogelijk contact met u op via e-mail. U kunt ook een ticket aanmaken via de contactformulier in de Help-sectie."
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-end justify-end p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-md h-[70vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
              <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Enterprise Support</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">AI-ondersteunde hulp (tijdelijk offline)</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </header>

        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-slate-700 rounded-bl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="max-w-xs px-4 py-3 rounded-2xl bg-gray-100 dark:bg-slate-700 rounded-bl-none">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-4 border-t dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Typ uw vraag..."
              className="flex-grow resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || input.trim() === ''}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}