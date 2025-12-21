
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Package } from "lucide-react";
import { Supplier, Material } from "@/api/entities";
import { handleMaterialRequest } from '@/api/functions';
import PlaceholderLogo from "@/components/ui/PlaceholderLogo";

const units = ["liter", "kg", "meter", "stuks", "rol", "doos", "m²", "pak"];
const priorities = ["laag", "normaal", "hoog", "urgent"];

export default function MaterialRequestForm({ request, projects, onSubmit, onCancel, isAdmin }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  const safeRequest = request && typeof request === 'object' ? request : {};

  const [formData, setFormData] = useState({
    project_id: safeRequest.project_id || (projects?.length === 1 ? projects[0].id : ""),
    material_id: safeRequest.material_id || "",
    material_name: safeRequest.material_name || "",
    quantity: safeRequest.quantity?.toString() || "",
    unit: safeRequest.unit || "stuks",
    priority: safeRequest.priority || "normaal",
    notes: safeRequest.notes || "",
    supplier_id: safeRequest.supplier_id || "",
    requested_by: safeRequest.requested_by || "",
    estimated_unit_price: safeRequest.estimated_unit_price || 0,
  });

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const supplierList = await Supplier.list();
        const validSuppliers = (supplierList || []).filter(s => s && s.id && s.name);
        setSuppliers(validSuppliers);
      } catch (error) {
        console.error("Failed to load suppliers", error);
        setErrors(prev => ({ ...prev, suppliers: "Kon leveranciers niet laden." }));
        setSuppliers([]);
      }
      setIsLoadingSuppliers(false);
    }
    fetchSuppliers();
  }, []);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const user = await (await import('@/api/entities')).User.me();
        if (user?.company_id) {
          const materialList = await Material.filter({
            company_id: user.company_id,
            is_active: true
          }, 'name');
          setMaterials(materialList || []);

          if (safeRequest.material_id) {
            const preSelected = materialList.find(m => m.id === safeRequest.material_id);
            if (preSelected) {
              setSelectedMaterial(preSelected);
              setFormData(prev => ({
                ...prev,
                material_id: preSelected.id,
                material_name: preSelected.name,
                unit: preSelected.unit,
                estimated_unit_price: preSelected.price_excl_vat || 0
              }));
            } else {
              setSelectedMaterial(null);
              setFormData(prev => ({
                ...prev,
                material_id: "",
                unit: safeRequest.unit || "stuks",
                estimated_unit_price: safeRequest.estimated_unit_price || 0
              }));
            }
          } else if (safeRequest.material_name && !safeRequest.material_id) {
            setSelectedMaterial(null);
            setFormData(prev => ({
              ...prev,
              material_id: "",
              unit: safeRequest.unit || "stuks",
              estimated_unit_price: safeRequest.estimated_unit_price || 0
            }));
          } else {
            setSelectedMaterial(null);
          }
        }
      } catch (error) {
        console.error("Failed to load materials", error);
        setMaterials([]);
      }
      setIsLoadingMaterials(false);
    }
    fetchMaterials();
  }, [safeRequest.material_id, safeRequest.material_name, safeRequest.unit, safeRequest.estimated_unit_price]);

  const handleMaterialSelect = (materialId) => {
    if (materialId === "custom") {
      setSelectedMaterial(null);
      setFormData(prev => ({
        ...prev,
        material_id: "",
        material_name: "",
        unit: "stuks",
        estimated_unit_price: 0
      }));
    } else if (materialId) {
      const material = materials.find(m => m.id === materialId);
      if (material) {
        setSelectedMaterial(material);
        setFormData(prev => ({
          ...prev,
          material_id: material.id,
          material_name: material.name,
          unit: material.unit,
          estimated_unit_price: material.price_excl_vat || 0
        }));
      }
    } else {
      setSelectedMaterial(null);
      setFormData(prev => ({
        ...prev,
        material_id: "",
        material_name: "",
        estimated_unit_price: 0
      }));
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.project_id) newErrors.project_id = "Selecteer een project";
    if (!formData.material_name?.trim()) newErrors.material_name = "Materiaal naam is verplicht";
    if (!formData.quantity || isNaN(formData.quantity) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Hoeveelheid moet een geldig getal groter dan 0 zijn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Get current user to ensure requested_by is set correctly
      const currentUser = await (await import('@/api/entities')).User.me();
      
      const cleanedData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        notes: formData.notes?.trim() || null,
        supplier_id: formData.supplier_id || null,
        material_id: formData.material_id || null,
        estimated_unit_price: parseFloat(formData.estimated_unit_price) || 0,
        // CRITICAL FIX: Ensure requested_by is always set correctly
        requested_by: request?.id ? (formData.requested_by || currentUser.email) : currentUser.email
      };

      const project = projects.find(p => p.id === formData.project_id);
      const submissionData = {
          ...cleanedData,
          project_name: project?.project_name || 'Niet gespecificeerd',
          company_id: project?.company_id || currentUser.company_id
      };

      if (request?.id) {
        // EDITING: Use onSubmit for updates
        await onSubmit(submissionData);
      } else {
        // NEW REQUEST: Use handleMaterialRequest which creates the record
        const { data, error: functionError } = await handleMaterialRequest(submissionData);
        if (functionError) throw new Error(functionError.message || 'Failed to create material request');
        if (!data?.success) throw new Error('Material request creation failed');
        
        // Close form directly - DO NOT call onSubmit again as that would create another record
        onCancel(); // This will close the form and trigger data reload in parent
      }
    } catch (error) {
      console.error("Error submitting material request form", error);
      setErrors(prev => ({ ...prev, submit: "Er is een fout opgetreden bij het indienen." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-4">
               <div className="flex items-center gap-3">
                <PlaceholderLogo />
                <CardTitle className="text-lg">{safeRequest.id ? "Aanvraag Bewerken" : "Nieuwe Materiaalaanvraag"}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                <X className="w-4 h-4"/>
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {errors.submit && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{errors.submit}</div>}
              {errors.suppliers && <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">{errors.suppliers}</div>}

              <div>
                <Label htmlFor="project">Project *</Label>
                <Select value={formData.project_id} onValueChange={(value) => handleChange("project_id", value)}>
                  <SelectTrigger className={errors.project_id ? "border-red-300" : ""}>
                    <SelectValue placeholder="Selecteer een project" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name || 'Naamloos project'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.project_id && <p className="text-red-500 text-sm mt-1">{errors.project_id}</p>}
              </div>

              {/* Material selection dropdown */}
              <div>
                <Label htmlFor="material_select">Materiaal Selectie</Label>
                <Select
                  value={selectedMaterial ? selectedMaterial.id : (formData.material_name && !formData.material_id ? "custom" : formData.material_id || "")}
                  onValueChange={handleMaterialSelect}
                  disabled={isLoadingMaterials}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingMaterials ? "Materialen laden..." : "Kies uit voorraad of voer handmatig in"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">🖊️ Handmatig invoeren</SelectItem>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
                        {isAdmin && ` - €${material.price_excl_vat?.toFixed(2)} per ${material.unit}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Material name input - only show when custom or no selection */}
              {(!selectedMaterial || formData.material_name === "") && (
                <div>
                  <Label htmlFor="material_name">Materiaal Naam *</Label>
                  <Input
                    id="material_name"
                    value={formData.material_name}
                    onChange={(e) => handleChange("material_name", e.target.value)}
                    className={errors.material_name ? "border-red-300" : ""}
                    placeholder="Bijv. witte muurverf, kwasten, primer..."
                    disabled={!!selectedMaterial}
                  />
                  {errors.material_name && <p className="text-red-500 text-sm mt-1">{errors.material_name}</p>}
                </div>
              )}

              {/* Show selected material info */}
              {selectedMaterial && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-medium text-green-800">{selectedMaterial.name}</p>
                  {isAdmin && (
                    <p className="text-sm text-green-600">
                      €{selectedMaterial.price_excl_vat?.toFixed(2)} per {selectedMaterial.unit}
                      {selectedMaterial.supplier && ` • ${selectedMaterial.supplier}`}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Hoeveelheid *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", e.target.value)}
                    className={errors.quantity ? "border-red-300" : ""}
                    placeholder="Bijv. 10"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>
                <div>
                  <Label htmlFor="unit">Eenheid</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleChange("unit", value)}
                    disabled={!!selectedMaterial}
                  >
                    <SelectTrigger><SelectValue placeholder="Kies eenheid" /></SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isAdmin && formData.estimated_unit_price > 0 && parseFloat(formData.quantity) > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Geschatte kosten:</strong> €{(parseFloat(formData.quantity) * formData.estimated_unit_price).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioriteit</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                    <SelectTrigger><SelectValue placeholder="Selecteer prioriteit" /></SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => <SelectItem key={priority} value={priority} className="capitalize">{priority}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supplier">Leverancier (Optioneel)</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => handleChange("supplier_id", value)}
                    disabled={isLoadingSuppliers}
                  >
                    <SelectTrigger><SelectValue placeholder={isLoadingSuppliers ? "Laden..." : "Kies leverancier"} /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Opmerkingen</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Extra informatie, specificaties, kleurcodes..." rows={3}/>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-slate-800/50">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Annuleren</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting || isLoadingSuppliers || isLoadingMaterials}>
                {isSubmitting && <InlineSpinner className="mr-2" />}
                {safeRequest.id ? 'Aanvraag Opslaan' : 'Aanvraag Indienen'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </motion.div>
    </motion.div>
  );
}
