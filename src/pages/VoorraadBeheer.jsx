
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  MapPin,
  Plus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Loader2,
  Edit,
  Trash2,
  ArrowRightLeft,
  Calendar,
  Euro,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatCurrency } from '@/components/utils';
import { geocodeAddress } from '@/api/functions';
import { useFeatureAccess, UpgradePrompt } from '@/hooks/useFeatureAccess';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import UpgradeModal from '@/components/ui/UpgradeModal';

export default function VoorraadBeheer() {
  const { hasFeature, isLoading: featureLoading } = useFeatureAccess();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [batches, setBatches] = useState([]);
  const [movements, setMovements] = useState([]);
  const [locations, setLocations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [showOnlyExpiring, setShowOnlyExpiring] = useState(false);

  // Modals
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    location_type: 'warehouse',
    description: '',
    address: '',
    postal_code: '',
    city: ''
  });
  const [movementFormData, setMovementFormData] = useState({
    movement_type: 'out',
    quantity: '',
    reason: '',
    to_location_id: ''
  });
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);


  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const companyId = user.company_id || user.current_company_id;
      if (!companyId) {
        toast.error('Geen bedrijf gekoppeld');
        setIsLoading(false);
        return;
      }

      const companyData = await base44.entities.Company.get(companyId);
      setCompany(companyData);

      await Promise.all([
        loadBatches(companyId),
        loadLocations(companyId),
        loadMovements(companyId)
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fout bij laden van gegevens');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBatches = async (companyId) => {
    try {
      const data = await base44.entities.StockBatch.filter(
        { company_id: companyId },
        '-created_date',
        1000
      );
      setBatches(data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const loadLocations = async (companyId) => {
    try {
      const data = await base44.entities.StockLocation.filter({ company_id: companyId });
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadMovements = async (companyId) => {
    try {
      const data = await base44.entities.StockMovement.filter(
        { company_id: companyId },
        '-created_date',
        100
      );
      setMovements(data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();

    const needsAddress = locationFormData.location_type === 'warehouse' || locationFormData.location_type === 'project';

    if (needsAddress && (!locationFormData.address || !locationFormData.postal_code || !locationFormData.city)) {
      toast.error('Vul het volledige adres in voor deze locatie');
      return;
    }

    setIsGeocodingLocation(true);

    try {
      let locationData = {
        company_id: company.id,
        name: locationFormData.name,
        location_type: locationFormData.location_type,
        description: locationFormData.description,
        is_active: true
      };

      // Geocode voor warehouse/project types
      if (needsAddress) {
        const fullAddress = `${locationFormData.address}, ${locationFormData.postal_code} ${locationFormData.city}`;

        try {
          const geocodeResult = await geocodeAddress({ address: fullAddress });

          if (geocodeResult.data.latitude && geocodeResult.data.longitude) {
            locationData = {
              ...locationData,
              address: locationFormData.address,
              postal_code: locationFormData.postal_code,
              city: locationFormData.city,
              latitude: geocodeResult.data.latitude,
              longitude: geocodeResult.data.longitude,
              formatted_address: geocodeResult.data.formatted_address
            };
          } else {
            toast.error(geocodeResult.data.error || 'Adres niet gevonden');
            setIsGeocodingLocation(false);
            return;
          }
        } catch (geocodeError) {
          console.error('Geocoding failed:', geocodeError);
          toast.error('Adres kon niet worden gevonden. Controleer of het adres correct is.');
          setIsGeocodingLocation(false);
          return;
        }
      }

      await base44.entities.StockLocation.create(locationData);

      toast.success('Locatie aangemaakt');
      setShowLocationModal(false);
      setLocationFormData({
        name: '',
        location_type: 'warehouse',
        description: '',
        address: '',
        postal_code: '',
        city: ''
      });
      loadLocations(company.id);
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Fout bij aanmaken locatie');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const handleCreateMovement = async (e) => {
    e.preventDefault();

    if (!selectedBatch) return;

    const quantity = parseFloat(movementFormData.quantity);
    if (quantity <= 0) {
      toast.error('Vul een geldige hoeveelheid in');
      return;
    }

    // Check if enough stock
    if (movementFormData.movement_type === 'out' && quantity > selectedBatch.current_quantity) {
      toast.error('Onvoldoende voorraad');
      return;
    }

    try {
      const newQuantity = movementFormData.movement_type === 'out'
        ? selectedBatch.current_quantity - quantity
        : selectedBatch.current_quantity + quantity;

      // Create movement
      await base44.entities.StockMovement.create({
        company_id: company.id,
        stock_batch_id: selectedBatch.id,
        material_id: selectedBatch.material_id,
        material_name: selectedBatch.material_name,
        movement_type: movementFormData.movement_type,
        quantity_change: movementFormData.movement_type === 'out' ? -quantity : quantity,
        unit: selectedBatch.unit,
        from_location_id: movementFormData.movement_type === 'transfer' ? selectedBatch.location_id : null,
        to_location_id: movementFormData.movement_type === 'transfer' ? movementFormData.to_location_id : selectedBatch.location_id,
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        reason: movementFormData.reason,
        unit_cost: selectedBatch.purchase_price_per_unit,
        total_cost: quantity * selectedBatch.purchase_price_per_unit
      });

      // Update batch
      await base44.entities.StockBatch.update(selectedBatch.id, {
        current_quantity: newQuantity,
        is_depleted: newQuantity <= 0,
        ...(movementFormData.movement_type === 'transfer' && { location_id: movementFormData.to_location_id })
      });

      toast.success('Voorraadmutatie geregistreerd');
      setShowMovementModal(false);
      setSelectedBatch(null);
      setMovementFormData({ movement_type: 'out', quantity: '', reason: '', to_location_id: '' });
      loadBatches(company.id);
      loadMovements(company.id);
    } catch (error) {
      console.error('Error creating movement:', error);
      toast.error('Fout bij registreren mutatie');
    }
  };

  const openMovementModal = (batch) => {
    setSelectedBatch(batch);
    setMovementFormData({ movement_type: 'out', quantity: '', reason: '', to_location_id: '' });
    setShowMovementModal(true);
  };

  const handleDeleteLocation = async (location) => {
    // Check if batches are linked to this location
    const linkedBatches = batches.filter(b => b.location_id === location.id && !b.is_depleted);
    
    if (linkedBatches.length > 0) {
      toast.error(`Kan locatie niet verwijderen: ${linkedBatches.length} actieve batch(es) gekoppeld. Verplaats of verbruik deze eerst.`);
      return;
    }

    if (!window.confirm(`Weet u zeker dat u locatie "${location.name}" wilt verwijderen?`)) {
      return;
    }

    try {
      await base44.entities.StockLocation.update(location.id, { is_active: false });
      toast.success('Locatie gedeactiveerd');
      loadLocations(company.id);
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Fout bij verwijderen locatie');
    }
  };

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    if (searchTerm && !batch.material_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (locationFilter && batch.location_id !== locationFilter) {
      return false;
    }
    if (showOnlyLowStock && batch.current_quantity > batch.initial_quantity * 0.2) {
      return false;
    }
    if (showOnlyExpiring && (!batch.expiry_date || new Date(batch.expiry_date) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))) {
      return false;
    }
    return true;
  });

  // Calculate stats
  const stats = {
    totalBatches: batches.length,
    totalValue: batches.reduce((sum, b) => sum + (b.current_quantity * b.purchase_price_per_unit), 0),
    lowStockCount: batches.filter(b => b.current_quantity <= b.initial_quantity * 0.2 && !b.is_depleted).length,
    expiringCount: batches.filter(b => b.expiry_date && new Date(b.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length
  };

  if (isLoading || featureLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="default" />
      </div>
    );
  }

  // Permission check - VoorraadBeheer is only for Professional+ subscriptions
  React.useEffect(() => {
    if (!featureLoading && !hasFeature('page_voorraad')) {
      setShowUpgradeModal(true);
    }
  }, [featureLoading, hasFeature]);

  if (!hasFeature('page_voorraad')) {
    return (
      <>
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-2xl mx-auto mt-12 sm:mt-24">
            <UpgradePrompt 
              feature="page_voorraad" 
              message="VoorraadBeheer is alleen beschikbaar voor Professional en Enterprise abonnementen. Upgrade om uw voorraad en locaties te beheren."
            />
          </div>
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="VoorraadBeheer"
          requiredTier="professional"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Voorraadbeheer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Voorraad per batch met volledige traceerbaarheid
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLocationModal(true)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Locatie toevoegen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadInitialData()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Totaal Batches</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalBatches}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Totale Waarde</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <Euro className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lage Voorraad</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.lowStockCount}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bijna Verlopen</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.expiringCount}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="batches" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="batches">Voorraad Batches</TabsTrigger>
            <TabsTrigger value="movements">Mutaties</TabsTrigger>
            <TabsTrigger value="locations">Locaties</TabsTrigger>
          </TabsList>

          {/* Batches Tab */}
          <TabsContent value="batches" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs mb-1">Zoeken</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Materiaal..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-1">Locatie</Label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle locaties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Alle locaties</SelectItem>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant={showOnlyLowStock ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                      className="w-full"
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Lage voorraad
                    </Button>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant={showOnlyExpiring ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowOnlyExpiring(!showOnlyExpiring)}
                      className="w-full"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Bijna verlopen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batches List */}
            <Card>
              <CardHeader>
                <CardTitle>Voorraad Batches ({filteredBatches.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredBatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Geen batches gevonden
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBatches.map(batch => {
                      const isLowStock = batch.current_quantity <= batch.initial_quantity * 0.2;
                      const isExpiring = batch.expiry_date && new Date(batch.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      const stockPercentage = (batch.current_quantity / batch.initial_quantity) * 100;

                      return (
                        <div key={batch.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {batch.material_name}
                                </h4>
                                {isLowStock && (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Laag
                                  </Badge>
                                )}
                                {isExpiring && (
                                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Verloopt
                                  </Badge>
                                )}
                                {batch.is_depleted && (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                    Op
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Batch: {batch.batch_number}</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {batch.location_name}
                                </span>
                                {batch.expiry_date && (
                                  <span>Vervalt: {format(new Date(batch.expiry_date), 'd MMM yyyy', { locale: nl })}</span>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openMovementModal(batch)}
                              disabled={batch.is_depleted}
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-2" />
                              Mutatie
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Voorraad</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {batch.current_quantity} / {batch.initial_quantity} {batch.unit}
                              </p>
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    stockPercentage > 50 ? 'bg-green-500' : stockPercentage > 20 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, stockPercentage)}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Kostprijs</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(batch.purchase_price_per_unit)} / {batch.unit}
                              </p>
                              <p className="text-xs text-gray-500">
                                Totaal: {formatCurrency(batch.current_quantity * batch.purchase_price_per_unit)}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Leverancier</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {batch.supplier_name || '-'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(batch.purchased_at), 'd MMM yyyy', { locale: nl })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Recente Mutaties</CardTitle>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Geen mutaties gevonden
                  </div>
                ) : (
                  <div className="space-y-2">
                    {movements.map(movement => (
                      <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          {movement.movement_type === 'in' ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {movement.material_name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {movement.reason} - {movement.user_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change} {movement.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(movement.created_date), 'd MMM HH:mm', { locale: nl })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Voorraadlocaties ({locations.filter(l => l.is_active).length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locations.filter(l => l.is_active).map(location => {
                    const linkedCount = batches.filter(b => b.location_id === location.id && !b.is_depleted).length;
                    
                    return (
                      <div key={location.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-gray-600" />
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {location.name}
                              </h4>
                            </div>
                            <Badge variant="outline" className="text-xs mb-2">
                              {location.location_type === 'warehouse' && 'Magazijn'}
                              {location.location_type === 'vehicle' && 'Voertuig'}
                              {location.location_type === 'project' && 'Project'}
                              {location.location_type === 'other' && 'Overig'}
                            </Badge>
                            {linkedCount > 0 && (
                              <Badge variant="outline" className="text-xs mb-2 ml-2 bg-blue-50 text-blue-700">
                                {linkedCount} batch(es)
                              </Badge>
                            )}
                            {location.formatted_address && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                📍 {location.formatted_address}
                              </p>
                            )}
                            {location.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {location.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLocation(location)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Locatie verwijderen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nieuwe Locatie</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLocation} className="space-y-4">
            <div>
              <Label>Naam *</Label>
              <Input
                value={locationFormData.name}
                onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                placeholder="bijv. Hoofdmagazijn, Camionette Jan"
                required
              />
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={locationFormData.location_type}
                onValueChange={(value) => setLocationFormData({ ...locationFormData, location_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Magazijn</SelectItem>
                  <SelectItem value="vehicle">Voertuig</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="other">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toon adresvelden alleen voor warehouse/project */}
            {(locationFormData.location_type === 'warehouse' || locationFormData.location_type === 'project') && (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Voor een {locationFormData.location_type === 'warehouse' ? 'magazijn' : 'project'} is een volledig adres vereist
                  </p>
                </div>

                <div>
                  <Label>Adres (straat + huisnummer) *</Label>
                  <Input
                    value={locationFormData.address}
                    onChange={(e) => setLocationFormData({ ...locationFormData, address: e.target.value })}
                    placeholder="bijv. Industrieweg 123"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Postcode *</Label>
                    <Input
                      value={locationFormData.postal_code}
                      onChange={(e) => setLocationFormData({ ...locationFormData, postal_code: e.target.value })}
                      placeholder="bijv. 9000"
                      required
                    />
                  </div>
                  <div>
                    <Label>Stad *</Label>
                    <Input
                      value={locationFormData.city}
                      onChange={(e) => setLocationFormData({ ...locationFormData, city: e.target.value })}
                      placeholder="bijv. Gent"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label>Beschrijving</Label>
              <Textarea
                value={locationFormData.description}
                onChange={(e) => setLocationFormData({ ...locationFormData, description: e.target.value })}
                rows={2}
                placeholder="Extra informatie over deze locatie..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLocationModal(false)}
                disabled={isGeocodingLocation}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isGeocodingLocation}
              >
                {isGeocodingLocation ? (
                  <>
                    <InlineSpinner />
                    Adres opzoeken...
                  </>
                ) : (
                  'Aanmaken'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement Modal */}
      <Dialog open={showMovementModal} onOpenChange={setShowMovementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voorraadmutatie</DialogTitle>
            {selectedBatch && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedBatch.material_name} - {selectedBatch.current_quantity} {selectedBatch.unit} beschikbaar
              </p>
            )}
          </DialogHeader>
          <form onSubmit={handleCreateMovement} className="space-y-4">
            <div>
              <Label>Type Mutatie *</Label>
              <Select
                value={movementFormData.movement_type}
                onValueChange={(value) => setMovementFormData({ ...movementFormData, movement_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="out">Uitname (gebruik)</SelectItem>
                  <SelectItem value="in">Toevoeging (correctie)</SelectItem>
                  <SelectItem value="correction">Correctie</SelectItem>
                  <SelectItem value="transfer">Verplaatsing</SelectItem>
                  <SelectItem value="expired">Verlopen</SelectItem>
                  <SelectItem value="damaged">Beschadigd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hoeveelheid *</Label>
              <Input
                type="number"
                step="0.01"
                value={movementFormData.quantity}
                onChange={(e) => setMovementFormData({ ...movementFormData, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            {movementFormData.movement_type === 'transfer' && (
              <div>
                <Label>Naar Locatie *</Label>
                <Select
                  value={movementFormData.to_location_id}
                  onValueChange={(value) => setMovementFormData({ ...movementFormData, to_location_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer locatie" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.filter(l => l.id !== selectedBatch?.location_id).map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Reden *</Label>
              <Textarea
                value={movementFormData.reason}
                onChange={(e) => setMovementFormData({ ...movementFormData, reason: e.target.value })}
                placeholder="bijv. Gebruikt op project X, Inventarisatie correctie..."
                rows={2}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMovementModal(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Registreren
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
