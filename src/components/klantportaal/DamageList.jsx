import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Shield, MapPin, Calendar, Camera } from 'lucide-react';

const severityColors = {
    laag: 'bg-green-100 text-green-800',
    gemiddeld: 'bg-yellow-100 text-yellow-800',
    hoog: 'bg-orange-100 text-orange-800',
    kritiek: 'bg-red-100 text-red-800',
};

const statusColors = {
    gemeld: 'bg-blue-100 text-blue-800',
    in_behandeling: 'bg-purple-100 text-purple-800',
    opgelost: 'bg-green-100 text-green-800',
    geaccepteerd: 'bg-gray-100 text-gray-800'
};

export default function DamageList({ damages }) {
    if (!damages || damages.length === 0) {
        return (
             <Card className="text-center py-12">
                <CardContent>
                    <Shield className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Geen beschadigingen gemeld</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Er zijn geen beschadigingen voor dit project gedeeld.
                    </p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            {damages.map(damage => (
                 <Card key={damage.id} className="shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="border-b pb-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                             <CardTitle className="text-lg">{damage.title}</CardTitle>
                             <Badge className={statusColors[damage.status]}>{damage.status.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                             <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4"/>
                                <span>Gemeld op {format(parseISO(damage.created_date), 'd MMM yyyy', { locale: nl })}</span>
                            </div>
                             <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4"/>
                                <span>{damage.location}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="md:grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <p className="font-semibold text-gray-800 mb-2">Beschrijving</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{damage.description}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 mb-2">Ernst</p>
                                <Badge className={severityColors[damage.severity]}>{damage.severity}</Badge>
                            </div>
                        </div>
                        
                         {damage.photo_urls && damage.photo_urls.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-purple-500" />
                                    Foto's
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {damage.photo_urls.map((url, index) => (
                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={url}
                                                alt={`Beschadiging foto ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}