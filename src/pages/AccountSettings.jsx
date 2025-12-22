import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  Send,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { invitePainter, createCustomerPortalSession } from '@/api/functions';
import { supabase } from '@/lib/supabase';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { createPageUrl } from '@/components/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useTheme } from '@/components/providers/ThemeProvider';
import InvoiceTable from '@/components/billing/InvoiceTable';

// Helper function to format subscription plan name
const formatSubscriptionPlan = (company, subscription) => {
  if (!company && !subscription) return 'Gratis';
  const planTier = company?.subscription_tier || subscription?.plan_type;
  if (!planTier) return 'Gratis';
  switch (planTier) {
    case 'starter': return 'Starter';
    case 'professional': return 'Professional';
    case 'enterprise': return 'Enterprise';
    default: return 'Gratis';
  }
};

// Helper function to get badge color for subscription plan
const getSubscriptionPlanColor = (company) => {
  if (!company || !company.subscription_tier) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  switch (company.subscription_tier) {
    case 'starter': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'professional': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'enterprise': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const themeOptions = [
  { value: 'light', label: 'Licht', icon: Sun },
  { value: 'dark', label: 'Donker', icon: Moon },
  { value: 'auto', label: 'Systeem', icon: Monitor }
];

export default function AccountSettings({ impersonatedCompanyId }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profiel');
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
    home_address: ''
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

  const [invoices, setInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Password management state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const isAdmin = user?.company_role === 'admin' || user?.company_role === 'owner';
  const fileInputRef = useRef(null);
  const { theme, setTheme } = useTheme();
  const activeCompanyId = impersonatedCompanyId || user?.current_company_id || user?.company_id;

  // Load user data
  const loadUserData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Check if user logged in with Google OAuth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // Debug: Log auth user structure
      console.log('[AccountSettings] Auth user data:', {
        provider: authUser?.app_metadata?.provider,
        providers: authUser?.app_metadata?.providers,
        identities: authUser?.identities?.map(id => ({ provider: id.provider, identity_id: id.identity_id })),
        email: authUser?.email
      });
      
      // Check multiple ways user could have logged in with Google
      const isGoogle = authUser?.app_metadata?.provider === 'google' || 
                       authUser?.app_metadata?.providers?.includes('google') ||
                       authUser?.identities?.some(id => id.provider === 'google');
      
      console.log('[AccountSettings] isGoogleUser:', isGoogle);
      setIsGoogleUser(isGoogle);
      
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
        home_address: userData.home_address || ''
      });
    } catch (err) {
      console.error('Error loading user:', err);
    }
  }, []);

  // Load team members
  const loadTeamMembers = useCallback(async () => {
    if (!activeCompanyId) return;
    setIsLoadingTeam(true);
    try {
      const activeUsers = await User.filter({ company_id: activeCompanyId, status: 'active' }).catch(() => []);
      const activeUserEmails = (activeUsers || []).map(u => u.email?.toLowerCase());
      const pendingInvites = await PendingInvite.filter({
        company_id: activeCompanyId,
        status: 'pending'
      }).catch(() => []);

      const uniquePendingInvites = (pendingInvites || []).filter(
        invite => !activeUserEmails.includes(invite.email?.toLowerCase())
      );
      
      const allMembers = [
        ...(activeUsers || []).map(member => ({ ...member, type: 'active', status: 'active' })),
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
    } finally {
      setIsLoadingTeam(false);
    }
  }, [activeCompanyId]);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    if (!company?.id) return;
    setIsLoadingInvoices(true);
    try {
      const invoiceData = await Invoice.filter({ company_id: company.id }, '-invoice_date', 100);
      setInvoices(invoiceData || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [company?.id]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);
        const nameParts = (userData.full_name || '').trim().split(/\s+/);
        setUserFormData({
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          email: userData.email || '',
          phone: userData.phone || '',
          hourly_rate: userData.hourly_rate || 35,
          theme_preference: userData.theme_preference || 'auto',
          email_notifications_enabled: userData.email_notifications_enabled !== false,
          home_address: userData.home_address || ''
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
        setMessage({ type: 'error', text: 'Kon accountgegevens niet laden.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [impersonatedCompanyId]);

  // Load team when tab changes
  useEffect(() => {
    if (activeTab === 'team' && activeCompanyId) {
      loadTeamMembers();
    }
  }, [activeTab, activeCompanyId, loadTeamMembers]);

  // Load invoices when company is loaded
  useEffect(() => {
    if (company) loadInvoices();
  }, [company, loadInvoices]);

  // Save user profile
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
        full_name,
        phone: userFormData.phone || null,
        hourly_rate: parseFloat(userFormData.hourly_rate) || 35,
        theme_preference: userFormData.theme_preference,
        email_notifications_enabled: userFormData.email_notifications_enabled,
        home_address: userFormData.home_address?.trim() || null
      });

      if (userFormData.theme_preference !== theme) {
        setTheme(userFormData.theme_preference);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Er ging iets mis bij het opslaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save company settings
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

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !company) return;
    setIsUploading(true);
    try {
      setMessage({ type: 'info', text: 'Logo upload wordt binnenkort toegevoegd.' });
    } catch (err) {
      console.error("Logo upload error:", err);
      setMessage({ type: 'error', text: 'Logo uploaden mislukt.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    // Validation
    if (!passwordData.newPassword) {
      setPasswordMessage({ type: 'error', text: 'Voer een nieuw wachtwoord in.' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Wachtwoord moet minimaal 8 tekens bevatten.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Wachtwoorden komen niet overeen.' });
      return;
    }

    setIsSettingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        setPasswordMessage({ type: 'error', text: error.message || 'Kon wachtwoord niet instellen.' });
      } else {
        setPasswordMessage({ type: 'success', text: 'Wachtwoord succesvol ingesteld! U kunt nu inloggen met uw e-mail en wachtwoord.' });
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('Password update exception:', err);
      setPasswordMessage({ type: 'error', text: 'Er ging iets mis bij het instellen van het wachtwoord.' });
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Resend invite
  const handleResendInvite = async (pendingInvite) => {
    setResendingInviteId(pendingInvite.id);
    try {
      setMessage({ type: '', text: '' });
      const result = await invitePainter({
        firstName: pendingInvite.full_name?.split(' ')[0] || '',
        lastName: pendingInvite.full_name?.split(' ').slice(1).join(' ') || '',
        email: pendingInvite.email,
        phoneNumber: pendingInvite.phone_number || null,
        companyRole: pendingInvite.company_role || 'painter',
        isPainter: true,
        companyId: activeCompanyId
      });
      
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: `Uitnodiging opnieuw verstuurd naar ${pendingInvite.email}!` });
      }
    } catch (err) {
      console.error('Resend invite error:', err);
      setMessage({ type: 'error', text: 'Kon uitnodiging niet opnieuw versturen.' });
    } finally {
      setResendingInviteId(null);
    }
  };

  // Remove team member
  const handleRemoveMember = async (member) => {
    if (!confirm(`Weet je zeker dat je ${member.full_name || member.email} wilt verwijderen?`)) return;
    
    try {
      if (member.type === 'pending') {
        await PendingInvite.delete(member.id);
      } else {
        await User.update(member.id, { status: 'inactive', company_id: null });
      }
      setMessage({ type: 'success', text: 'Teamlid verwijderd.' });
      await loadTeamMembers();
    } catch (err) {
      console.error('Remove member error:', err);
      setMessage({ type: 'error', text: 'Kon teamlid niet verwijderen.' });
    }
  };

  // Invite new team member
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
      const { data, error: backendError } = await invitePainter({
        firstName: inviteFormData.first_name.trim(),
        lastName: inviteFormData.last_name.trim(),
        email: inviteFormData.email.trim(),
        phoneNumber: inviteFormData.phone_number.trim() || null,
        companyRole: inviteFormData.company_role,
        isPainter: inviteFormData.is_painter,
        companyId: activeCompanyId,
        homeAddress: inviteFormData.home_address?.trim() || null
      });

      if (backendError || data?.error) {
        setInviteError(backendError?.error || data?.error || 'Er ging iets mis.');
      } else {
        setMessage({ type: 'success', text: data?.message || "Uitnodiging succesvol verstuurd!" });
        setInviteFormData({
          first_name: '', last_name: '', email: '', phone_number: '',
          company_role: 'painter', is_painter: true, home_address: ''
        });
        await loadTeamMembers();
      }
    } catch (err) {
      console.error("Failed to invite user:", err);
      setInviteError('Er is een onverwachte fout opgetreden.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Manage subscription
  const handleManageSubscription = async () => {
    setIsRedirecting(true);
    try {
      if (company?.stripe_customer_id) {
        const { data, error } = await createCustomerPortalSession();
        if (error) throw new Error(error);
        if (data?.url) {
          window.location.href = data.url;
        } else {
          setMessage({ type: 'error', text: 'Kon niet doorlinken naar portal.' });
        }
      } else {
        setMessage({ type: 'info', text: 'Neem contact op met support om uw abonnement te beheren.' });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: 'error', text: 'Fout bij openen betalingsportal.' });
    } finally {
      setIsRedirecting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Render message
  const renderMessage = () => {
    if (!message.text) return null;
    const icons = { success: CheckCircle, error: AlertCircle, info: Info };
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
      error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
      info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
    };
    const Icon = icons[message.type] || Info;
    return (
      <Alert className={`mb-4 ${colors[message.type] || colors.info}`}>
        <Icon className="h-4 w-4" />
        <AlertDescription>{message.text}</AlertDescription>
      </Alert>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <LoadingSpinner text="Accountgegevens laden..." />
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-center text-gray-700 dark:text-gray-300">U moet ingelogd zijn.</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-emerald-600" />
            Accountinstellingen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Beheer uw profiel, bedrijf en abonnement
          </p>
        </div>

        {renderMessage()}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-lg">
            <TabsTrigger value="profiel" className="gap-2">
              <UserIcon className="w-4 h-4" /> Profiel
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="bedrijf" className="gap-2">
                  <Building className="w-4 h-4" /> Bedrijf
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-2">
                  <Users className="w-4 h-4" /> Team
                </TabsTrigger>
                <TabsTrigger value="facturatie" className="gap-2">
                  <CreditCard className="w-4 h-4" /> Facturatie
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profiel">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Persoonlijke Gegevens</CardTitle>
                <CardDescription>Beheer uw profielinformatie en voorkeuren</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Voornaam *</Label>
                      <Input
                        value={userFormData.first_name}
                        onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })}
                        placeholder="Jan"
                      />
                    </div>
                    <div>
                      <Label>Achternaam *</Label>
                      <Input
                        value={userFormData.last_name}
                        onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                        placeholder="Jansen"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>E-mailadres</Label>
                      <Input value={userFormData.email} disabled className="bg-gray-100 dark:bg-gray-700" />
                    </div>
                    <div>
                      <Label>Telefoonnummer</Label>
                      <Input
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                        placeholder="+31 6 12345678"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Thuisadres (voor reistijd berekening)</Label>
                    <Input
                      value={userFormData.home_address}
                      onChange={(e) => setUserFormData({ ...userFormData, home_address: e.target.value })}
                      placeholder="Straat 123, 1234 AB Stad"
                    />
                  </div>

                  <div>
                    <Label>Uurtarief (€)</Label>
                    <Input
                      type="number"
                      value={userFormData.hourly_rate}
                      onChange={(e) => setUserFormData({ ...userFormData, hourly_rate: e.target.value })}
                      min="0"
                      step="0.50"
                    />
                  </div>

                  <div>
                    <Label className="mb-3 block">Thema</Label>
                    <div className="flex gap-2">
                      {themeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setUserFormData({ ...userFormData, theme_preference: opt.value })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                            userFormData.theme_preference === opt.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <opt.icon className="w-4 h-4" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <Label>E-mail notificaties</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ontvang updates via e-mail</p>
                    </div>
                    <Switch
                      checked={userFormData.email_notifications_enabled}
                      onCheckedChange={(checked) => setUserFormData({ ...userFormData, email_notifications_enabled: checked })}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>Profiel succesvol opgeslagen!</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                    {isSubmitting ? <InlineSpinner /> : <Save className="w-4 h-4 mr-2" />}
                    Opslaan
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password Card - Only show for non-Google users */}
            {!isGoogleUser && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    Wachtwoord Instellen
                  </CardTitle>
                  <CardDescription>
                    Stel een wachtwoord in om in te loggen met e-mail en wachtwoord in plaats van een magic link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <Label>Nieuw wachtwoord</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Minimaal 8 tekens"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label>Bevestig wachtwoord</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Herhaal wachtwoord"
                      />
                    </div>

                    {passwordMessage.text && (
                      <Alert className={passwordMessage.type === 'error' 
                        ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' 
                        : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'}>
                        {passwordMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        <AlertDescription>{passwordMessage.text}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      disabled={isSettingPassword}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSettingPassword ? <InlineSpinner /> : <Lock className="w-4 h-4 mr-2" />}
                      Wachtwoord Instellen
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="bedrijf">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Bedrijfsgegevens</CardTitle>
                <CardDescription>Beheer uw bedrijfsinformatie</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanySave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Bedrijfsnaam</Label>
                      <Input
                        value={companyFormData.name}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>BTW-nummer</Label>
                      <Input
                        value={companyFormData.vat_number}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, vat_number: e.target.value })}
                        placeholder="NL123456789B01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>E-mailadres</Label>
                      <Input
                        type="email"
                        value={companyFormData.email}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Telefoonnummer</Label>
                      <Input
                        value={companyFormData.phone_number}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, phone_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Label>Straat</Label>
                      <Input
                        value={companyFormData.street}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, street: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Huisnummer</Label>
                      <Input
                        value={companyFormData.house_number}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, house_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Postcode</Label>
                      <Input
                        value={companyFormData.postal_code}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, postal_code: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Stad</Label>
                      <Input
                        value={companyFormData.city}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />
                    Bedrijfsgegevens Opslaan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <div className="space-y-6">
              {/* Invite Form */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-emerald-600" />
                    Teamlid Uitnodigen
                  </CardTitle>
                  <CardDescription>Stuur een uitnodiging naar een nieuwe schilder of medewerker</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInviteSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Voornaam *</Label>
                        <Input
                          value={inviteFormData.first_name}
                          onChange={(e) => setInviteFormData({ ...inviteFormData, first_name: e.target.value })}
                          placeholder="Jan"
                        />
                      </div>
                      <div>
                        <Label>Achternaam *</Label>
                        <Input
                          value={inviteFormData.last_name}
                          onChange={(e) => setInviteFormData({ ...inviteFormData, last_name: e.target.value })}
                          placeholder="Jansen"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>E-mailadres *</Label>
                        <Input
                          type="email"
                          value={inviteFormData.email}
                          onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                          placeholder="jan@voorbeeld.nl"
                        />
                      </div>
                      <div>
                        <Label>Telefoonnummer</Label>
                        <Input
                          value={inviteFormData.phone_number}
                          onChange={(e) => setInviteFormData({ ...inviteFormData, phone_number: e.target.value })}
                          placeholder="+31 6 12345678"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Rol</Label>
                      <select
                        value={inviteFormData.company_role}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, company_role: e.target.value })}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="painter">Schilder</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {inviteError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{inviteError}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={isSubmittingInvite} className="bg-emerald-600 hover:bg-emerald-700">
                      {isSubmittingInvite ? <InlineSpinner /> : <Mail className="w-4 h-4 mr-2" />}
                      Uitnodiging Versturen
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Team Members List */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Teamleden ({teamMembers.length})</CardTitle>
                    <CardDescription>Overzicht van alle teamleden</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadTeamMembers} disabled={isLoadingTeam}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTeam ? 'animate-spin' : ''}`} />
                    Vernieuwen
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingTeam ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nog geen teamleden</p>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {member.full_name || member.email}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                              {member.status === 'active' ? 'Actief' : 'In afwachting'}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {member.company_role || 'schilder'}
                            </Badge>
                            {member.type === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvite(member)}
                                disabled={resendingInviteId === member.id}
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                              >
                                {resendingInviteId === member.id ? (
                                  <InlineSpinner />
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Opnieuw versturen</span>
                                  </>
                                )}
                              </Button>
                            )}
                            {member.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="facturatie">
            <div className="space-y-6">
              {/* Subscription Card */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Abonnement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatSubscriptionPlan(company, subscription)}
                        </span>
                        <Badge className={getSubscriptionPlanColor(company)}>
                          {company?.subscription_tier ? 'Actief' : 'Trial'}
                        </Badge>
                      </div>
                      {subscription?.current_period_end && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Volgende factuurdatum: {format(new Date(subscription.current_period_end), 'd MMMM yyyy', { locale: nl })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Link to={createPageUrl('Subscription')}>
                        <Button variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Pakketten Bekijken
                        </Button>
                      </Link>
                      <Button onClick={handleManageSubscription} disabled={isRedirecting}>
                        {isRedirecting ? <InlineSpinner /> : null}
                        Beheer Abonnement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoices Card */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Facturen</CardTitle>
                  <CardDescription>Overzicht van uw facturen</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingInvoices ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nog geen facturen</p>
                  ) : (
                    <InvoiceTable invoices={invoices} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
