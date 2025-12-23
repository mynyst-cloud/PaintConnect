import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Register Company Edge Function
 * 
 * Creates a new company and links it to the current user.
 * Also generates a unique inbound email address for receiving invoices.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Generate a unique inbound email address for the company
 * Format: {sanitized-company-name}{2-random-digits}@facturatie.paintconnect.be
 */
function generateInboundEmail(companyName: string): string {
  // Sanitize company name: lowercase, remove special chars, replace spaces with dashes
  const sanitized = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .substring(0, 20) // Limit length
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes

  // Add 2 random digits for uniqueness
  const randomDigits = Math.floor(Math.random() * 90 + 10) // 10-99

  return `${sanitized}${randomDigits}@facturatie.paintconnect.be`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header to identify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet geautoriseerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create Supabase client with user's auth
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Create admin client for operations that need elevated privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user from auth
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('[registerCompany] Auth error:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Gebruiker niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('[registerCompany] Request from user:', user.id, user.email)

    // Parse request body
    const {
      company_name,
      email,
      vat_number,
      phone_number,
      street,
      house_number,
      postal_code,
      city,
      country
    } = await req.json()

    // Validate required fields
    if (!company_name?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bedrijfsnaam is verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if user already has a company
    const { data: existingUserCheck } = await supabaseAdmin
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (existingUserCheck?.company_id) {
      console.log('[registerCompany] User already has company:', existingUserCheck.company_id)
      return new Response(
        JSON.stringify({ success: false, error: 'Gebruiker heeft al een bedrijf' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate unique inbound email address
    let inboundEmail = generateInboundEmail(company_name)
    
    // Check if email is unique, if not regenerate with different random digits
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('inbound_email_address', inboundEmail)
        .single()
      
      if (!existing) break
      
      inboundEmail = generateInboundEmail(company_name)
      attempts++
    }

    console.log('[registerCompany] Generated inbound email:', inboundEmail)

    // Create company
    // Note: created_at is handled automatically by Supabase, don't include it
    const companyData: Record<string, any> = {
      name: company_name.trim(),
      email: email || user.email,
      vat_number: vat_number || null,
      phone_number: phone_number || null,
      street: street || null,
      house_number: house_number || null,
      postal_code: postal_code || null,
      city: city || null,
      country: country || 'België',
      inbound_email_address: inboundEmail,
      subscription_tier: 'free',
      subscription_status: 'trialing'
    }

    // Try to add trial_ends_at - if column doesn't exist, it will fail gracefully
    // We'll catch the error and retry without it
    let company = null
    let companyError = null

    // First attempt: with trial_ends_at
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const companyDataWithTrial = {
      ...companyData,
      trial_ends_at: trialEndsAt
    }

    const { data: companyWithTrial, error: errorWithTrial } = await supabaseAdmin
      .from('companies')
      .insert(companyDataWithTrial)
      .select()
      .single()

    if (errorWithTrial) {
      const errorCode = errorWithTrial.code || ''
      const errorMessage = errorWithTrial.message || ''
      
      // If error is about trial_ends_at column, try without it
      if (errorCode.includes('PGRST') && errorMessage.includes('trial_ends_at')) {
        console.warn('[registerCompany] trial_ends_at column not found, trying without it...')
        
        const { data: companyWithoutTrial, error: errorWithoutTrial } = await supabaseAdmin
          .from('companies')
          .insert(companyData)
          .select()
          .single()

        if (errorWithoutTrial) {
          companyError = errorWithoutTrial
        } else {
          company = companyWithoutTrial
        }
      } else {
        companyError = errorWithTrial
      }
    } else {
      company = companyWithTrial
    }

    if (companyError) {
      console.error('[registerCompany] Error creating company:', companyError)
      console.error('[registerCompany] Company error code:', companyError.code)
      console.error('[registerCompany] Company error details:', JSON.stringify(companyError))
      return new Response(
        JSON.stringify({ success: false, error: 'Kon bedrijf niet aanmaken: ' + (companyError.message || companyError.code || 'Onbekende fout') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('[registerCompany] Company created:', company.id, company.name)

    // Check if user already exists and what their current company_role is
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, company_role, company_id')
      .eq('id', user.id)
      .single()

    if (existingUser) {
      console.log('[registerCompany] Existing user found:', {
        id: existingUser.id,
        current_company_role: existingUser.company_role,
        current_company_id: existingUser.company_id
      })
      
      // If user already has a company, don't allow registration
      if (existingUser.company_id && existingUser.company_id !== company.id) {
        // Clean up the company we just created
        try {
          await supabaseAdmin.from('companies').delete().eq('id', company.id)
        } catch (cleanupError) {
          console.error('[registerCompany] Error cleaning up company:', cleanupError)
        }
        
        return new Response(
          JSON.stringify({ success: false, error: 'Gebruiker heeft al een bedrijf' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // If existing user has 'owner' role, update it to 'admin' first to satisfy check constraint
      if (existingUser.company_role === 'owner') {
        console.log('[registerCompany] Existing user has "owner" role, updating to "admin" first...')
        const { error: updateRoleError } = await supabaseAdmin
          .from('users')
          .update({ company_role: 'admin' })
          .eq('id', user.id)
        
        if (updateRoleError) {
          console.error('[registerCompany] Error updating company_role from owner to admin:', updateRoleError)
          // Continue anyway, the upsert will try to set it
        } else {
          console.log('[registerCompany] Successfully updated company_role from owner to admin')
        }
      }
    }

    // Link user to company using UPSERT
    // Build base user data - always include these fields
    // Note: created_date is handled automatically by Supabase or set by User.me(), don't include it
    // IMPORTANT: Always set company_role to 'admin' (not 'owner') to satisfy check constraint
    const userData: Record<string, any> = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      company_id: company.id,
      company_role: 'admin', // Must be 'admin', not 'owner' - check constraint doesn't allow 'owner'
      status: 'active'
    }

    // Try to upsert with user_type first (if column exists)
    let userUpsertError = null
    const userDataWithType = {
      ...userData,
      user_type: 'painter_company'
    }

    console.log('[registerCompany] Attempting user upsert with user_type...')
    console.log('[registerCompany] User data to upsert:', JSON.stringify(userDataWithType, null, 2))
    
    const { data: upsertedUser, error: upsertErrorWithType } = await supabaseAdmin
      .from('users')
      .upsert(userDataWithType, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    // If error is PGRST204 (column not found), try without user_type
    if (upsertErrorWithType) {
      const errorCode = upsertErrorWithType.code || ''
      const errorMessage = upsertErrorWithType.message || ''
      
      console.warn('[registerCompany] Upsert with user_type failed:', errorCode, errorMessage)
      
      // PGRST204 = column not found in schema cache, try without user_type
      if (errorCode.includes('PGRST') && errorMessage.includes('user_type')) {
        console.log('[registerCompany] user_type column not found, trying without it...')
        
        console.log('[registerCompany] User data to upsert (without user_type):', JSON.stringify(userData, null, 2))
        
        const { data: upsertedUserNoType, error: upsertErrorNoType } = await supabaseAdmin
          .from('users')
          .upsert(userData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (upsertErrorNoType) {
          userUpsertError = upsertErrorNoType
          console.error('[registerCompany] Upsert without user_type also failed:', upsertErrorNoType)
        } else {
          console.log('[registerCompany] User linked successfully (without user_type)')
        }
      } else {
        // Other error - fail
        userUpsertError = upsertErrorWithType
        console.error('[registerCompany] Upsert error (not column related):', upsertErrorWithType)
      }
    } else {
      console.log('[registerCompany] User linked successfully (with user_type)')
    }

    // If there was an error, clean up and return
    if (userUpsertError) {
      console.error('[registerCompany] Error linking user to company:', userUpsertError)
      console.error('[registerCompany] Error code:', userUpsertError.code)
      console.error('[registerCompany] Error message:', userUpsertError.message)
      console.error('[registerCompany] Error details:', JSON.stringify(userUpsertError))
      
      // Try to clean up company
      try {
        await supabaseAdmin.from('companies').delete().eq('id', company.id)
        console.log('[registerCompany] Company cleaned up after user error')
      } catch (cleanupError) {
        console.error('[registerCompany] Error cleaning up company:', cleanupError)
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Kon gebruiker niet koppelen aan bedrijf: ${userUpsertError.message || userUpsertError.code || 'Onbekende fout'}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create storage bucket for invoices (if not exists) - non-blocking
    try {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket('supplier-invoices', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
      })
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.warn('[registerCompany] Could not create storage bucket:', bucketError.message)
      } else {
        console.log('[registerCompany] Storage bucket ready')
      }
    } catch (bucketErr) {
      // Non-critical, just log
      console.warn('[registerCompany] Storage bucket error (non-critical):', bucketErr)
    }

    console.log('[registerCompany] Registration successful for company:', company.id)

    return new Response(
      JSON.stringify({
        success: true,
        company_id: company.id,
        company_name: company.name,
        inbound_email: company.inbound_email_address
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[registerCompany] Unexpected error:', error)
    console.error('[registerCompany] Error stack:', error?.stack)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Er is een onverwachte fout opgetreden',
        details: error?.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
