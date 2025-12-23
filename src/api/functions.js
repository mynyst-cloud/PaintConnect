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

// High-end interior photos from Unsplash (free to use)
const DUMMY_PROJECT_DATA = [
  {
    project_name: 'Villa Renovatie - Familie De Groot',
    client_name: 'Familie De Groot',
    description: 'Luxe woonkamer en hal volledig opnieuw geschilderd in warm wit en accent kleuren.',
    status: 'in_uitvoering',
    progress_percentage: 65,
    photo_urls: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', // Modern living room
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Luxury interior
    ]
  },
  {
    project_name: 'Penthouse Amsterdam - Interieur',
    client_name: 'Dhr. Bakker',
    description: 'Volledig penthouse project met custom kleuradvies en hoogwaardige afwerking.',
    status: 'planning',
    progress_percentage: 10,
    photo_urls: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // Modern apartment
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // Luxury home
    ]
  },
  {
    project_name: 'Boutique Hotel Lobby',
    client_name: 'Hotel Majestic',
    description: 'Stijlvolle lobby en receptieruimte met klassieke accenten en moderne afwerking.',
    status: 'nieuw',
    progress_percentage: 0,
    photo_urls: [
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', // Hotel interior
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', // Elegant room
    ]
  },
  {
    project_name: 'Moderne Loft - Centrum',
    client_name: 'Mevr. Jansen',
    description: 'Industriële loft met wit stucwerk en contrast accenten. Plafond en muren.',
    status: 'afgerond',
    progress_percentage: 100,
    photo_urls: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', // Loft style
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80', // Modern interior
    ]
  }
];

export const seedDummyProjects = async ({ companyId }) => {
  console.log('[seedDummyProjects] Creating dummy projects for company:', companyId);
  
  if (!companyId) {
    console.error('[seedDummyProjects] No companyId provided');
    return [];
  }
  
  try {
    const { Project } = await import('@/api/entities');
    
    // Check if dummy projects already exist
    const existingDummies = await Project.filter({ 
      company_id: companyId, 
      is_dummy: true 
    }).catch(() => []);
    
    if (existingDummies && existingDummies.length > 0) {
      console.log('[seedDummyProjects] Dummy projects already exist:', existingDummies.length);
      return existingDummies;
    }
    
    // Create dummy projects
    const createdProjects = [];
    const today = new Date();
    
    for (let i = 0; i < DUMMY_PROJECT_DATA.length; i++) {
      const data = DUMMY_PROJECT_DATA[i];
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (i * 7)); // Stagger start dates
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14 + (i * 3)); // Vary end dates
      
      try {
        const project = await Project.create({
          company_id: companyId,
          project_name: data.project_name,
          client_name: data.client_name,
          client_email: `demo${i + 1}@example.com`,
          address: `Voorbeeldstraat ${100 + i * 25}, 1000 AA Amsterdam`,
          start_date: startDate.toISOString().split('T')[0],
          expected_end_date: endDate.toISOString().split('T')[0],
          status: data.status,
          progress_percentage: data.progress_percentage,
          description: data.description,
          photo_urls: data.photo_urls,
          is_dummy: true, // Mark as dummy project
          estimated_hours: 40 + (i * 10),
          actual_hours: Math.floor((40 + (i * 10)) * (data.progress_percentage / 100))
        });
        
        createdProjects.push(project);
        console.log('[seedDummyProjects] Created dummy project:', project.project_name);
      } catch (createError) {
        console.error('[seedDummyProjects] Error creating dummy project:', createError);
      }
    }
    
    console.log('[seedDummyProjects] Created', createdProjects.length, 'dummy projects');
    return createdProjects;
  } catch (error) {
    console.error('[seedDummyProjects] Error:', error);
    return [];
  }
};

// Delete dummy projects when a real project is created
export const deleteDummyProjects = async ({ companyId }) => {
  console.log('[deleteDummyProjects] Removing dummy projects for company:', companyId);
  
  if (!companyId) return;
  
  try {
    const { Project } = await import('@/api/entities');
    
    const dummyProjects = await Project.filter({ 
      company_id: companyId, 
      is_dummy: true 
    }).catch(() => []);
    
    for (const dummy of dummyProjects || []) {
      try {
        await Project.delete(dummy.id);
        console.log('[deleteDummyProjects] Deleted dummy project:', dummy.project_name);
      } catch (deleteError) {
        console.warn('[deleteDummyProjects] Could not delete:', dummy.id, deleteError.message);
      }
    }
  } catch (error) {
    console.error('[deleteDummyProjects] Error:', error);
  }
}

// ====== NOTIFICATION FUNCTIONS - Use Edge Functions ======

/**
 * Send in-app notifications via Edge Function
 * Optionally sends email and push notifications
 */
export const sendNotification = async ({
  recipient_emails,
  type = 'generic',
  title,
  message,
  link_to,
  project_id,
  company_id,
  data = {},
  send_email = false,
  send_push = false,
  triggering_user_name
}) => {
  try {
    const result = await supabaseFunctions.invoke('sendNotification', {
      body: {
        recipient_emails,
        type,
        title,
        message,
        link_to,
        project_id,
        company_id,
        data,
        send_email,
        send_push,
        triggering_user_name
      }
    })
    return result
  } catch (error) {
    console.error('sendNotification error:', error)
    return { data: null, error }
  }
}

export const notifyAssignedPainters = async ({ projectId, projectName, newlyAssignedEmails, companyId }) => {
  if (!newlyAssignedEmails || newlyAssignedEmails.length === 0) {
    return { success: true }
  }
  
  try {
    const result = await sendNotification({
      recipient_emails: newlyAssignedEmails,
      type: 'project_assigned',
      title: 'Nieuw project toegewezen',
      message: `Je bent toegewezen aan project: ${projectName}`,
      link_to: '/Planning',
      project_id: projectId,
      company_id: companyId,
      send_push: true // Painters get push for project assignment
    })
    return result.data || { success: true }
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

/**
 * Invite a painter to join a company
 * Sends email via Resend through Edge Function
 */
export const invitePainter = async (payload) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('invitePainter', {
      body: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        companyRole: payload.companyRole || 'painter',
        isPainter: payload.isPainter !== false,
        companyId: payload.companyId || payload.company_id,
        homeAddress: payload.homeAddress
      }
    })
    
    if (error) {
      console.error('invitePainter Edge Function error:', error)
      return { data: null, error: { error: error.message || 'Er ging iets mis' } }
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('invitePainter failed:', error)
    return { data: null, error: { error: error.message } }
  }
}

/**
 * Get invite details by token
 * Used on InviteAcceptance page to show invite info
 * Uses Edge Function to bypass RLS for unauthenticated users
 */
export const getInviteDetailsByToken = async ({ token }) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Call Edge Function (bypasses RLS with service role)
    const { data, error } = await supabase.functions.invoke('getInviteDetails', {
      body: { token }
    })
    
    if (error) {
      console.error('getInviteDetailsByToken Edge Function error:', error)
      return { data: { success: false, error: error.message || 'Er ging iets mis' } }
    }
    
    return { data }
  } catch (error) {
    console.error('getInviteDetailsByToken failed:', error)
    return { data: { success: false, error: error.message } }
  }
}

// Legacy version - kept for reference but not used
export const getInviteDetailsByTokenLegacy = async ({ token }) => {
  try {
    const { PendingInvite, Company } = await import('@/lib/supabase')
    const invites = await PendingInvite.filter({ token, status: 'pending' })
    
    if (!invites || invites.length === 0) {
      return { data: { success: false, error: 'Uitnodiging niet gevonden of al gebruikt' } }
    }
    
    const invite = invites[0]
    
    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return { data: { success: false, error: 'Deze uitnodiging is verlopen' } }
    }
    
    // Get company name
    let companyName = 'Onbekend bedrijf'
    try {
      const company = await Company.get(invite.company_id)
      if (company) companyName = company.name
    } catch (e) {
      console.error('Could not fetch company:', e)
    }
    
    return { 
      data: { 
        success: true, 
        invite: {
          ...invite,
          company_name: companyName
        }
      } 
    }
  } catch (error) {
    console.error('getInviteDetailsByToken failed:', error)
    return { data: { success: false, error: error.message } }
  }
}

/**
 * Accept an invitation and join the company
 * Called after user logs in
 */
export const acceptInvitation = async ({ token }) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('acceptInvitation', {
      body: { token }
    })
    
    if (error) {
      console.error('acceptInvitation Edge Function error:', error)
      return { data: { success: false, error: error.message || 'Er ging iets mis' } }
    }
    
    return { data }
  } catch (error) {
    console.error('acceptInvitation failed:', error)
    return { data: { success: false, error: error.message } }
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

/**
 * Handle damage report - creates record and notifies admins
 * Called from DamageForm.jsx
 */
export const handleDamageReport = async ({ damageData, project, currentUser }) => {
  try {
    // Dynamic import to avoid circular dependencies - only when function is called
    const { Damage, supabase } = await import('@/lib/supabase')
    
    // Create the damage record
    const createdDamage = await Damage.create(damageData)
    
    if (!createdDamage) {
      return { data: null, error: { message: 'Failed to create damage record' } }
    }
    
    // Get admin emails for notification (async, non-blocking)
    const companyId = project?.company_id || damageData.company_id
    
    // Fire and forget - don't block on notification
    supabase
      .from('users')
      .select('email')
      .eq('company_id', companyId)
      .eq('company_role', 'admin')
      .eq('status', 'active')
      .then(({ data: admins }) => {
        if (admins && admins.length > 0) {
          const adminEmails = admins.map(a => a.email).filter(Boolean)
          sendNotification({
            recipient_emails: adminEmails,
            type: 'damage_reported',
            title: 'Nieuwe beschadiging gemeld',
            message: `${currentUser?.full_name || 'Onbekend'} heeft een beschadiging gemeld: ${damageData.title}`,
            link_to: project?.id ? `/Projecten?id=${project.id}&tab=beschadigingen` : '/Beschadigingen',
            project_id: project?.id,
            company_id: companyId,
            send_push: true,
            triggering_user_name: currentUser?.full_name
          }).catch(err => console.warn('Damage notification failed:', err))
        }
      })
      .catch(err => console.warn('Failed to fetch admins for notification:', err))
    
    return { data: { success: true, damage: createdDamage }, error: null }
  } catch (error) {
    console.error('handleDamageReport error:', error)
    return { data: null, error: { message: error.message } }
  }
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

/**
 * Handle material request - creates record and notifies admins
 * Called from MaterialRequestForm.jsx
 */
export const handleMaterialRequest = async (submissionData) => {
  try {
    // Dynamic import to avoid circular dependencies
    const { MaterialRequest, supabase } = await import('@/lib/supabase')
    
    // Create the material request record
    const createdRequest = await MaterialRequest.create(submissionData)
    
    if (!createdRequest) {
      return { data: null, error: { message: 'Failed to create material request' } }
    }
    
    // Get admin emails for notification (fire and forget)
    const companyId = submissionData.company_id
    
    supabase
      .from('users')
      .select('email')
      .eq('company_id', companyId)
      .eq('company_role', 'admin')
      .eq('status', 'active')
      .then(({ data: admins }) => {
        if (admins && admins.length > 0) {
          const adminEmails = admins.map(a => a.email).filter(Boolean)
          sendNotification({
            recipient_emails: adminEmails,
            type: 'material_requested',
            title: 'Nieuwe materiaalaanvraag',
            message: `${submissionData.requested_by || 'Onbekend'} vraagt materiaal aan: ${submissionData.material_name}`,
            link_to: '/MateriaalBeheer',
            project_id: submissionData.project_id,
            company_id: companyId,
            send_push: true,
            triggering_user_name: submissionData.requested_by
          }).catch(err => console.warn('Material notification failed:', err))
        }
      })
      .catch(err => console.warn('Failed to fetch admins for notification:', err))
    
    return { data: { success: true, request: createdRequest }, error: null }
  } catch (error) {
    console.error('handleMaterialRequest error:', error)
    return { data: null, error: { message: error.message } }
  }
}

// ====== NOTIFICATION MANAGEMENT ======

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Get current user's email
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Update by recipient_email (not user_id)
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('recipient_email', user.email)
      .eq('read', false)
    
    return { success: true }
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send notification to all team members of a company
 */
export const notifyAllTeam = async ({ company_id, message, type = 'generic', title, link_to, send_email = false }) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Get all users in the company
    const { data: users, error } = await supabase
      .from('users')
      .select('email')
      .eq('company_id', company_id)
      .eq('status', 'active')
    
    if (error || !users || users.length === 0) {
      console.warn('notifyAllTeam: No users found for company', company_id)
      return { success: false, error: 'No users found' }
    }
    
    const emails = users.map(u => u.email).filter(Boolean)
    
    if (emails.length === 0) {
      return { success: false, error: 'No valid emails found' }
    }
    
    const result = await sendNotification({
      recipient_emails: emails,
      type,
      title,
      message,
      link_to,
      company_id,
      send_email
    })
    
    return result.data || { success: true, notified: emails.length }
  } catch (error) {
    console.error('notifyAllTeam error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify team chat message to other team members
 */
export const notifyTeamChatMessage = async ({
  company_id,
  sender_name,
  message_preview,
  recipient_emails,
  sender_email
}) => {
  // Filter out sender
  let emails = recipient_emails || []
  if (sender_email) {
    emails = emails.filter(e => e.toLowerCase() !== sender_email.toLowerCase())
  }
  
  if (emails.length === 0) {
    return { success: true, skipped: true }
  }
  
  try {
    const result = await sendNotification({
      recipient_emails: emails,
      type: 'team_message',
      title: 'Nieuw teambericht',
      message: `${sender_name}: ${message_preview.substring(0, 100)}${message_preview.length > 100 ? '...' : ''}`,
      link_to: '/TeamChat',
      company_id,
      send_push: true,
      triggering_user_name: sender_name
    })
    return result.data || { success: true }
  } catch (error) {
    console.error('notifyTeamChatMessage error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify painter of planning change
 */
export const notifyPlanningChange = async ({
  company_id,
  project_id,
  project_name,
  change_description,
  painter_emails,
  changer_name
}) => {
  if (!painter_emails || painter_emails.length === 0) {
    return { success: false, error: 'No painter emails' }
  }
  
  try {
    const result = await sendNotification({
      recipient_emails: painter_emails,
      type: 'planning_change',
      title: 'Planning gewijzigd',
      message: `De planning voor ${project_name} is gewijzigd: ${change_description}`,
      link_to: '/Planning',
      project_id,
      company_id,
      send_push: true,
      triggering_user_name: changer_name
    })
    return result.data || { success: true }
  } catch (error) {
    console.error('notifyPlanningChange error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify admins when a client logs into the portal
 */
export const notifyClientLogin = async ({
  company_id,
  project_id,
  project_name,
  client_name
}) => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Get admin emails
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('company_id', company_id)
      .eq('company_role', 'admin')
      .eq('status', 'active')
    
    if (!admins || admins.length === 0) {
      return { success: false, error: 'No admins found' }
    }
    
    const adminEmails = admins.map(a => a.email).filter(Boolean)
    
    const result = await sendNotification({
      recipient_emails: adminEmails,
      type: 'client_logged_in',
      title: 'Klant ingelogd op portaal',
      message: `${client_name} is ingelogd op het klantenportaal${project_name ? ` voor project ${project_name}` : ''}.`,
      link_to: project_id ? `/Projecten?id=${project_id}` : '/Dashboard',
      project_id,
      company_id,
      send_push: true
    })
    return result.data || { success: true }
  } catch (error) {
    console.error('notifyClientLogin error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Notify painter when admin replies to their daily update
 */
export const notifyUpdateReply = async ({
  company_id,
  project_id,
  project_name,
  replier_name,
  reply_preview,
  painter_email
}) => {
  if (!painter_email) {
    return { success: false, error: 'No painter email' }
  }
  
  try {
    const result = await sendNotification({
      recipient_emails: [painter_email],
      type: 'update_reply',
      title: 'Reactie op je update',
      message: `${replier_name} heeft gereageerd op je update${project_name ? ` voor ${project_name}` : ''}: ${reply_preview.substring(0, 80)}...`,
      link_to: project_id ? `/Projecten?id=${project_id}&tab=updates` : '/Dashboard',
      project_id,
      company_id,
      send_push: true,
      triggering_user_name: replier_name
    })
    return result.data || { success: true }
  } catch (error) {
    console.error('notifyUpdateReply error:', error)
    return { success: false, error: error.message }
  }
}

// ====== PROJECT FUNCTIONS ======

export const notifyHoursConfirmed = async (params) => {
  // Hours confirmation is replaced by check-in system
  console.log('notifyHoursConfirmed (deprecated):', params)
  return { success: true }
}

export const notifyMaterialsConfirmed = async (params) => {
  console.log('notifyMaterialsConfirmed (deprecated):', params)
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'functions.js:handleProjectUpdate:entry',message:'handleProjectUpdate called',data:{params},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    const { DailyUpdate } = await import('@/lib/supabase')
    
    // Create the daily update record (quick update - no check-in/check-out times)
    const updateData = {
      project_id: params.project_id,
      company_id: params.company_id,
      painter_name: params.painter_name,
      painter_email: params.painter_email,
      update_text: params.work_notes, // DB column is update_text, not work_notes
      photo_urls: params.photo_urls || [],
      work_date: params.work_date || new Date().toISOString().split('T')[0],
      visible_to_client: params.visible_to_client ?? true
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'functions.js:handleProjectUpdate:beforeCreate',message:'About to create DailyUpdate',data:{updateData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const createdUpdate = await DailyUpdate.create(updateData)
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'functions.js:handleProjectUpdate:afterCreate',message:'DailyUpdate created',data:{createdUpdate},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    return { data: { success: true, update: createdUpdate }, error: null }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'functions.js:handleProjectUpdate:error',message:'Error creating update',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.error('handleProjectUpdate error:', error)
    return { data: null, error }
  }
}

export const getProjectStats = async ({ project_ids }) => {
  return supabaseFunctions.invoke('getProjectStats', { body: { project_ids } })
}

// ====== AUTH FUNCTIONS ======

export const registerCompany = async (companyData) => {
  const { supabase } = await import('@/lib/supabase')
  return supabase.functions.invoke('registerCompany', { body: companyData })
}
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