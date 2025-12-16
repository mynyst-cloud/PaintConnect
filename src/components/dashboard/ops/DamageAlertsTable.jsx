import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wrench, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Damage } from '@/api/entities';

export default function DamageAlertsTable({ damages, projects, onUpdate }) {
    const [processingId, setProcessingId] = useState(null);

    const handleStatusChange = async (damageId, newStatus) => {
        setProcessingId(damageId);
        try {
            await Damage.update(damageId, { status: newStatus });
            onUpdate(); // Refresh parent data
        } catch (error) {
            console.error("Kon status niet updaten:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const getProjectName = (projectId) => projects.find(p => p.id === projectId)?.project_name || 'Onbekend';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/>Nieuwe Beschadigingen</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead>Melder</TableHead>
                                <TableHead>Actie</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {damages && damages.length > 0 ? damages.slice(0, 5).map(damage => (
                                <TableRow key={damage.id}>
                                    <TableCell>
                                        <p className="font-medium truncate" title={damage.title}>{damage.title}</p>
                                        <p className="text-xs text-gray-500">{getProjectName(damage.project_id)}</p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{damage.reported_by}</p>
                                        <p className="text-xs text-gray-500">{formatDistanceToNow(parseISO(damage.created_date), { locale: nl, addSuffix: true })}</p>
                                    </TableCell>
                                    <TableCell>
                                        {damage.status === 'gemeld' && (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleStatusChange(damage.id, 'in_behandeling')}
                                                disabled={processingId === damage.id}
                                            >
                                                <Wrench className="w-3 h-3 mr-1"/> Start Behandeling
                                            </Button>
                                        )}
                                        {damage.status === 'in_behandeling' && (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleStatusChange(damage.id, 'opgelost')}
                                                disabled={processingId === damage.id}
                                            >
                                                <CheckCircle2 className="w-3 h-3 mr-1 text-green-500"/> Markeer als Opgelost
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-gray-500">
                                        Perfect! Geen openstaande beschadigingen.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}