import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const severityColors = {
  laag: "bg-blue-100 text-blue-800",
  gemiddeld: "bg-yellow-100 text-yellow-800",
  hoog: "bg-orange-100 text-orange-800",
  kritiek: "bg-red-100 text-red-800"
};

export default function DefectAlerts({ defects, isLoading }) {
  const openDefects = defects.filter(d => d.status === "gemeld");

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Defect Meldingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-3 border rounded-lg space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
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
          <CardTitle className="text-lg font-bold text-gray-900">Defect Meldingen</CardTitle>
          <Link to={createPageUrl("Defecten")}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {openDefects.slice(0, 5).map((defect) => (
          <div
            key={defect.id}
            className="p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50/30"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{defect.title}</h4>
              <Badge className={`${severityColors[defect.severity]} text-xs border-0`}>
                {defect.severity}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{defect.description}</p>
            {defect.location && (
              <p className="text-xs text-gray-500 mt-1">📍 {defect.location}</p>
            )}
          </div>
        ))}
        
        {openDefects.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Geen open defecten</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}