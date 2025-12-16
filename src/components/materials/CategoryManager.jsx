import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Trash2, Save, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialCategory } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";

const colorOptions = [
  { value: 'blue', label: 'Blauw', class: 'bg-blue-500' },
  { value: 'purple', label: 'Paars', class: 'bg-purple-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'orange', label: 'Oranje', class: 'bg-orange-500' },
  { value: 'pink', label: 'Roze', class: 'bg-pink-500' },
  { value: 'gray', label: 'Grijs', class: 'bg-gray-500' },
  { value: 'green', label: 'Groen', class: 'bg-green-500' },
  { value: 'red', label: 'Rood', class: 'bg-red-500' },
  { value: 'yellow', label: 'Geel', class: 'bg-yellow-500' },
  { value: 'emerald', label: 'Smaragd', class: 'bg-emerald-500' }
];

export default function CategoryManager({ isOpen, onClose, companyId, onCategoriesUpdated }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const cats = await MaterialCategory.filter({ company_id: companyId }, 'sort_order');
      setCategories(cats || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon categorieën niet laden."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCategory({
      id: 'new',
      name: '',
      color: 'blue',
      sort_order: categories.length,
      is_active: true
    });
  };

  const handleEdit = (category) => {
    setEditingCategory({ ...category });
  };

  const handleSave = async () => {
    if (!editingCategory.name.trim()) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Categorienaam is verplicht."
      });
      return;
    }

    try {
      if (editingCategory.id === 'new') {
        await MaterialCategory.create({
          company_id: companyId,
          name: editingCategory.name,
          color: editingCategory.color,
          sort_order: editingCategory.sort_order,
          is_active: true
        });
        toast({
          title: "Succes",
          description: "Categorie aangemaakt."
        });
      } else {
        await MaterialCategory.update(editingCategory.id, {
          name: editingCategory.name,
          color: editingCategory.color,
          sort_order: editingCategory.sort_order,
          is_active: editingCategory.is_active
        });
        toast({
          title: "Succes",
          description: "Categorie bijgewerkt."
        });
      }
      
      setEditingCategory(null);
      await loadCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon categorie niet opslaan."
      });
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Weet u zeker dat u deze categorie wilt verwijderen?')) return;

    try {
      await MaterialCategory.delete(categoryId);
      toast({
        title: "Succes",
        description: "Categorie verwijderd."
      });
      await loadCategories();
      onCategoriesUpdated();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kon categorie niet verwijderen."
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Categorieën Beheren</h2>
                <p className="text-emerald-100 text-sm mt-1">Voeg toe, bewerk of verwijder materiaalcategorieën</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  editingCategory?.id === category.id ? (
                    <Card key={category.id} className="border-emerald-200 bg-emerald-50/50">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Naam</label>
                            <Input
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                              placeholder="Bijv. Verf, Primer..."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Kleur</label>
                            <Select 
                              value={editingCategory.color} 
                              onValueChange={(value) => setEditingCategory({...editingCategory, color: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {colorOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded ${opt.class}`}></div>
                                      {opt.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                            <X className="w-3 h-3 mr-1" />Annuleren
                          </Button>
                          <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                            <Save className="w-3 h-3 mr-1" />Opslaan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className={`w-4 h-4 rounded ${colorOptions.find(c => c.value === category.color)?.class || 'bg-gray-500'}`}></div>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-xs text-gray-500">Volgorde: {category.sort_order}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}

                {editingCategory?.id === 'new' && (
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Naam</label>
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                            placeholder="Bijv. Verf, Primer..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Kleur</label>
                          <Select 
                            value={editingCategory.color} 
                            onValueChange={(value) => setEditingCategory({...editingCategory, color: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${opt.class}`}></div>
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                          <X className="w-3 h-3 mr-1" />Annuleren
                        </Button>
                        <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                          <Save className="w-3 h-3 mr-1" />Opslaan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50 dark:bg-gray-900 flex justify-between">
            <Button variant="outline" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />Nieuwe Categorie
            </Button>
            <Button onClick={onClose}>Sluiten</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}