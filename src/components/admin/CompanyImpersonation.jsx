import React, { useState, useEffect } from 'react';
import { Company } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';

export default function CompanyImpersonation() {
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const allCompanies = await Company.list();
                setCompanies(allCompanies || []);
                setFilteredCompanies(allCompanies || []);
            } catch (error) {
                console.error("Failed to fetch companies:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const filtered = companies.filter(c => 
            c.name?.toLowerCase().includes(lowercasedTerm)
        );
        setFilteredCompanies(filtered);
    }, [searchTerm, companies]);

    const handleImpersonate = () => {
        if (!selectedCompanyId) {
            alert('Selecteer een bedrijf om de weergave te starten.');
            return;
        }
        navigate(createPageUrl(`Dashboard?impersonate_company_id=${selectedCompanyId}`));
    };

    return (
        <Card className="shadow-lg sticky top-28">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    Bekijk als Bedrijf
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecteer een bedrijf om de applicatie te bekijken vanuit hun perspectief.
                </p>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Zoek bedrijf..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId}>
                    <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder={isLoading ? "Bedrijven laden..." : "Selecteer een bedrijf"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {filteredCompanies.map(company => (
                            <SelectItem key={company.id} value={company.id}>
                                <div className="flex flex-col">
                                    <span className="font-medium">{company.name}</span>
                                    <span className="text-xs text-gray-500">{company.owner_email}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button 
                    onClick={handleImpersonate} 
                    disabled={!selectedCompanyId} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md"
                >
                    <Eye className="w-4 h-4 mr-2" />
                    Bekijk als dit bedrijf
                </Button>
            </CardContent>
        </Card>
    );
}