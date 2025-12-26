import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User as UserIcon, Sparkles, MessageCircle, Trash2, RefreshCw } from 'lucide-react';
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
        <span className="text-slate-700 dark:text-slate-300">{formattedName}</span>
        {statusConfig.text && (
          <span className={`${statusConfig.color}`}>• {statusConfig.text}</span>
        )}
      </button>
      
      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-2">
          {toolCall.arguments_string && (
            <div>
              <div className="text-xs text-slate-500 mb-1">Parameters:</div>
              <pre className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
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
              <pre className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-auto">
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
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 ${
            isUser 
              ? 'bg-slate-800 dark:bg-slate-700 text-white' 
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown 
                className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-emerald-700 dark:text-emerald-400">{children}</strong>,
                  code: ({ inline, children }) => 
                    inline ? (
                      <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 text-xs">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg p-3 my-2 text-xs overflow-x-auto">
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
          <div className="space-y-1 mt-1">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-slate-600 dark:bg-slate-500 flex items-center justify-center flex-shrink-0">
          <UserIcon className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default function AISupportChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Check if user has an existing conversation in localStorage
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
              await createNewConversation(user);
            }
          } catch (error) {
            console.log('Error getting conversation, creating new one:', error);
            localStorage.removeItem('ai_support_conversation_id');
            await createNewConversation(user);
          }
        } else {
          await createNewConversation(user);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: 'Kon de chat niet initialiseren.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [toast]);

  const createNewConversation = async (user) => {
    const newConversation = await base44.agents.createConversation({
      agent_name: 'paint_agent',
      metadata: {
        name: 'PaintConnect AI',
        user_name: user.full_name,
        user_email: user.email,
        started_at: new Date().toISOString()
      }
    });
    
    setConversation(newConversation);
    localStorage.setItem('ai_support_conversation_id', newConversation.id);
    setMessages([]);
  };

  const handleNewConversation = async () => {
    if (!currentUser) return;
    
    const confirmed = window.confirm('Weet je zeker dat je een nieuw gesprek wilt starten? De huidige chat wordt gewist.');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      localStorage.removeItem('ai_support_conversation_id');
      await createNewConversation(currentUser);
      toast({
        title: 'Nieuw gesprek gestart',
        description: 'Je kunt nu een nieuwe vraag stellen.'
      });
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon geen nieuw gesprek starten.'
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const suggestedQuestions = [
    "Hoe maak ik een nieuw project aan?",
    "Hoe vraag ik materialen aan voor een project?",
    "Hoe kan ik een beschadiging rapporteren?",
    "Wat is het verschil tussen de verschillende abonnementen?",
    "Hoe nodig ik een nieuwe schilder uit?",
    "Hoe werkt het klantportaal?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <span>PaintConnect</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-md text-sm font-medium">AI</span>
                </h1>
                <p className="text-emerald-100 text-sm">Stel je vraag over PaintConnect</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Nieuw gesprek
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col p-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Hallo {currentUser?.full_name?.split(' ')[0] || 'daar'}! 👋
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Ik ben je AI Support Assistent. Stel me gerust vragen over PaintConnect!
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="max-w-2xl mx-auto">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Populaire vragen:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {suggestedQuestions.map((question, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestedQuestion(question)}
                          className="text-left justify-start h-auto py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                        >
                          <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              <AnimatePresence>
                {messages.map((message, idx) => (
                  <motion.div
                    key={`${conversation?.id}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <MessageBubble message={message} />
                  </motion.div>
                ))}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="pt-4 border-t dark:border-gray-700">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Typ je vraag..."
                disabled={isSending}
                className="flex-1 bg-white dark:bg-gray-800"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                {isSending ? (
                  <InlineSpinner />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              De AI kan informatie opzoeken in je projecten, materialen en meer om je te helpen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}