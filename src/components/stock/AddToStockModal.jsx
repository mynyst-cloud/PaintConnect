import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package,  } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';

export default function AddToStockModal({ isOpen, onClose, material, companyId }) {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    quantity: '',
    batch_number: '',
    expiry_date: '',
    purchase_price: material?.price_excl_vat || '',
    location_id: '',
    supplier_name: material?.supplier || '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && companyId) {
      loadLocations();
    }
  }, [isOpen, companyId]);

  useEffect(() => {
    if (material) {
      setFormData(prev => ({
        ...prev,
        purchase_price: material.price_excl_vat || '',
        supplier_name: material.supplier || ''
      }));
    }
  }, [material]);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.StockLocation.filter({
        company_id: companyId,
        is_active: true
      });
      setLocations(data || []);

      // Auto-select first location if only one exists
      if (data?.length === 1) {
        setFormData(prev => ({ ...prev, location_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Fout bij laden van locaties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error('Vul een geldige hoeveelheid in');
      return;
    }

    if (!formData.location_id) {
      toast.error('Selecteer een locatie');
      return;
    }

    if (!formData.purchase_price || parseFloat(formData.purchase_price) <= 0) {
      toast.error('Vul een geldige inkoopprijs in');
      return;
    }

    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      const quantity = parseFloat(formData.quantity);
      const purchasePrice = parseFloat(formData.purchase_price);
      const location = locations.find(l => l.id === formData.location_id);

      // Create stock batch
      const batch = await base44.entities.StockBatch.create({
        company_id: companyId,
        material_id: material.id,
        material_name: material.name,
        batch_number: formData.batch_number || `BATCH-${Date.now()}`,
        expiry_date: formData.expiry_date || null,
        purchase_price_per_unit: purchasePrice,
        supplier_name: formData.supplier_name || null,
        initial_quantity: quantity,
        current_quantity: quantity,
        unit: material.unit || 'stuks',
        location_id: formData.location_id,
        location_name: location?.name || 'Onbekend',
        purchased_at: new Date().toISOString(),
        purchased_by: user.email,
        notes: formData.notes || null,
        is_depleted: false
      });

      // Create stock movement (IN)
      await base44.entities.StockMovement.create({
        company_id: companyId,
        stock_batch_id: batch.id,
        material_id: material.id,
        material_name: material.name,
        movement_type: 'in',
        quantity_change: quantity,
        unit: material.unit || 'stuks',
        to_location_id: formData.location_id,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        reason: `Voorraad toegevoegd: ${formData.notes || 'Nieuwe aankoop'}`,
        unit_cost: purchasePrice,
        total_cost: quantity * purchasePrice
      });

      toast.success(`${quantity} ${material.unit || 'stuks'} toegevoegd aan voorraad`);
      
      // Reset form
      setFormData({
        quantity: '',
        batch_number: '',
        expiry_date: '',
        purchase_price: material?.price_excl_vat || '',
        location_id: locations.length === 1 ? locations[0].id : '',
        supplier_name: material?.supplier || '',
        notes: ''
      });

      onClose(true); // Pass true to indicate success
    } catch (error) {
      console.error('Error adding to stock:', error);
      toast.error('Fout bij toevoegen aan voorraad: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Toevoegen aan Voorraad
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {material.name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hoeveelheid *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{material.unit || 'stuks'}</p>
            </div>

            <div>
              <Label>Inkoopprijs per eenheid *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">€ excl. BTW</p>
            </div>
          </div>

          <div>
            <Label>Locatie *</Label>
            <Select
              value={formData.location_id}
              onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer locatie" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {locations.length === 0 && !isLoading && (
              <p className="text-xs text-orange-600 mt-1">
                Geen locaties gevonden. Maak eerst een locatie aan in Voorraadbeheer.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Partijnummer</Label>
              <Input
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="Automatisch"
              />
            </div>

            <div>
              <Label>Vervaldatum</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Leverancier</Label>
            <Input
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="Naam leverancier"
            />
          </div>

          <div>
            <Label>Notities</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Bijv. factuurgegevens, opmerkingen..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? (
                <>
                  <InlineSpinner />
                  Bezig...
                </>
              ) : (
                'Toevoegen aan Voorraad'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}