import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Star } from "lucide-react";
import { formatCurrency } from '@/components/utils';
import { Users } from 'lucide-react';

const statusColors = {
  nieuw: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  gecontacteerd: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  offerte_verstuurd: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  gewonnen: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  verloren: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
};

const sourceColors = {
  referral: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  website: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  advertentie: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  telefoon: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  anders: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
};

const statusOptions = [
  { value: 'nieuw', label: 'Nieuw' },
  { value: 'gecontacteerd', label: 'Gecontacteerd' },
  { value: 'offerte_verstuurd', label: 'Offerte verstuurd' },
  { value: 'gewonnen', label: 'Gewonnen' },
  { value: 'verloren', label: 'Verloren' }
];

export function LeadsTable({ leads, onEdit, onDelete, onStatusChange, isUpdating }) {
  console.log('🔧 LeadsTable received:', {
    leads: leads?.length || 0,
    hasOnStatusChange: typeof onStatusChange === 'function'
  });

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-base">Geen leads gevonden.</p>
        <p className="text-sm text-gray-500 mt-1">Voeg uw eerste lead toe om te beginnen.</p>
      </div>
    );
  }

  const isReferralLead = (lead) => {
    return lead.source === 'referral' && lead.referred_by_painter_id;
  };

  const handleStatusChange = (lead, newStatus) => {
    console.log('🎯 LeadsTable: Status change triggered:', {
      leadId: lead.id,
      leadName: lead.lead_name,
      newStatus: newStatus,
      isReferral: isReferralLead(lead)
    });

    if (onStatusChange && typeof onStatusChange === 'function') {
      onStatusChange(lead, newStatus);
    } else {
      console.error('❌ onStatusChange function not provided to LeadsTable!');
      alert('Fout: Status kan niet worden bijgewerkt. Herlaad de pagina.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead Info</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Bron</TableHead>
            <TableHead className="hidden lg:table-cell">Waarde</TableHead>
            <TableHead className="hidden lg:table-cell">Toegewezen</TableHead>
            <TableHead>Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {lead.lead_name}
                      {isReferralLead(lead) && (
                        <Star className="w-4 h-4 text-yellow-500" title="Referral lead" />
                      )}
                      {lead.referral_points_awarded && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Punten toegekend</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                    {isReferralLead(lead) && (
                      <div className="text-xs text-yellow-600 font-medium">
                        Via: {lead.referred_by_painter_name || 'Schilder'}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={lead.status}
                  onValueChange={(newStatus) => handleStatusChange(lead, newStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue>
                      <Badge className={`${statusColors[lead.status]} capitalize`}>
                        {statusOptions.find(opt => opt.value === lead.status)?.label || lead.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <Badge className={`${statusColors[option.value]} capitalize`}>
                          {option.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline" className={`${sourceColors[lead.source]} capitalize`}>
                  {lead.source}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatCurrency(lead.estimated_value || 0)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-sm">
                  {lead.assigned_to || '-'}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isUpdating}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(lead)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Bewerken
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(lead.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}