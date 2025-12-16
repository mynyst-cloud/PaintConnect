import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

const placeholderLogo = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/39a5a0d42_Colorlogo-nobackground.png';

const statusStyles = {
  niet_gestart: 'bg-gray-100 text-gray-800 border-gray-200',
  in_uitvoering: 'bg-blue-100 text-blue-800 border-blue-200',
  bijna_klaar: 'bg-orange-100 text-orange-800 border-orange-200',
  afgerond: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels = {
  niet_gestart: 'Niet gestart',
  in_uitvoering: 'In uitvoering',
  bijna_klaar: 'Bijna klaar',
  afgerond: 'Afgerond',
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