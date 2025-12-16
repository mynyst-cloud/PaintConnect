import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase, Package, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';

export default function QuickActions() {
    return (
        <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
                <Link to={createPageUrl('Projecten')}>
                    <Plus className="w-4 h-4 mr-2"/> Project
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link to={createPageUrl('Materialen')}>
                    <Plus className="w-4 h-4 mr-2"/> Materiaal
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link to={createPageUrl('Beschadigingen')}>
                    <Plus className="w-4 h-4 mr-2"/> Beschadiging
                </Link>
            </Button>
        </div>
    );
}