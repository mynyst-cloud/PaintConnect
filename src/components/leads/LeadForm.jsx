import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Save, Info } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';

const sources = ["website", "referral", "advertentie", "telefoon", "anders"];
const statuses = ["nieuw", "gecontacteerd", "offerte_verstuurd", "gewonnen", "verloren"];

export default function LeadForm({ lead, users, onSubmit, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReferralInfo, setShowReferralInfo] = useState(false);
  const [formData, setFormData] = useState({
    lead_name: lead?.lead_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    address: lead?.address || '',
    source: lead?.source || 'website',
    status: lead?.status || 'nieuw',
    notes: lead?.notes || '',
    estimated_value: lead?.estimated_value || '',
    assigned_to: lead?.assigned_to || '',
  });

  // Show referral info when source is referral and assigned_to is filled
  useEffect(() => {
    setShowReferralInfo(formData.source === 'referral' && formData.assigned_to);
  }, [formData.source, formData.assigned_to]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSubmit = {
      ...formData,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
    };
    await onSubmit(dataToSubmit);
    setIsSubmitting(false);
  };

  // Filter painters only (users with is_painter = true or company_role = painter)
  const painters = users.filter(user => 
    user.is_painter || user.company_role === 'painter' || user.company_role === 'admin'
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{lead ? 'Lead Bewerken' : 'Nieuwe Lead Toevoegen'}</CardTitle>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Referral Integration Alert */}
              {showReferralInfo && (
                <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/50">
                  <Info className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800 dark:text-emerald-300">
                    <strong>Referral Integratie:</strong> Deze lead wordt automatisch gekoppeld aan het Referral systeem. 
                    De toegewezen schilder kan punten verdienen als de lead wordt gewonnen.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead_name">Naam Lead *</Label>
                  <Input id="lead_name" value={formData.lead_name} onChange={e => handleChange('lead_name', e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input id="phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Input id="address" value={formData.address} onChange={e => handleChange('address', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={value => handleChange('status', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Bron</Label>
                  <Select value={formData.source} onValueChange={value => handleChange('source', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sources.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_value">Geschatte Waarde (€)</Label>
                  <Input id="estimated_value" type="number" value={formData.estimated_value} onChange={e => handleChange('estimated_value', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="assigned_to">
                    Toegewezen aan {formData.source === 'referral' && <span className="text-emerald-600">*</span>}
                  </Label>
                  <Select value={formData.assigned_to} onValueChange={value => handleChange('assigned_to', value)}>
                    <SelectTrigger><SelectValue placeholder="Wijs toe aan een schilder" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Niemand</SelectItem>
                      {painters.map(u => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.full_name || u.email}
                          {u.referral_code && ` (${u.referral_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.source === 'referral' && (
                    <p className="text-xs text-gray-500 mt-1">
                      * Voor referrals moet u een schilder toewijzen voor de punten
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notities</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} rows={4} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Annuleren</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? <InlineSpinner /> : <Save className="w-4 h-4 mr-2" />}
                {lead ? 'Wijzigingen Opslaan' : 'Lead Toevoegen'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}