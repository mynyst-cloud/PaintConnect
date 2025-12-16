import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, MapPin, Briefcase } from 'lucide-react';

const severityColors = {
  laag: "bg-blue-100 text-blue-800",
  gemiddeld: "bg-yellow-100 text-yellow-800",
  hoog: "bg-orange-100 text-orange-800",
  kritiek: "bg-red-100 text-red-800"
};

const statusColors = {
    gemeld: "bg-gray-100 text-gray-800",
    in_behandeling: "bg-blue-100 text-blue-800",
    opgelost: "bg-green-100 text-green-800",
    geaccepteerd: "bg-purple-100 text-purple-800"
};

export default function DefectListItem({ defect, project, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          {defect.photo_urls && defect.photo_urls[0] && (
            <img src={defect.photo_urls[0]} alt={defect.title} className="w-full md:w-24 h-24 object-cover rounded-lg" />
          )}
          <div className="flex-1 w-full">
            <h4 className="font-bold text-lg text-gray-900">{defect.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-1">{defect.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              {project && (
                <div className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" /><span>{project.project_name}</span></div>
              )}
              {defect.location && (
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /><span>{defect.location}</span></div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Badge className={`${severityColors[defect.severity]} border-0 font-medium capitalize w-24 text-center justify-center`}>
              {defect.severity}
            </Badge>
            <Badge className={`${statusColors[defect.status]} border-0 font-medium capitalize w-24 text-center justify-center`}>
              {defect.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex-shrink-0">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4 mr-2" /> Acties
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(defect)}><Edit className="w-4 h-4 mr-2" /> Bewerken</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(defect.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Verwijderen</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}