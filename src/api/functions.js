// src/api/functions.js
// Client-side helpers & fallbacks voor (oude) backend functies

import { functions as supabaseFunctions } from '@/lib/supabase'

// Exporteer de ruwe Supabase functions client waar nodig
export { supabaseFunctions as baseFunctions }

// Google Maps Geocoding – gebruikt in o.a. Projecten, ProjectDetails & VoorraadBeheer
// Verwachte shape in de app:
// const { data } = await geocodeAddress({ address })
// data: { latitude, longitude, formatted_address?, error? }
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export const geocodeAddress = async ({ address }) => {
  if (!address || typeof address !== 'string') {
    return {
      data: {
        error: 'Geen geldig adres opgegeven.'
      }
    }
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('VITE_GOOGLE_MAPS_API_KEY ontbreekt in de omgeving')
    return {
      data: {
        error:
          'Geocoding is niet geconfigureerd. Neem contact op met de beheerder (Google Maps API key ontbreekt).'
      }
    }
  }

  const encodedAddress = encodeURIComponent(address.trim())
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error('Google Geocoding HTTP error:', response.status, response.statusText)
      return {
        data: {
          error: 'Kon adres niet opzoeken (netwerkfout). Probeer later opnieuw.'
        }
      }
    }

    const json = await response.json()

    if (json.status !== 'OK' || !json.results || json.results.length === 0) {
      console.warn('Google Geocoding geen resultaat:', json.status, json.error_message)
      let errorMessage = 'Adres niet gevonden. Controleer of het adres correct is.'

      if (json.status === 'ZERO_RESULTS') {
        errorMessage = 'Adres niet gevonden. Controleer straat, huisnummer, postcode en stad.'
      } else if (json.status === 'OVER_QUERY_LIMIT') {
        errorMessage = 'Limiet voor adresopzoekingen bereikt. Probeer het later opnieuw.'
      } else if (json.status === 'REQUEST_DENIED') {
        errorMessage =
          'Adresopzoeking geweigerd door Google. Controleer de API key configuratie.'
      } else if (json.status === 'INVALID_REQUEST') {
        errorMessage = 'Ongeldige adresaanvraag. Vul een volledig adres in.'
      }

      return {
        data: {
          error: errorMessage
        }
      }
    }

    const result = json.results[0]
    const { lat, lng } = result.geometry.location

    return {
      data: {
        latitude: lat,
        longitude: lng,
        formatted_address: result.formatted_address
      }
    }
  } catch (error) {
    console.error('Fout bij Google Geocoding:', error)
    return {
      data: {
        error: 'Er ging iets mis bij het opzoeken van het adres. Probeer het opnieuw.'
      }
    }
  }
}

// ====== PLACEHOLDERS VOOR OVERIGE (nog niet gemigreerde) FUNCTIONS ======

const notImplemented = (name) => {
  return () => {
    console.warn(`⚠️ Function "${name}" is nog niet gemigreerd naar Supabase/Edge Functions`)
    return Promise.reject(new Error(`${name} not implemented yet`))
  }
}

export const seedDummyProjects = async ({ companyId }) => {
  console.log('Seeding dummy projects voor company:', companyId)
  // Voeg hier later echte insert toe als je wilt
  return []
}

export const notifyAssignedPainters = notImplemented('notifyAssignedPainters')
export const sendQuickActionEmail = notImplemented('sendQuickActionEmail')
export const getCompanyUsers = notImplemented('getCompanyUsers')

// Alle admin & complexe functions
export const adminCreateCompany = notImplemented('adminCreateCompany')
export const deleteCompany = notImplemented('deleteCompany')
export const resendCompanyInvitation = notImplemented('resendCompanyInvitation')
export const cleanupDuplicateData = notImplemented('cleanupDuplicateData')
export const restoreFreshDecorData = notImplemented('restoreFreshDecorData')
export const upgradeEmailTemplates = notImplemented('upgradeEmailTemplates')
export const sendTestBrandedEmail = notImplemented('sendTestBrandedEmail')
export const invitePainter = notImplemented('invitePainter')
export const sendNewsletter = notImplemented('sendNewsletter')
export const approveCompany = notImplemented('approveCompany')
export const notifyCompaniesOfUpdate = notImplemented('notifyCompaniesOfUpdate')
export const setupStripePortal = notImplemented('setupStripePortal')
export const deleteSupplier = notImplemented('deleteSupplier')
export const handleDamageReport = notImplemented('handleDamageReport')
export const createDamageInteraction = notImplemented('createDamageInteraction')
export const createDailyUpdateInteraction = notImplemented('createDailyUpdateInteraction')
export const markAllNotificationsAsRead = notImplemented('markAllNotificationsAsRead')
export const handleMaterialRequest = notImplemented('handleMaterialRequest')
export const notifyHoursConfirmed = notImplemented('notifyHoursConfirmed')
export const notifyMaterialsConfirmed = notImplemented('notifyMaterialsConfirmed')
export const generatePostCalculationPDF = notImplemented('generatePostCalculationPDF')
export const finalizeProject = notImplemented('finalizeProject')
export const handleProjectUpdate = notImplemented('handleProjectUpdate')
export const registerCompany = notImplemented('registerCompany')
export const createCheckoutSession = notImplemented('createCheckoutSession')
export const createMollieCheckout = notImplemented('createMollieCheckout')
export const createCustomerPortalSession = notImplemented('createCustomerPortalSession')
export const getInviteDetailsByToken = notImplemented('getInviteDetailsByToken')
export const acceptInvitation = notImplemented('acceptInvitation')
export const getClientPortalData = notImplemented('getClientPortalData')
export const clientPortalAuth = notImplemented('clientPortalAuth')
export const activateClientAccess = notImplemented('activateClientAccess')
export const clearTeamChat = notImplemented('clearTeamChat')
export const authVerifyEmail = notImplemented('authVerifyEmail')
export const resendVerificationEmail = notImplemented('resendVerificationEmail')
export const getProjectStats = notImplemented('getProjectStats')
export const generateCompanyInboundEmail = notImplemented('generateCompanyInboundEmail')
export const notifyAllTeam = notImplemented('notifyAllTeam')