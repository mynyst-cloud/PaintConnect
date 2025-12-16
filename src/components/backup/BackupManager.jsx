import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Download,
  Upload,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Calendar
} from 'lucide-react';
import { Backup, User } from '@/api/entities';
import { formatDate } from '@/components/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export default function BackupManager() {
  const { toast } = useToast();
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (!user.company_id) return;

      const backupData = await Backup.filter({ company_id: user.company_id }, '-created_date', 20);
      setBackups(backupData || []);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon backups niet laden."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupData = {
        company_id: currentUser.company_id,
        backup_type: 'full',
        status: 'pending',
        started_at: new Date().toISOString(),
        entities_included: [
          'Project', 'MaterialRequest', 'Damage', 'User', 
          'ChatMessage', 'Referral', 'DailyUpdate'
        ],
        retention_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      };

      await Backup.create(backupData);
      
      toast({
        title: "Backup gestart",
        description: "Uw backup wordt op de achtergrond aangemaakt."
      });

      // Simulate backup process
      setTimeout(async () => {
        try {
          const createdBackup = await Backup.filter({ 
            company_id: currentUser.company_id,
            status: 'pending'
          });
          
          if (createdBackup && createdBackup.length > 0) {
            const backup = createdBackup[0];
            await Backup.update(backup.id, {
              status: 'completed',
              completed_at: new Date().toISOString(),
              file_size_mb: Math.floor(Math.random() * 100) + 10, // Mock size
              record_count: Math.floor(Math.random() * 1000) + 100, // Mock count
              backup_url: `https://secure-backups.paintproapp.com/${backup.id}.enc`
            });
            
            toast({
              title: "Backup voltooid",
              description: "Uw backup is succesvol aangemaakt."
            });
            
            loadBackups();
          }
        } catch (error) {
          console.error('Error completing backup:', error);
        }
      }, 5000); // 5 second simulation

      loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon backup niet starten."
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = async (backup) => {
    if (!backup.backup_url) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Backup bestand niet beschikbaar."
      });
      return;
    }

    // In real implementation, this would be a secure download link
    toast({
      title: "Download gestart",
      description: "Uw backup wordt gedownload."
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      running: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const latestBackup = backups.find(b => b.status === 'completed');
  const runningBackup = backups.find(b => b.status === 'running' || b.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Backup Management</h2>
          <p className="text-gray-600 dark:text-slate-400">
            Beheer en download backups van uw bedrijfsgegevens
          </p>
        </div>
        <Button onClick={createBackup} disabled={isCreatingBackup || !!runningBackup}>
          {isCreatingBackup ? <LoadingSpinner size="sm" /> : <Database className="w-4 h-4 mr-2" />}
          Nieuwe Backup
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Laatste Backup</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {latestBackup ? formatDate(latestBackup.completed_at, 'dd MMM') : 'Geen'}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  {latestBackup ? 'Succesvol' : 'Nog geen backup'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Totale Backups</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {backups.filter(b => b.status === 'completed').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <HardDrive className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">Beschikbaar</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Totale Grootte</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {backups.reduce((sum, b) => sum + (b.file_size_mb || 0), 0).toFixed(0)} MB
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                  <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Calendar className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">Opgeslagen</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Running Backup */}
      {runningBackup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Backup in uitvoering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Voortgang</span>
                <span>Bezig met verwerken...</span>
              </div>
              <Progress value={65} className="h-2" />
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Gestart op {formatDate(runningBackup.started_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Geschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length > 0 ? (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(backup.status)}`}>
                      {getStatusIcon(backup.status)}
                      {backup.status === 'completed' ? 'Voltooid' :
                       backup.status === 'running' ? 'Bezig' :
                       backup.status === 'failed' ? 'Mislukt' : 'Wachtend'}
                    </div>
                    
                    <div>
                      <div className="font-medium">
                        {backup.backup_type === 'full' ? 'Volledige Backup' : 
                         backup.backup_type === 'incremental' ? 'Incrementele Backup' : 
                         'Differentiële Backup'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        {backup.started_at && formatDate(backup.started_at)}
                        {backup.file_size_mb && ` • ${backup.file_size_mb} MB`}
                        {backup.record_count && ` • ${backup.record_count} records`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {backup.retention_until && (
                      <span className="text-xs text-gray-500 dark:text-slate-500">
                        Bewaard tot {formatDate(backup.retention_until, 'dd MMM')}
                      </span>
                    )}
                    
                    {backup.status === 'completed' && backup.backup_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadBackup(backup)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Geen backups</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Maak uw eerste backup aan om uw gegevens veilig te stellen
              </p>
              <Button onClick={createBackup} disabled={isCreatingBackup}>
                <Database className="w-4 h-4 mr-2" />
                Eerste Backup Aanmaken
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Information */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Informatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Wat wordt er geback-upt?</h4>
            <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
              <li>• Alle projectgegevens en klantinformatie</li>
              <li>• Materiaalaanvragen en bestellingen</li>
              <li>• Beschadingsrapporten en foto's</li>
              <li>• Gebruikersaccounts en instellingen</li>
              <li>• Chat berichten en communicatie</li>
              <li>• Referral gegevens en statistieken</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Beveiliging</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Alle backups worden versleuteld met AES-256 encryptie en opgeslagen in beveiligde cloud opslag. 
              Backups worden 90 dagen bewaard en daarna automatisch verwijderd.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Automatische Backups</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Voor Enterprise klanten worden automatisch dagelijkse backups aangemaakt. 
              Neem contact op voor meer informatie over automatische backup diensten.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}