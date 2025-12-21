import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

const placeholderLogo = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/39a5a0d42_Colorlogo-nobackground.png';

const statusStyles = {
  nieuw: 'bg-gray-100 text-gray-800 border-gray-200',
  planning: 'bg-blue-100 text-blue-800 border-blue-200',
  in_uitvoering: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  afgerond: 'bg-green-100 text-green-800 border-green-200',
  on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  geannuleerd: 'bg-red-100 text-red-800 border-red-200',
  offerte: 'bg-purple-100 text-purple-800 border-purple-200',
  // Backwards compatibility
  niet_gestart: 'bg-gray-100 text-gray-800 border-gray-200',
  bijna_klaar: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusLabels = {
  nieuw: 'Nieuw',
  planning: 'Planning',
  in_uitvoering: 'In uitvoering',
  afgerond: 'Afgerond',
  on_hold: 'On Hold',
  geannuleerd: 'Geannuleerd',
  offerte: 'Offerte',
  // Backwards compatibility
  niet_gestart: 'Nieuw',
  bijna_klaar: 'Planning',
};

export default function DetailHeader({ project }) {
    if (!project) return null;

    const coverImage = project.cover_photo_url || project.thumbnail_url || (project.photo_urls && project.photo_urls[0]) || placeholderLogo;
    const hasRealImage = !!(project.cover_photo_url || project.thumbnail_url || (project.photo_urls && project.photo_urls[0]));

    return (
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-slate-200">
            <img 
                src={coverImage}
                alt={project.project_name} 
                className={`w-full h-full ${hasRealImage ? 'object-cover' : 'object-contain p-8'}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white">
                <Badge className={`${statusStyles[project.status]} mb-2`}>
                    {statusLabels[project.status]}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold">{project.project_name}</h1>
                <div className="flex items-center gap-2 mt-1 text-sm opacity-90">
                    <MapPin className="w-4 h-4" />
                    <span>{project.address}</span>
                </div>
            </div>
        </div>
    );
}