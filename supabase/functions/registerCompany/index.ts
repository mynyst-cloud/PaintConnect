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

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gebruiker niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

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

    console.log('[registerCompany] Request from user:', user.email, 'Company:', company_name)

    // Validate required fields
    if (!company_name?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bedrijfsnaam is verplicht' }),
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
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
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
        subscription_status: 'trial',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (companyError) {
      console.error('[registerCompany] Error creating company:', companyError)
      return new Response(
        JSON.stringify({ success: false, error: 'Kon bedrijf niet aanmaken: ' + companyError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('[registerCompany] Company created:', company.id)

    // Link user to company
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        company_id: company.id,
        company_role: 'owner',
        status: 'active'
      })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('[registerCompany] Error linking user to company:', userUpdateError)
      // Try to clean up company
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      return new Response(
        JSON.stringify({ success: false, error: 'Kon gebruiker niet koppelen aan bedrijf' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('[registerCompany] User linked to company successfully')

    // Create storage bucket for this company's invoices (if not exists)
    try {
      await supabaseAdmin.storage.createBucket('supplier-invoices', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
      })
    } catch (e) {
      // Bucket might already exist, that's fine
      console.log('[registerCompany] Storage bucket already exists or error:', e.message)
    }

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
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Er is een onverwachte fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})


