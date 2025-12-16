import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, Trash2, Edit3, Users, UserPlus, Search, 
    AlertTriangle, CheckCircle, Crown, Mail, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Company } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UserManagement({ onRefresh }) {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [newUser, setNewUser] = useState({
        email: '',
        full_name: '',
        company_id: '',
        company_role: 'painter',
        user_type: 'painter_company',
        is_painter: true,
        hourly_rate: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [allUsers, allCompanies] = await Promise.all([
                User.list('-created_date'),
                Company.list()
            ]);
            setUsers(allUsers || []);
            setCompanies(allCompanies || []);
        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateUserForm = () => {
        const newErrors = {};
        if (!newUser.email.trim() || !/\S+@\S+\.\S+/.test(newUser.email)) {
            newErrors.email = "Geldig e-mailadres is verplicht";
        }
        if (!newUser.full_name.trim()) {
            newErrors.full_name = "Volledige naam is verplicht";
        }
        if (newUser.user_type === 'painter_company' && !newUser.company_id) {
            newErrors.company_id = "Bedrijf selecteren is verplicht voor schilders";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!validateUserForm()) return;

        setIsLoading(true);
        try {
            const userData = {
                ...newUser,
                email: newUser.email.toLowerCase(),
                account_activated: true // Direct geactiveerd bij handmatige aanmaak
            };

            await User.create(userData);
            
            setNewUser({
                email: '',
                full_name: '',
                company_id: '',
                company_role: 'painter',
                user_type: 'painter_company',
                is_painter: true
            });
            setShowAddUserForm(false);
            await loadData();
            if (onRefresh) onRefresh();
            alert('Gebruiker succesvol toegevoegd');
        } catch (error) {
            console.error("Error adding user:", error);
            alert(`Kon gebruiker niet toevoegen: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!confirm(`Weet u zeker dat u '${user.full_name}' (${user.email}) permanent wilt verwijderen?`)) {
            return;
        }

        setIsLoading(true);
        try {
            await User.delete(user.id);
            await loadData();
            if (onRefresh) onRefresh();
            alert(`Gebruiker '${user.full_name}' is verwijderd`);
        } catch (error) {
            console.error("Error deleting user:", error);
            
            // Verbeterde, specifieke foutafhandeling
            let errorMessage = `Kon gebruiker niet verwijderen: ${error.message}`;
            if (error.response?.data?.message?.includes("You cannot delete the owner of the app")) {
                errorMessage = "Actie mislukt: Deze gebruiker is de eigenaar van de applicatie en kan uit veiligheidsoverwegingen niet worden verwijderd.";
            }
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setNewUser({
            email: user.email,
            full_name: user.full_name,
            company_id: user.company_id || '',
            company_role: user.company_role || 'painter',
            user_type: user.user_type || 'painter_company',
            is_painter: user.is_painter !== false,
            hourly_rate: user.hourly_rate || ''
        });
        setShowAddUserForm(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!validateUserForm()) return;

        setIsLoading(true);
        try {
            const userData = {
                ...newUser,
                email: newUser.email.toLowerCase()
            };

            await User.update(editingUser.id, userData);
            
            setEditingUser(null);
            setNewUser({
                email: '',
                full_name: '',
                company_id: '',
                company_role: 'painter',
                user_type: 'painter_company',
                is_painter: true
            });
            setShowAddUserForm(false);
            await loadData();
            if (onRefresh) onRefresh();
            alert('Gebruiker succesvol bijgewerkt');
        } catch (error) {
            console.error("Error updating user:", error);
            alert(`Kon gebruiker niet bijwerken: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter gebruikers
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.company_role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getCompanyName = (companyId) => {
        const company = companies.find(c => c.id === companyId);
        return company ? company.name : 'Onbekend bedrijf';
    };

    const getRoleBadgeColor = (role) => {
        switch(role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'painter': return 'bg-blue-100 text-blue-800';
            case 'helpdesk': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gebruikersbeheer</h2>
                    <p className="text-gray-600">Beheer alle gebruikers in het systeem</p>
                </div>
                <Button onClick={() => setShowAddUserForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Gebruiker Toevoegen
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
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter op rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle rollen</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="painter">Schilder</SelectItem>
                        <SelectItem value="helpdesk">Helpdesk</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Gebruikers Lijst */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gebruiker</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bedrijf</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence>
                                    {filteredUsers.map((user) => (
                                        <motion.tr 
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                                        <Users className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.full_name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {user.company_id ? getCompanyName(user.company_id) : 'Geen bedrijf'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={getRoleBadgeColor(user.company_role)}>
                                                    {user.company_role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                                                    {user.company_role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {user.user_type === 'painter_company' ? 'Schilder' : 'Leverancier'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={user.account_activated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                                    {user.account_activated ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Actief
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                                            Niet geactiveerd
                                                        </>
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(user)}
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

            {/* Gebruiker Toevoegen/Bewerken Modal */}
            <AnimatePresence>
                {showAddUserForm && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setShowAddUserForm(false);
                            setEditingUser(null);
                            setNewUser({
                                email: '',
                                full_name: '',
                                company_id: '',
                                company_role: 'painter',
                                user_type: 'painter_company',
                                is_painter: true
                            });
                            setErrors({});
                        }}
                    >
                        <motion.div
                            className="w-full max-w-lg"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
                                <Card className="shadow-2xl">
                                    <CardHeader>
                                        <CardTitle>
                                            {editingUser ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker Toevoegen'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="email">E-mailadres *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                                className={errors.email ? 'border-red-300' : ''}
                                            />
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="full_name">Volledige naam *</Label>
                                            <Input
                                                id="full_name"
                                                value={newUser.full_name}
                                                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                                                className={errors.full_name ? 'border-red-300' : ''}
                                            />
                                            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="user_type">Gebruikerstype</Label>
                                            <Select value={newUser.user_type} onValueChange={(value) => setNewUser({...newUser, user_type: value, company_id: value === 'supplier' ? '' : newUser.company_id})}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="painter_company">Schilder</SelectItem>
                                                    <SelectItem value="supplier">Leverancier</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {newUser.user_type === 'painter_company' && (
                                            <div>
                                                <Label htmlFor="company_id">Bedrijf *</Label>
                                                <Select value={newUser.company_id} onValueChange={(value) => setNewUser({...newUser, company_id: value})}>
                                                    <SelectTrigger className={errors.company_id ? 'border-red-300' : ''}>
                                                        <SelectValue placeholder="Selecteer bedrijf" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {companies.map(company => (
                                                            <SelectItem key={company.id} value={company.id}>
                                                                {company.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.company_id && <p className="text-red-500 text-sm mt-1">{errors.company_id}</p>}
                                            </div>
                                        )}

                                        <div>
                                            <Label htmlFor="hourly_rate">Uurtarief (€/uur)</Label>
                                            <Input
                                                id="hourly_rate"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={newUser.hourly_rate}
                                                onChange={(e) => setNewUser({...newUser, hourly_rate: e.target.value})}
                                                placeholder="Bijv. 35.00"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="company_role">Rol binnen bedrijf</Label>
                                            <Select value={newUser.company_role} onValueChange={(value) => setNewUser({...newUser, company_role: value})}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="painter">Schilder</SelectItem>
                                                    <SelectItem value="helpdesk">Helpdesk</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                    <div className="flex justify-end gap-3 p-6 pt-0">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => {
                                                setShowAddUserForm(false);
                                                setEditingUser(null);
                                                setNewUser({
                                                    email: '',
                                                    full_name: '',
                                                    company_id: '',
                                                    company_role: 'painter',
                                                    user_type: 'painter_company',
                                                    is_painter: true
                                                });
                                                setErrors({});
                                            }}
                                            disabled={isLoading}
                                        >
                                            Annuleren
                                        </Button>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? 'Bezig...' : (editingUser ? 'Bijwerken' : 'Toevoegen')}
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