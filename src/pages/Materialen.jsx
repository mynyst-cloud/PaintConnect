
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MaterialRequest, Project, Supplier, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, RefreshCw, AlertTriangle, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import MaterialRequestForm from '../components/materials/MaterialRequestForm';
import MaterialFilters from '../components/materials/MaterialFilters';
import MaterialRequestTable from '../components/materials/MaterialRequestTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { notify } from '@/components/utils/notificationManager';
import { createPageUrl } from '@/components/utils';

// Simplified Mobile Card for Painters
const PainterRequestCard = ({ request }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      aangevraagd: { text: 'In afwachting', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      goedgekeurd: { text: 'Goedgekeurd', color: 'bg-green-100 text-green-800 border-green-200' },
      besteld: { text: 'Besteld', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      geleverd: { text: 'Geleverd', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      afgewezen: { text: 'Afgewezen', color: 'bg-red-100 text-red-800 border-red-200' },
    };
    return statusMap[status] || { text: 'Onbekend', color: 'bg-gray-100 text-gray-800' };
  };

  const statusInfo = getStatusInfo(request.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white p-4 rounded-lg shadow-sm border"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-900">{request.material_name}</h3>
          <p className="text-sm text-gray-500">{request.project_name}</p>
        </div>
        <div className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
          {statusInfo.text}
        </div>
      </div>
      <div className="text-sm text-gray-600 mt-2">
        {request.quantity} {request.unit}
      </div>
      <div className="text-xs text-gray-400 mt-2">
        Aangevraagd op {new Date(request.created_date).toLocaleDateString('nl-NL')}
      </div>
    </motion.div>
  );
};


export default function Materialen() {
  const [materialRequests, setMaterialRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    project: 'all'
  });

  const loadData = useCallback(async (user) => {
    setIsLoading(true);
    if (!user?.company_id) {
        setMaterialRequests([]);
        setProjects([]);
        setSuppliers([]);
        setIsLoading(false);
        return;
    }
    
    try {
        const [requests, projectsData, suppliersData] = await Promise.all([
            MaterialRequest.filter({ company_id: user.company_id }, '-created_date'),
            Project.filter({ company_id: user.company_id }),
            Supplier.list(),
        ]);

        const cleanRequests = (requests || []).filter(Boolean);

        const projectMap = new Map(projectsData.map(p => [p.id, p]));
        const supplierMap = new Map(suppliersData.map(s => [s.id, s.name]));

        const enrichedRequests = cleanRequests.map(request => ({
            ...request,
            project_name: projectMap.get(request.project_id)?.project_name || 'Onbekend project',
            supplier_name: supplierMap.get(request.supplier_id) || 'Onbekende leverancier',
        }));
        
        // BUGFIX: Deduplicate requests to prevent double rendering
        const uniqueRequests = Array.from(new Map(enrichedRequests.map(item => [item.id, item])).values());

        setMaterialRequests(uniqueRequests);
        setProjects(projectsData || []);
        setSuppliers(suppliersData || []);

    } catch (error) {
        console.error('Error loading materials:', error);
    } finally {
        setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    const init = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);
            const userIsAdmin = user?.company_role === 'admin' || user?.role === 'admin';
            setIsAdmin(userIsAdmin);
            await loadData(user);
        } catch (error) {
            console.error("Failed to get current user", error);
        } finally {
            setIsLoading(false);
        }
    };
    init();
  }, [loadData]); 

  const filteredRequestsForAdmin = useMemo(() => {
    if (!isAdmin) return [];
    return (materialRequests || []).filter(request => {
      if (!request) return false; 
      const statusMatch = filters.status === 'all' || request.status === filters.status;
      const priorityMatch = filters.priority === 'all' || request.priority === filters.priority;
      const projectMatch = filters.project === 'all' || request.project_id === filters.project;
      return statusMatch && priorityMatch && projectMatch;
    });
  }, [materialRequests, filters, isAdmin]);
  
  const filteredRequestsForPainter = useMemo(() => {
      if (isAdmin || !currentUser) return [];
      
      const painterProjectIds = new Set(
          (projects || []).filter(p => 
              p.assigned_painters?.includes(currentUser.email)
          ).map(p => p.id)
      );

      return (materialRequests || []).filter(request => 
          painterProjectIds.has(request.project_id)
      );
  }, [materialRequests, projects, currentUser, isAdmin]);


  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const requestToUpdate = materialRequests.find(r => r.id === requestId);
      if (!requestToUpdate) return;

      await MaterialRequest.update(requestId, { status: newStatus });

      const statusMessages = {
          'goedgekeurd': 'goedgekeurd',
          'afgewezen': 'afgewezen', 
          'besteld': 'besteld bij leverancier',
          'geleverd': 'geleverd'
      };

      // AANGEPAST: gebruik user_emails in plaats van recipient_email
      if (statusMessages[newStatus] && requestToUpdate.requested_by) {
        const recipient = await User.filter({email: requestToUpdate.requested_by, company_id: currentUser.company_id});
        if (recipient.length > 0) {
            notify({
                company_id: currentUser.company_id,
                user_emails: [recipient[0].email], // ✅ FIXED: user_emails als array
                triggering_user_name: currentUser.full_name,
                message: `Uw materiaalaanvraag "${requestToUpdate.material_name}" is ${statusMessages[newStatus]}`,
                type: 'material_status_update',
                link_to: createPageUrl('Materialen'),
                project_id: requestToUpdate.project_id
            });
        }
      }
      await loadData(currentUser);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSubmit = async (data) => {
    if (!currentUser || !currentUser.company_id) return;

    try {
      // Only handle UPDATES here, new requests are handled by the form itself
      if (editingRequest) {
        const requestData = {
          ...data,
          company_id: currentUser.company_id,
          requested_by: editingRequest.requested_by || currentUser.email, // Preserve original requester
          status: editingRequest.status // Preserve status on edit
        };
        
        await MaterialRequest.update(editingRequest.id, requestData);
        setShowForm(false);
        setEditingRequest(null);
      }
      
      // Always reload data after any operation
      await loadData(currentUser);
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setShowForm(true);
  };
  
  const handleDelete = async (requestId) => {
      if (window.confirm("Weet u zeker dat u deze aanvraag wilt verwijderen?")) {
          try {
              await MaterialRequest.delete(requestId);
              await loadData(currentUser);
          } catch (error) {
              console.error("Error deleting request:", error);
              alert("Verwijderen mislukt.");
          }
      }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRequest(null);
    // Reload data when form closes to show any new requests created by handleMaterialRequest
    loadData(currentUser);
  };

  if (isLoading) {
    return <LoadingSpinner overlay text="Gegevens laden..." />;
  }
  
  // PAINTER VIEW
  if (!isAdmin) {
      return (
          <div className="p-4 bg-gray-50 min-h-screen">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-600" />
                  Mijn Aanvragen
                </h1>
                <Button 
                  onClick={() => { setEditingRequest(null); setShowForm(true); }} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nieuw
                </Button>
              </div>
              <div className="space-y-3">
                  {filteredRequestsForPainter.length > 0 ? (
                      filteredRequestsForPainter.map(req => (
                          <PainterRequestCard key={req.id} request={req} />
                      ))
                  ) : (
                      <div className="text-center py-12 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>U heeft nog geen aanvragen voor uw projecten.</p>
                      </div>
                  )}
              </div>
              <AnimatePresence>
                {showForm && (
                  <MaterialRequestForm
                    request={editingRequest}
                    projects={projects.filter(p => p.assigned_painters?.includes(currentUser.email))}
                    onSubmit={handleSubmit}
                    onCancel={handleFormClose}
                    isAdmin={false}
                  />
                )}
              </AnimatePresence>
          </div>
      );
  }

  // ADMIN VIEW
  return (
    <div className="p-3 md:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-emerald-600" />
              Materiaalaanvragen Beheer
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Beheer alle materiaalaanvragen voor uw projecten</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button onClick={() => loadData(currentUser)} variant="outline" size="sm" disabled={isLoading} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
            <Button 
              onClick={() => { setEditingRequest(null); setShowForm(true); }} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Nieuwe Aanvraag
            </Button>
          </div>
        </motion.div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="p-4 md:p-6 border-b">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                Alle Aanvragen
              </CardTitle>
              <MaterialFilters
                filters={filters}
                setFilters={setFilters}
                projects={projects}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <MaterialRequestTable
                requests={filteredRequestsForAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusUpdate}
                suppliers={suppliers}
                projects={projects}
                onOrderPlaced={() => loadData(currentUser)}
                onRequestClick={(request) => {
                  setEditingRequest(request);
                  setShowForm(true);
                }}
                isAdmin={true}
              />
            </div>
             {filteredRequestsForAdmin.length === 0 && !isLoading && (
              <div className="text-center py-8 md:py-12 text-gray-500">
                <Package className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm md:text-base">Geen aanvragen gevonden.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showForm && (
          <MaterialRequestForm
            request={editingRequest}
            projects={isAdmin ? projects : projects.filter(p => p.assigned_painters?.includes(currentUser.email))}
            onSubmit={handleSubmit}
            onCancel={handleFormClose}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
