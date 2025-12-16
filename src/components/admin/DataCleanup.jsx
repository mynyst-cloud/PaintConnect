import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Search, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { cleanupDuplicateData } from '@/api/functions';

export default function DataCleanup() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [targetEmail, setTargetEmail] = useState('mynysteven@gmail.com');
    const [showResults, setShowResults] = useState(false);

    const handleCleanupFreshDecor = async () => {
        if (!confirm('Weet u zeker dat u alle "Fresh Decor" bedrijven (NIET "FRESH DECOR BV") en alle gerelateerde gebruikers permanent wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) {
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await cleanupDuplicateData({
                action: 'cleanup_fresh_decor'
            });
            
            setResults(data.results || []);
            setShowResults(true);
            alert('"Fresh Decor" cleanup voltooid!');
        } catch (error) {
            console.error('Cleanup error:', error);
            alert('Fout bij cleanup: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindDuplicates = async () => {
        if (!targetEmail) {
            alert('Voer een emailadres in');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await cleanupDuplicateData({
                action: 'find_duplicates',
                targetEmail: targetEmail
            });
            
            setResults(data.results || []);
            setShowResults(true);
        } catch (error) {
            console.error('Find duplicates error:', error);
            alert('Fout bij zoeken: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDuplicates = async () => {
        if (!targetEmail) {
            alert('Voer een emailadres in');
            return;
        }

        if (!confirm(`Weet u zeker dat u alle dubbele accounts voor ${targetEmail} wilt verwijderen (behalve het oudste)?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await cleanupDuplicateData({
                action: 'delete_duplicate_users',
                targetEmail: targetEmail
            });
            
            setResults(data.results || []);
            setShowResults(true);
            alert('Dubbele accounts verwijderd!');
        } catch (error) {
            console.error('Delete duplicates error:', error);
            alert('Fout bij verwijderen: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRestoreFreshDecor = async () => {
         if (!confirm('Weet u zeker dat u "FRESH DECOR BV" wilt herstellen? Dit activeert het bedrijf en koppelt "mynysteven@gmail.com" correct.')) {
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await cleanupDuplicateData({
                action: 'restore_fresh_decor_bv'
            });
            setResults(data.results || []);
            setShowResults(true);
            alert('Herstelactie voor "FRESH DECOR BV" voltooid.');
        } catch (error) {
             console.error('Restore error:', error);
            alert('Fout bij herstellen: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-green-600" />
                        Herstel "FRESH DECOR BV"
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Gebruik deze knop om het bedrijf "FRESH DECOR BV" te activeren en de gebruiker 'mynysteven@gmail.com' correct te koppelen.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            onClick={handleRestoreFreshDecor}
                            disabled={isLoading}
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? 'Bezig met herstellen...' : 'Herstel FRESH DECOR BV'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        Verwijder Foutief "Fresh Decor" Bedrijf
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Dit verwijdert alle bedrijven met "Fresh Decor" in de naam (BEHALVE "FRESH DECOR BV") en alle gerelateerde gebruikers. Wees voorzichtig, deze actie kan niet ongedaan gemaakt worden.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            onClick={handleCleanupFreshDecor}
                            disabled={isLoading}
                            variant="destructive"
                        >
                            {isLoading ? 'Bezig met verwijderen...' : 'Verwijder "Fresh Decor"'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-600" />
                        Dubbele Gebruikers Beheren
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email">Emailadres</Label>
                            <Input
                                id="email"
                                value={targetEmail}
                                onChange={(e) => setTargetEmail(e.target.value)}
                                placeholder="mynysteven@gmail.com"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={handleFindDuplicates}
                                disabled={isLoading}
                                variant="outline"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Zoek Duplicaten
                            </Button>
                            <Button 
                                onClick={handleDeleteDuplicates}
                                disabled={isLoading}
                                variant="destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Verwijder Duplicaten
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {showResults && results.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultaten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            {results.map((result, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    {result.action?.includes('deleted') || result.action?.includes('failed') ? (
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                    <span>
                                        <strong>{result.type}:</strong> {result.name || result.email || result.message} - <span className="font-semibold">{result.action}</span>
                                        {result.error && <span className="text-red-600 ml-2">Fout: {result.error}</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}