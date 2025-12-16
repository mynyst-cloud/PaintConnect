import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, MapPin } from 'lucide-react';

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

export default function DefectCard({ defect, projects, onEdit, onDelete }) {
  const project = projects.find(p => p.id === defect.project_id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="h-full"
    >
      <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
        {defect.photo_urls && defect.photo_urls[0] && (
            <img src={defect.photo_urls[0]} alt={defect.title} className="w-full h-40 object-cover rounded-t-lg" />
        )}
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-md font-bold flex-1 pr-2">{defect.title}</CardTitle>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(defect)}><Edit className="w-4 h-4 mr-2" /> Bewerken</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(defect.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Verwijderen</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
           {project && <p className="text-xs text-gray-500">{project.project_name}</p>}
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
            <div>
                <p className="text-sm text-gray-600 mb-3">{defect.description}</p>
                {defect.location && <div className="flex items-center gap-1 text-xs text-gray-500 mb-3"><MapPin className="w-3 h-3"/>{defect.location}</div>}
            </div>
            <div className="flex justify-between items-center mt-2">
                <Badge className={`${severityColors[defect.severity]} border-0 font-medium`}>{defect.severity}</Badge>
                <Badge variant="outline" className={`${statusColors[defect.status]} capitalize`}>{defect.status.replace('_', ' ')}</Badge>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}