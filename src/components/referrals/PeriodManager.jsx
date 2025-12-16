import React, { useState } from 'react';
import { ReferralPeriod } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { formatDate } from '@/components/utils';

export default function PeriodManager({ periods, companyId, onPeriodUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    bonus_amount: 0,
    points_per_referral: 1
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ReferralPeriod.create({
        ...formData,
        company_id: companyId
      });
      setShowForm(false);
      onPeriodUpdate(); // Triggers reload on parent
    } catch (error) {
      console.error("Failed to save period:", error);
      alert('Opslaan mislukt. Controleer de console voor details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-gray-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Periodes Beheren</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Periode
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="p-4 border rounded-lg mb-4 bg-gray-50 dark:bg-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Naam</Label>
                <Input placeholder="bv. Q3 2024" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <Label>Bonus Bedrag (€)</Label>
                <Input type="number" value={formData.bonus_amount} onChange={(e) => setFormData({...formData, bonus_amount: Number(e.target.value)})} />
              </div>
              <div>
                <Label>Startdatum</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div>
                <Label>Einddatum</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Opslaan
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuleren</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {periods.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Geen periodes gevonden. Maak de eerste aan!</p>
          ) : (
            periods.map(period => (
              <div key={period.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{period.name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">€{period.bonus_amount}</p>
                  <p className="text-xs text-gray-500">Bonus</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}