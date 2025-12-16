
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    Plus, Trash2, Edit3, Truck, Search, 
    AlertTriangle, CheckCircle, Building2, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Supplier } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteSupplier } from '@/api/functions'; // Importeren van de nieuwe functie

export default function SupplierManagement({ onRefresh }) {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddSupplierForm, setShowAddSupplierForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        owner_email: '',
        address: '',
        vat_number: '',
        specialties: [],
        status: 'active'
    });
    const [errors, setErrors] = useState({});

    const specialtyOptions = [
        'Verf', 'Kwasten & Rollen', 'Gereedschap', 'Schuurmateriaal', 
        'Primers & Grondverf', 'Afplakmateriaal', 'Beschermingsmiddelen',
        'Ladders & Steigers', 'Spuitapparatuur', 'Andere'
    ];

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setIsLoading(true);
        try {
            const allSuppliers = await Supplier.list('-created_date');
            setSuppliers(allSuppliers || []);
        } catch (error) {
            console.error("Error loading suppliers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateSupplierForm = () => {
        const newErrors = {};
        if (!newSupplier.name.trim()) {
            newErrors.name = "Naam is verplicht";
        }
        if (!newSupplier.owner_email.trim() || !/\S+@\S+\.\S/.test(newSupplier.owner_email)) {
            newErrors.owner_email = "Geldig e-mailadres is verplicht";
        }
        if (!newSupplier.vat_number.trim()) {
            newErrors.vat_number = "BTW-nummer is verplicht";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        if (!validateSupplierForm()) return;

        setIsLoading(true);
        try {
            const supplierData = {
                name: newSupplier.name.trim(),
                owner_email: newSupplier.owner_email.toLowerCase().trim(),
                address: newSupplier.address?.trim() || '',
                vat_number: newSupplier.vat_number?.trim() || '',
                specialties: Array.isArray(newSupplier.specialties) ? newSupplier.specialties : [],
                status: newSupplier.status || 'active'
            };

            console.log('Creating supplier with data:', supplierData);
            const result = await Supplier.create(supplierData);
            console.log('Supplier created:', result);
            
            // Reset form
            setNewSupplier({
                name: '',
                owner_email: '',
                address: '',
                vat_number: '',
                specialties: [],
                status: 'active'
            });
            setShowAddSupplierForm(false);
            setErrors({});
            
            // Refresh data
            await loadSuppliers();
            if (onRefresh) await onRefresh();
            
            alert('Leverancier succesvol toegevoegd');
        } catch (error) {
            console.error("Error adding supplier:", error);
            alert(`Kon leverancier niet toevoegen: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSupplier = async (supplier) => {
        if (!confirm(`Weet u zeker dat u '${supplier.name}' permanent wilt verwijderen?`)) {
            return;
        }

        setIsLoading(true);
        try {
            // Gebruik de nieuwe backend functie in plaats van de directe SDK call
            await deleteSupplier({ supplierId: supplier.id });
            
            await loadSuppliers();
            if (onRefresh) await onRefresh();
            alert(`Leverancier '${supplier.name}' is verwijderd`);
        } catch (error) {
            console.error("Error deleting supplier:", error);
            const errorMessage = error.response?.data?.error || error.message || 'Onbekende fout.';
            alert(`Kon leverancier niet verwijderen: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSupplier = (supplier) => {
        setEditingSupplier(supplier);
        setNewSupplier({
            name: supplier.name || '',
            owner_email: supplier.owner_email || '',
            address: supplier.address || '',
            vat_number: supplier.vat_number || '',
            specialties: supplier.specialties || [],
            status: supplier.status || 'active'
        });
        setShowAddSupplierForm(true);
    };

    const handleUpdateSupplier = async (e) => {
        e.preventDefault();
        if (!validateSupplierForm()) return;

        setIsLoading(true);
        try {
            const supplierData = {
                name: newSupplier.name.trim(),
                owner_email: newSupplier.owner_email.toLowerCase().trim(),
                address: newSupplier.address?.trim() || '',
                vat_number: newSupplier.vat_number?.trim() || '',
                specialties: Array.isArray(newSupplier.specialties) ? newSupplier.specialties : [],
                status: newSupplier.status || 'active'
            };

            console.log('Updating supplier with data:', supplierData);
            const result = await Supplier.update(editingSupplier.id, supplierData);
            console.log('Supplier updated:', result);
            
            // Reset form
            setEditingSupplier(null);
            setNewSupplier({
                name: '',
                owner_email: '',
                address: '',
                vat_number: '',
                specialties: [],
                status: 'active'
            });
            setShowAddSupplierForm(false);
            setErrors({});
            
            // Refresh data
            await loadSuppliers();
            if (onRefresh) await onRefresh();
            
            alert('Leverancier succesvol bijgewerkt');
        } catch (error) {
            console.error("Error updating supplier:", error);
            alert(`Kon leverancier niet bijwerken: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpecialtyToggle = (specialty) => {
        const currentSpecialties = Array.isArray(newSupplier.specialties) ? newSupplier.specialties : [];
        if (currentSpecialties.includes(specialty)) {
            setNewSupplier({
                ...newSupplier,
                specialties: currentSpecialties.filter(s => s !== specialty)
            });
        } else {
            setNewSupplier({
                ...newSupplier,
                specialties: [...currentSpecialties, specialty]
            });
        }
    };

    // Filter leveranciers
    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch = supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             supplier.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadgeColor = (status) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Leveranciersbeheer</h2>
                    <p className="text-gray-600">Beheer alle leveranciers in het systeem</p>
                </div>
                <Button onClick={() => setShowAddSupplierForm(true)} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Leverancier Toevoegen
                </Button>
            </div>

            {/* Zoeken en Filteren */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Zoek op naam of e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter op status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle statussen</SelectItem>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="pending">In behandeling</SelectItem>
                        <SelectItem value="suspended">Opgeschort</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Leveranciers Lijst */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leverancier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialiteiten</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence>
                                    {filteredSuppliers.map((supplier) => (
                                        <motion.tr 
                                            key={supplier.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                        <Truck className="w-4 h-4 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{supplier.name}</div>
                                                        <div className="text-sm text-gray-500">{supplier.vat_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{supplier.owner_email}</div>
                                                {supplier.address && (
                                                    <div className="text-sm text-gray-500">{supplier.address}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(supplier.specialties || []).slice(0, 3).map(specialty => (
                                                        <Badge key={specialty} variant="outline" className="text-xs">
                                                            {specialty}
                                                        </Badge>
                                                    ))}
                                                    {(supplier.specialties || []).length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{(supplier.specialties || []).length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={getStatusBadgeColor(supplier.status)}>
                                                    {supplier.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {supplier.status === 'pending' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {supplier.status === 'suspended' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {supplier.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditSupplier(supplier)}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteSupplier(supplier)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Leverancier Toevoegen/Bewerken Modal */}
            <AnimatePresence>
                {showAddSupplierForm && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setShowAddSupplierForm(false);
                            setEditingSupplier(null);
                            setNewSupplier({
                                name: '',
                                owner_email: '',
                                address: '',
                                vat_number: '',
                                specialties: [],
                                status: 'active'
                            });
                            setErrors({});
                        }}
                    >
                        <motion.div
                            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={editingSupplier ? handleUpdateSupplier : handleAddSupplier}>
                                <Card className="shadow-2xl">
                                    <CardHeader>
                                        <CardTitle>
                                            {editingSupplier ? 'Leverancier Bewerken' : 'Nieuwe Leverancier Toevoegen'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="name">Bedrijfsnaam *</Label>
                                                <Input
                                                    id="name"
                                                    value={newSupplier.name}
                                                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                                                    className={errors.name ? 'border-red-300' : ''}
                                                />
                                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                            </div>

                                            <div>
                                                <Label htmlFor="owner_email">Contact e-mail *</Label>
                                                <Input
                                                    id="owner_email"
                                                    type="email"
                                                    value={newSupplier.owner_email}
                                                    onChange={(e) => setNewSupplier({...newSupplier, owner_email: e.target.value})}
                                                    className={errors.owner_email ? 'border-red-300' : ''}
                                                />
                                                {errors.owner_email && <p className="text-red-500 text-sm mt-1">{errors.owner_email}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="address">Adres</Label>
                                            <Textarea
                                                id="address"
                                                value={newSupplier.address}
                                                onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                                                rows={2}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="vat_number">BTW-nummer *</Label>
                                                <Input
                                                    id="vat_number"
                                                    value={newSupplier.vat_number}
                                                    onChange={(e) => setNewSupplier({...newSupplier, vat_number: e.target.value})}
                                                    className={errors.vat_number ? 'border-red-300' : ''}
                                                />
                                                {errors.vat_number && <p className="text-red-500 text-sm mt-1">{errors.vat_number}</p>}
                                            </div>

                                            <div>
                                                <Label htmlFor="status">Status</Label>
                                                <Select value={newSupplier.status} onValueChange={(value) => setNewSupplier({...newSupplier, status: value})}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Actief</SelectItem>
                                                        <SelectItem value="pending">In behandeling</SelectItem>
                                                        <SelectItem value="suspended">Opgeschort</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Specialiteiten</Label>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {specialtyOptions.map(specialty => {
                                                    const isSelected = (newSupplier.specialties || []).includes(specialty);
                                                    return (
                                                        <Button
                                                            key={specialty}
                                                            type="button"
                                                            variant={isSelected ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handleSpecialtyToggle(specialty)}
                                                            className="justify-start text-left"
                                                        >
                                                            <Package className="w-3 h-3 mr-2" />
                                                            {specialty}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="flex justify-end gap-3 p-6 pt-0">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => {
                                                setShowAddSupplierForm(false);
                                                setEditingSupplier(null);
                                                setNewSupplier({
                                                    name: '',
                                                    owner_email: '',
                                                    address: '',
                                                    vat_number: '',
                                                    specialties: [],
                                                    status: 'active'
                                                });
                                                setErrors({});
                                            }}
                                            disabled={isLoading}
                                        >
                                            Annuleren
                                        </Button>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? 'Bezig...' : (editingSupplier ? 'Bijwerken' : 'Toevoegen')}
                                        </Button>
                                    </div>
                                </Card>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
