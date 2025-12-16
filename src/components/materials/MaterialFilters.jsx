import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusOptions = [
  { value: 'all', label: 'Alle statussen' },
  { value: 'aangevraagd', label: 'Aangevraagd' },
  { value: 'goedgekeurd', label: 'Goedgekeurd' },
  { value: 'besteld', label: 'Besteld' },
  { value: 'geleverd', label: 'Geleverd' },
  { value: 'afgewezen', label: 'Afgewezen' },
];

const priorityOptions = [
  { value: 'all', label: 'Alle prioriteiten' },
  { value: 'laag', label: 'Laag' },
  { value: 'normaal', label: 'Normaal' },
  { value: 'hoog', label: 'Hoog' },
  { value: 'urgent', label: 'Urgent' },
];

export default function MaterialFilters({ filters, setFilters, projects }) {
  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const safeProjects = projects || [];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter op status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter op prioriteit" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filters.project} onValueChange={(value) => handleFilterChange('project', value)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter op project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle projecten</SelectItem>
          {safeProjects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              {project.project_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}