import React from 'react';
import { Button } from '@/components/ui/button';
import { List, Grid } from 'lucide-react';

export default function ViewSwitcher({ viewMode, setViewMode }) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => setViewMode('list')}
        aria-label="Lijstweergave"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => setViewMode('grid')}
        aria-label="Rasterweergave"
      >
        <Grid className="h-4 w-4" />
      </Button>
    </div>
  );
}