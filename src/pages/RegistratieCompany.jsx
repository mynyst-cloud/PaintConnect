import React, { useState, useEffect } from 'react';
import { User, Company } from '@/api/entities';
import { registerCompany } from '@/api/functions';
import { createPageUrl } from '@/components/utils';
import { sanitizeInput } from '@/components/utils/validationSchemas';
import { SecurityValidation } from '@/components/utils/securityUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, CheckCircle, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function RegistratieCompany() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    country: 'Nederland',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    vat: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Get placeholders based on country
  const getPlaceholders = (country) => {
    if (country === 'België') {
      return {
        postalCode: '1000',
        city: 'Brussel',
        vat: 'BE0123456789'
      };
    }
    return {
      postalCode: '1234 AB',
      city: 'Amsterdam',
      vat: 'NL123456789B01'
    };
  };

  const placeholders = getPlaceholders(formData.country);

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
        const fullName = user.full_name || user.name || '';
        const nameParts = fullName.split(' ');
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
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

    // Voornaam (verplicht)
    const sanitizedFirstName = formData.firstName.trim();
    if (!sanitizedFirstName) {
      errors.firstName = 'Voornaam is verplicht';
    } else if (sanitizedFirstName.length > 100) {
      errors.firstName = 'Voornaam mag maximaal 100 karakters zijn';
    } else if (SecurityValidation.containsXSS(sanitizedFirstName)) {
      errors.firstName = 'Voornaam bevat ongeldige karakters';
    }

    // Naam (verplicht)
    const sanitizedLastName = formData.lastName.trim();
    if (!sanitizedLastName) {
      errors.lastName = 'Naam is verplicht';
    } else if (sanitizedLastName.length > 100) {
      errors.lastName = 'Naam mag maximaal 100 karakters zijn';
    } else if (SecurityValidation.containsXSS(sanitizedLastName)) {
      errors.lastName = 'Naam bevat ongeldige karakters';
    }

    // Bedrijfsnaam (verplicht)
    const sanitizedCompanyName = formData.companyName.trim();
    if (!sanitizedCompanyName) {
      errors.companyName = 'Bedrijfsnaam is verplicht';
    } else if (sanitizedCompanyName.length > 100) {
      errors.companyName = 'Bedrijfsnaam mag maximaal 100 karakters zijn';
    } else if (SecurityValidation.containsXSS(sanitizedCompanyName)) {
      errors.companyName = 'Bedrijfsnaam bevat ongeldige karakters';
    }

    // E-mail (verplicht)
    const sanitizedEmail = formData.email.trim();
    if (!sanitizedEmail) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!SecurityValidation.isValidEmail(sanitizedEmail)) {
      errors.email = 'Ongeldig e-mailadres';
    }

    // Telefoonnummer (verplicht)
    const sanitizedPhone = formData.phone.trim();
    if (!sanitizedPhone) {
      errors.phone = 'Telefoonnummer is verplicht';
    } else if (!SecurityValidation.isValidPhone(sanitizedPhone)) {
      errors.phone = 'Ongeldig telefoonnummer';
    }

    // Land (verplicht)
    if (!formData.country) {
      errors.country = 'Land is verplicht';
    }

    // Postcode (verplicht)
    const sanitizedPostalCode = formData.postalCode.trim();
    if (!sanitizedPostalCode) {
      errors.postalCode = 'Postcode is verplicht';
    } else if (sanitizedPostalCode.length > 20) {
      errors.postalCode = 'Postcode mag maximaal 20 karakters zijn';
    }

    // Plaats (verplicht)
    const sanitizedCity = formData.city.trim();
    if (!sanitizedCity) {
      errors.city = 'Plaats is verplicht';
    } else if (sanitizedCity.length > 100) {
      errors.city = 'Plaats mag maximaal 100 karakters zijn';
    }

    // BTW nummer (verplicht) - validatie afhankelijk van land
    const sanitizedVat = formData.vat.trim();
    if (!sanitizedVat) {
      errors.vat = 'BTW-nummer is verplicht';
    } else if (sanitizedVat.length > 50) {
      errors.vat = 'BTW-nummer mag maximaal 50 karakters zijn';
    } else {
      // Land-specifieke validatie
      const vatClean = sanitizedVat.replace(/\s/g, '').toUpperCase();
      if (formData.country === 'België') {
        // BE + 10 cijfers
        if (!/^BE\d{10}$/.test(vatClean)) {
          errors.vat = 'Ongeldig BTW-nummer. Formaat: BE0123456789';
        }
      } else if (formData.country === 'Nederland') {
        // NL + 9 cijfers + B + 2 cijfers
        if (!/^NL\d{9}B\d{2}$/.test(vatClean)) {
          errors.vat = 'Ongeldig BTW-nummer. Formaat: NL123456789B01';
        }
      }
    }

    // Straat en huisnummer (optioneel, maar als een wordt ingevuld, moet de ander ook)
    if (formData.street.trim() && !formData.houseNumber.trim()) {
      errors.houseNumber = 'Huisnummer is verplicht als straat is ingevuld';
    }
    if (formData.houseNumber.trim() && !formData.street.trim()) {
      errors.street = 'Straat is verplicht als huisnummer is ingevuld';
    }

    if (formData.street && formData.street.trim().length > 200) {
      errors.street = 'Straat mag maximaal 200 karakters zijn';
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
    
    // Update placeholders when country changes
    if (field === 'country') {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        // Clear VAT error when country changes to allow new validation
        if (newErrors.vat) {
          delete newErrors.vat;
        }
        return newErrors;
      });
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
      // Sanitize all input before sending
      const sanitizedData = {
        first_name: sanitizeInput(formData.firstName.trim()),
        last_name: sanitizeInput(formData.lastName.trim()),
        company_name: sanitizeInput(formData.companyName.trim()),
        email: sanitizeInput(formData.email.trim()),
        phone_number: sanitizeInput(formData.phone.trim()),
        country: formData.country,
        street: formData.street ? sanitizeInput(formData.street.trim()) : null,
        house_number: formData.houseNumber ? sanitizeInput(formData.houseNumber.trim()) : null,
        postal_code: sanitizeInput(formData.postalCode.trim()),
        city: sanitizeInput(formData.city.trim()),
        vat_number: sanitizeInput(formData.vat.trim())
      };

      console.log('[RegistratieCompany] Submitting registration with sanitized data');
      
      const { data, error: functionError } = await registerCompany(sanitizedData);

      if (functionError) {
        throw new Error(functionError.message || 'Registratie mislukt');
      }

      if (data && data.success) {
        console.log('[RegistratieCompany] Registration successful, redirecting to dashboard');
        
        // Show warning if email was not sent
        if (data.email_warning) {
          console.warn('[RegistratieCompany] Email warning:', data.email_warning);
          sessionStorage.setItem('registrationEmailWarning', data.email_warning);
        }
        
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-300">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={paintConnectLogoUrl} alt="PaintConnect" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welkom bij PaintConnect!</h1>
          <p className="text-gray-600 dark:text-gray-300">Vul je bedrijfsgegevens in om te beginnen</p>
        </div>

        <Card className="shadow-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Bedrijfsregistratie
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Je krijgt 14 dagen gratis toegang tot alle functies
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Voornaam en Naam (in 2 kolommen) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <UserIcon className="w-4 h-4" />
                    Voornaam *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="Jan"
                    className={validationErrors.firstName ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {validationErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <UserIcon className="w-4 h-4" />
                    Naam *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Janssen"
                    className={validationErrors.lastName ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Bedrijfsnaam */}
              <div>
                <Label htmlFor="companyName" className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Building className="w-4 h-4" />
                  Bedrijfsnaam *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Bijv. Schildersbedrijf Janssen"
                  className={validationErrors.companyName ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {validationErrors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.companyName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-gray-900 dark:text-white">
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

              {/* Telefoonnummer */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Phone className="w-4 h-4" />
                  Telefoonnummer *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="012 34 56 78"
                  className={validationErrors.phone ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>

              {/* Adresgegevens sectie */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                  <MapPin className="w-4 h-4" />
                  Adresgegevens
                </Label>
                
                {/* Land (verplicht) */}
                <div>
                  <Label htmlFor="country" className="text-gray-900 dark:text-white">Land *</Label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className={`w-full h-10 rounded-md border bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm ${validationErrors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    disabled={isSubmitting}>
                    <option value="Nederland">Nederland</option>
                    <option value="België">België</option>
                  </select>
                  {validationErrors.country && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
                  )}
                </div>

                {/* Straat en Huisnummer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street" className="text-gray-900 dark:text-white">Straat</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="Hoofdstraat"
                      className={validationErrors.street ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {validationErrors.street && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.street}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="houseNumber" className="text-gray-900 dark:text-white">Huisnummer</Label>
                    <Input
                      id="houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => handleChange('houseNumber', e.target.value)}
                      placeholder="123"
                      className={validationErrors.houseNumber ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {validationErrors.houseNumber && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.houseNumber}</p>
                    )}
                  </div>
                </div>

                {/* Postcode (verplicht) en Plaats (verplicht) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode" className="text-gray-900 dark:text-white">Postcode *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder={placeholders.postalCode}
                      className={validationErrors.postalCode ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {validationErrors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.postalCode}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-gray-900 dark:text-white">Plaats *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder={placeholders.city}
                      className={validationErrors.city ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {validationErrors.city && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                    )}
                  </div>
                </div>

                {/* BTW nummer (verplicht) */}
                <div>
                  <Label htmlFor="vat" className="text-gray-900 dark:text-white">BTW-nummer *</Label>
                  <Input
                    id="vat"
                    value={formData.vat}
                    onChange={(e) => handleChange('vat', e.target.value)}
                    placeholder={placeholders.vat}
                    className={validationErrors.vat ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {validationErrors.vat && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.vat}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.country === 'België' ? 'Formaat: BE0123456789' : 'Formaat: NL123456789B01'}
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg">
                {isSubmitting ? (
                  <>
                    <InlineSpinner />
                    Bedrijf registreren...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Start gratis proefperiode
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Door te registreren ga je akkoord met onze{' '}
                <a href={createPageUrl('TermsOfService')} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  Algemene Voorwaarden
                </a>{' '}
                en{' '}
                <a href={createPageUrl('PrivacyPolicy')} className="text-emerald-600 dark:text-emerald-400 hover:underline">
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
