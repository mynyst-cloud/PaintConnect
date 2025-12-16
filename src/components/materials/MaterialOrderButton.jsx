import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Truck, Package, AlertCircle } from 'lucide-react';
import { SupplierOrder } from '@/api/entities';
import { User } from '@/api/entities';

export default function MaterialOrderButton({ request, suppliers, onOrderPlaced }) {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderData, setOrderData] = useState({
    quantity: '',
    urgency: 'normal',
    notes: ''
  });

  // Safety checks for props
  if (!request || typeof request !== 'object' || !request.id) {
    console.warn("MaterialOrderButton received invalid request:", request);
    return null;
  }

  const safeSuppliers = (suppliers || []).filter(s => s && typeof s === 'object' && s.id);
  
  // Find supplier safely
  const supplier = safeSuppliers.find(s => s.id === (request.supplier_id || ''));

  // Initialize order data with request data
  useEffect(() => {
    if (request) {
      setOrderData({
        quantity: (request.quantity || 0).toString(),
        urgency: 'normal',
        notes: request.notes || ''
      });
    }
  }, [request]);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!supplier) {
      alert('Geen geldige leverancier gevonden voor deze aanvraag.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const user = await User.me();
      
      const orderPayload = {
        supplier_id: supplier.id,
        company_id: user.company_id,
        project_id: request.project_id || '',
        material_request_id: request.id,
        material_name: request.material_name || 'Onbekend materiaal',
        quantity: parseFloat(orderData.quantity) || 0,
        unit: request.unit || 'stuks',
        urgency: orderData.urgency,
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
        requested_by: user.id,
        notes: orderData.notes.trim() || null
      };

      await SupplierOrder.create(orderPayload);
      
      setShowOrderForm(false);
      
      if (onOrderPlaced) {
        onOrderPlaced();
      }
      
      alert('Bestelling succesvol geplaatst bij leverancier!');
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Fout bij plaatsen van bestelling. Probeer opnieuw.');
    }
    
    setIsSubmitting(false);
  };

  const canOrder = request.status === 'goedgekeurd' && supplier;

  if (!canOrder) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="h-8 px-2 text-gray-400"
        title={!supplier ? "Geen leverancier gekoppeld" : "Kan alleen goedgekeurde aanvragen bestellen"}
      >
        <AlertCircle className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOrderForm(true)}
        className="h-8 px-2"
        title="Bestelling plaatsen"
      >
        <ShoppingCart className="w-4 h-4" />
      </Button>

      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bestelling Plaatsen</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Materiaal:</strong> {request.material_name || 'Onbekend'}</p>
              <p><strong>Leverancier:</strong> {supplier?.name || 'Onbekend'}</p>
            </div>
            
            <div>
              <Label>Hoeveelheid</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={orderData.quantity}
                onChange={(e) => setOrderData(prev => ({...prev, quantity: e.target.value}))}
                required
              />
            </div>
            
            <div>
              <Label>Urgentie</Label>
              <Select 
                value={orderData.urgency} 
                onValueChange={(value) => setOrderData(prev => ({...prev, urgency: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normaal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Opmerkingen (optioneel)</Label>
              <Textarea
                value={orderData.notes}
                onChange={(e) => setOrderData(prev => ({...prev, notes: e.target.value}))}
                placeholder="Extra informatie voor de leverancier..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowOrderForm(false)}
                disabled={isSubmitting}
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Bestellen...' : 'Bestelling Plaatsen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}