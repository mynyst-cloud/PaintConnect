import React, { useState, useEffect } from 'react';
import { User, Company } from '@/api/entities';
import { registerCompany } from '@/api/functions';
import { createPageUrl } from '@/components/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Loader2, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function RegistratieCompany() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    vat: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: 'Nederland'
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await User.me();
        console.log('[RegistratieCompany] Current user:', user);
        
        if (!user) {
          console.log('[RegistratieCompany] No user found, redirecting to login');
          window.location.href = '/login';
          return;
        }

        // Check if user already has a company
        if (user.company_id) {
          console.log('[RegistratieCompany] User already has company, redirecting to dashboard');
          window.location.href = createPageUrl('Dashboard');
          return;
        }

        setCurrentUser(user);
        
        // Pre-fill form with user data
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          phone: user.phone || ''
        }));
      } catch (err) {
        console.error('[RegistratieCompany] Auth check failed:', err);
        setError('Kon gebruikersgegevens niet laden. Probeer opnieuw in te loggen.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Bedrijfsnaam is verplicht';
    }

    if (!formData.email.trim()) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('[RegistratieCompany] Submitting registration with data:', formData);
      
      const { data, error: functionError } = await registerCompany({
        company_name: formData.name,
        email: formData.email,
        vat_number: formData.vat || null,
        phone_number: formData.phone || null,
        street: formData.street || null,
        house_number: formData.houseNumber || null,
        postal_code: formData.postalCode || null,
        city: formData.city || null,
        country: formData.country || 'Nederland'
      });

      if (functionError) {
        throw new Error(functionError.message || 'Registratie mislukt');
      }

      if (data && data.success) {
        console.log('[RegistratieCompany] Registration successful, redirecting to dashboard');
        window.location.href = createPageUrl('Dashboard?setupComplete=true');
      } else {
        throw new Error('Registratie mislukt');
      }
    } catch (err) {
      console.error('[RegistratieCompany] Registration error:', err);
      setError(err.message || 'Er is een fout opgetreden bij de registratie. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={paintConnectLogoUrl} alt="PaintConnect" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welkom bij PaintConnect!</h1>
          <p className="text-gray-600">Vul je bedrijfsgegevens in om te beginnen</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              Bedrijfsregistratie
            </CardTitle>
            <CardDescription>
              Je krijgt 14 dagen gratis toegang tot alle functies
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <div className="text-red-600 text-sm">{error}</div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bedrijfsnaam */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Bedrijfsnaam *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Bijv. Schildersbedrijf Janssen"
                  className={validationErrors.name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mailadres *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="info@jouwbedrijf.nl"
                  className={validationErrors.email ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* BTW-nummer en Telefoon (in 2 kolommen) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vat">BTW-nummer</Label>
                  <Input
                    id="vat"
                    value={formData.vat}
                    onChange={(e) => handleChange('vat', e.target.value)}
                    placeholder="BE0123456789"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefoonnummer
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="012 34 56 78"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Adres sectie */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="w-4 h-4" />
                  Adresgegevens (optioneel)
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Straat</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="Hoofdstraat"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="houseNumber">Nummer</Label>
                    <Input
                      id="houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => handleChange('houseNumber', e.target.value)}
                      placeholder="123"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder="1234 AB"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Plaats</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Amsterdam"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Land</Label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    disabled={isSubmitting}>
                    <option value="Nederland">Nederland</option>
                    <option value="België">België</option>
                  </select>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Bedrijf registreren...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Start gratis proefperiode
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Door te registreren ga je akkoord met onze{' '}
                <a href={createPageUrl('TermsOfService')} className="text-emerald-600 hover:underline">
                  Algemene Voorwaarden
                </a>{' '}
                en{' '}
                <a href={createPageUrl('PrivacyPolicy')} className="text-emerald-600 hover:underline">
                  Privacybeleid
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}