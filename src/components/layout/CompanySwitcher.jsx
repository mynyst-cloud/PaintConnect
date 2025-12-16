import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Company } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Building } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { createPageUrl } from '@/components/utils';

export default function CompanySwitcher({ currentUser }) {
    const [companies, setCompanies] = useState([]);
    const [currentCompany, setCurrentCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadCompanies = async () => {
            if (!currentUser || !currentUser.memberships || currentUser.memberships.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                const companyIds = currentUser.memberships.map(m => m.company_id);
                const companyData = await Company.filter({ id: { $in: companyIds } });
                setCompanies(companyData || []);

                if (currentUser.current_company_id) {
                    const activeCompany = (companyData || []).find(c => c.id === currentUser.current_company_id);
                    setCurrentCompany(activeCompany);
                } else if (companyData && companyData.length > 0) {
                    // Set a default if none is active
                    setCurrentCompany(companyData[0]);
                    await User.updateMyUserData({ current_company_id: companyData[0].id });
                }
            } catch (error) {
                console.error("Failed to load companies for switcher:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCompanies();
    }, [currentUser]);

    const handleSwitchCompany = async (companyId) => {
        if (companyId === currentUser.current_company_id) {
            setOpen(false);
            return;
        }
        try {
            await User.updateMyUserData({ current_company_id: companyId });
            // Navigate to force a full layout reload and data refetch
            navigate(createPageUrl('Dashboard'));
            window.location.reload();
        } catch (error) {
            console.error("Failed to switch company:", error);
            alert("Kon niet van bedrijf wisselen. Probeer het opnieuw.");
        }
    };

    if (isLoading || !companies || companies.length <= 1) {
        return null; // Don't show switcher for 1 or 0 companies
    }

    return (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
             <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <div className="flex items-center gap-2">
                             <Building className="w-4 h-4" />
                             <span className="truncate">{currentCompany ? currentCompany.name : "Selecteer bedrijf..."}</span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Zoek bedrijf..." />
                        <CommandEmpty>Geen bedrijf gevonden.</CommandEmpty>
                        <CommandGroup>
                            {companies.map((company) => (
                                <CommandItem
                                    key={company.id}
                                    value={company.name}
                                    onSelect={() => handleSwitchCompany(company.id)}
                                >
                                    {company.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}