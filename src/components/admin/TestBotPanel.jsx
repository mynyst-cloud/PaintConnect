import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { 
    Play, 
    BarChart3, 
    CheckCircle, 
    AlertTriangle, 
    XCircle,
    ExternalLink
} from 'lucide-react';
import TestBot from '@/components/testing/TestBot';

export default function TestBotPanel({ testStats = null }) {
    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            {testStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Laatste Run</p>
                                    <p className="text-xl font-bold">{testStats.lastRun || 'Nog geen'}</p>
                                </div>
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Geslaagd</p>
                                    <p className="text-xl font-bold text-green-600">{testStats.passed || 0}</p>
                                </div>
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Waarschuwingen</p>
                                    <p className="text-xl font-bold text-yellow-600">{testStats.warnings || 0}</p>
                                </div>
                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Gefaald</p>
                                    <p className="text-xl font-bold text-red-600">{testStats.failed || 0}</p>
                                </div>
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Test Bot Interface */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            🤖 TestBot Interface
                        </CardTitle>
                        <Link to={createPageUrl('TestResults')}>
                            <Button variant="outline" size="sm">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Alle Resultaten
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <TestBot />
                </CardContent>
            </Card>

            {/* Information */}
            <Card>
                <CardHeader>
                    <CardTitle>ℹ️ TestBot Informatie</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Wat doet de TestBot?</h4>
                            <p className="text-sm text-gray-600">
                                De TestBot simuleert echte gebruikersacties voor alle rollen in PaintConnect. 
                                Het test automatisch functionaliteiten zoals login, navigation, project management, 
                                team chat, en meer op zowel desktop als mobiel.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Beschikbare Tests</h4>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">🔧 Super Admin</Badge>
                                <Badge variant="outline">🏢 Company Admin</Badge>
                                <Badge variant="outline">🎨 Painter</Badge>
                                <Badge variant="outline">👤 Client Portal</Badge>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Test Resultaten</h4>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-600">Pass - Functionaliteit werkt correct</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-gray-600">Warning - Mogelijke issues gevonden</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-gray-600">Fail - Functionaliteit defect</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}