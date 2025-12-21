import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, , ShoppingCart } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';

export default function OrderPlacementForm({ requests, suppliers, onSubmit, onCancel, companyId }) {
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
      project_id: requests[0]?.project_id, // Assume all requests are for the same project for now
      material_request_ids: requests.map(r => r.id),
      materials: requests.map(r => ({
        name: r.material_name,
        quantity: r.quantity,
        unit: r.unit
      })),
      order_notes: notes
    };

    await onSubmit(orderData);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bestelling Plaatsen</CardTitle>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}><X className="w-4 h-4"/></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Geselecteerde Materialen</Label>
                <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {requests.map(r => (
                      <li key={r.id}>{r.quantity} {r.unit} {r.material_name}</li>
                    ))}
                  </ul>
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
                <span>Bestelling Plaatsen</span>
              </Button>
            </CardFooter>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}