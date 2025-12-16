// src/api/functions.js
// Tijdelijke placeholders voor functions die nog niet naar Supabase zijn gemigreerd

const notImplemented = (name) => {
  return (...args) => {
    console.warn(`⚠️ Function "${name}" is nog niet gemigreerd naar Supabase`)
    // Je kunt hier later de echte Supabase Edge Function aanroepen
    return Promise.reject(new Error(`${name} not implemented yet`))
  }
}

// Basis functions die al werken
export { functions as baseFunctions } from '@/lib/supabase'

// Alle oude functions als placeholder
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
export const geocodeAddress = notImplemented('geocodeAddress')
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