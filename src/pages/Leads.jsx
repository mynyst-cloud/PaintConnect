import React, { useState, useEffect } from 'react';
import { Lead, ReferralPoint, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Star, Users, Lock } from 'lucide-react';
import { notify } from '@/components/utils/notificationManager';
import { createPageUrl } from '@/components/utils';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { USER_ROLES } from '@/config/roles';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [painters, setPainters] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feature access - Leads is admin only
  const { isAdmin, isPainter, isLoading: featureLoading } = useFeatureAccess();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'nieuw',
    value: '',
    referrer_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [leadsData, paintersData] = await Promise.all([
        Lead.filter({ company_id: user.company_id }),
        User.filter({ company_id: user.company_id, is_painter: true })
      ]);

      setLeads(leadsData || []);
      setPainters(paintersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const leadData = {
        ...formData,
        company_id: currentUser.company_id,
        value: formData.value ? Number(formData.value) : null
      };

      // Add referrer info if it's a referral
      if (formData.source === 'referral' && formData.referrer_id) {
        const referrer = painters.find(p => p.id === formData.referrer_id);
        leadData.referrer_name = referrer?.full_name || referrer?.email;
      }

      await Lead.create(leadData);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'nieuw',
        value: '',
        referrer_id: ''
      });
      setShowForm(false);
      
      // Reload data
      await loadData();
      
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Fout bij opslaan lead');
    }
  };

  const handleStatusUpdate = async (leadId, newStatus) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      // Update lead status
      await Lead.update(leadId, { status: newStatus });

      // If referral lead becomes "gewonnen", award points and send notifications
      if (newStatus === 'gewonnen' && 
          lead.source === 'referral' && // Ensure it's a referral lead
          lead.referrer_id && 
          !lead.points_given &&
          currentUser // Ensure current user is loaded for company_id/full_name
        ) {
        
        try {
          // Create referral point record
          await ReferralPoint.create({
            company_id: currentUser.company_id,
            painter_id: lead.referrer_id,
            painter_name: lead.referrer_name,
            lead_id: leadId,
            lead_name: lead.name,
            points: 1
          });

          // Mark points as given on lead
          await Lead.update(leadId, { points_given: true });

          // NOTIFICATION: Referral Points Awarded to the specific referrer
          // AANGEPAST: gebruik user_emails in plaats van recipient_email
          const referrer = painters.find(p => p.id === lead.referrer_id);
          if (referrer) {
            notify({
              company_id: currentUser.company_id,
              user_emails: [referrer.email], // ✅ FIXED: user_emails als array
              triggering_user_name: currentUser.full_name,
              message: `Gefeliciteerd! U heeft 1 punt gekregen voor de gewonnen referral: ${lead.name}`,
              type: 'leaderboard_update',
              link_to: createPageUrl('Referrals'),
              project_id: null
            });
          }

          // NOTIFICATION: Team Update about Referral Win (removed notifyAllTeam as it doesn't exist)

        } catch (pointError) {
          console.error("Error awarding referral points or sending notifications:", pointError);
          // Continue with loading data even if point award/notification fails
        }
      }

      await loadData(); // Reload data to reflect status change and points_given
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij status update');
    }
  };

  if (isLoading || featureLoading) {
    return <LoadingSpinner overlay text="Leads laden..." />;
  }

  // Role check - Leads is only for admins
  if (isPainter()) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
        <div className="max-w-md mx-auto mt-12 sm:mt-24 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Geen toegang
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Deze pagina is alleen beschikbaar voor beheerders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Lead
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nieuwe Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Naam *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefoon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Geschatte waarde</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bron</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="advertentie">Advertentie</SelectItem>
                      <SelectItem value="telefoon">Telefoon</SelectItem>
                      <SelectItem value="anders">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.source === 'referral' && (
                  <div>
                    <Label>Verwijzende Schilder</Label>
                    <Select value={formData.referrer_id} onValueChange={(value) => setFormData({...formData, referrer_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies schilder" />
                      </SelectTrigger>
                      <SelectContent>
                        {painters.map(painter => (
                          <SelectItem key={painter.id} value={painter.id}>
                            {painter.full_name || painter.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">Opslaan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leads lijst */}
      <div className="space-y-4">
        {leads.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Geen leads gevonden</p>
          </div>
        ) : (
          leads.map(lead => (
            <Card key={lead.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{lead.name}</h3>
                      {lead.source === 'referral' && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                      {lead.points_given && (
                        <Badge className="bg-green-100 text-green-800">Punt gegeven</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {lead.email && <div>📧 {lead.email}</div>}
                      {lead.phone && <div>📞 {lead.phone}</div>}
                      <div>📊 Bron: {lead.source}</div>
                      {lead.value && <div>💰 Waarde: €{lead.value}</div>}
                      {lead.referrer_name && (
                        <div className="text-yellow-600">⭐ Via: {lead.referrer_name}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Select value={lead.status} onValueChange={(value) => handleStatusUpdate(lead.id, value)}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nieuw">Nieuw</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="offerte">Offerte</SelectItem>
                        <SelectItem value="gewonnen">Gewonnen</SelectItem>
                        <SelectItem value="verloren">Verloren</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}