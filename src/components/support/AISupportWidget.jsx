
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User as UserIcon, Sparkles, MessageCircle, X, Minimize2, RefreshCw } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/components/ui/use-toast';

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;
  
  const parsedResults = (() => {
    if (!results) return null;
    try {
      return typeof results === 'string' ? JSON.parse(results) : results;
    } catch {
      return results;
    }
  })();
  
  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );
  
  const statusConfig = {
    pending: { color: 'text-slate-400', text: 'Pending' },
    running: { color: 'text-blue-500', text: 'Running...', spin: true },
    in_progress: { color: 'text-blue-500', text: 'Running...', spin: true },
    completed: isError ? { color: 'text-red-500', text: 'Failed' } : { color: 'text-green-600', text: 'Success' },
    success: { color: 'text-green-600', text: 'Success' },
    failed: { color: 'text-red-500', text: 'Failed' },
    error: { color: 'text-red-500', text: 'Failed' }
  }[status] || { color: 'text-slate-500', text: '' };
  
  const formattedName = name.split('.').reverse().join(' ').toLowerCase();
  
  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
          expanded ? 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
        }`}
      >
        <Loader2 className={`h-3 w-3 ${statusConfig.color} ${statusConfig.spin ? 'animate-spin' : ''}`} />
        <span className="text-slate-700 dark:text-slate-300 break-words">{formattedName}</span>
        {statusConfig.text && (
          <span className={`${statusConfig.color}`}>• {statusConfig.text}</span>
        )}
      </button>
      
      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Parameters:</div>
              <pre className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words overflow-x-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                  } catch {
                    return toolCall.arguments_string;
                  }
                })()}
              </pre>
            </div>
          )}
          {parsedResults && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Result:</div>
              <pre className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words max-h-48 overflow-auto">
                {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {message.content && (
          <div className={`rounded-2xl px-3 py-2 break-words overflow-hidden ${
            isUser 
              ? 'bg-slate-800 dark:bg-slate-700 text-white' 
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}>
            {isUser ? (
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            ) : (
              <ReactMarkdown 
                className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 break-words"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed break-words">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc break-words">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal break-words">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5 break-words">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-emerald-700 dark:text-emerald-400 break-words">{children}</strong>,
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 text-xs break-all">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg p-3 my-2 text-xs overflow-x-auto break-words">
                        {children}
                      </code>
                    ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        
        {message.tool_calls?.length > 0 && (
          <div className="space-y-1 mt-1 w-full">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="h-7 w-7 rounded-full bg-slate-600 dark:bg-slate-500 flex items-center justify-center flex-shrink-0">
          <UserIcon className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default function AISupportWidget({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewConversation = async () => {
    setIsInitializing(true);
    try {
      const newConversation = await base44.agents.createConversation({
        agent_name: 'paint_agent',
        metadata: {
          name: 'PaintConnect AI',
          user_name: currentUser.full_name,
          user_email: currentUser.email,
          started_at: new Date().toISOString()
        }
      });
      
      setConversation(newConversation);
      localStorage.setItem('ai_support_conversation_id', newConversation.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon chat niet initialiseren.'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const initializeChat = async () => {
    if (!currentUser) return;

    const savedConversationId = localStorage.getItem('ai_support_conversation_id');
    
    if (savedConversationId) {
      try {
        const existingConversation = await base44.agents.getConversation(savedConversationId);
        if (existingConversation) {
          setConversation(existingConversation);
          setMessages(existingConversation.messages || []);
        } else {
          // Conversation not found, clear localStorage and create new one
          console.log('Saved conversation not found, creating new one');
          localStorage.removeItem('ai_support_conversation_id');
          await createNewConversation();
        }
      } catch (error) {
        console.log('Error getting conversation, creating new one:', error);
        localStorage.removeItem('ai_support_conversation_id');
        await createNewConversation();
      }
    } else {
      await createNewConversation();
    }
  };

  useEffect(() => {
    if (isOpen && !conversation && currentUser) {
      initializeChat();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });

    return () => {
      unsubscribe();
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation || isSending) return;

    setIsSending(true);
    try {
      // addMessage retourneert de updated conversation met AI response
      const updatedConversation = await base44.agents.addMessage(conversation, {
        role: 'user',
        content: inputMessage.trim()
      });
      
      // Update conversation en messages state direct met de response
      if (updatedConversation) {
        setConversation(updatedConversation);
        setMessages(updatedConversation.messages || []);
      }
      
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon bericht niet verzenden.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleNewConversation = async () => {
    const confirmed = window.confirm('Weet je zeker dat je een nieuw gesprek wilt starten?');
    if (!confirmed) return;

    localStorage.removeItem('ai_support_conversation_id');
    await createNewConversation();
    toast({
      title: 'Nieuw gesprek gestart',
      description: 'Je kunt nu een nieuwe vraag stellen.'
    });
  };

  const suggestedQuestions = [
    "Hoe maak ik een nieuw project aan?",
    "Hoe vraag ik materialen aan?",
    "Hoe rapporteer ik een beschadiging?",
    "Hoe werkt het klantportaal?",
    "Hoe nodig ik een schilder uit?",
    "Wat zijn de abonnementen?"
  ];

  return (
    <>
      {/* Floating Button - AANGEPAST: Wit randje toegevoegd */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-16 right-6 sm:bottom-6 z-40"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white"
              size="icon"
            >
              <Bot className="h-7 w-7 text-white" />
            </Button>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-16 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-40 sm:w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ 
              height: 'calc(100vh - 180px)',
              maxHeight: '600px'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <span>PaintConnect</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded-md text-xs font-medium">AI</span>
                  </h3>
                  <p className="text-emerald-100 text-xs">Altijd beschikbaar</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  className="text-white hover:bg-white/20 h-8 w-8"
                  title="Nieuw gesprek"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 min-h-0">
              {isInitializing ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size="default" />
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {/* Welcome Message */}
                    {messages.length === 0 && (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-3">
                          <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          Hallo! 👋
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Ik help je graag met PaintConnect
                        </p>
                        
                        {/* Suggested Questions */}
                        <div className="space-y-2 mt-4">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Probeer bijvoorbeeld:
                          </p>
                          {suggestedQuestions.slice(0, 3).map((question, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInputMessage(question)}
                              className="w-full text-left text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                            >
                              <MessageCircle className="w-3 h-3 inline mr-1 text-emerald-600 dark:text-emerald-400" />
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((message, idx) => (
                      <MessageBubble key={`${conversation?.id}-${idx}`} message={message} />
                    ))}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Stel je vraag..."
                  disabled={isSending || isInitializing}
                  className="flex-1 text-sm min-w-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending || isInitializing}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                  size="icon"
                >
                  {isSending ? (
                    <InlineSpinner />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-center">
                AI kan je helpen met vragen over PaintConnect
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
