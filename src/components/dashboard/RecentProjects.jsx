
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { MapPin, User, Calendar, ArrowRight, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  // Nieuwe geldige statussen
  nieuw: "bg-gray-100 text-gray-800",
  planning: "bg-blue-100 text-blue-800",
  in_uitvoering: "bg-emerald-100 text-emerald-800",
  afgerond: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  geannuleerd: "bg-red-100 text-red-800",
  offerte: "bg-purple-100 text-purple-800",
  // Backwards compatibility
  niet_gestart: "bg-gray-100 text-gray-800",
  bijna_klaar: "bg-blue-100 text-blue-800"
};

const statusLabels = {
  // Nieuwe geldige statussen
  nieuw: "Nieuw",
  planning: "Planning",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  on_hold: "On Hold",
  geannuleerd: "Geannuleerd",
  offerte: "Offerte",
  // Backwards compatibility
  niet_gestart: "Nieuw",
  bijna_klaar: "Planning"
};

export default function RecentProjects({ projects, isLoading }) {
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recente Projecten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-900">Recente Projecten</CardTitle>
          <Link to={createPageUrl("Projecten")}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              Alle projecten <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.slice(0, 4).map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-200 bg-gray-50/50"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{project.project_name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {project.client_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {project.address}
                  </div>
                </div>
              </div>
              <Badge className={`${statusColors[project.status]} border-0 font-medium`}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Voortgang</span>
                <span className="font-medium text-gray-900">{project.progress_percentage}%</span>
              </div>
              <Progress 
                value={project.progress_percentage} 
                className="h-2"
              />
            </div>
            
            {project.assigned_painter && (
              <div className="flex items-center gap-1 mt-3 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Schilder: {project.assigned_painter}</span>
              </div>
            )}
          </motion.div>
        ))}
        
        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nog geen projecten aangemaakt</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
