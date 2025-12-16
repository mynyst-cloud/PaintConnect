import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Check, Loader2 } from 'lucide-react';
import { sendClientInvitation } from '@/api/functions';

export default function ClientInvitationButton({ project }) {
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    const handleSendInvitation = async () => {
        if (!project.client_email) {
            alert('Geen klant e-mailadres beschikbaar voor dit project.');
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const { data } = await sendClientInvitation({
                project_id: project.id,
                client_email: project.client_email,
                client_name: project.client_name
            });

            if (data.success) {
                setSent(true);
                setTimeout(() => setSent(false), 3000);
            } else {
                setError('Fout bij versturen uitnodiging');
            }
        } catch (err) {
            console.error('Error sending invitation:', err);
            setError('Fout bij versturen uitnodiging');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleSendInvitation}
                disabled={isSending || sent || !project.client_email}
                className={sent ? 'bg-green-50 border-green-200' : ''}
            >
                {isSending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Versturen...
                    </>
                ) : sent ? (
                    <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Verstuurd!
                    </>
                ) : (
                    <>
                        <Mail className="w-4 h-4 mr-2" />
                        Uitnodiging versturen
                    </>
                )}
            </Button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}