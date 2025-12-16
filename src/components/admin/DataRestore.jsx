import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Database, ArrowRight, Info } from 'lucide-react';
import { restoreFreshDecorData } from '@/api/functions';

export default function DataRestore() {
    const [isLoading, setIsLoading] = useState(false);
    const [backupData, setBackupData] = useState(null);
    const [targetCompanyId, setTargetCompanyId] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [migrationResults, setMigrationResults] = useState(null);

    const handleBackupFreshDecor = async () => {
        setIsLoading(true);
        try {
            const { data } = await restoreFreshDecorData({
                action: 'backup_fresh_decor_bv'
            });
            
            setBackupData(data);
            setShowResults(true);
            alert('FRESH DECOR BV data succesvol gebackupped!');
        } catch (error) {
            console.error('Backup error:', error);
            alert('Fout bij backup: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMigrateToCompany = async () => {
        if (!targetCompanyId) {
            alert('Selecteer eerst een doelbedrijf');
            return;
        }

        if (!confirm('Weet u zeker dat u alle data van FRESH DECOR BV wilt migreren naar het geselecteerde bedrijf?')) {
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await restoreFreshDecorData({
                action: 'migrate_to_company',
                targetCompanyId: targetCompanyId
            });
            
            setMigrationResults(data);
            alert('Migratie voltooid!');
        } catch (error) {
            console.error('Migration error:', error);
            alert('Fout bij migratie: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        FRESH DECOR BV Data Backup
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Dit maakt een backup van alle data uit het bedrijf "FRESH DECOR BV": 
                                projecten, gebruikers, meldingen, referrals, chat berichten, etc.
                            </AlertDescription>
                        </Alert>
                        <Button 
                            onClick={handleBackupFreshDecor}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Database className="w-4 h-4 mr-2" />
                            {isLoading ? 'Bezig met backup...' : 'Backup FRESH DECOR BV Data'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {backupData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowRight className="w-5 h-5 text-green-600" />
                            Data Migratie
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{backupData.summary?.projects || 0}</div>
                                    <div className="text-sm text-gray-600">Projecten</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{backupData.summary?.damages || 0}</div>
                                    <div className="text-sm text-gray-600">Meldingen</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{backupData.summary?.referrals || 0}</div>
                                    <div className="text-sm text-gray-600">Referrals</div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="targetCompany">Doel Bedrijf ID</Label>
                                <Input
                                    id="targetCompany"
                                    value={targetCompanyId}
                                    onChange={(e) => setTargetCompanyId(e.target.value)}
                                    placeholder="Voer het ID van het doelbedrijf in"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Dit is het bedrijf waar alle data naartoe wordt gekopieerd
                                </p>
                            </div>

                            <Button 
                                onClick={handleMigrateToCompany}
                                disabled={isLoading || !targetCompanyId}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <ArrowRight className="w-4 h-4 mr-2" />
                                {isLoading ? 'Bezig met migratie...' : 'Migreer Data naar Bedrijf'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {migrationResults && (
                <Card>
                    <CardHeader>
                        <CardTitle>Migratie Resultaten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {migrationResults.migration === 'completed' ? (
                            <div className="space-y-2">
                                <p className="text-green-600 font-semibold">✅ Migratie succesvol voltooid!</p>
                                <div className="space-y-1">
                                    {migrationResults.results?.map((result, index) => (
                                        <div key={index} className="text-sm p-2 bg-green-50 rounded">
                                            {result.type}: {result.name} - {result.status}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-red-600 font-semibold">❌ Migratie mislukt</p>
                                <p className="text-sm text-gray-600">{migrationResults.error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {backupData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Backup Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <strong>Gebruikers:</strong> {backupData.summary?.users || 0}
                            </div>
                            <div>
                                <strong>Projecten:</strong> {backupData.summary?.projects || 0}
                            </div>
                            <div>
                                <strong>Materiaal Aanvragen:</strong> {backupData.summary?.materialRequests || 0}
                            </div>
                            <div>
                                <strong>Beschadigingen:</strong> {backupData.summary?.damages || 0}
                            </div>
                            <div>
                                <strong>Referrals:</strong> {backupData.summary?.referrals || 0}
                            </div>
                            <div>
                                <strong>Dagelijkse Updates:</strong> {backupData.summary?.dailyUpdates || 0}
                            </div>
                            <div>
                                <strong>Chat Berichten:</strong> {backupData.summary?.chatMessages || 0}
                            </div>
                            <div>
                                <strong>Notificaties:</strong> {backupData.summary?.notifications || 0}
                            </div>
                            <div>
                                <strong>Referral Punten:</strong> {backupData.summary?.referralPoints || 0}
                            </div>
                            <div>
                                <strong>Kleur Adviezen:</strong> {backupData.summary?.colorAdvices || 0}
                            </div>
                            <div>
                                <strong>Materialen:</strong> {backupData.summary?.materials || 0}
                            </div>
                            <div>
                                <strong>Tijd Registraties:</strong> {backupData.summary?.timeEntries || 0}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}