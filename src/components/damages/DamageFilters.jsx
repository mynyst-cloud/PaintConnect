import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

const statusOptions = [
  { value: 'all', label: 'Alle statussen' },
  { value: 'gemeld', label: 'Gemeld' },
  { value: 'in_behandeling', label: 'In behandeling' },
  { value: 'opgelost', label: 'Opgelost' },
  { value: 'geaccepteerd', label: 'Geaccepteerd' }
];

const severityOptions = [
  { value: 'all', label: 'Alle ernst' },
  { value: 'laag', label: 'Laag' },
  { value: 'gemiddeld', label: 'Gemiddeld' },
  { value: 'hoog', label: 'Hoog' },
  { value: 'kritiek', label: 'Kritiek' }
];

const categoryOptions = [
  { value: 'all', label: 'Alle categorieën' },
  { value: 'materiaal_defect', label: 'Materiaal Defect' },
  { value: 'schade_bestaand', label: 'Bestaande Schade' },
  { value: 'nieuwe_schade', label: 'Nieuwe Schade' },
  { value: 'kwaliteit_probleem', label: 'Kwaliteitsprobleem' },
  { value: 'veiligheid', label: 'Veiligheidsprobleem' },
  { value: 'anders', label: 'Anders' }
];

export default function DamageFilters({ filters, onFiltersChange, projects = [] }) {
  const handleFilterChange = (key, value) => {
    if (onFiltersChange) {
      onFiltersChange(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const projectOptions = [
    { value: 'all', label: 'Alle projecten' },
    ...projects.map(project => ({
      value: project.id,
      label: project.project_name || 'Onbekend Project'
    }))
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filters:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <Select 
          value={filters?.status || 'all'} 
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters?.severity || 'all'} 
          onValueChange={(value) => handleFilterChange('severity', value)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Ernst" />
          </SelectTrigger>
          <SelectContent>
            {severityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters?.category || 'all'} 
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {projects.length > 0 && (
          <Select 
            value={filters?.project_id || 'all'} 
            onValueChange={(value) => handleFilterChange('project_id', value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}