import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Material, SupplierInvoice, MaterialPriceApproval, User, Supplier, MaterialCategory, Notification } from '@/api/entities';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Pencil, Trash2, Plus, Loader2, FileUp, Download, ArrowUpDown,
    Filter, X, CheckSquare, AlertCircle, TrendingUp, Package, Euro,
    BarChart3, FileText, Eye, Check, XCircle, Clock, Mail, ChevronDown, ChevronRight, Save,
    TrendingDown, AlertTriangle, Minus, ArrowUp, ArrowDown, Copy, CalendarDays, MessageSquare, Settings,
    ChevronLeft, FileSearch, PackagePlus
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MaterialInvoiceProcessor from '@/components/materials/MaterialInvoiceProcessor';
import InvoiceReviewModal from '@/components/materials/InvoiceReviewModal';
import SupplierSidebar from '@/components/suppliers/SupplierSidebar';
import CategoryManager from '@/components/materials/CategoryManager';
import AddToStockModal from '@/components/stock/AddToStockModal';
import MaterialConsumptionReport from '@/components/materials/MaterialConsumptionReport';
import { formatDate, formatCurrency } from '@/components/utils';
import { base44 } from '@/api/base44Client';
import { useFeatureAccess, UpgradePrompt } from '@/hooks/useFeatureAccess';
import UpgradeModal from '@/components/ui/UpgradeModal';
import { Lock } from 'lucide-react';

// Normaliseer materiaalnaam voor betere matching
const normalizeMaterialName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/\d+\s*(l|liter|lt|kg|ml|g|m|cm|mm)\b/gi, '') // Verwijder volume/gewicht (10L, 5kg, etc.)
        .replace(/\b(ral|ncs|pantone)\s*\d+/gi, '') // Verwijder kleurcodes (RAL 9016, NCS S1000-N)
        .replace(/\b(sf|op|lichte|donkere|kleur|wit|zwart|grijs|basis)\b/gi, '') // Verwijder kleur-gerelateerde woorden
        .replace(/[^a-z0-9]/g, '') // Verwijder speciale tekens
        .replace(/\s+/g, '') // Verwijder alle spaties
        .trim();
};

// Zoek bestaand materiaal met fuzzy matching
const findExistingMaterial = (itemName, allMaterials, companyId) => {
    if (!itemName || !allMaterials) return null;
    
    const normalizedItemName = normalizeMaterialName(itemName);
    
    // Eerst: exacte match op naam
    let match = allMaterials.find(m =>
        m.company_id === companyId &&
        m.name.toLowerCase() === itemName.toLowerCase()
    );
    if (match) return match;
    
    // Tweede: genormaliseerde match
    match = allMaterials.find(m =>
        m.company_id === companyId &&
        normalizeMaterialName(m.name) === normalizedItemName
    );
    if (match) return match;
    
    // Derde: check of genormaliseerde naam bevat is in bestaand materiaal of andersom
    match = allMaterials.find(m => {
        if (m.company_id !== companyId) return false;
        const normalizedExisting = normalizeMaterialName(m.name);
        // Minimaal 6 karakters voor substring match om false positives te voorkomen
        if (normalizedItemName.length >= 6 && normalizedExisting.length >= 6) {
            return normalizedExisting.includes(normalizedItemName) || 
                   normalizedItemName.includes(normalizedExisting);
        }
        return false;
    });
    
    return match || null;
};

const getStatusBadgeConfig = (item, allMaterials, currentUserCompanyId) => {
    const existingMaterial = findExistingMaterial(item.name, allMaterials, currentUserCompanyId);

    if (!existingMaterial) {
        return {
            icon: Plus,
            label: 'Nieuw Materiaal',
            className: 'bg-blue-100 text-blue-700 border-blue-300',
            message: 'Nieuw materiaal'
        };
    }

    const currentPrice = parseFloat(item.unit_price) || 0;
    const existingPrice = parseFloat(existingMaterial.price_excl_vat) || 0;
    const currentDiscount = parseInt(item.discount) || 0;
    const existingDiscount = parseInt(existingMaterial.discount_percentage) || 0;

    let changes = [];
    let priceChange = 0; // 0: no change, 1: increase, -1: decrease
    let discountChange = 0; // 0: no change, 1: increase, -1: decrease

    if (currentPrice > existingPrice + 0.01) { // Price increased (unfavorable)
        priceChange = 1;
        changes.push(`prijs gestegen met €${(currentPrice - existingPrice).toFixed(2)}`);
    } else if (currentPrice < existingPrice - 0.01) { // Price decreased (favorable)
        priceChange = -1;
        changes.push(`prijs gedaald met €${(existingPrice - currentPrice).toFixed(2)}`);
    }

    if (currentDiscount > existingDiscount) { // Discount increased (favorable)
        discountChange = 1;
        changes.push(`korting gestegen met ${currentDiscount - existingDiscount}%`);
    } else if (currentDiscount < existingDiscount) { // Discount decreased (unfavorable)
        discountChange = -1;
        changes.push(`korting gedaald met ${existingDiscount - currentDiscount}%`);
    }

    if (changes.length === 0) {
        return {
            icon: Minus,
            label: 'In Materiaalbeheer',
            className: 'bg-gray-100 text-gray-600 border-gray-300',
            message: 'Bestaand materiaal, geen wijzigingen'
        };
    }

    const message = changes.join(' en ');

    // Both unfavorable: price up (1) AND discount down (-1)
    if (priceChange === 1 && discountChange === -1) {
        return {
            icon: TrendingUp, // Indicating general negative trend
            label: 'Ongunstig Gewijzigd',
            className: 'bg-red-100 text-red-700 border-red-300',
            message: `Ongunstige wijziging: ${message}`
        };
    }
    
    // Both favorable: price down (-1) AND discount up (1)
    if (priceChange === -1 && discountChange === 1) {
        return {
            icon: TrendingDown, // Indicating general positive trend
            label: 'Gunstig Gewijzigd',
            className: 'bg-green-100 text-green-700 border-green-300',
            message: `Gunstige wijziging: ${message}`
        };
    }
    
    // Price change only
    if (priceChange !== 0 && discountChange === 0) {
        if (priceChange === 1) { // Price increased (unfavorable)
            return {
                icon: ArrowUp,
                label: 'Prijs Gestegen',
                className: 'bg-red-100 text-red-700 border-red-300',
                message
            };
        } else { // Price decreased (favorable)
            return {
                icon: ArrowDown,
                label: 'Prijs Gedaald',
                className: 'bg-green-100 text-green-700 border-green-300',
                message
            };
        }
    }
    
    // Discount change only
    if (discountChange !== 0 && priceChange === 0) {
        if (discountChange === 1) { // Discount increased (favorable)
            return {
                icon: ArrowDown,
                label: 'Korting Gestegen',
                className: 'bg-green-100 text-green-700 border-green-300',
                message
            };
        } else { // Discount decreased (unfavorable)
            return {
                icon: ArrowUp,
                label: 'Korting Gedaald',
                className: 'bg-red-100 text-red-700 border-red-300',
                message
            };
        }
    }

    // Mixed changes not covered by "both unfavorable/favorable"
    // e.g., price up, discount up (mixed) OR price down, discount down (mixed)
    // For simplicity, we'll categorize these as 'both_change' or 'alert'
    // This could be refined further if specific badges are desired for each mixed scenario.
    return {
        icon: AlertTriangle,
        label: 'Prijs & Korting Gewijzigd',
        className: 'bg-orange-100 text-orange-700 border-orange-300',
        message: `Prijs en korting gewijzigd: ${message}`
    };
};

// Helper functie voor BTW berekening
const calculatePriceWithVAT = (priceExclVat, vatRate = 21) => {
    const numericPriceExclVat = parseFloat(priceExclVat) || 0;
    const numericVatRate = parseFloat(vatRate) || 21;
    return numericPriceExclVat * (1 + (numericVatRate / 100));
};

const is404Error = (error) => {
    return error.response?.status === 404 ||
           error.message?.includes('not found') ||
           error.message?.includes('404');
};

export default function MateriaalBeheer() {
    // Feature access for subscription-based restrictions
    const { hasFeature, isLoading: featureLoading, checkLimit } = useFeatureAccess();
    
    // Upgrade modal state
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeatureName, setUpgradeFeatureName] = useState('');
    
    const [activeTab, setActiveTab] = useState('materials');
    const [materials, setMaterials] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [showInvoiceProcessor, setShowInvoiceProcessor] = useState(false);
    const [showSupplierSidebar, setShowSupplierSidebar] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState(new Set());
    const [selectedInvoices, setSelectedInvoices] = new useState(new Set());
    const [sortField, setSortField] = useState('created_date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filters, setFilters] = useState({
        category: 'all',
        supplier: 'all',
        status: 'all'
    });
    const [isExporting, setIsExporting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
    const [editingLineItem, setEditingLineItem] = useState(null);
    const [isSavingLineItem, setIsSavingLineItem] = useState(false);
    const [statsPeriod, setStatsPeriod] = useState('1');
    const [showStatsExpanded, setShowStatsExpanded] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedEmailContent, setSelectedEmailContent] = useState(null);
    
    // NIEUW: Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedInvoiceForReview, setSelectedInvoiceForReview] = useState(null);
    
    // NIEUW: Paginering state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // NIEUW: Stock modal state
    const [showAddToStockModal, setShowAddToStockModal] = useState(false);
    const [selectedMaterialForStock, setSelectedMaterialForStock] = useState(null);
    
    // NIEUW: Delete loading state
    const [isDeletingInvoices, setIsDeletingInvoices] = useState(false);
    
    const { toast } = useToast();

    const copyEmailToClipboard = useCallback(async (email) => {
        try {
            await navigator.clipboard.writeText(email);
            toast({
                title: "Gekopieerd!",
                description: "E-mailadres gekopieerd naar klembord.",
                duration: 2000
            });
        } catch (error) {
            console.error("Error copying to clipboard:", error);
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon e-mailadres niet kopiëren.",
                duration: 2000
            });
        }
    }, [toast]);

    const loadCategories = useCallback(async () => {
        if (!currentUser?.company_id && !currentUser?.current_company_id) return;

        try {
            const companyId = currentUser.current_company_id || currentUser.company_id;
            const cats = await MaterialCategory.filter({ company_id: companyId }, 'sort_order');
            setCategories(cats || []);
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([]);
        }
    }, [currentUser]);

    const loadMaterials = useCallback(async () => {
        if (!currentUser?.company_id && !currentUser?.current_company_id) {
            setMaterials([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const companyId = currentUser.current_company_id || currentUser.company_id;
            // CRITICAL FIX: Filter materials by company_id
            const materialList = await Material.filter({ company_id: companyId }, '-created_date');
            setMaterials(materialList || []);
            setSelectedMaterials(new Set());
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Fout bij laden",
                description: "Kon de materialenlijst niet ophalen.",
            });
            console.error("Error loading materials:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, toast]);

    const loadInvoices = useCallback(async () => {
        if (!currentUser?.company_id && !currentUser?.current_company_id) return;

        try {
            const companyIdForQuery = currentUser.current_company_id || currentUser.company_id;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MateriaalBeheer.jsx:loadInvoices',message:'Fetching invoices',data:{companyId:companyIdForQuery},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            const invoiceList = await SupplierInvoice.filter({
                company_id: companyIdForQuery
            }, '-created_date');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MateriaalBeheer.jsx:loadInvoices',message:'Invoices loaded',data:{count:invoiceList?.length||0,invoices:invoiceList?.slice(0,3).map(i=>({id:i.id,supplier:i.supplier_name,status:i.status}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            setInvoices(invoiceList || []);
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MateriaalBeheer.jsx:loadInvoices',message:'Error loading invoices',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            console.error("Error loading invoices:", error);
        }
    }, [currentUser]);

    const loadApprovals = useCallback(async () => {
        if (!currentUser?.company_id && !currentUser?.current_company_id) return;

        try {
            const approvalList = await MaterialPriceApproval.filter({
                company_id: currentUser.current_company_id || currentUser.company_id,
                status: 'pending'
            }, '-created_date');
            setApprovals(approvalList || []);
        } catch (error) {
            console.error("Error loading approvals:", error);
        }
    }, [currentUser]);

    const loadSuppliers = useCallback(async () => {
        try {
            const supplierList = await Supplier.list('-created_date');
            setSuppliers(supplierList || []);
        } catch (error) {
            console.error("Error loading suppliers:", error);
            setSuppliers([]);
        }
    }, []);

    const getAllSupplierNames = useCallback(() => {
        const supplierNames = new Set();
        
        materials.forEach(material => {
            if (material.supplier) {
                supplierNames.add(material.supplier);
            }
        });
        
        invoices.forEach(invoice => {
            if (invoice.supplier_name) {
                supplierNames.add(invoice.supplier_name);
            }
        });
        
        return Array.from(supplierNames);
    }, [materials, invoices]);

    const getEnrichedSuppliers = useCallback(() => {
        const allSupplierNames = getAllSupplierNames();
        const existingSupplierNames = new Set(suppliers.map(s => s.name));
        const enrichedSuppliers = [...suppliers];
        
        allSupplierNames.forEach(name => {
            if (!existingSupplierNames.has(name)) {
                const invoice = invoices.find(inv => inv.supplier_name === name);
                
                enrichedSuppliers.push({
                    id: `virtual-${name}`,
                    name: name,
                    owner_email: invoice?.sender_email || 'geen-email@onbekend.be',
                    phone_number: null,
                    address: invoice?.supplier_address || null,
                    vat_number: invoice?.supplier_vat || null,
                    status: 'active',
                    specialties: [],
                    isVirtual: true
                });
            }
        });
        
        return enrichedSuppliers;
    }, [suppliers, materials, invoices, getAllSupplierNames]);

    useEffect(() => {
        const init = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);

                const companyId = user.current_company_id || user.company_id;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MateriaalBeheer.jsx:init',message:'User loaded',data:{userId:user.id,companyId,email:user.email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                if (companyId) {
                    const companyData = await base44.entities.Company.get(companyId);
                    setCompany(companyData);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MateriaalBeheer.jsx:init',message:'Company loaded',data:{companyId:companyData.id,companyName:companyData.name,inboundEmail:companyData.inbound_email_address},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                }
            } catch (error) {
                console.error("Error initializing:", error);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadMaterials();
            loadInvoices();
            loadApprovals();
            loadSuppliers();
            loadCategories();
        }
    }, [currentUser, loadMaterials, loadInvoices, loadApprovals, loadSuppliers, loadCategories]);

    const categoryColors = useMemo(() => {
        const colors = {};
        categories.forEach(cat => {
            colors[cat.name.toLowerCase()] = `bg-${cat.color}-500`;
        });
        // Fallbacks
        colors['verf'] = colors['verf'] || 'bg-blue-500';
        colors['primer'] = colors['primer'] || 'bg-purple-500';
        colors['lak'] = colors['lak'] || 'bg-indigo-500';
        colors['klein_materiaal'] = colors['klein_materiaal'] || 'bg-orange-500';
        colors['toebehoren'] = colors['toebehoren'] || 'bg-pink-500';
        colors['onbekend'] = colors['onbekend'] || 'bg-gray-400';
        return colors;
    }, [categories]);

    const categoryLabels = useMemo(() => {
        const labels = {};
        categories.forEach(cat => {
            labels[cat.name.toLowerCase()] = cat.name;
        });
        // Fallbacks
        labels['verf'] = labels['verf'] || 'Verf';
        labels['primer'] = labels['primer'] || 'Primer';
        labels['lak'] = labels['lak'] || 'Lak';
        labels['klein_materiaal'] = labels['klein_materiaal'] || 'Klein Materiaal';
        labels['toebehoren'] = labels['toebehoren'] || 'Toebehoren';
        labels['onbekend'] = labels['onbekend'] || 'Onbekend';
        return labels;
    }, [categories]);

    const availableCategories = useMemo(() => {
        const cats = categories.filter(cat => cat.is_active).map(cat => cat.name.toLowerCase());
        if (cats.length === 0) {
            return ['verf', 'primer', 'lak', 'klein_materiaal', 'toebehoren', 'onbekend'];
        }
        return cats;
    }, [categories]);

    // AANGEPAST: Filter en sorteer ALLE materialen eerst
    const filteredAndSortedAllMaterials = useMemo(() => {
        let filtered = materials.filter(m => {
            if (!m) return false;

            const searchMatch = !searchTerm ||
                m.name.toLowerCase().includes(searchTerm) ||
                (m.sku && m.sku.toLowerCase().includes(searchTerm)) ||
                (m.supplier && m.supplier.toLowerCase().includes(searchTerm));

            const categoryMatch = filters.category === 'all' || m.category === filters.category;
            const supplierMatch = filters.supplier === 'all' || m.supplier === filters.supplier;
            const statusMatch = filters.status === 'all' ||
                (filters.status === 'active' && m.is_active) ||
                (filters.status === 'inactive' && !m.is_active);

            return searchMatch && categoryMatch && supplierMatch && statusMatch;
        });

        filtered.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (sortField === 'price_excl_vat' || sortField === 'discount_percentage') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (sortField === 'created_date') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal || '').toLowerCase();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [materials, searchTerm, filters, sortField, sortDirection]);

    // NIEUW: Bereken totaal aantal pagina's en haal alleen de huidige pagina op
    const totalPages = Math.ceil(filteredAndSortedAllMaterials.length / itemsPerPage);
    
    const paginatedMaterials = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedAllMaterials.slice(startIndex, endIndex);
    }, [filteredAndSortedAllMaterials, currentPage, itemsPerPage]);

    // NIEUW: Reset naar pagina 1 wanneer filters of zoekterm wijzigen
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortField, sortDirection]);

    const stats = useMemo(() => {
        const active = materials.filter(m => m.is_active).length;
        const suppliers = new Set(materials.map(m => m.supplier).filter(Boolean)).size;
        const totalValue = materials.reduce((sum, m) => sum + (parseFloat(m.price_excl_vat) || 0), 0).toFixed(2);

        const now = new Date();
        const monthsToShow = parseInt(statsPeriod);
        const activeCategories = availableCategories.length > 0 ? availableCategories : ['verf', 'primer', 'lak', 'klein_materiaal', 'toebehoren', 'onbekend'];

        const monthlyData = [];
        for (let i = monthsToShow - 1; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = monthDate.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });

            const monthStats = {
                month: monthLabel,
                monthKey: monthKey,
                monthDate: monthDate
            };

            activeCategories.forEach(cat => {
                monthStats[cat] = 0;
            });

            monthlyData.push(monthStats);
        }

        // AANGEPAST: Tel alleen goedgekeurde facturen mee in de statistieken
        invoices.forEach(invoice => {
            // Filter op goedgekeurde facturen
            if (invoice.status !== 'approved') return;
            if (!invoice.line_items || !invoice.invoice_date) return;

            const invoiceDate = new Date(invoice.invoice_date);
            const invoiceMonthKey = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;

            const monthEntry = monthlyData.find(m => m.monthKey === invoiceMonthKey);

            if (monthEntry) {
                invoice.line_items.forEach(item => {
                    const category = item.category || 'onbekend';
                    const amount = item.total_price || 0;

                    if (monthEntry[category] !== undefined) {
                        monthEntry[category] += amount;
                    }
                });
            }
        });

        const categoryTotals = {};
        activeCategories.forEach(cat => {
            categoryTotals[cat] = monthlyData.reduce((sum, month) => sum + (month[cat] || 0), 0);
        });

        const currentMonthStats = monthlyData[monthlyData.length - 1] || {};

        return {
            total: materials.length,
            active,
            suppliers,
            totalValue,
            monthlyData,
            categoryTotals,
            currentMonthStats,
            categories: activeCategories
        };
    }, [materials, invoices, statsPeriod, availableCategories]);

    const uniqueCategories = [...new Set(materials.map(m => m.category).filter(Boolean))];
    const uniqueSuppliers = [...new Set(materials.map(m => m.supplier).filter(Boolean))];

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleCategoryQuickFilter = (categoryName) => {
        setFilters({...filters, category: categoryName});
    };

    const handleSelectAll = () => {
        if (selectedMaterials.size === paginatedMaterials.length && paginatedMaterials.length > 0) {
            setSelectedMaterials(new Set());
        } else {
            setSelectedMaterials(new Set(paginatedMaterials.map(m => m.id)));
        }
    };

    const handleSelectMaterial = (materialId) => {
        const newSelected = new Set(selectedMaterials);
        if (newSelected.has(materialId)) {
            newSelected.delete(materialId);
        } else {
            newSelected.add(materialId);
        }
        setSelectedMaterials(newSelected);
    };

    const handleSelectAllInvoices = () => {
        if (selectedInvoices.size === invoices.length && invoices.length > 0) {
            setSelectedInvoices(new Set());
        } else {
            setSelectedInvoices(new Set(invoices.map(inv => inv.id)));
        }
    };

    const handleSelectInvoice = (invoiceId) => {
        const newSelected = new Set(selectedInvoices);
        if (newSelected.has(invoiceId)) {
            newSelected.delete(invoiceId);
        } else {
            newSelected.add(invoiceId);
        }
        setSelectedInvoices(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedMaterials.size === 0) return;

        const confirmed = window.confirm(
            `Weet u zeker dat u ${selectedMaterials.size} materialen wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`
        );

        if (!confirmed) return;

        try {
            const deletePromises = Array.from(selectedMaterials).map(id => Material.delete(id));
            await Promise.all(deletePromises);

            toast({
                title: "Succes",
                description: `${selectedMaterials.size} materialen succesvol verwijderd.`
            });

            setSelectedMaterials(new Set());
            await loadMaterials();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon niet alle materialen verwijderen."
            });
            console.error("Error deleting materials:", error);
        }
    };

    const handleBulkToggleStatus = async () => {
        if (selectedMaterials.size === 0) return;

        try {
            const materialsToUpdate = materials.filter(m => selectedMaterials.has(m.id));
            const updatePromises = materialsToUpdate.map(m =>
                Material.update(m.id, { ...m, is_active: !m.is_active })
            );

            await Promise.all(updatePromises);

            toast({
                title: "Succes",
                description: `Status van ${selectedMaterials.size} materialen aangepast.`
            });

            setSelectedMaterials(new Set());
            await loadMaterials();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon niet alle statussen bijwerken."
            });
            console.error("Error toggling status:", error);
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm("Weet u zeker dat u deze factuur wilt verwijderen? Goedgekeurde materialen blijven behouden.")) {
            return;
        }

        setIsDeletingInvoices(true);
        try {
            try {
                const relatedApprovals = await MaterialPriceApproval.filter({
                    supplier_invoice_id: invoiceId
                });

                const approvalsToDelete = relatedApprovals.filter(
                    approval => approval.status === 'pending' || approval.status === 'rejected'
                );

                for (const approval of approvalsToDelete) {
                    try {
                        await MaterialPriceApproval.delete(approval.id);
                    } catch (deleteError) {
                        if (!is404Error(deleteError)) {
                            console.error("Error deleting approval:", deleteError);
                        }
                    }
                }
            } catch (approvalError) {
                console.error("Error fetching approvals:", approvalError);
            }

            // Verwijder gerelateerde notificaties
            try {
                const companyId = currentUser.current_company_id || currentUser.company_id;
                const notifications = await Notification.filter({
                    company_id: companyId,
                    type: 'material_requested'
                });
                
                const relatedNotifications = notifications.filter(n => 
                    n.link_to?.includes(invoiceId) || 
                    n.message?.includes(invoiceId)
                );
                
                for (const notif of relatedNotifications) {
                    try {
                        await Notification.delete(notif.id);
                    } catch (deleteError) {
                        if (!is404Error(deleteError)) {
                            console.error("Error deleting notification:", deleteError);
                        }
                    }
                }
            } catch (notifError) {
                console.error("Error deleting related notifications:", notifError);
            }

            try {
                await SupplierInvoice.delete(invoiceId);

                toast({
                    title: "Factuur verwijderd",
                    description: "Factuur succesvol verwijderd. Goedgekeurde materialen zijn behouden."
                });
            } catch (deleteError) {
                if (is404Error(deleteError)) {
                    toast({
                        title: "Factuur verwijderd",
                        description: "Factuur was al verwijderd."
                    });
                } else {
                    throw deleteError;
                }
            }

            await Promise.all([loadInvoices(), loadApprovals()]);
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon factuur niet verwijderen."
            });
        } finally {
            setIsDeletingInvoices(false);
        }
    };

    const handleBulkDeleteInvoices = async () => {
        if (selectedInvoices.size === 0) return;

        const confirmed = window.confirm(
            `Weet u zeker dat u ${selectedInvoices.size} facturen wilt verwijderen? Goedgekeurde materialen blijven behouden.`
        );

        if (!confirmed) return;

        setIsDeletingInvoices(true);
        let successCount = 0;
        let alreadyDeletedCount = 0;
        let errorCount = 0;

        try {
            for (const invoiceId of Array.from(selectedInvoices)) {
                try {
                    try {
                        const relatedApprovals = await MaterialPriceApproval.filter({
                            supplier_invoice_id: invoiceId
                        });

                        const approvalsToDelete = relatedApprovals.filter(
                            approval => approval.status === 'pending' || approval.status === 'rejected'
                        );

                        for (const approval of approvalsToDelete) {
                            try {
                                await MaterialPriceApproval.delete(approval.id);
                            } catch (deleteError) {
                                if (!is404Error(deleteError)) {
                                    console.error("Error deleting approval:", deleteError);
                                }
                            }
                        }
                    } catch (approvalError) {
                        console.error("Error fetching/deleting approvals:", approvalError);
                    }

                    // Verwijder gerelateerde notificaties
                    try {
                        const companyId = currentUser.current_company_id || currentUser.company_id;
                        const notifications = await Notification.filter({
                            company_id: companyId,
                            type: 'material_requested'
                        });
                        
                        const relatedNotifications = notifications.filter(n => 
                            n.link_to?.includes(invoiceId) || 
                            n.message?.includes(invoiceId)
                        );
                        
                        for (const notif of relatedNotifications) {
                            try {
                                await Notification.delete(notif.id);
                            } catch (deleteError) {
                                if (!is404Error(deleteError)) {
                                    console.error("Error deleting notification:", deleteError);
                                }
                            }
                        }
                    } catch (notifError) {
                        console.error("Error deleting related notifications:", notifError);
                    }

                    try {
                        await SupplierInvoice.delete(invoiceId);
                        successCount++;
                    } catch (deleteError) {
                        if (is404Error(deleteError)) {
                            alreadyDeletedCount++;
                        } else {
                            throw deleteError;
                        }
                    }
                } catch (error) {
                    console.error(`Error deleting invoice ${invoiceId}:`, error);
                    errorCount++;
                }
            }

            const totalProcessed = successCount + alreadyDeletedCount;

            if (errorCount === 0) {
                toast({
                    title: "Facturen verwijderd",
                    description: `${totalProcessed} facturen succesvol verwijderd. Goedgekeurde materialen zijn behouden.`
                });
            } else {
                toast({
                    title: "Gedeeltelijk geslaagd",
                    description: `${totalProcessed} facturen verwijderd, ${errorCount} mislukt.`,
                    variant: "destructive"
                });
            }

            setSelectedInvoices(new Set());
            await Promise.all([loadInvoices(), loadApprovals()]);
        } catch (error) {
            console.error("Error in bulk delete:", error);
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon niet alle facturen verwijderen."
            });
        } finally {
            setIsDeletingInvoices(false);
        }
    };

    const handleExportCSV = async () => {
        if (filteredAndSortedAllMaterials.length === 0) {
            toast({
                variant: "destructive",
                title: "Geen data",
                description: "Geen materialen om te exporteren."
            });
            return;
        }

        setIsExporting(true);

        try {
            const headers = ['Naam', 'Categorie', 'Eenheid', 'Prijs (excl BTW)', 'Korting %', 'BTW %', 'SKU', 'Leverancier', 'Actief'];
            const csvData = [
                headers.join(','),
                ...filteredAndSortedAllMaterials.map(m => [
                    `"${m.name}"`,
                    `"${m.category}"`,
                    `"${m.unit}"`,
                    m.price_excl_vat,
                    m.discount_percentage,
                    m.vat_rate || 21,
                    `"${m.sku || ''}"`,
                    `"${m.supplier || ''}"`,
                    m.is_active ? 'Ja' : 'Nee'
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `materialen_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Succes", description: "CSV bestand gedownload!" });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon CSV niet genereren."
            });
            console.error("Error exporting CSV:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleEdit = (material) => {
        setEditingMaterial({ ...material });
    };

    const handleCancelEdit = () => {
        setEditingMaterial(null);
    };

    const handleUpdate = async () => {
        if (!editingMaterial) return;

        try {
            await Material.update(editingMaterial.id, {
                ...editingMaterial,
                price_excl_vat: parseFloat(editingMaterial.price_excl_vat),
                discount_percentage: parseFloat(editingMaterial.discount_percentage),
                vat_rate: parseFloat(editingMaterial.vat_rate),
            });
            toast({ title: "Succes", description: "Materiaal succesvol bijgewerkt." });
            setEditingMaterial(null);
            loadMaterials();
        } catch (error) {
            toast({ variant: "destructive", title: "Fout", description: "Kon materiaal niet bijwerken." });
            console.error("Error updating material:", error);
        }
    };

    const handleDelete = async (materialId) => {
        if (!window.confirm("Weet u zeker dat u dit materiaal wilt verwijderen?")) return;

        try {
            await Material.delete(materialId);
            toast({ title: "Succes", description: "Materiaal verwijderd." });
            loadMaterials();
        } catch (error) {
            toast({ variant: "destructive", title: "Fout", description: "Kon materiaal niet verwijderen." });
            console.error("Error deleting material:", error);
        }
    };

    const handleAddNew = () => {
        const newMaterial = {
            id: 'new',
            name: '',
            category: availableCategories[0] || 'onbekend',
            unit: 'stuk',
            price_excl_vat: 0,
            discount_percentage: 0,
            vat_rate: 21,
            sku: '',
            supplier: '',
            is_active: true,
        };
        setEditingMaterial(newMaterial);
    };

    const handleCreate = async () => {
        try {
            const { id, ...dataToCreate } = editingMaterial;

            const user = await User.me();
            dataToCreate.company_id = user.current_company_id || user.company_id;

            if (!dataToCreate.company_id) throw new Error("Bedrijfs-ID niet gevonden");

            await Material.create({
                ...dataToCreate,
                price_excl_vat: parseFloat(dataToCreate.price_excl_vat),
                discount_percentage: parseFloat(dataToCreate.discount_percentage),
                vat_rate: parseFloat(dataToCreate.vat_rate),
            });
            toast({ title: "Succes", description: "Nieuw materiaal aangemaakt." });
            setEditingMaterial(null);
            loadMaterials();
        } catch (error) {
             toast({ variant: "destructive", title: "Fout", description: `Kon materiaal niet aanmaken: ${error.message}` });
             console.error("Error creating material:", error);
        }
    };

    const handleInvoiceProcessed = () => {
        setShowInvoiceProcessor(false);
        loadMaterials();
        loadInvoices();
        loadApprovals();
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            supplier: 'all',
            status: 'all'
        });
        setSearchTerm('');
    };

    const toggleInvoiceExpansion = (invoiceId) => {
        setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
        setEditingLineItem(null);
    };

    const units = ["liter", "m2", "stuk", "set", "rol", "kg", "meter", "doos", "pak"];

    const pendingInvoices = useMemo(() => {
        return invoices.filter(inv => inv.status === 'pending_approval');
    }, [invoices]);

    // NIEUW: Review-requiring invoices
    const reviewRequiredInvoices = useMemo(() => {
        return invoices.filter(inv => 
            inv.status === 'needs_manual_review' || 
            inv.status === 'needs_quick_review'
        );
    }, [invoices]);

    // AANGEPAST: handleApproveInvoice om updated invoice data te accepteren
    const handleApproveInvoice = async (invoiceData) => {
        try {
            await SupplierInvoice.update(invoiceData.id, {
                ...invoiceData,
                status: 'approved',
                approved_by: currentUser.email,
                approved_at: new Date().toISOString()
            });

            toast({
                title: "Factuur goedgekeurd",
                description: `Factuur van ${invoiceData.supplier_name} is goedgekeurd.`
            });

            setShowReviewModal(false);
            setSelectedInvoiceForReview(null);
            await loadInvoices();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon factuur niet goedkeuren."
            });
            console.error("Error approving invoice:", error);
        }
    };

    // AANGEPAST: handleRejectInvoice om updated invoice data te accepteren
    const handleRejectInvoice = async (invoiceData, reason) => {
        try {
            await SupplierInvoice.update(invoiceData.id, {
                status: 'rejected',
                rejected_by: currentUser.email,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason || 'Geen reden opgegeven'
            });

            toast({
                title: "Factuur afgewezen",
                description: `Factuur van ${invoiceData.supplier_name} is afgewezen.`
            });

            setShowReviewModal(false);
            setSelectedInvoiceForReview(null);
            await loadInvoices();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon factuur niet afwijzen."
            });
            console.error("Error rejecting invoice:", error);
        }
    };

    // NIEUW: Open review modal
    const handleOpenReview = (invoice) => {
        setSelectedInvoiceForReview(invoice);
        setShowReviewModal(true);
    };

    const viewEmailContent = useCallback((invoice) => {
        if (!invoice.email_body_html && !invoice.email_body_text) {
            toast({
                variant: "destructive",
                title: "E-mail niet beschikbaar",
                description: "De inhoud van deze e-mail is niet beschikbaar."
            });
            return;
        }

        setSelectedEmailContent({
            subject: invoice.email_subject || 'Geen onderwerp',
            from: invoice.sender_email || 'Onbekend',
            html: invoice.email_body_html,
            text: invoice.email_body_text,
            date: invoice.created_date
        });
        setShowEmailModal(true);
    }, [toast]);

    const viewInvoicePDF = async (invoice) => {
        if (!invoice.pdf_file_url) {
            toast({
                variant: "destructive",
                title: "PDF niet beschikbaar",
                description: "De PDF van deze factuur is niet beschikbaar."
            });
            return;
        }

        try {
            // Check if it's a private file that needs a signed URL
            if (invoice.pdf_file_url.includes('/private/')) {
                const signedUrlResult = await base44.integrations.Core.CreateFileSignedUrl({
                    file_uri: invoice.pdf_file_url,
                    expires_in: 300
                });

                if (signedUrlResult?.signed_url) {
                    window.open(signedUrlResult.signed_url, '_blank');
                } else {
                    toast({
                        variant: "destructive",
                        title: "Fout",
                        description: "Kon geen geldige URL voor de PDF genereren."
                    });
                }
            } else {
                // Public file, open directly
                window.open(invoice.pdf_file_url, '_blank');
            }
        } catch (error) {
            console.error("Error opening PDF:", error);
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon PDF niet openen."
            });
        }
    };

    const handleEditLineItem = (invoiceId, itemIndex, item) => {
        setEditingLineItem({
            invoiceId,
            itemIndex,
            data: {
                ...item,
                category: item.category || 'onbekend'
            }
        });
    };

    const handleCancelLineItemEdit = () => {
        setEditingLineItem(null);
    };

    const handleUpdateLineItemField = (field, value) => {
        if (!editingLineItem) return;

        setEditingLineItem({
            ...editingLineItem,
            data: {
                ...editingLineItem.data,
                [field]: value
            }
        });
    };

    const handleSaveLineItem = async () => {
        if (!editingLineItem) return;

        setIsSavingLineItem(true);

        try {
            const invoice = invoices.find(inv => inv.id === editingLineItem.invoiceId);
            if (!invoice) throw new Error("Factuur niet gevonden");

            const updatedLineItems = [...invoice.line_items];

            const quantity = parseFloat(editingLineItem.data.quantity) || 1;
            const unitPrice = parseFloat(editingLineItem.data.unit_price) || 0;
            const discount = parseInt(editingLineItem.data.discount) || 0;
            const vatRate = parseInt(editingLineItem.data.vat_rate) || 21;
            const totalPrice = (quantity * unitPrice) * (1 - (discount / 100));

            updatedLineItems[editingLineItem.itemIndex] = {
                ...editingLineItem.data,
                quantity,
                unit_price: unitPrice,
                discount,
                vat_rate: vatRate,
                total_price: totalPrice,
                category: editingLineItem.data.category || 'onbekend'
            };

            const newTotalAmount = updatedLineItems.reduce((sum, item) => sum + (item.total_price || 0), 0);

            await SupplierInvoice.update(invoice.id, {
                line_items: updatedLineItems,
                total_amount: newTotalAmount
            });

            toast({
                title: "Opgeslagen",
                description: "Factuurregel succesvol bijgewerkt."
            });

            setEditingLineItem(null);
            await loadInvoices();
        } catch (error) {
            console.error("Error saving line item:", error);
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon factuurregel niet opslaan."
            });
        } finally {
            setIsSavingLineItem(false);
        }
    };

    const handleDeleteLineItem = async (invoiceId, itemIndex) => {
        if (!window.confirm("Weet u zeker dat u deze factuurregel wilt verwijderen?")) return;

        try {
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (!invoice) throw new Error("Factuur niet gevonden");

            const updatedLineItems = invoice.line_items.filter((_, idx) => idx !== itemIndex);

            const newTotalAmount = updatedLineItems.reduce((sum, item) => sum + (item.total_price || 0), 0);

            await SupplierInvoice.update(invoiceId, {
                line_items: updatedLineItems,
                total_amount: newTotalAmount
            });

            toast({
                title: "Verwijderd",
                description: "Factuurregel succesvol verwijderd."
            });

            setEditingLineItem(null);
            await loadInvoices();
        } catch (error) {
            console.error("Error deleting line item:", error);
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon factuurregel niet verwijderen."
            });
        }
    };

    const generateUniqueSku = useCallback(async (materialName, supplierName) => {
        try {
            const cleanMaterialName = materialName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
            const cleanSupplierName = supplierName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
            
            const baseSkuPrefix = `${cleanSupplierName}-${cleanMaterialName}`;
            
            // Filter materials to find SKUs starting with our prefix
            const matchingSkus = materials
                .filter(m => m.sku && m.sku.startsWith(baseSkuPrefix))
                .map(m => {
                    const match = m.sku.match(/-(\d+)$/);
                    return match ? parseInt(match[1]) : 0;
                })
                .filter(num => !isNaN(num)); // Ensure we only have valid numbers

            let highestNumber = matchingSkus.length > 0 ? Math.max(...matchingSkus) : 0;
            
            // Genereer nieuwe SKU met volgend nummer
            const newNumber = highestNumber + 1;
            const generatedSku = `${baseSkuPrefix}-${String(newNumber).padStart(4, '0')}`;
            
            console.log(`🔑 Generated SKU: ${generatedSku} for ${materialName}`);
            return generatedSku;
            
        } catch (error) {
            console.error("Error generating SKU:", error);
            // Fallback: use a timestamp if full generation fails
            return `MAT-${Date.now()}`;
        }
    }, [materials]);

    const handleApproveLineItem = async (invoiceId, itemIndex) => {
        try {
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (!invoice) throw new Error("Factuur niet gevonden");

            const lineItem = invoice.line_items[itemIndex];
            if (!lineItem) throw new Error("Factuurregel niet gevonden");

            // Bepaal categorie
            const materialCategory = lineItem.category || 'onbekend';
            
            // Gebruik ALTIJD invoice.supplier_name
            const supplierName = invoice.supplier_name;

            // Zoek of er al een materiaal bestaat met deze naam en bedrijf
            const existingMaterial = findExistingMaterial(
                lineItem.name, 
                materials, 
                currentUser.current_company_id || currentUser.company_id
            );

            let materialId = existingMaterial?.id;

            if (!materialId) {
                // NIEUW: Genereer automatisch een SKU voor nieuwe materialen
                const generatedSku = await generateUniqueSku(lineItem.name, supplierName);
                
                // Nieuw materiaal aanmaken met gegenereerde SKU
                const materialData = {
                    company_id: currentUser.current_company_id || currentUser.company_id,
                    name: lineItem.name,
                    category: materialCategory,
                    unit: lineItem.unit || 'stuk',
                    price_excl_vat: parseFloat(lineItem.unit_price) || 0,
                    discount_percentage: parseInt(lineItem.discount) || 0,
                    vat_rate: lineItem.vat_rate || 21,
                    sku: generatedSku, // Gebruik gegenereerde SKU
                    supplier: supplierName,
                    is_active: true,
                    notes: `Toegevoegd via factuur ${invoice.invoice_number || invoice.id} op ${new Date().toLocaleDateString('nl-NL')}`
                };

                const newMaterial = await Material.create(materialData);
                materialId = newMaterial.id;

                toast({
                    title: "✅ Nieuw materiaal toegevoegd",
                    description: `${lineItem.name} is toegevoegd met SKU: ${generatedSku}`,
                    duration: 5000
                });
            } else {
                // Bestaand materiaal updaten met nieuwe prijzen
                await Material.update(materialId, {
                    price_excl_vat: parseFloat(lineItem.unit_price) || 0,
                    discount_percentage: parseInt(lineItem.discount) || 0,
                    vat_rate: lineItem.vat_rate || 21,
                    category: materialCategory,
                    supplier: supplierName
                });

                toast({
                    title: "✅ Materiaal bijgewerkt",
                    description: `Prijs van ${lineItem.name} is bijgewerkt in materiaalbeheer.`,
                    duration: 5000
                });
            }

            // Update line item approval status
            const updatedLineItems = [...invoice.line_items];
            updatedLineItems[itemIndex] = {
                ...lineItem,
                approval_status: 'approved'
            };

            await SupplierInvoice.update(invoiceId, {
                line_items: updatedLineItems
            });

            // Update MaterialPriceApproval
            const relatedApproval = approvals.find(
                approval =>
                    approval.supplier_invoice_id === invoiceId &&
                    approval.material_name.toLowerCase() === lineItem.name.toLowerCase() &&
                    approval.status === 'pending'
            );

            if (relatedApproval) {
                await MaterialPriceApproval.update(relatedApproval.id, {
                    status: 'approved',
                    reviewed_by: currentUser.email,
                    reviewed_at: new Date().toISOString(),
                    material_id: materialId
                });
            }

            // Herlaad alle data
            await Promise.all([
                loadMaterials(),
                loadInvoices(),
                loadApprovals()
            ]);

        } catch (error) {
            console.error("Error approving line item:", error);
            toast({
                variant: "destructive",
                title: "❌ Fout bij goedkeuren",
                description: `${error.message}`,
                duration: 8000
            });
        }
    };

    const handleRejectLineItem = async (invoiceId, itemIndex) => {
        try {
            const invoice = invoices.find(inv => inv.id === invoiceId);
            if (!invoice) throw new Error("Factuur niet gevonden");

            const lineItem = invoice.line_items[itemIndex];

            const updatedLineItems = [...invoice.line_items];
            updatedLineItems[itemIndex] = {
                ...lineItem,
                approval_status: 'rejected'
            };

            await SupplierInvoice.update(invoiceId, {
                line_items: updatedLineItems
            });

            const relatedApproval = approvals.find(
                approval =>
                    approval.supplier_invoice_id === invoiceId &&
                    approval.material_name.toLowerCase() === lineItem.name.toLowerCase()
            );

            if (relatedApproval) {
                await MaterialPriceApproval.update(relatedApproval.id, {
                    status: 'rejected',
                    reviewed_by: currentUser.email,
                    reviewed_at: new Date().toISOString()
                });
            }

            toast({
                title: "Afgewezen",
                description: "Factuurregel afgewezen."
            });

            await Promise.all([
                loadInvoices(),
                loadApprovals()
            ]);
        } catch (error) {
            console.error("Error rejecting line item:", error);
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Kon factuurregel niet afwijzen."
            });
        }
    };

    const handleOpenAddToStock = (material) => {
        setSelectedMaterialForStock(material);
        setShowAddToStockModal(true);
    };

    const handleStockAdded = (success) => {
        setShowAddToStockModal(false);
        setSelectedMaterialForStock(null);
        if (success) {
            toast({
                title: "Voorraad toegevoegd",
                description: "Materiaal succesvol toegevoegd aan voorraad."
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Materiaalbeheer</h1>
                        <p className="text-sm text-muted-foreground">
                            Beheer uw materialen, prijzen en inkomende facturen
                        </p>
                        {company?.inbound_email_address && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-emerald-600" />
                                <span className="text-gray-600">Facturen naar:</span>
                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-emerald-700 dark:text-emerald-400 font-mono">
                                    {company.inbound_email_address}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyEmailToClipboard(company.inbound_email_address)}
                                    className="h-7 px-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    title="Kopieer e-mailadres"
                                >
                                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <TabsList>
                        <TabsTrigger value="materials">
                            <Package className="w-4 h-4 mr-2" />
                            Materialen
                        </TabsTrigger>
                        {/* Facturen tab - Always visible, but shows modal if no access */}
                        <TabsTrigger 
                            value={hasFeature('materiaalbeheer_tab_invoices') ? "invoices" : "materials"}
                            onClick={(e) => {
                                if (!hasFeature('materiaalbeheer_tab_invoices')) {
                                    e.preventDefault();
                                    setUpgradeFeatureName('Facturen verwerken');
                                    setShowUpgradeModal(true);
                                }
                            }}
                            className={`relative ${!hasFeature('materiaalbeheer_tab_invoices') ? 'opacity-60' : ''}`}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Facturen
                            {hasFeature('materiaalbeheer_tab_invoices') && (pendingInvoices.length > 0 || reviewRequiredInvoices.length > 0) && (
                                <Badge className="ml-2 bg-red-500 text-white">
                                    {pendingInvoices.length + reviewRequiredInvoices.length}
                                </Badge>
                            )}
                            {!hasFeature('materiaalbeheer_tab_invoices') && <Lock className="w-3 h-3 ml-2 text-gray-400" />}
                        </TabsTrigger>
                        {/* Verbruik tab - Always visible, but shows modal if no access */}
                        <TabsTrigger 
                            value={hasFeature('materiaalbeheer_tab_usage') ? "consumption" : "materials"}
                            onClick={(e) => {
                                if (!hasFeature('materiaalbeheer_tab_usage')) {
                                    e.preventDefault();
                                    setUpgradeFeatureName('Verbruiksrapportage');
                                    setShowUpgradeModal(true);
                                }
                            }}
                            className={!hasFeature('materiaalbeheer_tab_usage') ? 'opacity-60' : ''}
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Verbruik
                            {!hasFeature('materiaalbeheer_tab_usage') && <Lock className="w-3 h-3 ml-2 text-gray-400" />}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="materials" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Totaal Materialen</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">{stats.active} actief</p>
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setShowSupplierSidebar(true)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Leveranciers</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.suppliers}</div>
                                <p className="text-xs text-muted-foreground">unieke leveranciers</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Geselecteerd</CardTitle>
                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{selectedMaterials.size}</div>
                                <p className="text-xs text-muted-foreground">van {filteredAndSortedAllMaterials.length}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                                    <CardTitle className="text-lg">Omzet Goedgekeurde Facturen per Categorie</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-gray-500" />
                                    <Select value={statsPeriod} onValueChange={setStatsPeriod}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Deze maand</SelectItem>
                                            <SelectItem value="3">Afgelopen 3 maanden</SelectItem>
                                            <SelectItem value="6">Afgelopen 6 maanden</SelectItem>
                                            <SelectItem value="12">Afgelopen 12 maanden</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowStatsExpanded(!showStatsExpanded)}
                                    >
                                        {showStatsExpanded ? <ChevronDown className="w-4 w-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                ✓ Alleen goedgekeurde facturen worden meegenomen in de statistieken
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                {stats.categories.map(category => {
                                    const total = stats.categoryTotals[category] || 0;
                                    const currentMonth = stats.currentMonthStats[category] || 0;

                                    return (
                                        <div key={category} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-3 h-3 rounded ${categoryColors[category]}`}></div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                                                    {categoryLabels[category]}
                                                </span>
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(total)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Deze maand: {formatCurrency(currentMonth)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <AnimatePresence>
                                {showStatsExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t pt-6 mt-6">
                                            <h4 className="text-sm font-semibold mb-4">Maandelijks Overzicht</h4>

                                            <div className="mb-6">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={stats.monthlyData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="month" />
                                                        <YAxis />
                                                        <Tooltip
                                                            formatter={(value) => formatCurrency(value)}
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px'
                                                            }}
                                                        />
                                                        <Legend />
                                                        {stats.categories.map(category => (
                                                            <Bar
                                                                key={category}
                                                                dataKey={category}
                                                                fill={categoryColors[category]?.replace('bg-', '#')}
                                                                name={categoryLabels[category]}
                                                                stackId="a"
                                                            />
                                                        ))}
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="rounded-lg border bg-white dark:bg-gray-800">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Maand</TableHead>
                                                            {stats.categories.map(category => (
                                                                <TableHead key={category} className="text-right capitalize">
                                                                    {categoryLabels[category]}
                                                                </TableHead>
                                                            ))}
                                                            <TableHead className="text-right font-bold">Totaal</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {stats.monthlyData.map((monthData, idx) => {
                                                            const monthTotal = stats.categories.reduce(
                                                                (sum, cat) => sum + (monthData[cat] || 0),
                                                                0
                                                            );

                                                            return (
                                                                <TableRow key={idx}>
                                                                    <TableCell className="font-medium">{monthData.month}</TableCell>
                                                                    {stats.categories.map(category => (
                                                                        <TableCell key={category} className="text-right">
                                                                            {monthData[category] > 0 ? formatCurrency(monthData[category]) : '-'}
                                                                        </TableCell>
                                                                    ))}
                                                                    <TableCell className="text-right font-bold">
                                                                        {formatCurrency(monthTotal)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                        <TableRow className="bg-gray-50 dark:bg-gray-700 font-bold">
                                                            <TableCell>Totaal</TableCell>
                                                            {stats.categories.map(category => (
                                                                <TableCell key={category} className="text-right">
                                                                    {formatCurrency(stats.categoryTotals[category] || 0)}
                                                                </TableCell>
                                                            ))}
                                                            <TableCell className="text-right">
                                                                {formatCurrency(
                                                                    stats.categories.reduce(
                                                                        (sum, cat) => sum + (stats.categoryTotals[cat] || 0),
                                                                        0
                                                                    )
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-wrap gap-2 items-center">
                            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                                <Filter className="mr-2 h-4 w-4" />Filters{showFilters && <X className="ml-2 h-3 w-3" />}
                            </Button>
                            
                            <div className="flex items-center gap-1 ml-2">
                                <Button
                                    variant={filters.category === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleCategoryQuickFilter('all')}
                                    className={filters.category === 'all' ? 'bg-gray-700' : ''}
                                >
                                    Alle
                                </Button>
                                {categories.filter(cat => cat.is_active).map(cat => {
                                    const colorClass = categoryColors[cat.name.toLowerCase()];
                                    const isActive = filters.category === cat.name.toLowerCase();
                                    
                                    return (
                                        <Button
                                            key={cat.id}
                                            variant={isActive ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleCategoryQuickFilter(cat.name.toLowerCase())}
                                            className={isActive ? colorClass : ''}
                                        >
                                            {cat.name}
                                        </Button>
                                    );
                                })}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCategoryManager(true)}
                                    title="Categorieën beheren"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting || filteredAndSortedAllMaterials.length === 0}>
                                {isExporting ? <InlineSpinner /> : <Download className="mr-2 h-4 w-4" />}
                                Export CSV
                            </Button>
                            <Button onClick={handleAddNew}>
                                <Plus className="mr-2 h-4 w-4" />Nieuw Materiaal
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-gray-50 rounded-lg p-4 border">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Zoeken</label>
                                        <Input placeholder="Naam, SKU, leverancier..." value={searchTerm} onChange={handleSearch} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Categorie</label>
                                        <Select value={filters.category} onValueChange={value => setFilters({...filters, category: value})}>
                                            <SelectTrigger><SelectValue placeholder="Alle categorieën" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Alle categorieën</SelectItem>
                                                {uniqueCategories.map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Leverancier</label>
                                        <Select value={filters.supplier} onValueChange={value => setFilters({...filters, supplier: value})}>
                                            <SelectTrigger><SelectValue placeholder="Alle leveranciers" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Alle leveranciers</SelectItem>
                                                {uniqueSuppliers.map(sup => <SelectItem key={sup} value={sup}>{sup}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Status</label>
                                        <Select value={filters.status} onValueChange={value => setFilters({...filters, status: value})}>
                                            <SelectTrigger><SelectValue placeholder="Alle statussen" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Alle statussen</SelectItem>
                                                <SelectItem value="active">Alleen actief</SelectItem>
                                                <SelectItem value="inactive">Alleen inactief</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button variant="outline" size="sm" onClick={clearFilters}>
                                        <X className="mr-2 h-4 w-4" />Filters wissen
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {selectedMaterials.size > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium text-blue-900">{selectedMaterials.size} materialen geselecteerd</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleBulkToggleStatus}>Status omschakelen</Button>
                                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" />Verwijderen
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner size="default" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-lg border bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox checked={selectedMaterials.size === paginatedMaterials.length && paginatedMaterials.length > 0} onCheckedChange={handleSelectAll} />
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                                                <div className="flex items-center gap-2">Naam<ArrowUpDown className="h-4 w-4" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                                                <div className="flex items-center gap-2">Categorie<ArrowUpDown className="h-4 w-4" /></div>
                                            </TableHead>
                                            <TableHead>Eenheid</TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('price_excl_vat')}>
                                                <div className="flex items-center gap-2">Prijs (€)<ArrowUpDown className="h-4 w-4" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('discount_percentage')}>
                                                <div className="flex items-center gap-2">Korting (%)<ArrowUpDown className="h-4 w-4" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('supplier')}>
                                                <div className="flex items-center gap-2">Leverancier<ArrowUpDown className="h-4 w-4" /></div>
                                            </TableHead>
                                            <TableHead>Actief</TableHead>
                                            <TableHead className="text-right">Acties</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedMaterials.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                    <p>Geen materialen gevonden</p>
                                                    <p className="text-sm">Pas uw filters aan of voeg nieuwe materialen toe</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedMaterials.map(material => (
                                                editingMaterial?.id === material.id ? (
                                                    <TableRow key={material.id} className="bg-slate-50">
                                                        <TableCell><Checkbox disabled /></TableCell>
                                                        <TableCell>
                                                            <Input value={editingMaterial.name} onChange={e => setEditingMaterial({...editingMaterial, name: e.target.value})} className="min-w-[200px]" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select value={editingMaterial.category} onValueChange={value => setEditingMaterial({...editingMaterial, category: value})}>
                                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                                <SelectContent>
                                                                    {availableCategories.map(c => (
                                                                        <SelectItem key={c} value={c} className="capitalize">
                                                                            {categoryLabels[c] || c}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select value={editingMaterial.unit} onValueChange={value => setEditingMaterial({...editingMaterial, unit: value})}>
                                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                                <SelectContent>
                                                                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="number" step="0.01" value={editingMaterial.price_excl_vat} onChange={e => setEditingMaterial({...editingMaterial, price_excl_vat: e.target.value})} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="number" step="0.1" value={editingMaterial.discount_percentage} onChange={e => setEditingMaterial({...editingMaterial, discount_percentage: e.target.value})} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input value={editingMaterial.supplier || ''} onChange={e => setEditingMaterial({...editingMaterial, supplier: e.target.value})} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select value={editingMaterial.is_active.toString()} onValueChange={value => setEditingMaterial({...editingMaterial, is_active: value === 'true'})}>
                                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="true">Ja</SelectItem>
                                                                    <SelectItem value="false">Nee</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" onClick={editingMaterial.id === 'new' ? handleCreate : handleUpdate}>Opslaan</Button>
                                                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>Annuleren</Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    <TableRow key={material.id} className={selectedMaterials.has(material.id) ? "bg-blue-50" : ""}>
                                                        <TableCell>
                                                            <Checkbox checked={selectedMaterials.has(material.id)} onCheckedChange={() => handleSelectMaterial(material.id)} />
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <div>
                                                                <div className="font-semibold">{material.name}</div>
                                                                {material.sku && <div className="text-xs text-gray-500">SKU: {material.sku}</div>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell><Badge variant="outline" className="capitalize">{categoryLabels[material.category] || material.category}</Badge></TableCell>
                                                        <TableCell>{material.unit}</TableCell>
                                                        <TableCell className="font-medium">€{parseFloat(material.price_excl_vat).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            {material.discount_percentage > 0 && <Badge variant="secondary">-{material.discount_percentage}%</Badge>}
                                                            {material.discount_percentage === 0 && "-"}
                                                        </TableCell>
                                                        <TableCell>{material.supplier || "-"}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={material.is_active ? "default" : "secondary"}>{material.is_active ? 'Actief' : 'Inactief'}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-1 justify-end">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => handleOpenAddToStock(material)}
                                                                    title="Toevoegen aan voorraad"
                                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                >
                                                                    <PackagePlus className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(material)}><Pencil className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(material.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {/* NIEUW: Paginering controls */}
                            {filteredAndSortedAllMaterials.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span>
                                            Toon {((currentPage - 1) * itemsPerPage) + 1} tot {Math.min(currentPage * itemsPerPage, filteredAndSortedAllMaterials.length)} van {filteredAndSortedAllMaterials.length} materialen
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Select 
                                            value={itemsPerPage.toString()} 
                                            onValueChange={(value) => {
                                                setItemsPerPage(parseInt(value));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10 per pagina</SelectItem>
                                                <SelectItem value="20">20 per pagina</SelectItem>
                                                <SelectItem value="50">50 per pagina</SelectItem>
                                                <SelectItem value="100">100 per pagina</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(1)}
                                                disabled={currentPage === 1}
                                            >
                                                Eerste
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            
                                            <div className="flex items-center gap-1 px-3 py-2 text-sm">
                                                <span className="font-medium">{currentPage}</span>
                                                <span className="text-gray-500">/</span>
                                                <span className="text-gray-600">{totalPages}</span>
                                            </div>
                                            
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Laatste
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="invoices" className="space-y-6">
                    {/* Loading overlay bij verwijderen */}
                    {isDeletingInvoices && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
                                <img 
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png" 
                                    alt="Loading" 
                                    className="w-16 h-16 animate-pulse"
                                />
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Facturen verwijderen...</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Even geduld a.u.b.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Inkomende Facturen</h2>
                            <p className="text-sm text-muted-foreground">Automatisch ontvangen via e-mail en klaar voor beoordeling</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowInvoiceProcessor(true)}>
                                <FileUp className="w-4 h-4 mr-2" />Upload Factuur
                            </Button>
                            <Button variant="outline" onClick={loadInvoices}>
                                <ArrowUpDown className="w-4 h-4 mr-2" />Vernieuwen
                            </Button>
                        </div>
                    </div>

                    {selectedInvoices.size > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium text-blue-900">{selectedInvoices.size} facturen geselecteerd</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="destructive" size="sm" onClick={handleBulkDeleteInvoices}>
                                        <Trash2 className="mr-2 h-4 w-4" />Verwijderen
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner size="default" />
                        </div>
                    ) : invoices.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen facturen ontvangen</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Stuur facturen naar <code className="bg-gray-100 px-2 py-1 rounded">
                                        {company?.inbound_email_address || 'uw-bedrijf@facturatie.paintconnect.be'}
                                    </code>
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="rounded-lg border bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                                                onCheckedChange={handleSelectAllInvoices}
                                            />
                                        </TableHead>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead>Datum</TableHead>
                                        <TableHead>Leverancier</TableHead>
                                        <TableHead>Factuurnummer</TableHead>
                                        <TableHead>Bedrag</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Van</TableHead>
                                        <TableHead className="text-right">Acties</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map(invoice => {
                                        // NIEUW: Bereken totaal incl. BTW op basis van line items
                                        // Bereken totaal excl BTW correct met korting
                                        const totalExclVat = invoice.line_items?.reduce((sum, item) => {
                                            const unitPrice = parseFloat(item.unit_price) || 0;
                                            const quantity = parseFloat(item.quantity) || 1;
                                            const discount = parseFloat(item.discount) || 0;
                                            return sum + (unitPrice * quantity * (1 - discount / 100));
                                        }, 0) || 0;
                                        
                                        // Bereken totaal incl BTW
                                        const totalInclVat = invoice.line_items?.reduce((sum, item) => {
                                            const unitPrice = parseFloat(item.unit_price) || 0;
                                            const quantity = parseFloat(item.quantity) || 1;
                                            const discount = parseFloat(item.discount) || 0;
                                            const vatRate = item.vat_rate || 21;
                                            const lineTotal = unitPrice * quantity * (1 - discount / 100);
                                            return sum + (lineTotal * (1 + vatRate / 100));
                                        }, 0) || 0;

                                        const needsReview = invoice.status === 'needs_manual_review' || invoice.status === 'needs_quick_review';

                                        return (
                                            <React.Fragment key={invoice.id}>
                                                <TableRow className="cursor-pointer hover:bg-gray-50">
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedInvoices.has(invoice.id)}
                                                            onCheckedChange={() => handleSelectInvoice(invoice.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => toggleInvoiceExpansion(invoice.id)}>
                                                            {expandedInvoiceId === invoice.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell onClick={() => toggleInvoiceExpansion(invoice.id)}>
                                                        <div className="text-sm">
                                                            <div className="font-medium">
                                                                {invoice.invoice_date ? formatDate(invoice.invoice_date) : formatDate(invoice.created_date)}
                                                            </div>
                                                            {invoice.due_date && <div className="text-xs text-gray-500">Vervalt: {formatDate(invoice.due_date)}</div>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium" onClick={() => toggleInvoiceExpansion(invoice.id)}>
                                                        <div>
                                                            <div>{invoice.supplier_name}</div>
                                                            {invoice.supplier_vat && (
                                                                <div className="text-xs text-gray-500">BTW: {invoice.supplier_vat}</div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell onClick={() => toggleInvoiceExpansion(invoice.id)}>
                                                        {invoice.invoice_number || '-'}
                                                    </TableCell>
                                                    <TableCell className="font-semibold" onClick={() => toggleInvoiceExpansion(invoice.id)}>
                                                        <div>
                                                            <div>{formatCurrency(totalExclVat)}</div>
                                                            <div className="text-xs text-emerald-600 font-medium">
                                                                {formatCurrency(totalInclVat)} incl.
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell onClick={() => toggleInvoiceExpansion(invoice.id)}>
                                                        {invoice.status === 'pending_approval' && (
                                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                                                <Clock className="w-3 h-3 mr-1" />Te beoordelen
                                                            </Badge>
                                                        )}
                                                        {invoice.status === 'needs_quick_review' && (
                                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />Snelle check
                                                            </Badge>
                                                        )}
                                                        {invoice.status === 'needs_manual_review' && (
                                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />Review vereist
                                                            </Badge>
                                                        )}
                                                        {invoice.status === 'approved' && (
                                                            <Badge className="bg-green-100 text-green-700 border-green-300">
                                                                <Check className="w-3 h-3 mr-1" />Goedgekeurd
                                                            </Badge>
                                                        )}
                                                        {invoice.status === 'rejected' && (
                                                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Afgewezen</Badge>
                                                        )}
                                                        {invoice.status === 'credit_note' && (
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                                                                <FileText className="w-3 h-3 mr-1" />Creditnota
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell onClick={() => toggleInvoiceExpansion(invoice.id)}>
                                                        <div className="text-sm text-gray-600">{invoice.sender_email || '-'}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-1 justify-end">
                                                            {/* ALTIJD Review knop tonen voor alle facturen */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenReview(invoice)}
                                                                title="Review & bewerk factuur"
                                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            >
                                                                <FileSearch className="h-4 w-4" />
                                                            </Button>
                                                            {(invoice.email_body_html || invoice.email_body_text) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => viewEmailContent(invoice)}
                                                                    title="Bekijk e-mail"
                                                                >
                                                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                                                </Button>
                                                            )}
                                                            {invoice.pdf_file_url && (
                                                                <Button variant="ghost" size="icon" onClick={() => viewInvoicePDF(invoice)} title="PDF bekijken">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteInvoice(invoice.id)}
                                                                title="Verwijderen"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                <AnimatePresence>
                                                    {expandedInvoiceId === invoice.id && invoice.line_items && invoice.line_items.length > 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={9} className="p-0 bg-gray-50">
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                    <div className="p-4">
                                                                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                                                            <Package className="w-4 h-4" />
                                                                            Materialen op factuur ({invoice.line_items.length})
                                                                        </h4>
                                                                        <div className="space-y-2">
                                                                            {invoice.line_items.map((item, idx) => {
                                                                                const isEditing = editingLineItem?.invoiceId === invoice.id && editingLineItem?.itemIndex === idx;
                                                                                const editData = isEditing ? editingLineItem.data : item;
                                                                                const statusConfig = getStatusBadgeConfig(item, materials, currentUser.current_company_id || currentUser.company_id);
                                                                                const StatusIcon = statusConfig.icon;

                                                                                const vatRate = item.vat_rate || 21;
                                                                                const unitPriceExclVat = parseFloat(item.unit_price) || 0;
                                                                                const unitPriceInclVat = calculatePriceWithVAT(unitPriceExclVat, vatRate);
                                                                                const quantity = parseFloat(item.quantity) || 1;
                                                                                const discount = parseFloat(item.discount) || 0;
                                                                                // Bereken totaal: eenheidsprijs * aantal * (1 - korting%)
                                                                                const totalPriceExclVat = unitPriceExclVat * quantity * (1 - discount / 100);
                                                                                const totalPriceInclVat = calculatePriceWithVAT(totalPriceExclVat, vatRate);

                                                                                return (
                                                                                    <div key={idx} className={`bg-white rounded-lg p-3 border shadow-sm ${
                                                                                        item.approval_status === 'approved' ? 'border-green-300 bg-green-50' :
                                                                                        item.approval_status === 'rejected' ? 'border-red-300 bg-red-50' :
                                                                                        'border-gray-200'
                                                                                    }`}>
                                                                                        {isEditing ? (
                                                                                            <div className="space-y-3">
                                                                                                <div className="grid grid-cols-3 gap-3">
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">Naam</label>
                                                                                                        <Input
                                                                                                            value={editData.name}
                                                                                                            onChange={(e) => handleUpdateLineItemField('name', e.target.value)}
                                                                                                            className="mt-1"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">SKU</label>
                                                                                                        <Input
                                                                                                            value={editData.sku || ''}
                                                                                                            onChange={(e) => handleUpdateLineItemField('sku', e.target.value)}
                                                                                                            className="mt-1"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">Categorie</label>
                                                                                                        <Select
                                                                                                            value={editData.category || 'onbekend'}
                                                                                                            onValueChange={(value) => handleUpdateLineItemField('category', value)}
                                                                                                        >
                                                                                                            <SelectTrigger className="mt-1">
                                                                                                                <SelectValue />
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {availableCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{categoryLabels[c] || c}</SelectItem>)}
                                                                                                            </SelectContent>
                                                                                                        </Select>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="grid grid-cols-5 gap-3">
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">Hoeveelheid</label>
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            step="0.01"
                                                                                                            value={editData.quantity}
                                                                                                            onChange={(e) => handleUpdateLineItemField('quantity', e.target.value)}
                                                                                                            className="mt-1"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">Eenheid</label>
                                                                                                        <Select
                                                                                                            value={editData.unit}
                                                                                                            onValueChange={(value) => handleUpdateLineItemField('unit', value)}
                                                                                                        >
                                                                                                            <SelectTrigger className="mt-1">
                                                                                                                <SelectValue />
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                                                                            </SelectContent>
                                                                                                        </Select>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">Prijs excl. BTW (€)</label>
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            step="0.01"
                                                                                                            value={editData.unit_price}
                                                                                                            onChange={(e) => handleUpdateLineItemField('unit_price', e.target.value)}
                                                                                                            className="mt-1"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">BTW (%)</label>
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            step="1"
                                                                                                            min="0"
                                                                                                            max="100"
                                                                                                            value={editData.vat_rate || 21}
                                                                                                            onChange={(e) => handleUpdateLineItemField('vat_rate', e.target.value)}
                                                                                                            className="mt-1"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <label className="text-xs font-medium text-gray-600">Korting (%)</label>
                                                                                                        <Input
                                                                                                            type="number"
                                                                                                            step="1"
                                                                                                            min="0"
                                                                                                            max="100"
                                                                                                            value={editData.discount || 0}
                                                                                                            onChange={(e) => handleUpdateLineItemField('discount', e.target.value)}
                                                                                                            className="mt-1"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex justify-end gap-2 pt-2">
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        variant="outline"
                                                                                                        onClick={handleCancelLineItemEdit}
                                                                                                        disabled={isSavingLineItem}
                                                                                                    >
                                                                                                        <X className="w-3 h-3 mr-1" />
                                                                                                        Annuleren
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        onClick={handleSaveLineItem}
                                                                                                        disabled={isSavingLineItem}
                                                                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                                                                    >
                                                                                                        {isSavingLineItem ? (
                                                                                                            <InlineSpinner className="mr-1" />
                                                                                                        ) : (
                                                                                                            <Save className="w-3 h-3 mr-1" />
                                                                                                        )}
                                                                                                        Opslaan
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <>
                                                                                                <div className="flex justify-between items-start mb-2">
                                                                                                    <div className="flex-1">
                                                                                                        <div className="font-medium text-gray-900">{item.name}</div>
                                                                                                        <div className="flex gap-2 items-center text-xs text-gray-500 mt-1">
                                                                                                            {item.sku && <span>SKU: {item.sku}</span>}
                                                                                                            {item.category && <Badge variant="outline" className="capitalize">{categoryLabels[item.category] || item.category}</Badge>}

                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="flex flex-col gap-2 items-end">
                                                                                                        <Badge
                                                                                                            variant="outline"
                                                                                                            className={`${statusConfig.className} flex items-center gap-1`}
                                                                                                            title={statusConfig.message}
                                                                                                        >
                                                                                                            <StatusIcon className="w-3 h-3" />
                                                                                                            {statusConfig.label}
                                                                                                        </Badge>

                                                                                                        {item.approval_status && (
                                                                                                            <Badge
                                                                                                                variant={
                                                                                                                    item.approval_status === 'approved' ? 'default' :
                                                                                                                    item.approval_status === 'rejected' ? 'destructive' :
                                                                                                                    'outline'
                                                                                                                }
                                                                                                            >
                                                                                                                {item.approval_status === 'approved' ? '✓ Goedgekeurd' :
                                                                                                                 item.approval_status === 'rejected' ? '✗ Afgewezen' :
                                                                                                                 '⏱ In behandeling'}
                                                                                                            </Badge>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>

                                                                                                {statusConfig.message && statusConfig.label !== 'In Materiaalbeheer' && (
                                                                                                    <div className="text-xs text-gray-600 mb-2 italic">
                                                                                                        {statusConfig.message}
                                                                                                    </div>
                                                                                                )}

                                                                                                <div className="grid grid-cols-6 gap-4 text-sm">
                                                                                                    <div className="text-gray-600">
                                                                                                        <div className="text-xs text-gray-500">Hoeveelheid</div>
                                                                                                        <div className="font-medium">{item.quantity} {item.unit}</div>
                                                                                                    </div>
                                                                                                    <div className="text-gray-600">
                                                                                                        <div className="text-xs text-gray-500">Prijs excl. BTW</div>
                                                                                                        <div className="font-medium">€{unitPriceExclVat.toFixed(2)}</div>
                                                                                                        <div className="text-xs text-emerald-600">
                                                                                                            €{unitPriceInclVat.toFixed(2)} incl.
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="text-gray-600">
                                                                                                        <div className="text-xs text-gray-500">BTW</div>
                                                                                                        <div className="font-medium">{vatRate}%</div>
                                                                                                    </div>
                                                                                                    <div className="text-gray-600">
                                                                                                        <div className="text-xs text-gray-500">Korting</div>
                                                                                                        <div className="font-medium">{item.discount || 0}%</div>
                                                                                                    </div>
                                                                                                    <div className="text-right">
                                                                                                        <div className="text-xs text-gray-500">Totaal</div>
                                                                                                        <div className="font-semibold text-gray-900">
                                                                                                            €{totalPriceExclVat.toFixed(2)}
                                                                                                        </div>
                                                                                                        <div className="text-xs text-emerald-600 font-medium">
                                                                                                            €{totalPriceInclVat.toFixed(2)} incl.
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className="flex justify-end gap-1">
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            size="icon"
                                                                                                            onClick={() => handleEditLineItem(invoice.id, idx, item)}
                                                                                                            title="Bewerken"
                                                                                                            className="h-7 w-7"
                                                                                                        >
                                                                                                            <Pencil className="h-3 w-3" />
                                                                                                        </Button>
                                                                                                        {item.approval_status !== 'approved' && (
                                                                                                            <Button
                                                                                                                variant="ghost"
                                                                                                                size="icon"
                                                                                                                onClick={() => handleApproveLineItem(invoice.id, idx)}
                                                                                                                title="Goedkeuren"
                                                                                                                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                                                            >
                                                                                                                <Check className="h-3 w-3" />
                                                                                                            </Button>
                                                                                                        )}
                                                                                                        {item.approval_status !== 'rejected' && (
                                                                                                            <Button
                                                                                                                variant="ghost"
                                                                                                                size="icon"
                                                                                                                onClick={() => handleRejectLineItem(invoice.id, idx)}
                                                                                                                title="Afwijzen"
                                                                                                                className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                                                            >
                                                                                                                <XCircle className="h-3 w-3" />
                                                                                                            </Button>
                                                                                                        )}
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            size="icon"
                                                                                                            onClick={() => handleDeleteLineItem(invoice.id, idx)}
                                                                                                            title="Verwijderen"
                                                                                                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                                        >
                                                                                                            <Trash2 className="h-3 w-3" />
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="consumption" className="space-y-6">
                    <MaterialConsumptionReport 
                        companyId={company?.id} 
                        categoryColors={useMemo(() => {
                            // Convert tailwind classes to rough hex codes for charts
                            const hexMap = {
                                'bg-blue-500': '#3b82f6',
                                'bg-purple-500': '#a855f7',
                                'bg-indigo-500': '#6366f1',
                                'bg-orange-500': '#f97316',
                                'bg-pink-500': '#ec4899',
                                'bg-gray-400': '#9ca3af',
                                'bg-green-500': '#22c55e',
                                'bg-red-500': '#ef4444',
                                'bg-yellow-500': '#eab308',
                                'bg-emerald-500': '#10b981'
                            };
                            const colors = {};
                            Object.entries(categoryColors).forEach(([cat, cls]) => {
                                colors[cat] = hexMap[cls] || '#cbd5e1';
                            });
                            return colors;
                        }, [categoryColors])}
                    />
                </TabsContent>
            </Tabs>

            <AnimatePresence>
                {showInvoiceProcessor && (
                    <MaterialInvoiceProcessor
                        onCancel={() => setShowInvoiceProcessor(false)}
                        onFinished={handleInvoiceProcessed}
                    />
                )}
            </AnimatePresence>

            <SupplierSidebar
                suppliers={getEnrichedSuppliers()}
                invoices={invoices}
                materials={materials}
                isOpen={showSupplierSidebar}
                onClose={() => setShowSupplierSidebar(false)}
                onRefresh={() => {
                    loadSuppliers();
                    loadMaterials();
                    loadInvoices();
                }}
            />

            <CategoryManager
                isOpen={showCategoryManager}
                onClose={() => setShowCategoryManager(false)}
                companyId={currentUser?.current_company_id || currentUser?.company_id}
                onCategoriesUpdated={() => {
                    loadCategories();
                    loadMaterials();
                }}
            />

            {/* NIEUW: Review Modal */}
            <AnimatePresence>
                {showReviewModal && selectedInvoiceForReview && (
                    <InvoiceReviewModal
                        invoice={selectedInvoiceForReview}
                        onClose={() => {
                            setShowReviewModal(false);
                            setSelectedInvoiceForReview(null);
                        }}
                        onApprove={handleApproveInvoice}
                        onReject={handleRejectInvoice}
                        currentUser={currentUser}
                        categories={categories}
                        suppliers={suppliers}
                        materials={materials}
                        loadMaterials={loadMaterials}
                        loadInvoices={loadInvoices}
                        generateUniqueSku={generateUniqueSku}
                        toast={toast}
                    />
                )}
            </AnimatePresence>

            {/* NIEUW: Add to Stock Modal */}
            <AddToStockModal
                isOpen={showAddToStockModal}
                onClose={handleStockAdded}
                material={selectedMaterialForStock}
                companyId={company?.id}
            />

            <AnimatePresence>
                {showEmailModal && selectedEmailContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEmailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">E-mail Inhoud</h2>
                                            <p className="text-blue-100 text-sm">Factuurcommunicatie</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowEmailModal(false)}
                                        className="text-white hover:bg-white/20"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-blue-100 min-w-[80px]">Onderwerp:</span>
                                        <span>{selectedEmailContent.subject}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-blue-100 min-w-[80px]">Van:</span>
                                        <span>{selectedEmailContent.from}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-blue-100 min-w-[80px]">Datum:</span>
                                        <span>{formatDate(selectedEmailContent.date)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {selectedEmailContent.html ? (
                                    <div className="prose prose-sm max-w-none">
                                        <div
                                            dangerouslySetInnerHTML={{ __html: selectedEmailContent.html }}
                                            className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                                        />
                                    </div>
                                ) : selectedEmailContent.text ? (
                                    <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                                        {selectedEmailContent.text}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>Geen e-mailinhoud beschikbaar</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t p-4 bg-gray-50 dark:bg-gray-900 flex justify-end">
                                <Button onClick={() => setShowEmailModal(false)}>
                                    Sluiten
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Upgrade Modal for restricted tabs */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName={upgradeFeatureName}
                requiredTier="professional"
            />
        </div>
    );
}