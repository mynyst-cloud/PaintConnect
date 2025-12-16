import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Save, X, Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function MetingenTable({ metingen, onUpdate, onDelete, onRespeak, correctingIndex, onRoomNameChange, onRoomDelete }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [editingRoom, setEditingRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');

  const startEdit = (index, meting) => {
    setEditingIndex(index);
    setEditData({ ...meting });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditData({});
  };

  const saveEdit = () => {
    if (editData.oppervlakte <= 0) {
      toast.error('Oppervlakte moet groter dan 0 zijn');
      return;
    }
    if (editData.m2_prijs <= 0) {
      toast.error('Prijs moet groter dan 0 zijn');
      return;
    }
    if (editData.aantal_lagen <= 0) {
      toast.error('Aantal lagen moet groter dan 0 zijn');
      return;
    }

    onUpdate(editingIndex, editData);
    setEditingIndex(null);
    setEditData({});
    toast.success('Meting bijgewerkt');
  };

  const handleDelete = (index) => {
    if (window.confirm('Weet u zeker dat u deze meting wilt verwijderen?')) {
      onDelete(index);
      toast.success('Meting verwijderd');
    }
  };

  const startRoomEdit = (oldRoom) => {
    setEditingRoom(oldRoom);
    setNewRoomName(oldRoom);
  };

  const saveRoomEdit = (oldRoom) => {
    if (!newRoomName.trim()) {
      toast.error('Ruimtenaam mag niet leeg zijn');
      return;
    }

    onRoomNameChange(oldRoom, newRoomName);
    setEditingRoom(null);
    setNewRoomName('');
  };

  const cancelRoomEdit = () => {
    setEditingRoom(null);
    setNewRoomName('');
  };

  const handleRoomDelete = (room) => {
    const metingenCount = metingen.filter(m => m.ruimte === room).length;
    if (window.confirm(`Weet u zeker dat u de ruimte "${room}" met ${metingenCount} ${metingenCount === 1 ? 'meting' : 'metingen'} wilt verwijderen?`)) {
      onRoomDelete(room);
    }
  };

  // Group by room
  const grouped = metingen.reduce((acc, meting, index) => {
    const room = meting.ruimte || 'Onbekend';
    if (!acc[room]) acc[room] = [];
    acc[room].push({ ...meting, originalIndex: index });
    return acc;
  }, {});

  if (metingen.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📐 Metingen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Nog geen metingen toegevoegd. Start de spraakopname om metingen toe te voegen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📐 Metingen ({metingen.length})</span>
          <span className="text-sm font-normal text-gray-600">
            Totaal: {metingen.reduce((sum, m) => sum + m.oppervlakte, 0).toFixed(2)} m²
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([room, roomMetingen]) => (
          <div key={room} className="space-y-2">
            {editingRoom === room ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="font-semibold text-lg"
                  placeholder="Ruimtenaam"
                  autoFocus
                />
                <Button size="sm" onClick={() => saveRoomEdit(room)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={cancelRoomEdit}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h3 
                  className="font-semibold text-lg text-emerald-700 dark:text-emerald-400 cursor-pointer hover:text-emerald-600 flex items-center gap-2 group"
                  onClick={() => startRoomEdit(room)}
                  title="Klik om ruimtenaam te wijzigen"
                >
                  {room}
                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRoomDelete(room)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Verwijder hele ruimte"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {roomMetingen.map((meting) => {
                const isEditing = editingIndex === meting.originalIndex;
                const data = isEditing ? editData : meting;

                return (
                  <div
                    key={meting.originalIndex}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3"
                  >
                    {isEditing ? (
                      // Edit mode
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600">Type</label>
                            <Select
                              value={data.type}
                              onValueChange={(value) => setEditData({ ...data, type: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="wand">Wand</SelectItem>
                                <SelectItem value="plafond">Plafond</SelectItem>
                                <SelectItem value="kozijn">Kozijn</SelectItem>
                                <SelectItem value="deur">Deur</SelectItem>
                                <SelectItem value="plinten">Plinten</SelectItem>
                                <SelectItem value="raam">Raam</SelectItem>
                                <SelectItem value="overig">Overig</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Breedte (m)</label>
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8"
                              value={data.breedte || ''}
                              onChange={(e) => setEditData({ ...data, breedte: parseFloat(e.target.value) || null })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Hoogte (m)</label>
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8"
                              value={data.hoogte || ''}
                              onChange={(e) => setEditData({ ...data, hoogte: parseFloat(e.target.value) || null })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Oppervlakte (m²)</label>
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8"
                              value={data.oppervlakte}
                              onChange={(e) => setEditData({ ...data, oppervlakte: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600">Prijs per m²</label>
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8"
                              value={data.m2_prijs}
                              onChange={(e) => setEditData({ ...data, m2_prijs: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600">Aantal lagen</label>
                            <Input
                              type="number"
                              className="h-8"
                              value={data.aantal_lagen}
                              onChange={(e) => setEditData({ ...data, aantal_lagen: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">Notities</label>
                          <Textarea
                            rows={2}
                            className="text-sm"
                            value={data.notities || ''}
                            onChange={(e) => setEditData({ ...data, notities: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} className="bg-emerald-600 hover:bg-emerald-700">
                            <Save className="w-3 h-3 mr-1" />
                            Opslaan
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-3 h-3 mr-1" />
                            Annuleren
                          </Button>
                        </div>
                      </>
                    ) : (
                      // View mode
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                {data.type}
                              </span>
                              {data.breedte && data.hoogte && (
                                <span className="text-sm text-gray-600">
                                  ({data.breedte} × {data.hoogte} m)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-0.5">
                              <div>Oppervlakte: <strong>{data.oppervlakte.toFixed(2)} m²</strong></div>
                              <div>Prijs: €{data.m2_prijs} per m² × {data.aantal_lagen} {data.aantal_lagen === 1 ? 'laag' : 'lagen'}</div>
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                                Subtotaal: €{(data.oppervlakte * data.m2_prijs * data.aantal_lagen).toFixed(2)}
                              </div>
                              {data.notities && (
                                <div className="text-xs text-gray-500 italic mt-1">{data.notities}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRespeak(meting.originalIndex)}
                              className={`${correctingIndex === meting.originalIndex ? 'text-orange-600 bg-orange-100' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                              title="Opnieuw inspreken"
                            >
                              <Mic className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(meting.originalIndex, meting)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(meting.originalIndex)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}