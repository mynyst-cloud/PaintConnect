import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const priorityColors = {
  laag: "bg-blue-100 text-blue-800",
  normaal: "bg-gray-100 text-gray-800",
  hoog: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function PendingRequests({ requests, isLoading }) {
  const pendingRequests = requests.filter(r => r.status === "aangevraagd");

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Openstaande Aanvragen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-3 border rounded-lg space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
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
          <CardTitle className="text-lg font-bold text-gray-900">Openstaande Aanvragen</CardTitle>
          <Link to={createPageUrl("Materialen")}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.slice(0, 5).map((request) => (
          <div
            key={request.id}
            className="p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50/30"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">{request.material_name}</h4>
              <Badge className={`${priorityColors[request.priority]} text-xs border-0`}>
                {request.priority}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{request.quantity} {request.unit}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="text-xs">Aangevraagd</span>
              </div>
            </div>
          </div>
        ))}
        
        {pendingRequests.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Geen openstaande aanvragen</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}