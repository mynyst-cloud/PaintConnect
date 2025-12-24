// src/lib/supabase.js
// Drop-in replacement voor Base44 SDK

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper functie om te bepalen of een key auth-gerelateerd is
const isAuthKey = (key) => {
  if (!key) return false
  return (
    key.includes('auth') || 
    key.includes('supabase') ||
    key.startsWith('sb-') ||
    key.includes('auth-token') ||
    key.includes('auth.refresh')
  )
}

// Migreer bestaande auth data van localStorage naar sessionStorage (eenmalig)
// Dit zorgt ervoor dat bestaande sessies niet verloren gaan
const migrateAuthToSessionStorage = () => {
  try {
    const migrationKey = 'auth_migrated_to_session'
    if (sessionStorage.getItem(migrationKey)) {
      // Al gemigreerd
      return
    }

    // Zoek alle auth-gerelateerde keys in localStorage
    const authKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (isAuthKey(key)) {
        authKeys.push(key)
      }
    }

    // Kopieer naar sessionStorage
    authKeys.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        sessionStorage.setItem(key, value)
        // Optioneel: verwijder uit localStorage (maar laat het staan voor nu voor veiligheid)
        // localStorage.removeItem(key)
      }
    })

    // Markeer als gemigreerd
    if (authKeys.length > 0) {
      sessionStorage.setItem(migrationKey, 'true')
      console.log(`[Supabase Storage] Migrated ${authKeys.length} auth keys to sessionStorage`)
    }
  } catch (error) {
    console.warn('[Supabase Storage] Migration error:', error)
  }
}

// Voer migratie uit bij het laden
migrateAuthToSessionStorage()

// Custom storage adapter die sessionStorage gebruikt voor auth
// Dit zorgt ervoor dat elke tab zijn eigen sessie heeft en onafhankelijk kan uitloggen
const customStorage = {
  getItem: (key) => {
    if (isAuthKey(key)) {
      // Eerst checken in sessionStorage
      const value = sessionStorage.getItem(key)
      if (value) return value
      
      // Fallback: check localStorage (voor migratie van oude sessies)
      const fallbackValue = localStorage.getItem(key)
      if (fallbackValue) {
        // Migreer naar sessionStorage
        sessionStorage.setItem(key, fallbackValue)
        return fallbackValue
      }
      return null
    }
    // Andere data blijft in localStorage voor cross-tab sharing
    return localStorage.getItem(key)
  },
  setItem: (key, value) => {
    if (isAuthKey(key)) {
      sessionStorage.setItem(key, value)
      // Verwijder ook uit localStorage als het daar nog staat
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
      }
    } else {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    if (isAuthKey(key)) {
      sessionStorage.removeItem(key)
      // Verwijder ook uit localStorage voor volledigheid
      localStorage.removeItem(key)
    } else {
      localStorage.removeItem(key)
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ============================================
// ENTITY CLASS - Base44 Compatible
// ============================================
class Entity {
  constructor(tableName) {
    this.tableName = tableName
  }

  async filter(conditions = {}, orderBy = '-created_date', limit = null) {
    let query = supabase.from(this.tableName).select('*')
    
    // Handle conditions
    Object.entries(conditions).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle operators
        if (value.$ne !== undefined) {
          query = query.neq(key, value.$ne)
        } else if (value.$in) {
          query = query.in(key, value.$in)
        } else if (value.$contains) {
          // For array columns (e.g. text[]), use contains operator
          // This checks if the array column contains the specified value(s)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.js:filter',message:'Using $contains operator',data:{key,value:value.$contains},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          query = query.contains(key, value.$contains)
        } else if (value.$gt !== undefined) {
          query = query.gt(key, value.$gt)
        } else if (value.$gte !== undefined) {
          query = query.gte(key, value.$gte)
        } else if (value.$lt !== undefined) {
          query = query.lt(key, value.$lt)
        } else if (value.$lte !== undefined) {
          query = query.lte(key, value.$lte)
        }
      } else {
        query = query.eq(key, value)
      }
    })
    
    // Handle ordering
    if (orderBy) {
      const isDesc = orderBy.startsWith('-')
      const column = isDesc ? orderBy.slice(1) : orderBy
      query = query.order(column, { ascending: !isDesc })
    }
    
    // Handle limit
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error)
      throw error
    }
    return data || []
  }

  async list(orderBy = '-created_date') {
    return this.filter({}, orderBy);
  }

  async get(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error(`Error getting ${this.tableName} ${id}:`, error)
      throw error
    }
    return data
  }

  async create(data) {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single()
    
    if (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw error
    }
    return created
  }

  async update(id, data) {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating ${this.tableName} ${id}:`, error)
      throw error
    }
    return updated
  }

  async delete(id) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(`Error deleting ${this.tableName} ${id}:`, error)
      throw error
    }
    return true
  }
}

// ============================================
// USER ENTITY met Auth
// ============================================
class UserEntity extends Entity {
  constructor() {
    super('users')
  }

  async me() {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      console.error('Auth error:', authError)
      throw new Error('auth')
    }
    
    // First attempt: Try to get existing user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    // If user exists and has company_id, return it
    if (!userError && userData) {
      console.log('[User.me] Found existing user:', { id: userData.id, company_id: userData.company_id })
      return userData
    }
    
    console.warn('[User.me] User not found or error, checking pending invites...', userError?.message)
    
    // Try to find company_id from an accepted pending invite for this email
    let companyId = null
    let companyRole = null
    
    try {
      const { data: acceptedInvite } = await supabase
        .from('pending_invites')
        .select('company_id, company_role')
        .eq('email', authUser.email?.toLowerCase())
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false })
        .limit(1)
        .single()
      
      if (acceptedInvite) {
        companyId = acceptedInvite.company_id
        companyRole = acceptedInvite.company_role || 'painter'
        console.log('[User.me] Found company from accepted invite:', { companyId, companyRole })
      }
    } catch (e) {
      console.log('[User.me] No accepted invite found for email:', authUser.email)
    }
    
    // Create new user record with company_id if found
    // FIXED: Set default user_type for new Google OAuth users (they need to register company)
    const newUser = {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.email,
      created_date: new Date().toISOString(),
      user_type: 'painter_company', // Default for new users - they need to register a company
      ...(companyId && { company_id: companyId }),
      ...(companyRole && { company_role: companyRole })
    }
    
    console.log('[User.me] Creating user record:', newUser)
    
    // Use UPSERT to avoid conflicts and preserve existing data
    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .upsert(newUser, { 
        onConflict: 'id',
        // Don't overwrite existing company_id if it's already set
        ignoreDuplicates: false 
      })
      .select()
      .single()
    
    if (createError) {
      console.error('[User.me] Error upserting user:', createError)
      
      // If upsert failed, try to read again (maybe RLS issue on first read)
      const { data: retryData, error: retryError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (!retryError && retryData) {
        console.log('[User.me] Successfully read on retry:', retryData)
        return retryData
      }
      
      throw createError
    }
    
    console.log('[User.me] User record created/updated:', createdUser)
    return createdUser
  }

  async login() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/Dashboard`
      }
    })
    
    if (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
      throw error
    }
  }
}

export const Project = new Entity('projects')
export const MaterialRequest = new Entity('material_requests')
export const Damage = new Entity('damages')
export const ChatMessage = new Entity('chat_messages')
export const User = new UserEntity()
export const Company = new Entity('companies')
export const ReferralPoint = new Entity('referral_points')
export const Notification = new Entity('notifications')
export const DailyUpdate = new Entity('daily_updates')
export const HoursEntry = new Entity('hours_entries')
export const MaterialsUsage = new Entity('materials_usage')
// === EXTRA ENTITIES VOOR PAINTCONNECT ===
export const ClientInvitation = new Entity('client_invitations')
export const GlobalSettings = new Entity('global_settings')
export const PendingCompany = new Entity('pending_companies')
export const PlatformUpdate = new Entity('platform_updates')
export const Supplier = new Entity('suppliers')
export const Material = new Entity('materials')
export const MaterialCategory = new Entity('material_categories')
export const TimeEntry = new Entity('time_entries')
export const ExtraCost = new Entity('extra_costs')
export const PlanningEvent = new Entity('planning_events')
export const ColorAdvice = new Entity('color_advice')
export const DamageInteraction = new Entity('damage_interactions')
export const DailyUpdateInteraction = new Entity('daily_update_interactions')
export const PhotoReaction = new Entity('photo_reactions')
export const ReferralPeriod = new Entity('referral_periods')
export const Lead = new Entity('leads')
export const OfferteOpmeting = new Entity('offerte_opmetingen')
export const HelpdeskTicket = new Entity('helpdesk_tickets')
export const HelpdeskReply = new Entity('helpdesk_replies')
export const PendingInvite = new Entity('pending_invites')
export const Invoice = new Entity('invoices')
export const Subscription = new Entity('subscriptions')
export const TestLog = new Entity('test_logs')
export const AppError = new Entity('app_errors')
export const SupplierInvoice = new Entity('supplier_invoices')
export const MaterialPriceApproval = new Entity('material_price_approvals')
export const MaterialUsage = MaterialsUsage // alias voor compatibiliteit
export const CheckInRecord = new Entity('check_in_records')

// Week Planning entities
export const CompanyVehicle = new Entity('company_vehicles')
export const VehicleAssignment = new Entity('vehicle_assignments')
export const Subcontractor = new Entity('subcontractors')
export const SubcontractorAssignment = new Entity('subcontractor_assignments')
export const ProjectTask = new Entity('project_tasks')
export const EmployeeDaySchedule = new Entity('employee_day_schedules')
export const MaterialDelivery = new Entity('material_deliveries')

export const functions = {
  async invoke(functionName, params) {
    try {
      // Handle both formats:
      // 1. { body: {...} } - already wrapped, pass directly
      // 2. { someField: value } - needs to be wrapped in body
      let invokeParams = params
      if (params && !params.body && !params.headers) {
        // params is the body itself, wrap it
        invokeParams = { body: params }
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, invokeParams)
      
      if (error) throw error
      return { data }
    } catch (error) {
      console.error(`Error invoking function ${functionName}:`, error)
      throw error
    }
  }
}

export const base44 = {
  functions,
  auth: {
    signIn: User.login,
    signOut: User.logout,
    getCurrentUser: User.me,
    me: User.me.bind(User)
  },
  entities: {
    Project,
    MaterialRequest,
    Damage,
    ChatMessage,
    User,
    Company,
    ReferralPoint,
    Notification,
    DailyUpdate,
    HoursEntry,
    MaterialsUsage,
    ClientInvitation,
    GlobalSettings,
    PendingCompany,
    PlatformUpdate,
    Supplier,
    Material,
    MaterialCategory,
    TimeEntry,
    ExtraCost,
    PlanningEvent,
    ColorAdvice,
    DamageInteraction,
    DailyUpdateInteraction,
    PhotoReaction,
    ReferralPeriod,
    Lead,
    OfferteOpmeting,
    HelpdeskTicket,
    HelpdeskReply,
    PendingInvite,
    Invoice,
    Subscription,
    TestLog,
    AppError,
    SupplierInvoice,
    MaterialPriceApproval,
    CheckInRecord,
    CompanyVehicle,
    VehicleAssignment,
    Subcontractor,
    SubcontractorAssignment,
    ProjectTask,
    EmployeeDaySchedule,
    MaterialDelivery
  }
}

export const subscribeToTable = (tableName, callback) => {
  const subscription = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      callback
    )
    .subscribe()
  
  return subscription
}

export const unsubscribe = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}