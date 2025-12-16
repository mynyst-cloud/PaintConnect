import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { startOfWeek, parseISO } from 'date-fns';

export default function TeamHoursSummary({ users, updates }) {
    const weeklyHours = React.useMemo(() => {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const hoursMap = new Map();

        updates.forEach(update => {
            if (parseISO(update.created_date) >= weekStart) {
                const currentHours = hoursMap.get(update.painter_email) || 0;
                hoursMap.set(update.painter_email, currentHours + (update.hours_worked || 0));
            }
        });
        return hoursMap;
    }, [updates]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-purple-500"/>Team & Uren (Deze Week)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {users.filter(u => u.is_painter).map(user => (
                        <div key={user.id} className="p-3 text-center bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <Avatar className="mx-auto mb-2">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm truncate">{user.full_name}</p>
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                               <Clock className="w-3 h-3"/> {Math.round(weeklyHours.get(user.email) || 0)} uur
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}