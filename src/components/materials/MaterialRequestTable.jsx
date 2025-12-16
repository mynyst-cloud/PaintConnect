
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Package, Truck, AlertTriangle, CheckCircle, Clock, ArrowUp, ArrowDown, MoreHorizontal, Trash2, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Helper functions (kept as they were, returning class names for Badge)
const getStatusColor = (status) => {
  if (!status) return 'bg-gray-50 text-gray-700 border-gray-200';
  const colors = {
    aangevraagd: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    goedgekeurd: 'bg-green-50 text-green-700 border-green-200',
    besteld: 'bg-purple-50 text-purple-700 border-purple-200',
    geleverd: 'bg-blue-50 text-blue-700 border-blue-200',
    afgewezen: 'bg-red-50 text-red-700 border-red-200'
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const getSupplierStatusColor = (status) => {
  if (!status) return 'bg-gray-50 text-gray-700 border-gray-200';
  const colors = {
    pending: 'bg-orange-50 text-orange-700 border-orange-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivered: 'bg-teal-50 text-teal-700 border-teal-200',
    canceled: 'bg-red-50 text-red-700 border-red-200'
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const getPriorityColor = (priority) => {
  if (!priority) return 'bg-gray-50 text-gray-600 border-gray-200';
  const colors = {
    laag: 'bg-gray-50 text-gray-600 border-gray-200',
    normaal: 'bg-blue-50 text-blue-600 border-blue-200',
    hoog: 'bg-orange-50 text-orange-600 border-orange-200',
    urgent: 'bg-red-50 text-red-700 border-red-200'
  };
  return colors[priority] || 'bg-gray-50 text-gray-600 border-gray-200';
};

const getStatusIcon = (status) => {
  if (!status) return <Clock className="w-4 h-4" />;
  const icons = {
    aangevraagd: <Clock className="w-4 h-4" />,
    goedgekeurd: <CheckCircle className="w-4 h-4" />,
    besteld: <Package className="w-4 h-4" />,
    geleverd: <Truck className="w-4 h-4" />,
    afgewezen: <AlertTriangle className="w-4 h-4" />
  };
  return icons[status] || <Clock className="w-4 h-4" />;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

const getStatusText = (status) => {
  const statusTexts = {
    aangevraagd: 'Aangevraagd',
    goedgekeurd: 'Goedgekeurd',
    besteld: 'Besteld',
    geleverd: 'Geleverd',
    afgewezen: 'Afgewezen'
  };
  return statusTexts[status] || status || 'Onbekend';
};

const getSupplierStatusText = (status) => {
  const statusTexts = {
    pending: 'In afwachting',
    confirmed: 'Bevestigd',
    shipped: 'Verzonden',
    delivered: 'Geleverd',
    canceled: 'Geannuleerd'
  };
  return statusTexts[status] || status || 'Onbekend';
};

// New ActionsMenu component
const ActionsMenu = React.memo(({ request, onEdit, onStatusChange, onDelete, onRequestClick, isAdmin }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Acties</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onRequestClick && onRequestClick(request)}>Details bekijken</DropdownMenuItem>
      {isAdmin && <DropdownMenuItem onClick={() => onEdit && onEdit(request)}><Edit className="mr-2 h-4 w-4" /> Aanpassen</DropdownMenuItem>}
      <DropdownMenuSeparator />
      {request.status === 'aangevraagd' && isAdmin && (
        <>
          <DropdownMenuItem onClick={() => onStatusChange && onStatusChange(request.id, 'goedgekeurd')}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Goedkeuren
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange && onStatusChange(request.id, 'afgewezen')}>
            <AlertTriangle className="mr-2 h-4 w-4 text-red-600" /> Afwijzen
          </DropdownMenuItem>
        </>
      )}
       {request.status === 'goedgekeurd' && isAdmin && (
        <DropdownMenuItem onClick={() => onStatusChange && onStatusChange(request.id, 'besteld')}>
          <Box className="mr-2 h-4 w-4 text-purple-600" /> Markeer als Besteld
        </DropdownMenuItem>
      )}
      {['goedgekeurd', 'besteld'].includes(request.status) && isAdmin && (
         <DropdownMenuItem onClick={() => onStatusChange && onStatusChange(request.id, 'geleverd')}>
           <Truck className="mr-2 h-4 w-4 text-blue-600" /> Markeer als Geleverd
         </DropdownMenuItem>
      )}
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => onDelete && onDelete(request.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
));

// Updated MobileRequestCard component
const MobileRequestCard = React.memo(({ request, isAdmin, ...props }) => {
  // Safety check for request object
  if (!request || typeof request !== 'object') {
    return null;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 border-b bg-white dark:bg-slate-800 dark:border-slate-700"
      onClick={() => props.onRequestClick && props.onRequestClick(request)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-grow">
          <h3 className="font-bold text-gray-900 dark:text-slate-100">{request.material_name || 'Onbekend materiaal'}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{request.project_name || 'Onbekend project'}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Aangevraagd door: {request.requested_by || 'Onbekende gebruiker'}</p>
          {request.supplier_name && (
            <p className="text-xs text-gray-400 dark:text-slate-500">Leverancier: {request.supplier_name}</p>
          )}
        </div>
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <ActionsMenu request={request} isAdmin={isAdmin} {...props} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className={getPriorityColor(request.priority)}>{request.priority || 'normaal'}</Badge>
        <Badge variant="outline" className="dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
          {request.quantity || 0} {request.unit || ''}
        </Badge>
        {isAdmin && request.estimated_unit_price > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            €{(request.quantity * request.estimated_unit_price).toFixed(2)}
          </Badge>
        )}
        <Badge className={getStatusColor(request.status)}>
            <div className="flex items-center gap-1.5">
              {getStatusIcon(request.status)}
              {getStatusText(request.status)}
            </div>
        </Badge>
        {request.supplier_order_status && (
          <Badge className={getSupplierStatusColor(request.supplier_order_status)}>
            {getSupplierStatusText(request.supplier_order_status)}
          </Badge>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-400 dark:text-slate-500">
        Aangevraagd op: {formatDate(request.created_date)}
      </div>
    </motion.div>
  );
});

// Renamed and updated MemoizedRow to DesktopRequestRow
const DesktopRequestRow = React.memo(({ request, index, isAdmin, ...props }) => {
  if (!request || !request.id || typeof request !== 'object') {
    console.warn("Invalid request object found:", request);
    return null;
  }

  // project_name and supplier_name are now expected to be directly on the request object
  // due to pre-processing in MaterialRequestTable
  const projectName = request.project_name || 'Onbekend Project';
  const supplierName = request.supplier_name || 'Onbekende leverancier';
  // CRITICAL FIX: Better handling of requested_by field
  const requestedBy = request.requested_by || 'Onbekende gebruiker';

  return (
    <motion.tr
      key={request.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="border-b hover:bg-gray-50/50 dark:border-slate-700 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
      onClick={() => props.onRequestClick && props.onRequestClick(request)}
    >
      <TableCell className="p-4">
        <div>
          <div className="font-semibold text-gray-900 dark:text-slate-100 hover:text-emerald-600 transition-colors">
            {request.material_name || 'Onbekend materiaal'}
          </div>
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Leverancier: {supplierName}
          </div>
        </div>
      </TableCell>
      <TableCell className="p-4 font-medium dark:text-slate-200">
        {request.quantity || 0} {request.unit || ''}
      </TableCell>
      <TableCell className="p-4">
        {isAdmin && request.estimated_unit_price > 0 ? (
          <div>
            <div className="font-medium text-green-600">
              €{(request.quantity * request.estimated_unit_price).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              €{request.estimated_unit_price.toFixed(2)} per {request.unit}
            </div>
          </div>
        ) : isAdmin ? (
          <span className="text-gray-400">Geen prijs</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="p-4 text-sm text-gray-600 dark:text-slate-300">{projectName}</TableCell>
      <TableCell className="p-4 text-sm text-gray-600 dark:text-slate-300">{requestedBy}</TableCell>
      <TableCell className="p-4">
        <Badge className={getPriorityColor(request.priority)}>
          {request.priority || 'normaal'}
        </Badge>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex flex-col gap-1 items-start">
          <Badge className={getStatusColor(request.status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(request.status)}
              {getStatusText(request.status)}
            </div>
          </Badge>
          {request.supplier_order_status && (
            <Badge className={getSupplierStatusColor(request.supplier_order_status)}>
              {getSupplierStatusText(request.supplier_order_status)}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="p-4 text-sm text-gray-500 dark:text-slate-400">
        {formatDate(request.created_date)}
      </TableCell>
      <TableCell className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
        <ActionsMenu request={request} isAdmin={isAdmin} {...props} />
      </TableCell>
    </motion.tr>
  );
});

export default function MaterialRequestTable({
  requests,
  onEdit,
  onDelete,
  onStatusChange,
  suppliers,
  projects,
  onOrderPlaced, // Re-introduced as per outline
  onRequestClick,
  loading,
  isAdmin
}) {
  const [sortField, setSortField] = useState('created_date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Ensure all props are arrays and filter out invalid items
  const safeRequests = (requests || []).filter(req => req && typeof req === 'object' && req.id);
  const safeSuppliers = (suppliers || []).filter(sup => sup && typeof sup === 'object' && sup.id);
  const safeProjects = (projects || []).filter(proj => proj && typeof proj === 'object' && proj.id);

  // Enrich requests with project and supplier names for easier rendering in rows/cards
  const enrichedRequests = useMemo(() => {
    return safeRequests.map(request => {
      if (!request || typeof request !== 'object') return null; // Added safety check
      
      const project = safeProjects.find(p => p && p.id === request.project_id);
      const supplier = safeSuppliers.find(s => s && s.id === (request.supplier_id || ''));
      return {
        ...request,
        project_name: project?.project_name || 'Onbekend Project',
        supplier_name: supplier?.name || 'Onbekende leverancier',
      };
    }).filter(Boolean); // Remove any null results
  }, [safeRequests, safeSuppliers, safeProjects]); // Depend on source arrays

  const sortedRequests = useMemo(() => {
    return [...enrichedRequests].filter(Boolean).sort((a, b) => { // Added .filter(Boolean)
      if (!a || !b) return 0; // Added null/undefined check for sorting
      
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_date') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (sortField === 'quantity' || sortField === 'estimated_unit_price') { // Added estimated_unit_price to sortable numbers
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortField === 'material_name' || sortField === 'requested_by') { // Added requested_by to sortable strings
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (aValue === bValue) return 0;

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [enrichedRequests, sortField, sortDirection]); // Depend on enrichedRequests

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField === field) {
      return sortDirection === 'asc'
        ? <ArrowUp className="w-3 h-3 ml-1 text-gray-500" />
        : <ArrowDown className="w-3 h-3 ml-1 text-gray-500" />;
    }
    return null;
  };

  const SortableHead = ({ field, label }) => (
    <TableHead
      className="text-left p-4 font-semibold text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon field={field} />
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (safeRequests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p>Geen materiaalaanvragen gevonden</p>
      </div>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-transparent dark:bg-slate-900 dark:text-slate-100">
      <CardHeader className="pb-3 px-0 md:px-6">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Package className="w-5 h-5 text-emerald-600" />
          Materiaalaanvragen
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table (hidden on small screens) */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-gray-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                <SortableHead field="material_name" label="Materiaal" />
                <SortableHead field="quantity" label="Hoeveelheid" />
                {isAdmin && <TableHead className="text-left p-4 font-semibold text-gray-700 dark:text-slate-300">Geschatte Kosten</TableHead>}
                <TableHead className="text-left p-4 font-semibold text-gray-700 dark:text-slate-300">Project</TableHead>
                <SortableHead field="requested_by" label="Aangevraagd door" />
                <TableHead className="text-left p-4 font-semibold text-gray-700 dark:text-slate-300">Prioriteit</TableHead>
                <TableHead className="text-left p-4 font-semibold text-gray-700 dark:text-slate-300">Status</TableHead>
                <SortableHead field="created_date" label="Aangevraagd" />
                <TableHead className="text-center p-4 font-semibold text-gray-700 dark:text-slate-300">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {sortedRequests.map((request, index) => (
                  <DesktopRequestRow
                    key={request.id}
                    request={request}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    onOrderPlaced={onOrderPlaced}
                    onRequestClick={onRequestClick}
                    index={index}
                    isAdmin={isAdmin}
                  />
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List (only on small screens) */}
        <div className="md:hidden border-t dark:border-slate-700">
          <AnimatePresence>
            {sortedRequests.map((request) => (
              <MobileRequestCard
                key={request.id}
                request={request}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onOrderPlaced={onOrderPlaced}
                onRequestClick={onRequestClick}
                isAdmin={isAdmin}
              />
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
