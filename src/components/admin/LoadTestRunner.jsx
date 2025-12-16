import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export default function LoadTestRunner() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Load Testing
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600 dark:text-slate-400">
                    Deze module voor het uitvoeren van load tests is in ontwikkeling en binnenkort beschikbaar.
                </p>
            </CardContent>
        </Card>
    );
}