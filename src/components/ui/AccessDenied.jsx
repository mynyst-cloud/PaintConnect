import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';

export default function AccessDenied({ message }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-gray-50 dark:bg-slate-900">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="w-12 h-12 text-red-500" />
            <span className="text-2xl">Toegang Geweigerd</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            {message || "U heeft niet de juiste permissies om deze pagina te bekijken."}
          </p>
          <Button asChild>
            <Link to={createPageUrl('Dashboard')}>
              Terug naar Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}