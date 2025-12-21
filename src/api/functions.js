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

// ====== SEED & UTILITY FUNCTIONS ======

export const seedDummyProjects = async ({ companyId }) => {
  console.log('Seeding dummy projects voor company:', companyId)
  return []
}

// ====== NOTIFICATION FUNCTIONS - Use Supabase directly ======

export const notifyAssignedPainters = async ({ projectId, projectName, newlyAssignedEmails }) => {
  // Create notifications directly in database
  try {
    const { Notification } = await import('@/lib/supabase')
    for (const email of newlyAssignedEmails || []) {
      await Notification.create({
        user_email: email,
        type: 'project_assigned',
        title: 'Nieuw project toegewezen',
        message: `Je bent toegewezen aan project: ${projectName}`,
        data: { project_id: projectId },
        read: false
      })
    }
    return { success: true }
  } catch (error) {
    console.warn('notifyAssignedPainters failed:', error)
    return { success: false, error: error.message }
  }
}

export const sendQuickActionEmail = async (params) => {
  console.log('sendQuickActionEmail called with:', params)
  return { success: true } // Placeholder - implement with Resend later
}

export const getCompanyUsers = async ({ company_id }) => {
  return supabaseFunctions.invoke('getCompanyUsers', { body: { company_id } })
}

// ====== ADMIN FUNCTIONS ======

export const adminCreateCompany = notImplemented('adminCreateCompany')
export const deleteCompany = notImplemented('deleteCompany')
export const resendCompanyInvitation = notImplemented('resendCompanyInvitation')
export const cleanupDuplicateData = notImplemented('cleanupDuplicateData')
export const restoreFreshDecorData = notImplemented('restoreFreshDecorData')
export const upgradeEmailTemplates = notImplemented('upgradeEmailTemplates')
export const sendTestBrandedEmail = notImplemented('sendTestBrandedEmail')
export const sendNewsletter = notImplemented('sendNewsletter')
export const approveCompany = notImplemented('approveCompany')
export const notifyCompaniesOfUpdate = notImplemented('notifyCompaniesOfUpdate')
export const generateCompanyInboundEmail = notImplemented('generateCompanyInboundEmail')

// ====== PAYMENT FUNCTIONS ======

export const setupStripePortal = notImplemented('setupStripePortal')
export const createCheckoutSession = notImplemented('createCheckoutSession')
export const createMollieCheckout = notImplemented('createMollieCheckout')
export const createCustomerPortalSession = notImplemented('createCustomerPortalSession')

// ====== INVITE FUNCTIONS ======

export const invitePainter = async ({ email, company_id }) => {
  try {
    const { PendingInvite } = await import('@/lib/supabase')
    const invite = await PendingInvite.create({
      email,
      company_id,
      role: 'painter',
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    return { success: true, invite }
  } catch (error) {
    console.error('invitePainter failed:', error)
    return { success: false, error: error.message }
  }
}

export const getInviteDetailsByToken = async ({ token }) => {
  try {
    const { PendingInvite } = await import('@/lib/supabase')
    const invites = await PendingInvite.filter({ token })
    return { data: invites[0] || null }
  } catch (error) {
    console.error('getInviteDetailsByToken failed:', error)
    return { data: null, error: error.message }
  }
}

export const acceptInvitation = async ({ token }) => {
  try {
    const { PendingInvite } = await import('@/lib/supabase')
    const invites = await PendingInvite.filter({ token })
    if (invites[0]) {
      await PendingInvite.update(invites[0].id, { status: 'accepted' })
      return { success: true }
    }
    return { success: false, error: 'Uitnodiging niet gevonden' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ====== DAMAGE & MATERIAL FUNCTIONS ======

export const deleteSupplier = async ({ supplier_id }) => {
  try {
    const { Supplier } = await import('@/lib/supabase')
    await Supplier.delete(supplier_id)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const handleDamageReport = async (params) => {
  console.log('handleDamageReport called:', params)
  return { success: true }
}

export const createDamageInteraction = async (params) => {
  try {
    const { DamageInteraction } = await import('@/lib/supabase')
    const interaction = await DamageInteraction.create(params)
    return { success: true, data: interaction }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const createDailyUpdateInteraction = async (params) => {
  try {
    const { DailyUpdateInteraction } = await import('@/lib/supabase')
    const interaction = await DailyUpdateInteraction.create(params)
    return { success: true, data: interaction }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const handleMaterialRequest = async (params) => {
  console.log('handleMaterialRequest called:', params)
  return { success: true }
}

// ====== NOTIFICATION MANAGEMENT ======

export const markAllNotificationsAsRead = async ({ user_id }) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user_id)
      .eq('read', false)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const notifyAllTeam = async ({ company_id, message, type }) => {
  console.log('notifyAllTeam called:', { company_id, message, type })
  return { success: true }
}

// ====== PROJECT FUNCTIONS ======

export const notifyHoursConfirmed = async (params) => {
  console.log('notifyHoursConfirmed:', params)
  return { success: true }
}

export const notifyMaterialsConfirmed = async (params) => {
  console.log('notifyMaterialsConfirmed:', params)
  return { success: true }
}

export const generatePostCalculationPDF = notImplemented('generatePostCalculationPDF')

export const finalizeProject = async ({ project_id }) => {
  try {
    const { Project } = await import('@/lib/supabase')
    await Project.update(project_id, { status: 'afgerond', finalized_at: new Date().toISOString() })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const handleProjectUpdate = async (params) => {
  console.log('handleProjectUpdate:', params)
  return { success: true }
}

export const getProjectStats = async ({ project_ids }) => {
  return supabaseFunctions.invoke('getProjectStats', { body: { project_ids } })
}

// ====== AUTH FUNCTIONS ======

export const registerCompany = notImplemented('registerCompany')
export const authVerifyEmail = notImplemented('authVerifyEmail')
export const resendVerificationEmail = notImplemented('resendVerificationEmail')

// ====== CLIENT PORTAL FUNCTIONS ======

export const getClientPortalData = async ({ token }) => {
  try {
    const { ClientInvitation, Project } = await import('@/lib/supabase')
    const invitations = await ClientInvitation.filter({ token })
    if (!invitations[0]) {
      return { data: null, error: 'Uitnodiging niet gevonden' }
    }
    const invitation = invitations[0]
    const project = invitation.project_id ? await Project.get(invitation.project_id) : null
    return { data: { invitation, project } }
  } catch (error) {
    return { data: null, error: error.message }
  }
}

export const clientPortalAuth = async ({ token }) => {
  try {
    const { ClientInvitation } = await import('@/lib/supabase')
    const invitations = await ClientInvitation.filter({ token })
    if (!invitations[0]) {
      return { success: false, error: 'Ongeldige of verlopen link' }
    }
    return { success: true, data: invitations[0] }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const activateClientAccess = async ({ token }) => {
  try {
    const { ClientInvitation } = await import('@/lib/supabase')
    const invitations = await ClientInvitation.filter({ token })
    if (invitations[0]) {
      await ClientInvitation.update(invitations[0].id, { status: 'active' })
      return { success: true }
    }
    return { success: false, error: 'Uitnodiging niet gevonden' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ====== CHAT FUNCTIONS ======

export const clearTeamChat = async ({ company_id }) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    await supabase
      .from('chat_messages')
      .delete()
      .eq('company_id', company_id)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}