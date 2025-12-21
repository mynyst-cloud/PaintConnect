import React, { useState } from 'react';
import { MaterialPriceApproval, Material, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  Percent,
  Euro,
  Edit3,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// BUGFIX 3: Helper functie voor numerieke parsing
const parseNumericInput = (value, fallback) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

const MaterialApprovalPanel = ({ approvals, onApprovalAction, onRefresh }) => {
  const [editingApproval, setEditingApproval] = useState(null);
  const [notes, setNotes] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDiscount, setEditedDiscount] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [processingApproval, setProcessingApproval] = useState(null); // BUGFIX 4: Race condition prevention
  const [isRefreshing, setIsRefreshing] = useState(false); // BUGFIX 9: Loading state tijdens refresh

  // BUGFIX 6: Consistente discount logic
  const getDiscount = (approval, customData) => {
    if (customData?.discount !== undefined) return customData.discount;
    if (editedDiscount !== '') return parseNumericInput(editedDiscount, 0);
    return approval.new_discount ?? approval.current_discount ?? 0;
  };

  const handleApprove = async (approval, customData = null) => {
    if (processingApproval === approval.id) return; // BUGFIX 4: Prevent double-click
    
    setProcessingApproval(approval.id);
    
    try {
      const user = await User.me();
      
      // BUGFIX 5: Validatie voor nieuwe materialen
      if (approval.change_type === 'new_material' && editingApproval?.id === approval.id && !editedCategory) {
        alert('Selecteer eerst een categorie voor het nieuwe materiaal');
        setProcessingApproval(null);
        return;
      }

      // BUGFIX 2: EERST Material aanmaken/updaten (voordat approval status wordt aangepast)
      if (approval.change_type === 'new_material') {
        await Material.create({
          company_id: approval.company_id,
          name: approval.material_name,
          category: customData?.category || editedCategory || approval.suggested_category || 'onbekend',
          unit: approval.unit,
          price_excl_vat: customData?.price ?? parseNumericInput(editedPrice, approval.new_price), // BUGFIX 3
          discount_percentage: getDiscount(approval, customData), // BUGFIX 6
          vat_rate: 21,
          sku: approval.sku || null, // BUGFIX 7: Null check
          supplier: approval.supplier_name,
          is_active: true,
          notes: `Toegevoegd via factuur op ${new Date().toLocaleDateString('nl-NL')}`
        });
      } else {
        await Material.update(approval.material_id, {
          price_excl_vat: customData?.price ?? parseNumericInput(editedPrice, approval.new_price), // BUGFIX 3
          discount_percentage: getDiscount(approval, customData) // BUGFIX 6
        });
      }

      // BUGFIX 2: PAS DAARNA approval status updaten (alleen als Material operatie succesvol was)
      await MaterialPriceApproval.update(approval.id, {
        status: 'approved',
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        notes: notes || null
      });

      // Reset ALL state
      setEditingApproval(null);
      setNotes('');
      setEditedPrice('');
      setEditedDiscount('');
      setEditedCategory('');
      
      // BUGFIX 9: Loading state tijdens refresh
      setIsRefreshing(true);
      if (onApprovalAction) await onApprovalAction();
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Error approving:', error);
      // BUGFIX 2: Specifieke foutmelding
      alert('Fout bij goedkeuren: ' + (error.message || 'Onbekende fout. Probeer opnieuw.'));
    } finally {
      setProcessingApproval(null);
      setIsRefreshing(false);
    }
  };

  const handleReject = async (approval) => {
    if (processingApproval === approval.id) return; // BUGFIX 4: Prevent double-click
    
    setProcessingApproval(approval.id);
    
    try {
      const user = await User.me();
      
      await MaterialPriceApproval.update(approval.id, {
        status: 'rejected',
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        notes: notes || null
      });

      // BUGFIX 1: Reset ALL state (inclusief edited fields)
      setEditingApproval(null);
      setNotes('');
      setEditedPrice('');
      setEditedDiscount('');
      setEditedCategory('');
      
      setIsRefreshing(true);
      if (onApprovalAction) await onApprovalAction();
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Fout bij afwijzen: ' + error.message);
    } finally {
      setProcessingApproval(null);
      setIsRefreshing(false);
    }
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'new_material':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'price_change':
        return <Euro className="w-4 h-4 text-orange-600" />;
      case 'discount_change':
        return <Percent className="w-4 h-4 text-purple-600" />;
      case 'both_change':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getChangeLabel = (changeType) => {
    const labels = {
      new_material: 'Nieuw Materiaal',
      price_change: 'Prijswijziging',
      discount_change: 'Kortingswijziging',
      both_change: 'Prijs & Korting'
    };
    return labels[changeType] || changeType;
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  if (pendingApprovals.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Materiaal Goedkeuringen
            {isRefreshing && <InlineSpinner />}
          </CardTitle>
          <Badge variant="outline" className="bg-white dark:bg-slate-800">
            {pendingApprovals.length} in behandeling
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {pendingApprovals.map((approval) => (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getChangeIcon(approval.change_type)}
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                      {approval.material_name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getChangeLabel(approval.change_type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {approval.supplier_name} • {approval.quantity} {approval.unit}
                    {approval.sku && <span className="ml-2">• SKU: {approval.sku}</span>}
                  </p>
                </div>
              </div>

              {/* Change Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Price comparison */}
                {(approval.change_type === 'price_change' || approval.change_type === 'both_change' || approval.change_type === 'new_material') && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-slate-400">Prijs excl. BTW</Label>
                    <div className="flex items-center gap-2">
                      {approval.current_price !== null && (
                        <>
                          <span className="line-through text-gray-400">
                            €{approval.current_price.toFixed(2)}
                          </span>
                          {approval.new_price > approval.current_price ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-green-600" />
                          )}
                        </>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        €{approval.new_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Discount comparison */}
                {(approval.change_type === 'discount_change' || approval.change_type === 'both_change') && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-slate-400">Korting</Label>
                    <div className="flex items-center gap-2">
                      {approval.current_discount !== null && (
                        <span className="line-through text-gray-400">
                          {approval.current_discount}%
                        </span>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {approval.new_discount || 0}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Mode */}
              {editingApproval?.id === approval.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                >
                  {approval.change_type === 'new_material' && (
                    <div>
                      <Label className="text-sm">Categorie <span className="text-red-500">*</span></Label>
                      <Select value={editedCategory} onValueChange={setEditedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verf">Verf</SelectItem>
                          <SelectItem value="primer">Primer</SelectItem>
                          <SelectItem value="lak">Lak</SelectItem>
                          <SelectItem value="klein_materiaal">Klein Materiaal</SelectItem>
                          <SelectItem value="toebehoren">Toebehoren</SelectItem>
                          <SelectItem value="onbekend">Onbekend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Prijs (excl. BTW)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={approval.new_price.toFixed(2)}
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Korting (%)</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder={String(approval.new_discount || 0)}
                        value={editedDiscount}
                        onChange={(e) => setEditedDiscount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Notities (optioneel)</Label>
                    <Textarea
                      placeholder="Voeg eventuele notities toe..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {editingApproval?.id === approval.id ? (
                  <>
                    <Button
                      onClick={() => handleApprove(approval)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      disabled={processingApproval === approval.id || isRefreshing}
                    >
                      {processingApproval === approval.id ? (
                        <>
                          <InlineSpinner />
                          Verwerken...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Bevestig Wijzigingen
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingApproval(null);
                        setEditedPrice('');
                        setEditedDiscount('');
                        setEditedCategory('');
                        setNotes('');
                      }}
                      variant="outline"
                      size="sm"
                      disabled={processingApproval === approval.id || isRefreshing}
                    >
                      Annuleer
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleApprove(approval)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      disabled={processingApproval === approval.id || isRefreshing}
                    >
                      {processingApproval === approval.id ? (
                        <>
                          <InlineSpinner />
                          Verwerken...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Goedkeuren
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingApproval(approval);
                        setEditedPrice(String(approval.new_price));
                        setEditedDiscount(String(approval.new_discount || 0));
                        setEditedCategory(approval.suggested_category || 'onbekend');
                      }}
                      variant="outline"
                      size="sm"
                      disabled={processingApproval !== null || isRefreshing}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Bewerken
                    </Button>
                    <Button
                      onClick={() => handleReject(approval)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      disabled={processingApproval === approval.id || isRefreshing}
                    >
                      {processingApproval === approval.id ? (
                        <>
                          <InlineSpinner />
                          Verwerken...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Afwijzen
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default MaterialApprovalPanel;