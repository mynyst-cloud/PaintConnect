import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Save,
  FileText,
  Calendar,
  Euro,
  Package,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Brain,
  Sparkles,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/components/utils';
import { base44 } from '@/api/base44Client';
import { useToast } from "@/components/ui/use-toast";
import PDFViewer from '@/components/common/PDFViewer';

export default function InvoiceReviewModal({ invoice, onClose, onApprove, onReject, materials, currentUser }) {
  const [editedInvoice, setEditedInvoice] = useState({
    total_amount: invoice.total_amount,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    document_type: invoice.document_type || 'onbekend',
    line_items: invoice.line_items || []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isTeaching, setIsTeaching] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const { toast } = useToast();

  const calculatedTotal = editedInvoice.line_items.reduce(
    (sum, item) => sum + (parseFloat(item.total_price) || 0), 
    0
  );

  const calculatedTotalInclVat = editedInvoice.line_items.reduce((sum, item) => {
    const excl = parseFloat(item.total_price) || 0;
    const vat = parseFloat(item.vat_rate) || 21;
    return sum + excl * (1 + vat / 100);
  }, 0);

  const difference = editedInvoice.total_amount - calculatedTotal;
  const isValid = Math.abs(difference) < 5.0;

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...editedInvoice.line_items];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: field === 'quantity' || field === 'unit_price' || field === 'discount' || field === 'total_price' || field === 'gross_unit_price' || field === 'vat_rate'
        ? parseFloat(value) || 0 
        : value
    };

    if (field === 'quantity' || field === 'gross_unit_price' || field === 'discount') {
      const item = newLineItems[index];
      const grossPrice = parseFloat(item.gross_unit_price) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      const discountPercentage = parseFloat(item.discount) || 0;
      
      const netUnitPrice = grossPrice * (1 - (discountPercentage / 100));
      newLineItems[index].unit_price = Math.round(netUnitPrice * 100) / 100;
      newLineItems[index].total_price = Math.round(netUnitPrice * quantity * 100) / 100;
    }

    setEditedInvoice({ ...editedInvoice, line_items: newLineItems });
  };

  const handleSave = async () => {
    try {
      await base44.entities.SupplierInvoice.update(invoice.id, editedInvoice);
      
      toast({
        title: "✅ Opgeslagen",
        description: "Wijzigingen zijn opgeslagen.",
        duration: 3000
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        variant: "destructive",
        title: "❌ Fout",
        description: "Kon wijzigingen niet opslaan.",
        duration: 3000
      });
    }
  };

  const handleSaveAndApprove = () => {
    onApprove({
      ...invoice,
      ...editedInvoice,
      status: 'approved'
    });
  };

  const handleReject = () => {
    onReject(invoice);
  };

  const handleTeachTemplate = async () => {
    setIsTeaching(true);
    
    try {
      const normalizedSupplierName = invoice.supplier_name.toUpperCase().replace(/[^A-Z]/g, '');
      
      const existingTemplates = await base44.entities.SupplierTemplate.filter({
        company_id: invoice.company_id,
        supplier_name_normalized: normalizedSupplierName
      });
      
      if (existingTemplates && existingTemplates.length > 0) {
        const template = existingTemplates[0];
        await base44.entities.SupplierTemplate.update(template.id, {
          success_count: template.success_count + 1,
          total_usage_count: template.total_usage_count + 1,
          accuracy_score: (template.success_count + 1) / (template.total_usage_count + 1),
          last_used_at: new Date().toISOString(),
          version: `v${parseFloat(template.version.replace('v', '')) + 0.1}`.replace('.', '.')
        });
        
        toast({
          title: "✅ Template verbeterd!",
          description: `Template voor ${invoice.supplier_name} is bijgewerkt met deze factuur als referentie.`,
          duration: 5000
        });
      } else {
        await base44.entities.SupplierTemplate.create({
          company_id: invoice.company_id,
          supplier_name: invoice.supplier_name,
          supplier_name_normalized: normalizedSupplierName,
          invoice_number_prefix: invoice.invoice_number?.substring(0, 2) || null,
          has_gross_price_column: true,
          success_count: 1,
          total_usage_count: 1,
          accuracy_score: 1.0,
          last_used_at: new Date().toISOString(),
          version: "v1.0",
          is_active: true
        });
        
        toast({
          title: "🎉 Nieuwe template aangemaakt!",
          description: `Vanaf nu worden facturen van ${invoice.supplier_name} sneller en nauwkeuriger verwerkt.`,
          duration: 5000
        });
      }
      
    } catch (error) {
      console.error("Error teaching template:", error);
      toast({
        variant: "destructive",
        title: "❌ Fout",
        description: "Kon template niet opslaan. Probeer het opnieuw.",
        duration: 3000
      });
    } finally {
      setIsTeaching(false);
    }
  };

  // Normaliseer materiaalnaam voor betere matching
  const normalizeMaterialName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\d+\s*(l|liter|lt|kg|ml|g|m|cm|mm)\b/gi, '') // Verwijder volume/gewicht (10L, 5kg, etc.)
      .replace(/\b(ral|ncs|pantone)\s*\d+/gi, '') // Verwijder kleurcodes (RAL 9016, NCS S1000-N)
      .replace(/\b(sf|op|lichte|donkere|kleur|wit|zwart|grijs|basis)\b/gi, '') // Verwijder kleur-gerelateerde woorden
      .replace(/[^a-z0-9]/g, '') // Verwijder speciale tekens
      .replace(/\s+/g, '') // Verwijder alle spaties
      .trim();
  };

  // Zoek bestaand materiaal met fuzzy matching
  const findExistingMaterial = (itemName, allMaterials, companyId) => {
    if (!itemName || !allMaterials) return null;
    
    const normalizedItemName = normalizeMaterialName(itemName);
    
    // Eerst: exacte match op naam
    let match = allMaterials.find(m =>
      m.company_id === companyId &&
      m.name.toLowerCase() === itemName.toLowerCase()
    );
    if (match) return match;
    
    // Tweede: genormaliseerde match
    match = allMaterials.find(m =>
      m.company_id === companyId &&
      normalizeMaterialName(m.name) === normalizedItemName
    );
    if (match) return match;
    
    // Derde: check of genormaliseerde naam bevat is in bestaand materiaal of andersom
    match = allMaterials.find(m => {
      if (m.company_id !== companyId) return false;
      const normalizedExisting = normalizeMaterialName(m.name);
      // Minimaal 6 karakters voor substring match om false positives te voorkomen
      if (normalizedItemName.length >= 6 && normalizedExisting.length >= 6) {
        return normalizedExisting.includes(normalizedItemName) || 
               normalizedItemName.includes(normalizedExisting);
      }
      return false;
    });
    
    return match || null;
  };

  const getStatusBadgeConfig = (item, allMaterials, invoiceCompanyId) => {
    const existingMaterial = findExistingMaterial(item.name, allMaterials, invoiceCompanyId);

    if (!existingMaterial) {
      return {
        icon: Plus,
        label: 'Nieuw Materiaal',
        className: 'bg-blue-100 text-blue-700 border-blue-300',
        message: 'Nieuw materiaal'
      };
    }

    const currentPrice = parseFloat(item.unit_price) || 0;
    const existingPrice = parseFloat(existingMaterial.price_excl_vat) || 0;
    const currentDiscount = parseInt(item.discount) || 0;
    const existingDiscount = parseInt(existingMaterial.discount_percentage) || 0;

    let changes = [];
    if (currentPrice > existingPrice + 0.01) {
      changes.push(`prijs gestegen met €${(currentPrice - existingPrice).toFixed(2)}`);
    } else if (currentPrice < existingPrice - 0.01) {
      changes.push(`prijs gedaald met €${(existingPrice - currentPrice).toFixed(2)}`);
    }

    if (currentDiscount > existingDiscount) {
      changes.push(`korting gestegen met ${currentDiscount - existingDiscount}%`);
    } else if (currentDiscount < existingDiscount) {
      changes.push(`korting gedaald met ${existingDiscount - currentDiscount}%`);
    }

    if (changes.length === 0) {
      return {
        icon: Minus,
        label: 'In Materiaalbeheer',
        className: 'bg-gray-100 text-gray-600 border-gray-300',
        message: 'Bestaand materiaal, geen wijzigingen'
      };
    }

    const message = changes.join(' en ');

    // Beide ongunstig
    if (currentPrice > existingPrice + 0.01 && currentDiscount < existingDiscount) {
      return {
        icon: TrendingUp,
        label: 'Ongunstig Gewijzigd',
        className: 'bg-red-100 text-red-700 border-red-300',
        message: `Ongunstige wijziging: ${message}`
      };
    }
    
    // Beide gunstig
    if (currentPrice < existingPrice - 0.01 && currentDiscount > existingDiscount) {
      return {
        icon: TrendingDown,
        label: 'Gunstig Gewijzigd',
        className: 'bg-green-100 text-green-700 border-green-300',
        message: `Gunstige wijziging: ${message}`
      };
    }
    
    // Prijs gestegen
    if (currentPrice > existingPrice + 0.01) {
      return {
        icon: ArrowUp,
        label: 'Prijs Gestegen',
        className: 'bg-red-100 text-red-700 border-red-300',
        message
      };
    }
    
    // Prijs gedaald
    if (currentPrice < existingPrice - 0.01) {
      return {
        icon: ArrowDown,
        label: 'Prijs Gedaald',
        className: 'bg-green-100 text-green-700 border-green-300',
        message
      };
    }
    
    // Korting gestegen (gunstiger)
    if (currentDiscount > existingDiscount) {
      return {
        icon: ArrowDown,
        label: 'Korting Gestegen',
        className: 'bg-green-100 text-green-700 border-green-300',
        message
      };
    }
    
    // Korting gedaald (ongunstiger)
    if (currentDiscount < existingDiscount) {
      return {
        icon: ArrowUp,
        label: 'Korting Gedaald',
        className: 'bg-red-100 text-red-700 border-red-300',
        message
      };
    }

    return {
      icon: Minus,
      label: 'In Materiaalbeheer',
      className: 'bg-gray-100 text-gray-600 border-gray-300',
      message: 'Bestaand materiaal, geen wijzigingen'
    };
  };

  const getLowConfidenceItems = () => {
    return editedInvoice.line_items.filter(item => 
      (item.confidence || 1) < 0.8
    );
  };

  const lowConfItems = getLowConfidenceItems();

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl"
        initial={{ scale: 0.95, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Factuur Review
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {invoice.supplier_name} • {invoice.invoice_number || 'Geen nummer'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* PAYMENT STATUS BANNER */}
          {invoice.payment_status === 'paid' && (
            <div className="mb-6 p-5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8" />
                  <div>
                    <div className="text-xl font-bold">FACTUUR REEDS VOLLEDIG BETAALD</div>
                    <div className="text-sm">Via {invoice.paid_via === 'bancontact' ? 'Bancontact' : 'Overschrijving'}</div>
                  </div>
                </div>
                <div className="text-3xl font-bold">€0,00</div>
              </div>
            </div>
          )}

          {/* Status Banner */}
          {invoice.status === 'needs_manual_review' && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100">Handmatige Controle Vereist</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {invoice.notes || 'Deze factuur vereist handmatige verificatie voordat deze kan worden goedgekeurd.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {invoice.status === 'needs_quick_review' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Snelle Controle Aanbevolen</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {invoice.notes || 'Er is een klein verschil gedetecteerd. Controleer kort of alles klopt.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Document Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Type
            </label>
            <Select 
              value={editedInvoice.document_type} 
              onValueChange={(value) => setEditedInvoice({...editedInvoice, document_type: value})}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="factuur">✓ Factuur</SelectItem>
                <SelectItem value="creditnota">💰 Creditnota</SelectItem>
                <SelectItem value="leveringsbon">📦 Leveringsbon</SelectItem>
                <SelectItem value="pakbon">📋 Pakbon</SelectItem>
                <SelectItem value="afhaalbon">🚗 Afhaalbon</SelectItem>
                <SelectItem value="bestelbon">🛒 Bestelbon</SelectItem>
                <SelectItem value="orderbevestiging">✉️ Orderbevestiging</SelectItem>
                <SelectItem value="offerte">📊 Offerte</SelectItem>
                <SelectItem value="pro_forma">📄 Pro Forma</SelectItem>
                <SelectItem value="retourbon">↩️ Retourbon</SelectItem>
                <SelectItem value="te_beoordelen">⚠️ Te beoordelen</SelectItem>
                <SelectItem value="onbekend">❓ Onbekend</SelectItem>
              </SelectContent>
            </Select>
            {editedInvoice.document_type !== 'factuur' && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                ⚠️ Dit document is geen factuur. Overweeg om dit af te wijzen of handmatig te verwerken.
              </p>
            )}
          </div>

          {/* Invoice Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Factuurdatum</span>
              </div>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedInvoice.invoice_date || ''}
                  onChange={(e) => setEditedInvoice({...editedInvoice, invoice_date: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(invoice.invoice_date)}
                </p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Vervaldatum</span>
              </div>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedInvoice.due_date || ''}
                  onChange={(e) => setEditedInvoice({...editedInvoice, due_date: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(invoice.due_date)}
                </p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                <Euro className="w-4 h-4" />
                <span>Factuurtotaal</span>
              </div>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={editedInvoice.total_amount || 0}
                  onChange={(e) => setEditedInvoice({...editedInvoice, total_amount: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(invoice.total_amount)}
                </p>
              )}
            </div>

            <div className={`rounded-lg p-4 ${
              Math.abs(difference) < 0.10 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : Math.abs(difference) < 5.0
                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                <Package className="w-4 h-4" />
                <span>Berekend totaal</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(calculatedTotal)}
              </p>
              <p className={`text-xs mt-1 ${
                Math.abs(difference) < 0.10 
                  ? 'text-green-600' 
                  : Math.abs(difference) < 5.0
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                {difference > 0 ? '+' : ''}{formatCurrency(difference)} verschil
              </p>
            </div>
          </div>

          {/* Low Confidence Warning */}
          {lowConfItems.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    {lowConfItems.length} item{lowConfItems.length !== 1 ? 's' : ''} met lage zekerheid
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    {lowConfItems.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name}</strong> ({Math.round((item.confidence || 0) * 100)}% zeker)
                        {item.issues?.length > 0 && ` - ${item.issues.join(', ')}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="border dark:border-gray-700 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Artikel</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Omschrijving</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Aantal</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Bruto €</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Korting</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Netto €</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Regeltotaal</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">BTW</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {editedInvoice.line_items.map((item, index) => {
                    const grossPrice = parseFloat(item.gross_unit_price) || 0;
                    const netPrice = parseFloat(item.unit_price) || 0;
                    const discount = parseFloat(item.discount) || 0;
                    const vatRate = parseFloat(item.vat_rate) || 21;
                    const statusConfig = getStatusBadgeConfig(item, materials, invoice.company_id);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">
                          {item.sku || '-'}
                        </td>
                        <td className="px-4 py-3 max-w-md">
                          {isEditing ? (
                            <Input
                              value={item.name}
                              onChange={(e) => handleLineItemChange(index, 'name', e.target.value)}
                              className="text-sm"
                            />
                          ) : (
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                              {(item.confidence || 1) < 0.8 && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {Math.round(item.confidence * 100)}% zeker
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input 
                              type="number" 
                              step="0.01" 
                              value={item.quantity} 
                              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)} 
                              className="w-20 text-right text-sm" 
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-gray-100">{item.quantity} {item.unit}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input 
                              type="number" 
                              step="0.01" 
                              value={grossPrice} 
                              onChange={(e) => handleLineItemChange(index, 'gross_unit_price', e.target.value)} 
                              className="w-24 text-right text-sm" 
                            />
                          ) : (
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                              {grossPrice > 0 ? formatCurrency(grossPrice) : '-'}
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">bruto</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input 
                              type="number" 
                              step="1" 
                              min="0"
                              max="100"
                              value={discount} 
                              onChange={(e) => handleLineItemChange(index, 'discount', e.target.value)} 
                              className="w-20 text-right text-sm" 
                            />
                          ) : (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {discount > 0 ? `-${discount.toFixed(0)}%` : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(netPrice)}
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">netto</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.total_price)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <Select 
                              value={vatRate.toString()} 
                              onValueChange={(value) => handleLineItemChange(index, 'vat_rate', value)}
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="6">6%</SelectItem>
                                <SelectItem value="21">21%</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={vatRate === 6 ? "secondary" : "outline"} className={vatRate === 6 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : ""}>
                              {vatRate}%
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant="outline"
                              className={`${statusConfig.className} flex items-center gap-1`}
                              title={statusConfig.message}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </Badge>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {statusConfig.message}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800 font-semibold">
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">Totaal excl. BTW</td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-gray-100">{formatCurrency(calculatedTotal)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">BTW (gemengd)</td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-gray-100">{formatCurrency(calculatedTotalInclVat - calculatedTotal)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="text-lg border-t-2 border-gray-300 dark:border-gray-600">
                    <td colSpan={6} className="px-4 py-4 text-right text-gray-900 dark:text-white font-bold">Totaal incl. BTW</td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-white font-bold">
                      {formatCurrency(calculatedTotalInclVat)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* PDF Link */}
          {invoice.pdf_file_url && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Originele PDF</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{invoice.original_filename}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPdfViewer(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Bekijk PDF
                </Button>
              </div>
            </div>
          )}

          {/* PDF Viewer Modal */}
          <PDFViewer
            isOpen={showPdfViewer}
            onClose={() => setShowPdfViewer(false)}
            pdfUrl={invoice.pdf_file_url}
            title={`Factuur: ${invoice.invoice_number || invoice.original_filename}`}
            allowDownload={true}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-6 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Bewerken
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleTeachTemplate}
                  disabled={isTeaching}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-300 dark:border-purple-700 hover:from-purple-100 hover:to-blue-100"
                  title="Leer het systeem hoe facturen van deze leverancier te verwerken"
                >
                  {isTeaching ? (
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isTeaching ? 'Aan het leren...' : 'Deze factuur is perfect → leer layout'}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Annuleer Bewerking
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleReject}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Afwijzen
            </Button>
            <Button 
              variant="outline"
              onClick={handleSave}
              className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <Save className="w-4 h-4 mr-2" />
              Opslaan
            </Button>
            <Button 
              onClick={handleSaveAndApprove}
              disabled={!isValid}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isEditing ? 'Opslaan & Goedkeuren' : 'Goedkeuren'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}