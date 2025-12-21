import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, ShoppingCart } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';

export default function SingleMaterialOrderForm({ request, suppliers, onSubmit, onCancel, companyId }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      alert("Selecteer een leverancier.");
      return;
    }

    setIsSubmitting(true);
    
    const orderData = {
      supplier_id: supplierId,
      company_id: companyId,
      project_id: request.project_id,
      material_request_ids: [request.id],
      materials: [{
        name: request.material_name,
        quantity: request.quantity,
        unit: request.unit
      }],
      order_notes: notes
    };

    await onSubmit(orderData);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Materiaal Bestellen</CardTitle>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                <X className="w-4 h-4"/>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Te bestellen materiaal</Label>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <h3 className="font-semibold text-emerald-900">{request.material_name}</h3>
                  <p className="text-sm text-emerald-700">
                    {request.quantity} {request.unit}
                  </p>
                  {request.supplier && (
                    <p className="text-sm text-emerald-600 mt-1">
                      Voorkeur leverancier: {request.supplier}
                    </p>
                  )}
                  {request.estimated_cost && (
                    <p className="text-sm text-emerald-600">
                      Geschatte kosten: €{request.estimated_cost}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Leverancier *</Label>
                <Select required value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een leverancier"/>
                  </SelectTrigger>
                  <SelectContent>
                    {(suppliers || []).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Notities voor leverancier</Label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Extra details, leverinstructies, etc."
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                {isSubmitting ? (
                  <InlineSpinner />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2"/>
                )}
                <span>Bestellen</span>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}