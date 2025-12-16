import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

const statusOptions = [
  { value: 'all', label: 'Alle statussen' },
  { value: 'niet_gestart', label: 'Niet gestart' },
  { value: 'in_uitvoering', label: 'In uitvoering' },
  { value: 'bijna_klaar', label: 'Bijna klaar' },
  { value: 'afgerond', label: 'Afgerond' }
];

export default function ProjectFilters({ activeFilters, setActiveFilters }) {
  const handleFilterChange = (key, value) => {
    if (setActiveFilters) {
      setActiveFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-500 dark:text-slate-400" />
      <Select 
        value={activeFilters?.status || 'all'} 
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger className="w-40 sm:w-48">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}