import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { , Building, Truck, Users } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { createPageUrl } from '@/components/utils';
import { globalCache } from '@/components/utils/performanceOptimizer';
import { useTheme } from '@/components/providers/ThemeProvider';

const logoLightUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const logoDarkUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";

export default function RegistratieSetup() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const logoUrl = resolvedTheme === 'dark' ? logoDarkUrl : logoLightUrl;

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const user = await User.me();
        console.log('RegistratieSetup: Current user:', user);
        
        // Als gebruiker al een company_id of supplier_id heeft, redirect naar dashboard
        if (user.company_id) {
          console.log('RegistratieSetup: User already has company_id, redirecting to dashboard');
          navigate(createPageUrl('Dashboard'));
          return;
        }
        
        if (user.supplier_id) {
          console.log('RegistratieSetup: User already has supplier_id, redirecting to supplier dashboard');
          navigate(createPageUrl('LeverancierDashboard'));
          return;
        }

        // Voor password gebruikers: check email verificatie
        if (user.auth_provider === 'password' && !user.email_verified) {
          console.log('RegistratieSetup: Password user not verified, redirecting to verify email');
          navigate(createPageUrl('VerifyEmail'));
          return;
        }

        setCurrentUser(user);
      } catch (error) {
        console.error('RegistratieSetup: Auth error:', error);
        navigate(createPageUrl('PasswordLogin'));
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [navigate]);

  const handleSetupType = async (userType) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    console.log('RegistratieSetup: Starting setup for type:', userType);

    try {
      if (userType === 'painter_company') {
        // Redirect naar bedrijf registratie
        navigate(createPageUrl('RegistratieCompany'));
      } else if (userType === 'supplier') {
        // Redirect naar leverancier registratie  
        navigate(createPageUrl('RegistratieSupplier'));
      }
    } catch (error) {
      console.error('RegistratieSetup: Setup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <LoadingSpinner size="default" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoUrl} alt="PaintConnect" className="h-16 w-auto object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welkom bij PaintConnect
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Kies uw rol om verder te gaan met de registratie
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              onClick={() => handleSetupType('painter_company')}
              disabled={isSubmitting}
              className="w-full h-auto p-4 bg-emerald-600 hover:bg-emerald-700 text-left flex items-start gap-4"
            >
              <Building className="w-6 h-6 mt-1 text-emerald-100" />
              <div>
                <div className="font-semibold text-white">Schildersbedrijf</div>
                <div className="text-sm text-emerald-100 opacity-90">
                  Voor schilders en schildersbedrijven
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-100 text-xs mt-1">
                  14 dagen gratis trial
                </Badge>
              </div>
            </Button>

            <Button
              onClick={() => handleSetupType('supplier')}
              disabled={isSubmitting}
              variant="outline"
              className="w-full h-auto p-4 border-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-left flex items-start gap-4"
            >
              <Truck className="w-6 h-6 mt-1 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-900">Leverancier</div>
                <div className="text-sm text-gray-600">
                  Voor verfhandels en groothandels
                </div>
              </div>
            </Button>
          </div>

          {currentUser && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Ingelogd als: <span className="font-medium">{currentUser.email}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}