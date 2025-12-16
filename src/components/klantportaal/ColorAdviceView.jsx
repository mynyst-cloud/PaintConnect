import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, CheckCircle, PaintBucket, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ColorAdviceView({ advices }) {
    if (!advices || advices.length === 0) {
        return (
             <Card className="text-center py-12">
                <CardContent>
                    <Palette className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Geen kleuradvies beschikbaar</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Zodra er kleuradvies is, verschijnt het hier.
                    </p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="shadow-lg bg-white/80 backdrop-blur-sm">
             <CardHeader className="flex flex-row justify-between items-center">
                 <CardTitle className="flex items-center gap-3">
                     <Palette className="w-6 h-6 text-purple-600"/>
                     Kleuradvies Overzicht
                 </CardTitle>
                 <Button variant="outline" disabled>
                     <Download className="w-4 h-4 mr-2" />
                     Download als PDF
                 </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {advices.map(advice => (
                        <div key={advice.id} className="p-4 border rounded-lg">
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-3">
                                <h4 className="text-lg font-semibold text-gray-800">{advice.room_name}</h4>
                                {advice.client_approved && (
                                    <Badge className="bg-green-100 text-green-800 self-start mt-2 md:mt-0">
                                        <CheckCircle className="w-4 h-4 mr-2"/>
                                        Goedgekeurd door klant
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-20 h-20 rounded-md border-2" 
                                    style={{ backgroundColor: advice.color_hex }}
                                />
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                    <span className="text-gray-500">Kleurcode:</span>
                                    <span className="font-medium text-gray-800">{advice.color_code} ({advice.color_type})</span>
                                    
                                    <span className="text-gray-500">Verfmerk:</span>
                                    <span className="font-medium text-gray-800">{advice.paint_brand}</span>
                                    
                                    <span className="text-gray-500">Verfnaam:</span>
                                    <span className="font-medium text-gray-800">{advice.paint_name || 'N/A'}</span>
                                </div>
                            </div>
                            {advice.notes && (
                                <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                    <strong>Notities:</strong> {advice.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}