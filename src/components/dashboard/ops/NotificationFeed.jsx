import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Briefcase, Package, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function NotificationFeed({ damages, requests, updates }) {
    const activityItems = useMemo(() => {
        const combined = [
            ...(damages || []).map(d => ({ ...d, type: 'damage' })),
            ...(requests || []).map(r => ({ ...r, type: 'request' })),
            ...(updates || []).map(u => ({ ...u, type: 'update' })),
        ];
        return combined.sort((a, b) => parseISO(b.created_date) - parseISO(a.created_date));
    }, [damages, requests, updates]);

    const renderItem = (item) => {
        const timeAgo = formatDistanceToNow(parseISO(item.created_date), { locale: nl, addSuffix: true });
        switch (item.type) {
            case 'damage':
                return (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex-shrink-0 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-600"/></div>
                        <div>
                            <p className="text-sm">Nieuwe schade: <span className="font-semibold">{item.title}</span></p>
                            <p className="text-xs text-gray-500">{item.reported_by} &bull; {timeAgo}</p>
                        </div>
                    </div>
                );
            case 'request':
                return (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center"><Package className="w-4 h-4 text-blue-600"/></div>
                         <div>
                            <p className="text-sm">Nieuwe aanvraag: <span className="font-semibold">{item.material_name}</span></p>
                            <p className="text-xs text-gray-500">{item.requested_by} &bull; {timeAgo}</p>
                        </div>
                    </div>
                );
            case 'update':
                 return (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex-shrink-0 flex items-center justify-center"><Briefcase className="w-4 h-4 text-green-600"/></div>
                         <div>
                            <p className="text-sm">Project update door <span className="font-semibold">{item.painter_name}</span></p>
                            <p className="text-xs text-gray-500">{timeAgo}</p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5"/>Notificatie Feed</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                    {activityItems.slice(0, 15).map(item => (
                        <div key={`${item.type}-${item.id}`}>{renderItem(item)}</div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}