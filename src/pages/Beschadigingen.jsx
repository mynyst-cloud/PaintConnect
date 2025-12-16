import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { errorTracker } from "@/components/utils/errorTracker";
import { Damage, User, Project } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Clock, CheckCircle2, Wrench, LayoutGrid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import DamageForm from "@/components/damages/DamageForm";
import DamageCard from "@/components/damages/DamageCard";
import DamageListItem from "@/components/damages/DamageListItem";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SearchAndSort from "@/components/ui/SearchAndSort";
import PaginationControls from "@/components/ui/PaginationControls";
import ViewSwitcher from "@/components/ui/ViewSwitcher";
import { usePagination } from "@/components/utils/usePagination";

const statusColors = {
  gemeld: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  in_behandeling: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  opgelost: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  geaccepteerd: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
};

const statusLabels = {
  gemeld: "Gemeld",
  in_behandeling: "In behandeling",
  opgelost: "Opgelost",
  geaccepteerd: "Geaccepteerd"
};

const severityColors = {
  laag: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gemiddeld: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  hoog: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  kritiek: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
};

export default function Beschadigingen() {
  const [damages, setDamages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDamage, setEditingDamage] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [deletingIds, setDeletingIds] = useState(new Set());

  const {
    paginatedData: paginatedDamages,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    getPageNumbers,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    setItems,
  } = usePagination(damages, 20);

  const sortOptions = [
    { value: 'title', label: 'Titel' },
    { value: 'status', label: 'Status' },
    { value: 'severity', label: 'Ernst' },
    { value: 'category', label: 'Categorie' },
    { value: 'created_date', label: 'Gemeld op' },
    { value: 'location', label: 'Locatie' }
  ];

  const stats = useMemo(() => {
    const dataToUse = searchTerm || sortBy ? paginatedDamages : damages;
    const safeDamages = Array.isArray(dataToUse) ? dataToUse.filter(d => d && typeof d === 'object') : [];
    const total = safeDamages.length;
    const open = safeDamages.filter(d => d?.status === 'gemeld').length;
    const inProgress = safeDamages.filter(d => d?.status === 'in_behandeling').length;
    const resolved = safeDamages.filter(d => d?.status === 'opgelost' || d?.status === 'geaccepteerd').length;

    return { total, open, inProgress, resolved };
  }, [damages, paginatedDamages, searchTerm, sortBy]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const updateFilteredItems = useCallback(() => {
    const safeDamages = Array.isArray(damages) ? damages.filter(d => d && typeof d === 'object' && d.id) : [];
    let filtered = [...safeDamages];

    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(damage =>
        damage?.title?.toLowerCase().includes(lowercaseSearch) ||
        damage?.description?.toLowerCase().includes(lowercaseSearch) ||
        damage?.location?.toLowerCase().includes(lowercaseSearch) ||
        damage?.category?.toLowerCase().includes(lowercaseSearch) ||
        damage?.reported_by?.toLowerCase().includes(lowercaseSearch)
      );
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        if (!a || !b) return 0;

        let valueA = a[sortBy] ?? (sortBy === 'created_date' ? new Date(0) : '');
        let valueB = b[sortBy] ?? (sortBy === 'created_date' ? new Date(0) : '');

        if (sortBy === 'created_date') {
          valueA = valueA ? new Date(valueA) : new Date(0);
          valueB = valueB ? new Date(valueB) : new Date(0);
        }

        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return sortOrder === 'asc' ? 1 : -1;
        if (valueB == null) return sortOrder === 'asc' ? -1 : 1;

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setItems(filtered);
  }, [damages, searchTerm, sortBy, sortOrder, setItems]);

  useEffect(() => {
    updateFilteredItems();
  }, [updateFilteredItems]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setSearchTerm('');
    
    try {
      localStorage.removeItem('damages_cache');
      sessionStorage.removeItem('damages_cache');
    } catch (e) {
      // Ignore cache clearing errors
    }
    
    try {
      const userData = await User.me();
      setCurrentUser(userData);

      if (!userData?.company_id) {
        setError('U bent niet gekoppeld aan een bedrijf. Neem contact op met uw beheerder.');
        setIsLoading(false);
        return;
      }

      const companyId = userData.company_id;

      const [damagesData, projectsData] = await Promise.all([
        Damage.filter({ company_id: companyId }, '-created_date', 1000).catch(() => []),
        Project.filter({ company_id: companyId }, '', 500).catch(() => [])
      ]);

      const cleanDamages = Array.isArray(damagesData)
        ? damagesData.filter(d => d && typeof d === 'object' && d.id && d.title)
        : [];

      const cleanProjects = Array.isArray(projectsData)
        ? projectsData.filter(p => p && typeof p === 'object' && p.id)
        : [];

      setDamages(cleanDamages);
      setProjects(cleanProjects);

    } catch (error) {
      console.error('[Beschadigingen] Error loading data:', error);
      setError('Kon beschadigingen niet laden. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (damageResult) => {
    if (!damageResult || !damageResult.id) {
      console.error('[Beschadigingen] Invalid damage result received');
      return;
    }
    
    if (editingDamage) {
      setDamages(prev => 
        prev.map(d => d.id === damageResult.id ? damageResult : d)
      );
    } else {
      setDamages(prev => [damageResult, ...prev]);
    }
    
    setShowForm(false);
    setEditingDamage(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDamage(null);
  };

  const handleEdit = (damage) => {
    setEditingDamage(damage);
    setShowForm(true);
  };

  const handleDelete = async (damageId) => {
    if (!damageId || deletingIds.has(damageId)) return;

    if (!window.confirm('Weet je zeker dat je deze beschadiging permanent wilt verwijderen?')) {
      return;
    }

    // Optimistic UI update
    const originalDamages = damages;
    setDamages(prev => prev.filter(d => d.id !== damageId));
    setDeletingIds(prev => new Set(prev).add(damageId));

    try {
      await Damage.delete(damageId);
      toast.success("Beschadiging verwijderd");
      // Alles oké → niets doen
    } catch (err) {
      console.log('[Beschadigingen] Delete error:', err);

      // 404 of 410 = record al weg → dit is GEEN fout!
      if (err.response?.status === 404 || err.response?.status === 410) {
        toast.success("Beschadiging was al verwijderd");
        // UI is al correct → geen rollback nodig
        return;
      }

      // Echte fout → rollback
      toast.error("Fout bij verwijderen: " + (err.message || "onbekend"));
      setDamages(originalDamages); // rollback

      // Log alleen echte fouten naar error tracker
      errorTracker.captureError({
        type: 'damage_delete_failed',
        message: `Echte delete fout voor ${damageId}`,
        error: err,
        status: err.response?.status
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(damageId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (damageId, newStatus) => {
    try {
      const updated = await Damage.update(damageId, { status: newStatus });
      setDamages(prev => prev.map(d => d.id === damageId ? updated : d));
    } catch (err) {
      // Alles negeren behalve echte fouten
      if (!String(err.message || '').includes('not found') && err.response?.status !== 404) {
        console.warn('[Beschadigingen] Real status update error:', err);
      }
      // Stil verwijderen als item weg is
      setDamages(prev => prev.filter(d => d.id !== damageId));
    }
  };

  if (isLoading) {
    return <LoadingSpinner overlay text="Beschadigingen laden..." />;
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Fout bij laden</h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={loadData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              Opnieuw proberen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              Beschadigingen
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Beheer alle gemelde beschadigingen</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Beschadiging Melden
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Totaal</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Open</p>
                  <p className="text-2xl font-bold">{stats.open}</p>
                </div>
                <Clock className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Bezig</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <Wrench className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Opgelost</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="shadow-lg dark:shadow-slate-950/50 border-0">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex-1">
                <SearchAndSort
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  sortOptions={sortOptions}
                  placeholder="Zoek beschadigingen op titel, locatie, categorie..."
                />
              </div>
              <div className="flex-shrink-0">
                <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {Array.isArray(paginatedDamages) && paginatedDamages.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6"
                    : "divide-y divide-gray-100 dark:divide-slate-700"}
                >
                  {paginatedDamages
                    .filter(d => d && d.id && damages.some(item => item.id === d.id))
                    .map((damage, index) => (
                      <motion.div
                        key={damage.id}
                        initial={viewMode === 'grid' ? { opacity: 0, y: 20 } : { opacity: 0, x: -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {viewMode === 'grid' ? (
                          <DamageCard
                            damage={damage}
                            projects={projects}
                            currentUser={currentUser}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onStatusUpdate={handleStatusUpdate}
                            statusColors={statusColors}
                            statusLabels={statusLabels}
                            severityColors={severityColors}
                          />
                        ) : (
                          <DamageListItem
                            damage={damage}
                            projects={projects}
                            currentUser={currentUser}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onStatusUpdate={handleStatusUpdate}
                            statusColors={statusColors}
                            statusLabels={statusLabels}
                            severityColors={severityColors}
                          />
                        )}
                      </motion.div>
                    ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="p-12 text-center">
                {searchTerm ? (
                  <div>
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      Geen resultaten gevonden
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-4">
                      Probeer een andere zoekterm.
                    </p>
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Zoekterm wissen
                    </Button>
                  </div>
                ) : damages.length === 0 ? (
                  <div>
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 dark:text-green-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      Geen beschadigingen gemeld
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-4">
                      Geweldig! Er zijn momenteel geen beschadigingen gemeld.
                    </p>
                    <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Beschadiging Melden
                    </Button>
                  </div>
                ) : (
                  <div>
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      Geen resultaten voor huidige filters
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-4">
                      Er zijn {damages.length} beschadigingen, maar geen die voldoen aan de huidige filters.
                    </p>
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setSortBy(''); }}>
                      Filters wissen
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          {totalItems > itemsPerPage && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
        </Card>

        <AnimatePresence>
          {showForm && (
            <DamageForm
              damage={editingDamage}
              projects={projects}
              currentUser={currentUser}
              onSubmit={handleSubmit}
              onClose={handleCancel}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}