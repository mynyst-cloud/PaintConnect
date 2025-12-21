// src/lib/supabase.js
// Drop-in replacement voor Base44 SDK

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (userError) {
      console.warn('User not in users table, creating...', userError)
      
      const newUser = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email,
        created_date: new Date().toISOString()
      }
      
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user:', createError)
        throw createError
      }
      
      return createdUser
    }
    
    return userData
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

export const functions = {
  async invoke(functionName, params) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params
      })
      
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
    CheckInRecord
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