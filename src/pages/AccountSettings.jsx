import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Company, PendingInvite, Invoice, Subscription } from '@/api/entities';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  UserIcon,
  Building,
  CreditCard,
  Users,
  Upload,
  Copy,
  Check,
  Mail,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  AlertTriangle,
  Save,
  Moon,
  Sun,
  Monitor,
  RefreshCw,
  Settings,
  ExternalLink,
  MapPin,
  X
} from 'lucide-react';
import { invitePainter } from '@/api/functions';
import { createCustomerPortalSession } from '@/api/functions';
// import { generateCompanyInboundEmail } from '@/api/functions'; // VERWIJDERD
// import { geocodeAddress } from '@/api/functions'; // VERWIJDERD – tijdelijk uitgeschakeld
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { createPageUrl } from '@/components/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/components/providers/ThemeProvider';
import InvoiceTable from '@/components/billing/InvoiceTable';

// Helper function to format subscription plan name
const formatSubscriptionPlan = (company, subscription) => {
  if (!company && !subscription) return 'Gratis';

  const planTier = company?.subscription_tier || subscription?.plan_type;
  if (!planTier) return 'Gratis';
  switch (planTier) {
    case 'starter':
      return 'Starter';
    case 'professional':
      return 'Professional';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Gratis';
  }
};

// Helper function to get badge color for subscription plan
const getSubscriptionPlanColor = (company) => {
  if (!company || !company.subscription_tier) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  switch (company.subscription_tier) {
    case 'starter':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'professional':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'enterprise':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export default function AccountSettings({ impersonatedCompanyId }) {
    const [user, setUser] = useState(null);
    const [company, setCompany] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [activeTab, setActiveTab] = useState('profiel');
    const [generatedInviteLink, setGeneratedInviteLink] = useState('');
    const [copiedCode, setCopiedCode] = useState('');

    const [inviteFormData, setInviteFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        company_role: 'painter',
        is_painter: true,
        home_address: ''
    });
    const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);

    const [userFormData, setUserFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        hourly_rate: 35,
        theme_preference: 'auto',
        email_notifications_enabled: true,
        home_address: '',
        home_lat: null,
        home_lng: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [companyFormData, setCompanyFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        street: '',
        house_number: '',
        postal_code: '',
        city: '',
        vat_number: ''
    });

    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editMemberAddress, setEditMemberAddress] = useState('');
    const [isUpdatingMemberAddress, setIsUpdatingMemberAddress] = useState(false);

    const [editingRateMemberId, setEditingRateMemberId] = useState(null);
    const [editMemberRate, setEditMemberRate] = useState('');
    const [isUpdatingMemberRate, setIsUpdatingMemberRate] = useState(false);

    const [isGeneratingInboundEmail, setIsGeneratingInboundEmail] = useState(false);

    const [invoices, setInvoices] = useState([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    const isAdmin = user?.company_role === 'admin';
    const fileInputRef = useRef(null);
    const { theme, setTheme } = useTheme();
    const activeCompanyId = impersonatedCompanyId || user?.current_company_id || user?.company_id;

    const loadUserData = useCallback(async () => {
        setIsLoading(true);
        try {
            const userData = await User.me();
            setUser(userData);

            const nameParts = (userData.full_name || '').trim().split(/\s+/);
            const firstName = nameParts.length > 0 ? nameParts[0] : '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            setUserFormData({
                first_name: firstName,
                last_name: lastName,
                email: userData.email || '',
                phone: userData.phone || '',
                hourly_rate: userData.hourly_rate || 35,
                theme_preference: userData.theme_preference || 'auto',
                email_notifications_enabled: userData.email_notifications_enabled !== false,
                home_address: userData.home_address || '',
                home_lat: userData.home_lat || null,
                home_lng: userData.home_lng || null
            });
        } catch (err) {
            setError('Kon gebruikersgegevens niet laden');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadTeamMembers = useCallback(async () => {
        if (!activeCompanyId) return;

        try {
            setIsLoadingTeam(true);
            const activeUsers = await User.filter({ company_id: activeCompanyId, status: 'active' }).catch(() => []);
            const activeUserEmails = (activeUsers || []).map(u => u.email.toLowerCase());
            const pendingInvites = await PendingInvite.filter({
                company_id: activeCompanyId,
                status: 'pending'
            }).catch(() => []);

            const uniquePendingInvites = (pendingInvites || []).filter(
                invite => !activeUserEmails.includes(invite.email.toLowerCase())
            );
            const allMembers = [
                ...(activeUsers || []).map(member => ({
                    ...member,
                    type: 'active',
                    status: 'active'
                })),
                ...(uniquePendingInvites || []).map(invite => ({
                    id: invite.id,
                    full_name: invite.full_name,
                    email: invite.email,
                    phone_number: invite.phone_number,
                    company_role: invite.company_role,
                    type: 'pending',
                    status: 'pending'
                }))
            ];

            setTeamMembers(allMembers);
        } catch (error) {
            console.error("Error loading team members:", error);
            setMessage({ type: 'error', text: 'Kon teamleden niet vernieuwen.' });
        } finally {
            setIsLoadingTeam(false);
        }
    }, [activeCompanyId]);

    const loadInvoices = useCallback(async () => {
        if (!company?.id) return;

        setIsLoadingInvoices(true);
        try {
            const invoiceData = await Invoice.filter({ company_id: company.id }, '-invoice_date', 100);
            setInvoices(invoiceData || []);
        } catch (error) {
            console.error('Error loading invoices:', error);
            setMessage({ type: 'error', text: 'Kon facturen niet laden.' });
        } finally {
            setIsLoadingInvoices(false);
        }
    }, [company?.id]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setMessage({ type: '', text: '' });
            try {
                const userData = await User.me();
                setUser(userData);
                const nameParts = (userData.full_name || '').trim().split(/\s+/);
                const firstName = nameParts.length > 0 ? nameParts[0] : '';
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                setUserFormData({
                    first_name: firstName,
                    last_name: lastName,
                    email: userData.email || '',
                    phone: userData.phone || '',
                    hourly_rate: userData.hourly_rate || 35,
                    theme_preference: userData.theme_preference || 'auto',
                    email_notifications_enabled: userData.email_notifications_enabled !== false,
                    home_address: userData.home_address || '',
                    home_lat: userData.home_lat || null,
                    home_lng: userData.home_lng || null
                });
                const companyIdToLoad = impersonatedCompanyId || userData?.current_company_id || userData?.company_id;
                if (companyIdToLoad) {
                    const [companyData, subscriptionData] = await Promise.all([
                        Company.get(companyIdToLoad),
                        Subscription.filter({ company_id: companyIdToLoad }).then(subs => subs?.[0] || null)
                    ]);
                    setCompany(companyData);
                    setSubscription(subscriptionData);

                    setCompanyFormData({
                        name: companyData?.name || '',
                        email: companyData?.email || '',
                        phone_number: companyData?.phone_number || '',
                        street: companyData?.street || '',
                        house_number: companyData?.house_number || '',
                        postal_code: companyData?.postal_code || '',
                        city: companyData?.city || '',
                        vat_number: companyData?.vat_number || '',
                    });
                }
            } catch (error) {
                console.error("Failed to load account settings:", error);
                setMessage({ type: 'error', text: 'Kon accountgegevens niet laden. Probeer de pagina te vernieuwen.' });
            } finally {
                setIsLoading(false);
                setAuthChecked(true);
            }
        };
        loadInitialData();
    }, [impersonatedCompanyId]);

    useEffect(() => {
        if (activeTab === 'team' && activeCompanyId) {
            loadTeamMembers();

            const interval = setInterval(loadTeamMembers, 30000);
            return () => clearInterval(interval);
        }
    }, [activeTab, activeCompanyId, loadTeamMembers]);

    useEffect(() => {
        if (company && authChecked) {
            loadInvoices();
        }
    }, [company, authChecked, loadInvoices]);

    const handleUserSave = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const full_name = `${userFormData.first_name.trim()} ${userFormData.last_name.trim()}`.trim();

            if (!userFormData.first_name.trim() || !userFormData.last_name.trim()) {
                setError('Voornaam en achternaam zijn verplicht');
                setIsSubmitting(false);
                return;
            }

            await User.updateMyUserData({
                full_name: full_name,
                phone: userFormData.phone || null,
                hourly_rate: parseFloat(userFormData.hourly_rate) || 35,
                theme_preference: userFormData.theme_preference,
                email_notifications_enabled: userFormData.email_notifications_enabled,
                home_address: userFormData.home_address?.trim() || null,
                home_lat: null, // tijdelijk null – geocoding later
                home_lng: null
            });

            if (userFormData.theme_preference !== theme) {
                setTheme(userFormData.theme_preference);
            }

            setSuccess(true);
            await loadUserData();
        } catch (err) {
            setError(err.message || 'Er ging iets mis bij het opslaan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompanySave = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await Company.update(company.id, companyFormData);
            setMessage({ type: 'success', text: 'Bedrijfsgegevens succesvol bijgewerkt!' });
            setCompany(prev => ({ ...prev, ...companyFormData }));
        } catch (err) {
            console.error("Company save error:", err);
            setMessage({ type: 'error', text: 'Kon bedrijfsgegevens niet bijwerken.' });
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !company) return;
        setIsUploading(true);
        setMessage({ type: '', text: '' });
        try {
            // Tijdelijk uitgeschakeld – Supabase Storage komt later
            setMessage({ type: 'info', text: 'Logo upload tijdelijk uitgeschakeld tijdens migratie.' });
        } catch (err) {
            console.error("Logo upload error:", err);
            setMessage({ type: 'error', text: 'Logo uploaden mislukt.' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleResendInvite = async (pendingInvite) => {
        // ... (blijft hetzelfde)
    };

    const handleRemoveMember = async (member) => {
        // ... (blijft hetzelfde)
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setInviteError('');

        if (!inviteFormData.email || !inviteFormData.first_name || !inviteFormData.last_name) {
            setInviteError("E-mailadres, voornaam en achternaam zijn verplicht");
            return;
        }
        setIsSubmittingInvite(true);
        try {
            const invitePayload = {
                firstName: inviteFormData.first_name.trim(),
                lastName: inviteFormData.last_name.trim(),
                email: inviteFormData.email.trim(),
                phoneNumber: inviteFormData.phone_number.trim() || null,
                companyRole: inviteFormData.company_role,
                isPainter: inviteFormData.is_painter,
                companyId: activeCompanyId,
                homeAddress: inviteFormData.home_address?.trim() || null,
                homeLat: null, // tijdelijk null
                homeLng: null
            };
            const { data, error: backendError } = await invitePainter(invitePayload);

            if (backendError || data?.error) {
                setInviteError(backendError?.error || data?.error || 'Er ging iets mis bij het versturen van de uitnodiging.');
            } else {
                setMessage({
                    type: 'success',
                    text: data?.message || "Uitnodiging succesvol verstuurd via e-mail."
                });
                setInviteFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone_number: '',
                    company_role: 'painter',
                    is_painter: true,
                    home_address: ''
                });
                await loadTeamMembers();
            }
        } catch (err) {
            console.error("Failed to invite user:", err);
            setInviteError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
        } finally {
            setIsSubmittingInvite(false);
        }
    };

    // Tijdelijk uitgecommentarieerd – inbound email komt later
    // const handleGenerateInboundEmail = async () => { ... };

    const handleManageSubscription = async () => {
        setIsRedirecting(true);
        setMessage({ type: '', text: '' });
        try {
            if (company?.stripe_customer_id) {
                const { data, error } = await createCustomerPortalSession();

                if (error) {
                    throw new Error(error);
                }

                if (data?.url) {
                    window.location.href = data.url;
                } else {
                    setMessage({ type: 'error', text: 'Kon niet doorlinken naar Stripe portal.' });
                }
            } else {
                setMessage({ type: 'info', text: 'Neem contact op met support om uw Mollie abonnement te beheren.' });
            }
        } catch (error) {
            console.error("Error redirecting to customer portal:", error);
            setMessage({ type: 'error', text: 'Fout bij het openen van de betalingsportal: ' + error.message });
        } finally {
            setIsRedirecting(false);
        }
    };

    // ... (renderMessage, themeOptions, nextInvoiceDate, billingCycleDisplay blijven hetzelfde)

    if (isLoading) {
        return (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <LoadingSpinner text="Accountgegevens laden..." />
            </div>
        );
    }
    if (!user) {
        return <div className="p-6 max-w-5xl mx-auto text-center text-gray-700 dark:text-gray-300">U moet ingelogd zijn om deze pagina te zien.</div>;
    }

    return (
        // ... (de volledige JSX blijft hetzelfde – geen wijzigingen nodig in de UI)
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
            {/* De rest van de JSX is ongewijzigd – te lang om hier te plakken, maar blijft exact zoals in je originele code */}
            {/* Alleen de calls naar verwijderde functions zijn veilig uitgecommentarieerd of vervangen door placeholders */}
        </div>
    );
}