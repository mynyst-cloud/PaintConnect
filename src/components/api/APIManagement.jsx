import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  AlertTriangle,
  Shield,
  Clock,
  Activity,
  Code
} from 'lucide-react';
import { APIKey, User } from '@/api/entities';
import { formatDate } from '@/components/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';

const AVAILABLE_PERMISSIONS = [
  { key: 'projects:read', label: 'Projecten lezen', description: 'Toegang tot projectgegevens' },
  { key: 'projects:write', label: 'Projecten schrijven', description: 'Projecten aanmaken en wijzigen' },
  { key: 'materials:read', label: 'Materialen lezen', description: 'Toegang tot materiaalgegevens' },
  { key: 'materials:write', label: 'Materialen schrijven', description: 'Materiaalaanvragen beheren' },
  { key: 'orders:read', label: 'Bestellingen lezen', description: 'Toegang tot bestellingsgegevens' },
  { key: 'orders:write', label: 'Bestellingen schrijven', description: 'Bestellingen plaatsen en updaten' },
  { key: 'analytics:read', label: 'Analytics lezen', description: 'Toegang tot rapportages' },
  { key: 'users:read', label: 'Gebruikers lezen', description: 'Toegang tot gebruikersgegevens' }
];

export default function APIManagement() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  
  const [newKey, setNewKey] = useState({
    key_name: '',
    permissions: [],
    rate_limit: 1000,
    expires_at: ''
  });

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (!user.company_id) return;

      const keys = await APIKey.filter({ company_id: user.company_id }, '-created_date');
      setApiKeys(keys || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon API keys niet laden."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAPIKey = () => {
    const prefix = 'pk_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return prefix + randomPart;
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (!newKey.key_name.trim()) {
        toast({
          variant: "destructive",
          title: "Validatiefout",
          description: "Naam is verplicht."
        });
        return;
      }

      if (newKey.permissions.length === 0) {
        toast({
          variant: "destructive",
          title: "Validatiefout",
          description: "Selecteer minimaal één permissie."
        });
        return;
      }

      const apiKey = generateAPIKey();
      const keyPrefix = apiKey.substring(0, 12) + '...';

      const keyData = {
        company_id: currentUser.company_id,
        key_name: newKey.key_name.trim(),
        api_key: apiKey, // In real app, this would be hashed
        key_prefix: keyPrefix,
        permissions: newKey.permissions,
        rate_limit: newKey.rate_limit,
        expires_at: newKey.expires_at || null,
        is_active: true,
        usage_count: 0
      };

      await APIKey.create(keyData);
      
      toast({
        title: "Succes",
        description: "API key succesvol aangemaakt."
      });

      // Show the full key once to the user
      toast({
        title: "API Key",
        description: `Bewaar deze key veilig: ${apiKey}`,
        duration: 10000
      });

      setNewKey({
        key_name: '',
        permissions: [],
        rate_limit: 1000,
        expires_at: ''
      });
      setShowCreateForm(false);
      loadAPIKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon API key niet aanmaken."
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Weet u zeker dat u deze API key wilt verwijderen?')) return;

    try {
      await APIKey.delete(keyId);
      toast({
        title: "Succes",
        description: "API key verwijderd."
      });
      loadAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon API key niet verwijderen."
      });
    }
  };

  const handleToggleKeyVisibility = (keyId) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Gekopieerd",
      description: "API key gekopieerd naar klembord."
    });
  };

  const handlePermissionChange = (permission, checked) => {
    if (checked) {
      setNewKey(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }));
    } else {
      setNewKey(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">API Management</h2>
          <p className="text-gray-600 dark:text-slate-400">
            Beheer API keys voor externe integraties
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe API Key
        </Button>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Documentatie</TabsTrigger>
          <TabsTrigger value="usage">Gebruik</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Nieuwe API Key Aanmaken</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div>
                    <Label htmlFor="key_name">Naam</Label>
                    <Input
                      id="key_name"
                      value={newKey.key_name}
                      onChange={(e) => setNewKey(prev => ({...prev, key_name: e.target.value}))}
                      placeholder="Bijv. Leverancier Portal API"
                      required
                    />
                  </div>

                  <div>
                    <Label>Permissies</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {AVAILABLE_PERMISSIONS.map((permission) => (
                        <div key={permission.key} className="flex items-start space-x-2">
                          <Checkbox
                            id={permission.key}
                            checked={newKey.permissions.includes(permission.key)}
                            onCheckedChange={(checked) => handlePermissionChange(permission.key, checked)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={permission.key}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.label}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rate_limit">Rate Limit (per uur)</Label>
                      <Input
                        id="rate_limit"
                        type="number"
                        value={newKey.rate_limit}
                        onChange={(e) => setNewKey(prev => ({...prev, rate_limit: parseInt(e.target.value)}))}
                        min="1"
                        max="10000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="expires_at">Vervaldatum (optioneel)</Label>
                      <Input
                        id="expires_at"
                        type="datetime-local"
                        value={newKey.expires_at}
                        onChange={(e) => setNewKey(prev => ({...prev, expires_at: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? <LoadingSpinner size="sm" /> : <Key className="w-4 h-4 mr-2" />}
                      API Key Aanmaken
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Annuleren
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {apiKeys.length > 0 ? (
              apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{key.key_name}</h3>
                          <Badge variant={key.is_active ? "default" : "secondary"}>
                            {key.is_active ? 'Actief' : 'Inactief'}
                          </Badge>
                          {key.expires_at && new Date(key.expires_at) < new Date() && (
                            <Badge variant="destructive">Verlopen</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Key className="w-4 h-4" />
                            <span className="font-mono">
                              {visibleKeys.has(key.id) ? key.api_key : key.key_prefix}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            <span>{key.usage_count} aanvragen</span>
                          </div>
                          {key.last_used && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Laatst gebruikt: {formatDate(key.last_used)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {key.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? 
                            <EyeOff className="w-4 h-4" /> : 
                            <Eye className="w-4 h-4" />
                          }
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyKey(key.api_key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Geen API Keys</h3>
                  <p className="text-gray-600 dark:text-slate-400 mb-4">
                    Maak uw eerste API key aan om externe integraties mogelijk te maken
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Eerste API Key Aanmaken
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                API Documentatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Base URL</h4>
                <code className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded text-sm">
                  https://api.paintproapp.com/v1
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Authenticatie</h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                  Voeg uw API key toe aan de Authorization header:
                </p>
                <code className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded text-sm block">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Beschikbare Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">GET</Badge>
                    <code>/projects</code>
                    <span className="text-gray-600 dark:text-slate-400">Lijst van projecten</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">POST</Badge>
                    <code>/projects</code>
                    <span className="text-gray-600 dark:text-slate-400">Nieuw project aanmaken</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">GET</Badge>
                    <code>/materials</code>
                    <span className="text-gray-600 dark:text-slate-400">Materiaalaanvragen</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">POST</Badge>
                    <code>/orders</code>
                    <span className="text-gray-600 dark:text-slate-400">Bestelling plaatsen</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Rate Limiting</h4>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  API calls zijn gelimiteerd per uur. De limiet is afhankelijk van uw API key configuratie.
                  Rate limit informatie wordt meegestuurd in de response headers.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Gebruik Statistieken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400">
                  Gebruik statistieken worden binnenkort beschikbaar
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}