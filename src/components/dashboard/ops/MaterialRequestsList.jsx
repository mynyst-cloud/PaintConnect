import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Package } from 'lucide-react';
import { MaterialRequest } from '@/api/entities';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function MaterialRequestsList({ requests, onUpdate }) {
    const [processingId, setProcessingId] = useState(null);

    const handleApproval = async (requestId, newStatus) => {
        setProcessingId(requestId);
        try {
            await MaterialRequest.update(requestId, { status: newStatus });
            onUpdate();
        } catch (error) {
            console.error("Fout bij bijwerken aanvraag:", error);
        } finally {
            setProcessingId(null);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-blue-500"/>Materiaal Aanvragen</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {requests && requests.length > 0 ? requests.slice(0, 5).map(req => (
                        <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800">
                            <div>
                                <p className="font-semibold text-sm">{req.material_name} <span className="font-normal text-gray-600">({req.quantity} {req.unit})</span></p>
                                <p className="text-xs text-gray-500">{req.requested_by} &bull; {formatDistanceToNow(parseISO(req.created_date), { locale: nl, addSuffix: true })}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="icon" variant="outline" className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100" onClick={() => handleApproval(req.id, 'afgewezen')} disabled={processingId === req.id}>
                                    <X className="w-4 h-4"/>
                                </Button>
                                <Button size="icon" variant="outline" className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100" onClick={() => handleApproval(req.id, 'goedgekeurd')} disabled={processingId === req.id}>
                                    <Check className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-gray-500">
                            Geen openstaande materiaalaanvragen.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}