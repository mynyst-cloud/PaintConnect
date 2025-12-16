import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { formatCurrency } from '@/components/utils';

export default function MaterialUsageList({ materialUsages, materialsList, assignedPainters }) {
    if (!materialUsages || materialUsages.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Materiaalverbruik</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center py-8 text-gray-500">Nog geen materialen gebruikt voor dit project.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Materiaalverbruik</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Materiaal</TableHead>
                                <TableHead>Schilder</TableHead>
                                <TableHead>Aantal</TableHead>
                                <TableHead>Datum</TableHead>
                                <TableHead className="text-right">Totaal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materialUsages.map((usage) => {
                                const material = (materialsList || []).find(m => m.id === usage.material_id);
                                const painter = (assignedPainters || []).find(p => p.id === usage.painter_id);
                                return (
                                    <TableRow key={usage.id}>
                                        <TableCell>
                                            <div className="font-medium">{material?.name || 'Onbekend'}</div>
                                            <div className="text-xs text-gray-500">{material?.category}</div>
                                        </TableCell>
                                        <TableCell>{painter?.full_name || 'Onbekend'}</TableCell>
                                        <TableCell>{usage.quantity} {material?.unit}</TableCell>
                                        <TableCell>{format(parseISO(usage.date_used), 'dd-MM-yyyy')}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(usage.cost_total || 0)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}