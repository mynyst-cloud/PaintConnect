import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PaintBucket, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function MaterialenTab({ materialRequests, materialUsages, materialsList }) {
    const getMaterialName = (materialId) => {
        const material = materialsList?.find(m => m.id === materialId);
        return material?.name || materialId;
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <List className="w-5 h-5" />
                        Materiaalaanvragen
                    </CardTitle>
                    <CardDescription>Overzicht van aangevraagde materialen.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(!materialRequests || materialRequests.length === 0) ? (
                        <p className="text-gray-500">Geen materiaalaanvragen.</p>
                    ) : (
                        <div className="space-y-3">
                            {materialRequests.map(req => (
                                <div key={req.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{req.material_name} ({req.quantity} {req.unit})</p>
                                        <p className="text-sm text-gray-500">Aangevraagd door {req.requested_by} op {format(new Date(req.created_date), 'd MMM yyyy', { locale: nl })}</p>
                                    </div>
                                    <Badge>{req.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PaintBucket className="w-5 h-5" />
                        Materiaalverbruik
                    </CardTitle>
                    <CardDescription>Overzicht van gebruikte materialen.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(!materialUsages || materialUsages.length === 0) ? (
                        <p className="text-gray-500">Geen materiaalverbruik geregistreerd.</p>
                    ) : (
                        <div className="space-y-3">
                            {materialUsages.map(usage => (
                                <div key={usage.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{getMaterialName(usage.material_id)} ({usage.quantity})</p>
                                        <p className="text-sm text-gray-500">Gebruikt op {format(new Date(usage.date_used), 'd MMM yyyy', { locale: nl })}</p>
                                    </div>
                                     <p className="text-sm font-semibold">€{usage.cost_total?.toFixed(2) || '0.00'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}