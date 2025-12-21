import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { ChatMessage } from '@/api/entities';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function ProjectChat({ project, clientInfo }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const loadMessages = useCallback(async () => {
        try {
            const chatMessages = await ChatMessage.filter(
                { project_id: project.id },
                '-timestamp',
                50
            );
            setMessages(chatMessages || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [project.id]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !clientInfo) return;

        setIsSending(true);
        try {
            const messageData = {
                company_id: project.company_id,
                project_id: project.id,
                message: `[KLANT VRAAG - ${project.project_name}] ${newMessage}`,
                sender_name: clientInfo.name || clientInfo.email,
                sender_email: clientInfo.email,
                sender_type: 'client',
                timestamp: new Date().toISOString()
            };

            await ChatMessage.create(messageData);

            // 7. **Nieuw bericht van klant** - Notificatie naar team/admins
            try {
                // Get the backend SDK to send notifications
                const response = await fetch('https://base44.app/api/apps/688ddf9fafec117afa44cb01/functions/notifyTeamOfClientMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_id: project.company_id,
                        project_id: project.id,
                        project_name: project.project_name,
                        client_name: clientInfo.name || clientInfo.email,
                        message_preview: newMessage.substring(0, 100) + (newMessage.length > 100 ? '...' : '')
                    })
                });
            } catch (notifError) {
                console.error('Failed to send client message notification:', notifError);
            }

            setNewMessage('');
            await loadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Kon bericht niet versturen. Probeer het opnieuw.');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Chat met Schildersteam
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <LoadingSpinner size="sm" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Filter messages for this project and show client questions & team answers
    const projectMessages = messages.filter(msg => 
        msg.message?.includes(`[KLANT VRAAG - ${project.project_name}]`) ||
        msg.message?.includes(`[ANTWOORD VOOR ${clientInfo?.name || clientInfo?.email} IN ${project.project_name}]`)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Chat met Schildersteam
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                    Stel vragen of deel opmerkingen over uw project
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                    {projectMessages.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-slate-400 py-8">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nog geen berichten. Begin een gesprek!</p>
                        </div>
                    ) : (
                        projectMessages.reverse().map((message) => {
                            const isFromClient = message.sender_type === 'client';
                            const isClientQuestion = message.message?.includes('[KLANT VRAAG');
                            const isTeamAnswer = message.message?.includes('[ANTWOORD VOOR');
                            
                            let cleanMessage = message.message || '';
                            if (isClientQuestion) {
                                cleanMessage = cleanMessage.replace(/\[KLANT VRAAG - .*?\]\s*/, '');
                            } else if (isTeamAnswer) {
                                cleanMessage = cleanMessage.replace(/\[ANTWOORD VOOR .*? IN .*?\]\s*/, '');
                            }

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isFromClient ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                        isFromClient 
                                            ? 'bg-emerald-600 text-white' 
                                            : 'bg-white dark:bg-slate-700 border'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-3 h-3" />
                                            <span className="text-xs font-medium">
                                                {isFromClient ? 'U' : 'Schildersteam'}
                                            </span>
                                        </div>
                                        <p className="text-sm">{cleanMessage}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3 opacity-70" />
                                            <span className="text-xs opacity-70">
                                                {formatDistanceToNow(parseISO(message.timestamp), { locale: nl, addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Typ uw bericht..."
                        disabled={isSending || !clientInfo}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={isSending || !newMessage.trim() || !clientInfo}>
                        {isSending ? (
                            <InlineSpinner />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </form>

                <p className="text-xs text-gray-500 dark:text-slate-400">
                    Uw berichten worden direct naar het schildersteam gestuurd.
                </p>
            </CardContent>
        </Card>
    );
}