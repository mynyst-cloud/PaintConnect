import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { Material } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { X, UploadCloud, Loader2, Wand2, Trash2, Save, AlertTriangle, Info } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const materialSchemaForExtraction = {
  type: "object",
  properties: {
    materials: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Volledige naam van het product/materiaal, zo specifiek mogelijk." },
          price_excl_vat: { type: "number", description: "Prijs per eenheid, exclusief BTW. Dit is de kale prijs." },
          unit: { type: "string", description: "De eenheid (bijv. 'liter', 'stuk', 'm2', 'rol'). Vertaal 'st' of 'ea' naar 'stuk'." },
          discount_percentage: { type: "number", description: "Eventuele korting in procenten (bijv. 10 voor 10%). Indien geen korting, 0." },
          sku: { type: "string", description: "Artikelnummer, productcode of SKU, indien aanwezig." },
          supplier: { type: "string", description: "Naam van de leverancier, indien te vinden op de factuur." }
        },
        required: ["name", "price_excl_vat", "unit"]
      }
    }
  },
  required: ["materials"]
};

const materialCategories = ["verf", "primer", "lak", "klein_materiaal", "toebehoren", "onbekend"];
const materialUnits = ["liter", "m2", "stuk", "set", "rol", "kg", "meter", "doos", "pak"];

// Helper om status badge te bepalen op basis van meerdere velden
const getStatusBadge = (item) => {
  return item.status_badge || item.status || item.statusBadge || 'existing';
};

// Helper om status message te bepalen op basis van meerdere velden
const getStatusMessage = (item) => {
  return item.status_message || item.statusLabel || item.statusMessage || 'Bestaand materiaal, geen wijzigingen';
};

// Helper om badge kleur te bepalen
const getBadgeVariant = (statusBadge) => {
  switch(statusBadge) {
    case 'new':
      return 'default'; // Blauwe badge voor nieuw
    case 'price_increase':
    case 'price_decrease':
    case 'both_change':
      return 'destructive'; // Rode badge voor wijzigingen
    case 'discount_change':
      return 'secondary'; // Grijze badge voor kortingswijziging
    case 'existing':
    default:
      return 'outline'; // Outline voor bestaand
  }
};

export default function MaterialInvoiceProcessor({ onCancel, onFinished }) {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload', 'review', 'saving'
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type.includes('image') || selectedFile.type === 'application/pdf')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Selecteer een geldig afbeeldings- of PDF-bestand.");
      setFile(null);
    }
  };

  const handleProcessInvoice = async () => {
    if (!file) {
      setError("Selecteer eerst een factuurbestand.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setExtractedData([]);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error("Bestandsupload mislukt.");

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: materialSchemaForExtraction
      });
      
      if (result.status === 'success' && result.output?.materials) {
        const validatedData = result.output.materials.map(item => ({
          ...item,
          category: 'onbekend', // Default category
          unit: materialUnits.includes(item.unit?.toLowerCase()) ? item.unit.toLowerCase() : 'stuk',
          discount_percentage: item.discount_percentage || 0,
          id: Math.random(), // Temp ID for list key
          // Frontend gebruikt deze velden voor display
          status_badge: 'new',
          status_message: 'Nieuw materiaal (handmatig toegevoegd)',
          is_new_material: true
        }));
        setExtractedData(validatedData);
        setCurrentStep('review');
      } else {
        throw new Error(result.details || "Kon geen materialen uit de factuur extraheren.");
      }
    } catch (err) {
      setError(err.message || "Er is een onbekende fout opgetreden.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDataChange = (index, field, value) => {
    setExtractedData(prevData => {
      const newData = [...prevData];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const handleRemoveRow = (indexToRemove) => {
    setExtractedData(prevData => prevData.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveMaterials = async () => {
    setCurrentStep('saving');
    setIsLoading(true);
    
    try {
      const { User } = await import('@/api/entities');
      const user = await User.me();
      const companyId = user.current_company_id || user.company_id;

      if (!companyId) throw new Error("Geen bedrijfs-ID gevonden.");

      const materialsToCreate = extractedData.map(item => ({
        company_id: companyId,
        name: item.name,
        category: item.category,
        unit: item.unit,
        price_excl_vat: parseFloat(item.price_excl_vat) || 0,
        discount_percentage: parseFloat(item.discount_percentage) || 0,
        sku: item.sku,
        supplier: item.supplier,
        is_active: true,
      }));
      
      await Material.bulkCreate(materialsToCreate);
      
      toast({
        title: "Succes!",
        description: `${materialsToCreate.length} materialen zijn succesvol toegevoegd.`,
      });
      onFinished();
    } catch (err) {
      setError(err.message || "Kon materialen niet opslaan.");
      setCurrentStep('review'); // Go back to review step on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.95, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Factuur Verwerken</h2>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-grow p-6 overflow-y-auto">
          {currentStep === 'upload' && (
            <div className="text-center max-w-lg mx-auto">
              <UploadCloud className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-slate-200">Upload een factuur</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Selecteer een PDF of afbeelding van uw leveranciersfactuur om materialen automatisch toe te voegen.</p>
              <div className="mt-6">
                <Input id="file-upload" type="file" onChange={handleFileChange} accept="image/*,application/pdf" className="sr-only" />
                <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">
                  Selecteer Bestand
                </Label>
              </div>
              {file && <p className="mt-4 text-sm text-gray-600 dark:text-slate-300">Geselecteerd: {file.name}</p>}
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
          )}

          {currentStep === 'review' && (
            <div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">Let op: Handmatig toegevoegde materialen</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Deze materialen zijn geëxtraheerd uit een handmatig geüploade factuur en worden als "nieuw" gemarkeerd. 
                      Controleer de gegevens zorgvuldig voordat je opslaat.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2">Controleer de gevonden materialen</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Pas de gegevens hieronder aan waar nodig. Alle velden zijn bewerkbaar.</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Naam</TableHead>
                      <TableHead>Prijs (€)</TableHead>
                      <TableHead>Eenheid</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Korting (%)</TableHead>
                      <TableHead>Leverancier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((item, index) => {
                      const statusBadge = getStatusBadge(item);
                      const statusMessage = getStatusMessage(item);
                      const badgeVariant = getBadgeVariant(statusBadge);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell><Input value={item.name} onChange={(e) => handleDataChange(index, 'name', e.target.value)} /></TableCell>
                          <TableCell><Input type="number" value={item.price_excl_vat} onChange={(e) => handleDataChange(index, 'price_excl_vat', e.target.value)} /></TableCell>
                          <TableCell>
                            <Select value={item.unit} onValueChange={(value) => handleDataChange(index, 'unit', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{materialUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={item.category} onValueChange={(value) => handleDataChange(index, 'category', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{materialCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell><Input type="number" value={item.discount_percentage} onChange={(e) => handleDataChange(index, 'discount_percentage', e.target.value)} /></TableCell>
                          <TableCell><Input value={item.supplier} onChange={(e) => handleDataChange(index, 'supplier', e.target.value)} /></TableCell>
                          <TableCell>
                            <Badge variant={badgeVariant} className="whitespace-nowrap">
                              {statusMessage}
                            </Badge>
                            {item.matching_score !== undefined && (
                              <span className="text-xs text-gray-500 ml-1">({item.matching_score})</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
              {extractedData.length === 0 && !isLoading && (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg mt-4">
                      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Geen materialen gevonden</h3>
                      <p className="mt-1 text-sm text-gray-500">Probeer een andere factuur of controleer de kwaliteit van het bestand.</p>
                  </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
              <p className="mt-4 text-lg text-gray-700 dark:text-slate-300">
                {currentStep === 'upload' ? 'Factuur wordt verwerkt...' : 'Materialen worden opgeslagen...'}
              </p>
              <p className="text-sm text-gray-500">Dit kan even duren.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-slate-800 border-t dark:border-slate-700">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>Annuleren</Button>
          {currentStep === 'upload' && (
            <Button onClick={handleProcessInvoice} disabled={!file || isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Verwerk Factuur
            </Button>
          )}
          {currentStep === 'review' && (
             <Button onClick={handleSaveMaterials} disabled={extractedData.length === 0 || isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Sla op in Materialenlijst
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}