import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Plus, Edit, Trash2, Save, X, Crown, Check,
  Eye, Settings, BarChart3, Calendar, Package, AlertTriangle,
  Users, MessageCircle, FileText, Calculator, Gift, Briefcase,
  Loader2, Search, Copy, ChevronDown, ChevronRight, Lock, Unlock,
  Zap, Star, Building, CreditCard, Bell, Upload, Clock, Map
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ============================================
// FEATURE DEFINITIONS - Alle features in de app
// ============================================
const FEATURE_CATEGORIES = {
  pages: {
    name: 'Pagina\'s',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    features: {
      page_dashboard: { name: 'Dashboard', description: 'Hoofddashboard met overzicht', icon: BarChart3 },
      page_projects: { name: 'Projecten', description: 'Projectbeheer en overzicht', icon: Briefcase },
      page_planning: { name: 'Planning', description: 'Kalender en planning', icon: Calendar },
      page_materials: { name: 'Materialen', description: 'Materiaal aanvragen', icon: Package },
      page_damages: { name: 'Beschadigingen', description: 'Schademeldingen', icon: AlertTriangle },
      page_teamchat: { name: 'Team Chat', description: 'Interne communicatie', icon: MessageCircle },
      page_analytics: { name: 'Analytics', description: 'Statistieken en rapporten', icon: BarChart3 },
      page_referrals: { name: 'Referrals', description: 'Verwijzingssysteem', icon: Gift },
      page_leads: { name: 'Leads', description: 'Lead beheer', icon: Users },
      page_klantportaal: { name: 'Klantportaal', description: 'Klanttoegang beheer', icon: Building },
      page_nacalculatie: { name: 'Nacalculatie', description: 'Nacalculatie en facturen', icon: Calculator },
      page_voorraad: { name: 'Voorraad Beheer', description: 'Voorraad management', icon: Package },
      page_offerte: { name: 'Offerte Opmeting', description: 'Offerte tool', icon: FileText },
      page_verfcalculator: { name: 'Verf Calculator', description: 'Verf berekeningen', icon: Calculator },
      page_team_activiteit: { name: 'Team Activiteit', description: 'Check-in/out overzicht', icon: Users },
    }
  },
  project_features: {
    name: 'Project Functies',
    icon: Briefcase,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    features: {
      project_create: { name: 'Projecten Aanmaken', description: 'Nieuwe projecten maken', icon: Plus },
      project_edit: { name: 'Projecten Bewerken', description: 'Projecten wijzigen', icon: Edit },
      project_delete: { name: 'Projecten Verwijderen', description: 'Projecten verwijderen', icon: Trash2 },
      project_photos: { name: 'Foto\'s Uploaden', description: 'Foto\'s aan projecten toevoegen', icon: Upload },
      project_documents: { name: 'Documenten', description: 'Documenten beheren', icon: FileText },
      project_timeline: { name: 'Tijdlijn', description: 'Project tijdlijn weergave', icon: Clock },
      project_map: { name: 'Kaart Weergave', description: 'Projecten op kaart', icon: Map },
      project_client_portal: { name: 'Klant Portaal Link', description: 'Deel met klanten', icon: Building },
    }
  },
  team_features: {
    name: 'Team Functies',
    icon: Users,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    features: {
      team_invite: { name: 'Teamleden Uitnodigen', description: 'Nieuwe gebruikers toevoegen', icon: Users },
      team_roles: { name: 'Rollen Beheren', description: 'Custom rollen aanmaken', icon: Shield },
      team_hours: { name: 'Uren Registratie', description: 'Urenregistratie systeem', icon: Clock },
      team_checkin: { name: 'Check-in Systeem', description: 'Aanwezigheid tracking', icon: Map },
      team_chat: { name: 'Team Chat', description: 'Interne berichten', icon: MessageCircle },
      team_notifications: { name: 'Push Notificaties', description: 'Push meldingen', icon: Bell },
    }
  },
  materials_features: {
    name: 'Materiaal Functies',
    icon: Package,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    features: {
      material_request: { name: 'Materiaal Aanvragen', description: 'Aanvragen indienen', icon: Package },
      material_approve: { name: 'Aanvragen Goedkeuren', description: 'Aanvragen beoordelen', icon: Check },
      material_inventory: { name: 'Voorraad Beheer', description: 'Voorraad bijhouden', icon: Package },
      material_suppliers: { name: 'Leveranciers', description: 'Leveranciersbeheer', icon: Building },
      material_pricing: { name: 'Prijsbeheer', description: 'Materiaal prijzen', icon: CreditCard },
    }
  },
  analytics_features: {
    name: 'Analytics & Rapporten',
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    features: {
      analytics_basic: { name: 'Basis Analytics', description: 'Standaard statistieken', icon: BarChart3 },
      analytics_advanced: { name: 'Geavanceerde Analytics', description: 'Uitgebreide rapporten', icon: BarChart3 },
      analytics_export: { name: 'Data Export', description: 'Exporteer naar Excel/PDF', icon: FileText },
      analytics_custom: { name: 'Custom Rapporten', description: 'Eigen rapporten maken', icon: Settings },
    }
  },
  integrations: {
    name: 'Integraties',
    icon: Zap,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    features: {
      integration_calendar: { name: 'Kalender Sync', description: 'Google/Outlook sync', icon: Calendar },
      integration_accounting: { name: 'Boekhouding', description: 'Exact/Twinfield koppeling', icon: Calculator },
      integration_api: { name: 'API Toegang', description: 'REST API toegang', icon: Settings },
      integration_webhooks: { name: 'Webhooks', description: 'Webhook notificaties', icon: Bell },
    }
  },
  support: {
    name: 'Support & Extra',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    features: {
      support_email: { name: 'Email Support', description: 'Support via email', icon: MessageCircle },
      support_chat: { name: 'Live Chat', description: 'Real-time chat support', icon: MessageCircle },
      support_phone: { name: 'Telefonische Support', description: 'Bel voor hulp', icon: Bell },
      support_priority: { name: 'Priority Support', description: 'Voorrang bij vragen', icon: Zap },
      feature_whitelabel: { name: 'White Label', description: 'Eigen branding', icon: Building },
      feature_custom_domain: { name: 'Custom Domein', description: 'Eigen domein naam', icon: Settings },
    }
  }
};

// Standaard limieten per categorie
const LIMIT_DEFINITIONS = {
  max_projects: { name: 'Max Projecten', description: 'Maximaal aantal actieve projecten', icon: Briefcase, unit: 'projecten', unlimited: -1 },
  max_users: { name: 'Max Gebruikers', description: 'Maximaal aantal teamleden', icon: Users, unit: 'gebruikers', unlimited: -1 },
  max_storage_gb: { name: 'Opslag (GB)', description: 'Maximale opslagruimte', icon: Upload, unit: 'GB', unlimited: -1 },
  max_photos_per_project: { name: 'Foto\'s per Project', description: 'Max foto\'s per project', icon: Upload, unit: 'foto\'s', unlimited: -1 },
  max_materials_month: { name: 'Materiaal Aanvragen/Maand', description: 'Max aanvragen per maand', icon: Package, unit: 'aanvragen', unlimited: -1 },
  max_leads: { name: 'Max Leads', description: 'Maximaal aantal leads', icon: Users, unit: 'leads', unlimited: -1 },
  history_retention_days: { name: 'Geschiedenis (dagen)', description: 'Hoelang data bewaard blijft', icon: Clock, unit: 'dagen', unlimited: -1 },
};

// Standaard subscription tiers
const DEFAULT_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect voor kleine schildersbedrijven',
    price_monthly: 29,
    price_yearly: 290,
    color: '#6B7280',
    icon: 'star',
    is_active: true,
    is_default: true,
    sort_order: 1,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Voor groeiende bedrijven',
    price_monthly: 59,
    price_yearly: 590,
    color: '#10B981',
    icon: 'zap',
    is_active: true,
    is_default: false,
    sort_order: 2,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Onbeperkte mogelijkheden',
    price_monthly: 99,
    price_yearly: 990,
    color: '#8B5CF6',
    icon: 'crown',
    is_active: true,
    is_default: false,
    sort_order: 3,
  }
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function FeatureSubscriptionManager() {
  const [tiers, setTiers] = useState([]);
  const [features, setFeatures] = useState({});
  const [tierFeatures, setTierFeatures] = useState({});
  const [tierLimits, setTierLimits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingTier, setEditingTier] = useState(null);
  const [showCreateTier, setShowCreateTier] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load subscription tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('sort_order');

      if (tiersError && tiersError.code !== 'PGRST116') {
        console.error('Error loading tiers:', tiersError);
      }

      // Load tier features mapping
      const { data: tierFeaturesData, error: tfError } = await supabase
        .from('tier_features')
        .select('*');

      if (tfError && tfError.code !== 'PGRST116') {
        console.error('Error loading tier features:', tfError);
      }

      // Load tier limits
      const { data: tierLimitsData, error: tlError } = await supabase
        .from('tier_limits')
        .select('*');

      if (tlError && tlError.code !== 'PGRST116') {
        console.error('Error loading tier limits:', tlError);
      }

      // Process tiers
      const loadedTiers = tiersData?.length > 0 ? tiersData : DEFAULT_TIERS;
      setTiers(loadedTiers);

      // Process tier features into a map: { tier_id: { feature_key: enabled } }
      const tfMap = {};
      loadedTiers.forEach(tier => {
        tfMap[tier.id] = {};
        // Default all features to false
        Object.entries(FEATURE_CATEGORIES).forEach(([_, category]) => {
          Object.keys(category.features).forEach(featureKey => {
            tfMap[tier.id][featureKey] = false;
          });
        });
      });

      // Apply saved feature states
      (tierFeaturesData || []).forEach(tf => {
        if (tfMap[tf.tier_id]) {
          tfMap[tf.tier_id][tf.feature_key] = tf.is_enabled;
        }
      });

      setTierFeatures(tfMap);

      // Process tier limits into a map: { tier_id: { limit_key: value } }
      const tlMap = {};
      loadedTiers.forEach(tier => {
        tlMap[tier.id] = {};
        Object.keys(LIMIT_DEFINITIONS).forEach(limitKey => {
          tlMap[tier.id][limitKey] = 0;
        });
      });

      (tierLimitsData || []).forEach(tl => {
        if (tlMap[tl.tier_id]) {
          tlMap[tl.tier_id][tl.limit_key] = tl.limit_value;
        }
      });

      setTierLimits(tlMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon data niet laden.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save all changes
  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      // Save tiers
      for (const tier of tiers) {
        const { error } = await supabase
          .from('subscription_tiers')
          .upsert(tier, { onConflict: 'id' });
        
        if (error) throw error;
      }

      // Save tier features
      const featureRows = [];
      Object.entries(tierFeatures).forEach(([tierId, features]) => {
        Object.entries(features).forEach(([featureKey, isEnabled]) => {
          featureRows.push({
            tier_id: tierId,
            feature_key: featureKey,
            is_enabled: isEnabled
          });
        });
      });

      // Delete existing and insert new
      await supabase.from('tier_features').delete().neq('tier_id', 'dummy');
      
      if (featureRows.length > 0) {
        const { error: featuresError } = await supabase
          .from('tier_features')
          .insert(featureRows);
        
        if (featuresError) throw featuresError;
      }

      // Save tier limits
      const limitRows = [];
      Object.entries(tierLimits).forEach(([tierId, limits]) => {
        Object.entries(limits).forEach(([limitKey, limitValue]) => {
          limitRows.push({
            tier_id: tierId,
            limit_key: limitKey,
            limit_value: limitValue
          });
        });
      });

      await supabase.from('tier_limits').delete().neq('tier_id', 'dummy');
      
      if (limitRows.length > 0) {
        const { error: limitsError } = await supabase
          .from('tier_limits')
          .insert(limitRows);
        
        if (limitsError) throw limitsError;
      }

      setHasChanges(false);
      toast({ title: 'Opgeslagen!', description: 'Alle wijzigingen zijn opgeslagen.' });

    } catch (error) {
      console.error('Error saving:', error);
      toast({ variant: 'destructive', title: 'Fout', description: 'Kon wijzigingen niet opslaan: ' + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle feature for a tier
  const toggleFeature = (tierId, featureKey) => {
    setTierFeatures(prev => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        [featureKey]: !prev[tierId]?.[featureKey]
      }
    }));
    setHasChanges(true);
  };

  // Update limit for a tier
  const updateLimit = (tierId, limitKey, value) => {
    setTierLimits(prev => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        [limitKey]: value
      }
    }));
    setHasChanges(true);
  };

  // Enable all features for a tier
  const enableAllFeatures = (tierId) => {
    const allEnabled = {};
    Object.entries(FEATURE_CATEGORIES).forEach(([_, category]) => {
      Object.keys(category.features).forEach(featureKey => {
        allEnabled[featureKey] = true;
      });
    });
    setTierFeatures(prev => ({ ...prev, [tierId]: allEnabled }));
    setHasChanges(true);
  };

  // Disable all features for a tier
  const disableAllFeatures = (tierId) => {
    const allDisabled = {};
    Object.entries(FEATURE_CATEGORIES).forEach(([_, category]) => {
      Object.keys(category.features).forEach(featureKey => {
        allDisabled[featureKey] = false;
      });
    });
    setTierFeatures(prev => ({ ...prev, [tierId]: allDisabled }));
    setHasChanges(true);
  };

  // Copy features from one tier to another
  const copyFeaturesFrom = (sourceTierId, targetTierId) => {
    setTierFeatures(prev => ({
      ...prev,
      [targetTierId]: { ...prev[sourceTierId] }
    }));
    setTierLimits(prev => ({
      ...prev,
      [targetTierId]: { ...prev[sourceTierId] }
    }));
    setHasChanges(true);
    toast({ title: 'Gekopieerd', description: 'Features en limieten gekopieerd.' });
  };

  // Count enabled features for a tier
  const countEnabledFeatures = (tierId) => {
    if (!tierFeatures[tierId]) return 0;
    return Object.values(tierFeatures[tierId]).filter(Boolean).length;
  };

  // Get total feature count
  const getTotalFeatureCount = () => {
    let count = 0;
    Object.values(FEATURE_CATEGORIES).forEach(category => {
      count += Object.keys(category.features).length;
    });
    return count;
  };

  // Filter features by search
  const filterFeatures = (features) => {
    if (!searchQuery) return features;
    const query = searchQuery.toLowerCase();
    const filtered = {};
    Object.entries(features).forEach(([key, feature]) => {
      if (feature.name.toLowerCase().includes(query) || 
          feature.description.toLowerCase().includes(query)) {
        filtered[key] = feature;
      }
    });
    return filtered;
  };

  // Create new tier
  const handleCreateTier = async (tierData) => {
    const newTier = {
      ...tierData,
      id: tierData.name.toLowerCase().replace(/\s+/g, '_'),
      sort_order: tiers.length + 1,
      is_active: true
    };

    setTiers(prev => [...prev, newTier]);
    
    // Initialize features and limits for new tier
    const initFeatures = {};
    Object.entries(FEATURE_CATEGORIES).forEach(([_, category]) => {
      Object.keys(category.features).forEach(featureKey => {
        initFeatures[featureKey] = false;
      });
    });
    setTierFeatures(prev => ({ ...prev, [newTier.id]: initFeatures }));

    const initLimits = {};
    Object.keys(LIMIT_DEFINITIONS).forEach(limitKey => {
      initLimits[limitKey] = 0;
    });
    setTierLimits(prev => ({ ...prev, [newTier.id]: initLimits }));

    setShowCreateTier(false);
    setHasChanges(true);
    toast({ title: 'Tier aangemaakt', description: `${newTier.name} is toegevoegd.` });
  };

  // Delete tier
  const handleDeleteTier = async (tierId) => {
    if (!confirm('Weet je zeker dat je deze tier wilt verwijderen?')) return;
    
    setTiers(prev => prev.filter(t => t.id !== tierId));
    setTierFeatures(prev => {
      const newState = { ...prev };
      delete newState[tierId];
      return newState;
    });
    setTierLimits(prev => {
      const newState = { ...prev };
      delete newState[tierId];
      return newState;
    });
    setHasChanges(true);
    toast({ title: 'Verwijderd', description: 'Tier is verwijderd.' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Feature & Subscription Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Beheer abonnementsvormen en feature toegang
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Onopgeslagen wijzigingen
            </Badge>
          )}
          <Button 
            onClick={saveAllChanges} 
            disabled={!hasChanges || isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Alles Opslaan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="limits">Limieten</TabsTrigger>
          <TabsTrigger value="matrix">Matrix</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Subscription Tiers</h3>
            <Button onClick={() => setShowCreateTier(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card key={tier.id} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ backgroundColor: tier.color }}
                />
                <CardHeader className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tier.icon === 'crown' && <Crown className="w-5 h-5" style={{ color: tier.color }} />}
                        {tier.icon === 'zap' && <Zap className="w-5 h-5" style={{ color: tier.color }} />}
                        {tier.icon === 'star' && <Star className="w-5 h-5" style={{ color: tier.color }} />}
                        {tier.name}
                      </CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingTier(tier)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTier(tier.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-3xl font-bold">€{tier.price_monthly}</p>
                        <p className="text-sm text-gray-500">/maand</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">€{tier.price_yearly}</p>
                        <p className="text-xs text-gray-500">/jaar</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Features actief</span>
                        <Badge variant="secondary">
                          {countEnabledFeatures(tier.id)} / {getTotalFeatureCount()}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(countEnabledFeatures(tier.id) / getTotalFeatureCount()) * 100}%`,
                            backgroundColor: tier.color 
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => enableAllFeatures(tier.id)}
                      >
                        <Unlock className="w-3 h-3 mr-1" />
                        Alles Aan
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => disableAllFeatures(tier.id)}
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        Alles Uit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Zoek features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => {
              const CategoryIcon = category.icon;
              const filteredFeatures = filterFeatures(category.features);
              
              if (Object.keys(filteredFeatures).length === 0 && searchQuery) return null;

              return (
                <Card key={categoryKey}>
                  <CardHeader className="py-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className={`p-2 rounded-lg ${category.color}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      {category.name}
                      <Badge variant="secondary" className="ml-auto">
                        {Object.keys(category.features).length} features
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium text-gray-600 min-w-[200px]">Feature</th>
                            {tiers.map(tier => (
                              <th key={tier.id} className="text-center py-2 px-3 font-medium min-w-[100px]">
                                <span style={{ color: tier.color }}>{tier.name}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(filteredFeatures).map(([featureKey, feature]) => {
                            const FeatureIcon = feature.icon;
                            return (
                              <tr key={featureKey} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <FeatureIcon className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <p className="font-medium text-sm">{feature.name}</p>
                                      <p className="text-xs text-gray-500">{feature.description}</p>
                                    </div>
                                  </div>
                                </td>
                                {tiers.map(tier => (
                                  <td key={tier.id} className="text-center py-3 px-3">
                                    <Switch
                                      checked={tierFeatures[tier.id]?.[featureKey] || false}
                                      onCheckedChange={() => toggleFeature(tier.id, featureKey)}
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Limits Tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Limieten per Tier</CardTitle>
              <CardDescription>
                Stel maximale waarden in per abonnementsvorm. -1 = onbeperkt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 min-w-[200px]">Limiet</th>
                      {tiers.map(tier => (
                        <th key={tier.id} className="text-center py-3 px-4 font-medium min-w-[150px]">
                          <span style={{ color: tier.color }}>{tier.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(LIMIT_DEFINITIONS).map(([limitKey, limit]) => {
                      const LimitIcon = limit.icon;
                      return (
                        <tr key={limitKey} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <LimitIcon className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-sm">{limit.name}</p>
                                <p className="text-xs text-gray-500">{limit.description}</p>
                              </div>
                            </div>
                          </td>
                          {tiers.map(tier => (
                            <td key={tier.id} className="text-center py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <Input
                                  type="number"
                                  value={tierLimits[tier.id]?.[limitKey] || 0}
                                  onChange={(e) => updateLimit(tier.id, limitKey, parseInt(e.target.value) || 0)}
                                  className="w-24 text-center"
                                  min="-1"
                                />
                                <span className="text-xs text-gray-500">{limit.unit}</span>
                              </div>
                              {tierLimits[tier.id]?.[limitKey] === -1 && (
                                <Badge variant="outline" className="mt-1 text-xs">Onbeperkt</Badge>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matrix Tab - Visual Overview */}
        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Matrix</CardTitle>
              <CardDescription>
                Visueel overzicht van alle features per tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600 border-b min-w-[250px]">
                          Feature
                        </th>
                        {tiers.map(tier => (
                          <th 
                            key={tier.id} 
                            className="text-center py-3 px-4 font-medium border-b min-w-[120px]"
                            style={{ backgroundColor: `${tier.color}15` }}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {tier.icon === 'crown' && <Crown className="w-5 h-5" style={{ color: tier.color }} />}
                              {tier.icon === 'zap' && <Zap className="w-5 h-5" style={{ color: tier.color }} />}
                              {tier.icon === 'star' && <Star className="w-5 h-5" style={{ color: tier.color }} />}
                              <span style={{ color: tier.color }}>{tier.name}</span>
                              <span className="text-xs font-normal text-gray-500">€{tier.price_monthly}/mo</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
                        <React.Fragment key={categoryKey}>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <td colSpan={tiers.length + 1} className="py-2 px-4 font-semibold text-sm">
                              <div className="flex items-center gap-2">
                                <category.icon className="w-4 h-4" />
                                {category.name}
                              </div>
                            </td>
                          </tr>
                          {Object.entries(category.features).map(([featureKey, feature]) => (
                            <tr key={featureKey} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/30">
                              <td className="py-2 px-4 text-sm">{feature.name}</td>
                              {tiers.map(tier => (
                                <td key={tier.id} className="text-center py-2 px-4">
                                  {tierFeatures[tier.id]?.[featureKey] ? (
                                    <Check className="w-5 h-5 mx-auto text-emerald-600" />
                                  ) : (
                                    <X className="w-5 h-5 mx-auto text-gray-300" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Tier Dialog */}
      <Dialog open={showCreateTier} onOpenChange={setShowCreateTier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Subscription Tier</DialogTitle>
          </DialogHeader>
          <CreateTierForm onSubmit={handleCreateTier} onCancel={() => setShowCreateTier(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Tier Dialog */}
      {editingTier && (
        <Dialog open={!!editingTier} onOpenChange={() => setEditingTier(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tier Bewerken: {editingTier.name}</DialogTitle>
            </DialogHeader>
            <EditTierForm 
              tier={editingTier} 
              onSubmit={(updated) => {
                setTiers(prev => prev.map(t => t.id === updated.id ? updated : t));
                setEditingTier(null);
                setHasChanges(true);
              }} 
              onCancel={() => setEditingTier(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================
// CREATE TIER FORM
// ============================================
function CreateTierForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    color: '#10B981',
    icon: 'star'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Naam</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Bijv. Professional"
          required
        />
      </div>
      <div>
        <Label>Beschrijving</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Korte beschrijving van de tier"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Prijs per Maand (€)</Label>
          <Input
            type="number"
            value={formData.price_monthly}
            onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <Label>Prijs per Jaar (€)</Label>
          <Input
            type="number"
            value={formData.price_yearly}
            onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Kleur</Label>
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-10"
          />
        </div>
        <div>
          <Label>Icoon</Label>
          <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="star"><Star className="w-4 h-4 inline mr-2" /> Star</SelectItem>
              <SelectItem value="zap"><Zap className="w-4 h-4 inline mr-2" /> Zap</SelectItem>
              <SelectItem value="crown"><Crown className="w-4 h-4 inline mr-2" /> Crown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Annuleren</Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Aanmaken</Button>
      </DialogFooter>
    </form>
  );
}

// ============================================
// EDIT TIER FORM
// ============================================
function EditTierForm({ tier, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(tier);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Naam</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Beschrijving</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Prijs per Maand (€)</Label>
          <Input
            type="number"
            value={formData.price_monthly}
            onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <Label>Prijs per Jaar (€)</Label>
          <Input
            type="number"
            value={formData.price_yearly}
            onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Kleur</Label>
          <Input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-10"
          />
        </div>
        <div>
          <Label>Icoon</Label>
          <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="star"><Star className="w-4 h-4 inline mr-2" /> Star</SelectItem>
              <SelectItem value="zap"><Zap className="w-4 h-4 inline mr-2" /> Zap</SelectItem>
              <SelectItem value="crown"><Crown className="w-4 h-4 inline mr-2" /> Crown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Actief</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Annuleren</Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Opslaan</Button>
      </DialogFooter>
    </form>
  );
}




