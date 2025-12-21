import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfferteOpmeting, User, Company } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl, formatDateTime } from '@/components/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OfferteLijstPage() {
  const navigate = useNavigate();
  const [offertes, setOffertes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Only super admin can access
        if (user.role !== 'admin') {
          toast.error('Deze functie is alleen toegankelijk voor super admins');
          navigate(createPageUrl('Dashboard'));
          return;
        }

        const companyId = user.company_id || user.current_company_id;
        if (companyId) {
          const companyData = await Company.get(companyId);
          setCompany(companyData);
        }

        const fetchedOffertes = await OfferteOpmeting.list('-created_date', 100);
        setOffertes(fetchedOffertes);
      } catch (error) {
        console.error('Error fetching offertes:', error);
        toast.error('Fout bij het laden van de offertes.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleViewOfferte = (id) => {
    navigate(createPageUrl(`OfferteOpmeting?id=${id}`));
  };

  if (isLoading) {
    return <LoadingSpinner text="Offertes laden..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              📋 Offertes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Overzicht van alle opmetingen en offertes
            </p>
          </div>
          <Button onClick={() => navigate(createPageUrl('OfferteOpmeting'))} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Nieuwe Offerte
          </Button>
        </div>

        {offertes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">Nog geen offertes aangemaakt.</p>
              <Button onClick={() => navigate(createPageUrl('OfferteOpmeting'))} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Start Nieuwe Offerte
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offertes.map((offerte) => {
              const totaalM2 = offerte.metingen?.reduce((sum, m) => sum + m.oppervlakte, 0) || 0;
              const totaalPrijs = offerte.metingen?.reduce((sum, m) => sum + (m.oppervlakte * m.m2_prijs * m.aantal_lagen), 0) || 0;

              return (
                <Card key={offerte.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewOfferte(offerte.id)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1">
                        {offerte.project_naam || 'Naamloze offerte'}
                      </CardTitle>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                        offerte.status === 'concept' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {offerte.status === 'concept' ? '📝 Concept' : '✅ Verzonden'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <p className="text-gray-600 dark:text-gray-300">
                        <strong>Klant:</strong> {offerte.voornaam_klant} {offerte.achternaam_klant}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 truncate">
                        <strong>E-mail:</strong> {offerte.email_klant}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <strong>Aangemaakt:</strong> {formatDateTime(offerte.created_date)}
                      </p>
                      {offerte.offerte_nummer && (
                        <p className="text-gray-600 dark:text-gray-300">
                          <strong>Nr:</strong> {offerte.offerte_nummer}
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {offerte.metingen?.length || 0} meting(en)
                        </span>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{totaalM2.toFixed(2)} m²</div>
                          <div className="text-lg font-bold text-emerald-600">€{totaalPrijs.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full mt-3" onClick={(e) => { e.stopPropagation(); handleViewOfferte(offerte.id); }}>
                      <Eye className="w-4 h-4 mr-2" /> Bekijk & Bewerk
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}