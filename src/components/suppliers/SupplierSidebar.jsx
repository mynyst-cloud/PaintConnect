
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MapPin, FileText, AlertTriangle, Building, Pencil, Trash2, GitMerge, Save, Loader2, Package, Ghost, Euro, TrendingUp, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Supplier, Material } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/components/utils';

export default function SupplierSidebar({ suppliers = [], invoices = [], materials = [], isOpen, onClose, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState(null);
  const [mergeTarget, setMergeTarget] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { toast } = useToast();

  // Calculate invoice counts per supplier name
  const invoiceCounts = invoices.reduce((acc, invoice) => {
    const supplierName = invoice.supplier_name;
    acc[supplierName] = (acc[supplierName] || 0) + 1;
    return acc;
  }, {});

  // Calculate material counts per supplier name
  const materialCounts = materials.reduce((acc, material) => {
    const supplierName = material.supplier;
    if (supplierName) {
      acc[supplierName] = (acc[supplierName] || 0) + 1;
    }
    return acc;
  }, {});

  // AANGEPAST: Calculate revenue statistics per supplier - alleen goedgekeurde facturen
  const revenueStats = useMemo(() => {
    const stats = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    suppliers.forEach(supplier => {
      // AANGEPAST: Filter alleen goedgekeurde facturen
      const supplierInvoices = invoices.filter(inv => 
        inv.status === 'approved' && 
        (inv.supplier_name === supplier.name || inv.supplier_vat === supplier.vat_number)
      );

      const totalRevenue = supplierInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      const monthlyRevenue = supplierInvoices
        .filter(inv => {
          if (!inv.invoice_date) return false;
          const invDate = new Date(inv.invoice_date);
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      stats[supplier.name] = {
        total: totalRevenue,
        monthly: monthlyRevenue,
        invoiceCount: supplierInvoices.length // Dit telt nu ook alleen goedgekeurde facturen
      };
    });

    return stats;
  }, [suppliers, invoices]);

  const detectDuplicates = () => {
    const duplicateGroups = {};
    
    suppliers.forEach((supplier, index) => {
      const normalizedName = supplier.name?.toLowerCase().trim();
      const vatNumber = supplier.vat_number?.toLowerCase().trim();
      
      suppliers.forEach((otherSupplier, otherIndex) => {
        if (index >= otherIndex) return;
        
        const otherNormalizedName = otherSupplier.name?.toLowerCase().trim();
        const otherVatNumber = otherSupplier.vat_number?.toLowerCase().trim();
        
        // Als beide leveranciers een BTW-nummer hebben
        if (vatNumber && otherVatNumber) {
          // Dan zijn ze alleen duplicaat als de BTW-nummers hetzelfde zijn
          if (vatNumber === otherVatNumber) {
            duplicateGroups[supplier.id] = true;
            duplicateGroups[otherSupplier.id] = true;
          }
          // Als BTW-nummers verschillen, skip deze vergelijking (geen duplicaat)
          return;
        }
        
        // Als een of beide geen BTW-nummer hebben, check op naamsgelijkenis
        const isSimilarName = normalizedName && otherNormalizedName && (
          normalizedName.includes(otherNormalizedName) || 
          otherNormalizedName.includes(normalizedName) ||
          calculateSimilarity(normalizedName, otherNormalizedName) > 0.8
        );
        
        if (isSimilarName) {
          duplicateGroups[supplier.id] = true;
          duplicateGroups[otherSupplier.id] = true;
        }
      });
    });
    
    return duplicateGroups;
  };

  const calculateSimilarity = (str1, str2) => {
    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);
    const intersection = bigrams1.filter(x => bigrams2.includes(x));
    return (2.0 * intersection.length) / (bigrams1.length + bigrams2.length);
  };

  const getBigrams = (str) => {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const duplicates = detectDuplicates();

  const filteredSuppliers = suppliers.filter(supplier => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      supplier.name?.toLowerCase().includes(search) ||
      supplier.owner_email?.toLowerCase().includes(search) ||
      supplier.vat_number?.toLowerCase().includes(search) ||
      supplier.address?.toLowerCase().includes(search) ||
      supplier.phone_number?.toLowerCase().includes(search)
    );
  });

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (duplicates[a.id] && !duplicates[b.id]) return -1;
    if (!duplicates[a.id] && duplicates[b.id]) return 1;
    
    const countA = invoiceCounts[a.name] || 0;
    const countB = invoiceCounts[b.name] || 0;
    if (countA !== countB) return countB - countA;
    
    return (a.name || '').localeCompare(b.name || '');
  });

  const handleEdit = (supplier) => {
    // Ook virtuele profielen kunnen nu bewerkt worden
    setEditingSupplier({ ...supplier });
  };

  const handleCancelEdit = () => {
    setEditingSupplier(null);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Ongeldig bestand",
        description: "Selecteer een geldig afbeeldingsbestand (PNG, JPG, etc.)"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Bestand te groot",
        description: "Logo mag maximaal 5MB zijn."
      });
      return;
    }

    setUploadingLogo(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setEditingSupplier({
        ...editingSupplier,
        logo_url: file_url
      });

      toast({
        title: "Logo geüpload",
        description: "Logo succesvol toegevoegd."
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        variant: "destructive",
        title: "Upload mislukt",
        description: "Kon logo niet uploaden. Probeer opnieuw."
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!editingSupplier || !editingSupplier.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Naam is verplicht."
      });
      return;
    }

    if (!editingSupplier.owner_email?.trim()) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "E-mail is verplicht."
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const supplierData = {
        name: editingSupplier.name.trim(),
        owner_email: editingSupplier.owner_email.trim(),
        phone_number: editingSupplier.phone_number || null,
        address: editingSupplier.address || null,
        vat_number: editingSupplier.vat_number || null,
        logo_url: editingSupplier.logo_url || null,
        specialties: editingSupplier.specialties || [],
        status: 'active'
      };

      if (editingSupplier.isVirtual) {
        // Voor virtuele profielen: maak een nieuw Supplier record aan
        await Supplier.create(supplierData);

        toast({
          title: "✅ Leveranciersprofiel aangemaakt",
          description: `${editingSupplier.name} is nu een volledig leveranciersprofiel en kan worden beheerd.`
        });
      } else {
        // Voor bestaande leveranciers: update het record
        await Supplier.update(editingSupplier.id, supplierData);

        toast({
          title: "Opgeslagen",
          description: "Leverancier succesvol bijgewerkt."
        });
      }

      setEditingSupplier(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: `Kon leverancier niet opslaan: ${error.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (supplier.isVirtual) {
      toast({
        title: "Kan niet verwijderen",
        description: "Deze leverancier is virtueel en kan niet verwijderd worden. Verwijder eerst alle materialen en facturen, of maak een profiel aan en deactiveer deze.",
        variant: "destructive"
      });
      return;
    }

    const materialCount = materialCounts[supplier.name] || 0;
    const invoiceCount = invoiceCounts[supplier.name] || 0;

    if (materialCount > 0 || invoiceCount > 0) {
      const confirmed = window.confirm(
        `Deze leverancier heeft ${materialCount} materiaal/materialen en ${invoiceCount} factuur/facturen. ` +
        `De leverancier wordt gedeactiveerd, maar de gekoppelde data blijft behouden. Doorgaan?`
      );
      
      if (!confirmed) return;

      try {
        await Supplier.update(supplier.id, { status: 'suspended' });
        
        toast({
          title: "Leverancier gedeactiveerd",
          description: `${supplier.name} is gedeactiveerd. Materialen en facturen blijven behouden.`
        });

        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Error deactivating supplier:", error);
        toast({
          variant: "destructive",
          title: "Fout",
          description: "Kon leverancier niet deactiveren."
        });
      }
    } else {
      const confirmed = window.confirm(
        `Weet u zeker dat u ${supplier.name} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`
      );
      
      if (!confirmed) return;

      try {
        await Supplier.delete(supplier.id);
        
        toast({
          title: "Verwijderd",
          description: `${supplier.name} is succesvol verwijderd.`
        });

        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        toast({
          variant: "destructive",
          title: "Fout",
          description: "Kon leverancier niet verwijderen."
        });
      }
    }
  };

  const handleInitiateMerge = (supplier) => {
    setMergeSource(supplier);
    setMergeDialogOpen(true);
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Selecteer een doel-leverancier om mee samen te voegen."
      });
      return;
    }

    if (mergeSource.id === mergeTarget) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kan een leverancier niet met zichzelf samenvoegen."
      });
      return;
    }

    const targetSupplier = suppliers.find(s => s.id === mergeTarget);
    if (!targetSupplier) return;

    const confirmed = window.confirm(
      `Weet u zeker dat u "${mergeSource.name}" wilt samenvoegen met "${targetSupplier.name}"?\n\n` +
      `Alle materialen en facturen van "${mergeSource.name}" worden gekoppeld aan "${targetSupplier.name}".\n` +
      `"${mergeSource.name}" wordt daarna verwijderd.`
    );

    if (!confirmed) return;

    setIsMerging(true);

    try {
      // Update all materials pointing to source supplier
      const materialsToUpdate = materials.filter(m => m.supplier === mergeSource.name);
      for (const material of materialsToUpdate) {
        await Material.update(material.id, { supplier: targetSupplier.name });
      }

      toast({
        title: "Materialen bijgewerkt",
        description: `${materialsToUpdate.length} materialen gekoppeld aan ${targetSupplier.name}.`
      });

      // If source is not virtual, delete the Supplier entity record
      if (!mergeSource.isVirtual) {
        await Supplier.delete(mergeSource.id);
      }

      toast({
        title: "Samenvoegen voltooid",
        description: `${mergeSource.name} is succesvol samengevoegd met ${targetSupplier.name}.`
      });

      setMergeDialogOpen(false);
      setMergeSource(null);
      setMergeTarget(null);
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error merging suppliers:", error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon leveranciers niet samenvoegen."
      });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[700px] bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Leveranciers Overzicht
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {suppliers.length} leveranciers
                      {Object.keys(duplicates).length > 0 && ` • ${Object.keys(duplicates).length} mogelijke duplicaten`}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      ✓ Omzetstatistieken gebaseerd op goedgekeurde facturen
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <Input
                  placeholder="Zoek leverancier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {sortedSuppliers.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'Geen leveranciers gevonden' : 'Nog geen leveranciers'}
                    </p>
                  </div>
                ) : (
                  sortedSuppliers.map((supplier) => {
                    // This invoiceCount is for ALL invoices, not just approved ones.
                    // The revenue.invoiceCount already reflects approved ones.
                    const invoiceCount = invoiceCounts[supplier.name] || 0; 
                    const materialCount = materialCounts[supplier.name] || 0;
                    const revenue = revenueStats[supplier.name] || { total: 0, monthly: 0, invoiceCount: 0 };
                    const isDuplicate = duplicates[supplier.id];
                    const isEditing = editingSupplier?.id === supplier.id;
                    const isVirtual = supplier.isVirtual;

                    return (
                      <Card key={supplier.id} className={`${isDuplicate ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' : ''} ${isVirtual ? 'border-dashed border-2 border-gray-300' : ''}`}>
                        {isEditing ? (
                          <CardContent className="pt-6 space-y-4">
                            {isVirtual && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                  <strong>Virtueel profiel omzetten:</strong> Door op te slaan wordt er een volledig leveranciersprofiel aangemaakt dat je later kunt beheren.
                                </p>
                              </div>
                            )}

                            {/* Logo Upload Section */}
                            <div className="space-y-2">
                              <Label>Leveranciers Logo</Label>
                              <div className="flex items-center gap-4">
                                {editingSupplier.logo_url ? (
                                  <div className="relative">
                                    <img
                                      src={editingSupplier.logo_url}
                                      alt="Leveranciers logo"
                                      className="w-24 h-24 object-contain border rounded-lg"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute -top-2 -right-2 h-6 w-6"
                                      onClick={() => setEditingSupplier({...editingSupplier, logo_url: null})}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                
                                <div className="flex-1">
                                  <Input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={uploadingLogo}
                                  />
                                  <Label htmlFor="logo-upload">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={uploadingLogo}
                                      className="cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('logo-upload').click();
                                      }}
                                    >
                                      {uploadingLogo ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Uploaden...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="w-4 h-4 mr-2" />
                                          Upload Logo
                                        </>
                                      )}
                                    </Button>
                                  </Label>
                                  <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG max 5MB
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Naam *</Label>
                                <Input
                                  value={editingSupplier.name || ''}
                                  onChange={(e) => setEditingSupplier({...editingSupplier, name: e.target.value})}
                                  placeholder="Leveranciersnaam"
                                />
                              </div>
                              <div>
                                <Label>E-mail *</Label>
                                <Input
                                  type="email"
                                  value={editingSupplier.owner_email || ''}
                                  onChange={(e) => setEditingSupplier({...editingSupplier, owner_email: e.target.value})}
                                  placeholder="info@leverancier.be"
                                />
                              </div>
                              <div>
                                <Label>Telefoonnummer</Label>
                                <Input
                                  value={editingSupplier.phone_number || ''}
                                  onChange={(e) => setEditingSupplier({...editingSupplier, phone_number: e.target.value})}
                                  placeholder="+32 123 45 67 89"
                                />
                              </div>
                              <div>
                                <Label>BTW-nummer</Label>
                                <Input
                                  value={editingSupplier.vat_number || ''}
                                  onChange={(e) => setEditingSupplier({...editingSupplier, vat_number: e.target.value})}
                                  placeholder="BE0123456789"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Adres</Label>
                                <Input
                                  value={editingSupplier.address || ''}
                                  onChange={(e) => setEditingSupplier({...editingSupplier, address: e.target.value})}
                                  placeholder="Straat 123, 1000 Brussel"
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                              >
                                Annuleren
                              </Button>
                              <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isVirtual ? 'Profiel aanmaken...' : 'Opslaan...'}
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isVirtual ? 'Profiel aanmaken' : 'Opslaan'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        ) : (
                          <>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  {supplier.logo_url ? (
                                    <img
                                      src={supplier.logo_url}
                                      alt={`${supplier.name} logo`}
                                      className="w-12 h-12 object-contain border rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                                      <Building className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                                      {isVirtual && <Ghost className="w-4 h-4 text-gray-400" />}
                                      {supplier.name || 'Naamloze Leverancier'}
                                      {isDuplicate && (
                                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Mogelijk duplicaat
                                        </Badge>
                                      )}
                                      {isVirtual && (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                                          <Ghost className="w-3 h-3 mr-1" />
                                          Virtueel profiel
                                        </Badge>
                                      )}
                                    </CardTitle>
                                    {supplier.vat_number && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        BTW: {supplier.vat_number}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Statistics Section - AANGEPAST: Toon alleen goedgekeurde facturen */}
                              <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Euro className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Deze maand</span>
                                  </div>
                                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                    {formatCurrency(revenue.monthly)}
                                  </p>
                                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Goedgekeurd</p>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Totaal omzet</span>
                                  </div>
                                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                    {formatCurrency(revenue.total)}
                                  </p>
                                  <p className="text-[10px] text-blue-600 dark:text-blue-400">Goedgekeurd</p>
                                </div>

                                <Badge variant="secondary" className="justify-center py-2">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {revenue.invoiceCount} {revenue.invoiceCount === 1 ? 'goedgekeurde factuur' : 'goedgekeurde facturen'}
                                </Badge>
                                
                                <Badge variant="outline" className="justify-center py-2">
                                  <Package className="w-3 h-3 mr-1" />
                                  {materialCount} {materialCount === 1 ? 'materiaal' : 'materialen'}
                                </Badge>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                              {supplier.address && (
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700 dark:text-gray-300">{supplier.address}</span>
                                </div>
                              )}

                              {(supplier.owner_email || supplier.phone_number) && <Separator />}

                              <div className="flex flex-wrap gap-2">
                                {supplier.owner_email && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => window.location.href = `mailto:${supplier.owner_email}`}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    E-mail
                                  </Button>
                                )}
                                
                                {supplier.phone_number && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => window.location.href = `tel:${supplier.phone_number}`}
                                  >
                                    <Phone className="w-4 h-4 mr-2" />
                                    Bellen
                                  </Button>
                                )}
                              </div>

                              {(supplier.owner_email || supplier.phone_number) && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {supplier.owner_email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3" />
                                      <span>{supplier.owner_email}</span>
                                    </div>
                                  )}
                                  {supplier.phone_number && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3 h-3" />
                                      <span>{supplier.phone_number}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {supplier.specialties && supplier.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {supplier.specialties.map((specialty, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <Separator />

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(supplier)}
                                  className="flex-1"
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  {isVirtual ? 'Profiel aanmaken' : 'Bewerken'}
                                </Button>
                                
                                {isDuplicate && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleInitiateMerge(supplier)}
                                    className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  >
                                    <GitMerge className="w-4 h-4 mr-2" />
                                    Samenvoegen
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(supplier)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={isVirtual}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Verwijderen
                                </Button>
                              </div>
                            </CardContent>
                          </>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leveranciers Samenvoegen</DialogTitle>
            <DialogDescription>
              Voeg "{mergeSource?.name}" samen met een andere leverancier. Alle materialen en facturen worden overgezet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Samenvoegen met:</Label>
              <Select value={mergeTarget || ''} onValueChange={setMergeTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer doel-leverancier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter(s => s.id !== mergeSource?.id)
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.isVirtual && <Ghost className="w-3 h-3 inline mr-1" />}
                        {s.name}
                        <span className="text-xs text-gray-500 ml-2">
                          ({materialCounts[s.name] || 0} materialen, {invoiceCounts[s.name] || 0} facturen)
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {mergeSource && mergeTarget && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Wat gebeurt er:</h4>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• {materialCounts[mergeSource.name] || 0} materialen worden overgezet</li>
                  <li>• Facturen blijven gekoppeld aan de naam "{mergeSource.name}"</li>
                  <li>• "{mergeSource.name}" wordt {mergeSource.isVirtual ? 'samengevoegd' : 'verwijderd'}</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMergeDialogOpen(false);
                setMergeSource(null);
                setMergeTarget(null);
              }}
              disabled={isMerging}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeTarget || isMerging}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Samenvoegen...
                </>
              ) : (
                <>
                  <GitMerge className="w-4 h-4 mr-2" />
                  Samenvoegen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
