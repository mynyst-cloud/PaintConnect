import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Accept Invitation Edge Function
 * 
 * Links a user to a company based on their invite token
 * Called after the user logs in (via Google OAuth or Magic Link)
 * 
 * Required env vars:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get token from request body
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen geldig token opgegeven' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet ingelogd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const jwtToken = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(jwtToken)

    if (authError || !authUser) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Ongeldige sessie. Log opnieuw in.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get the invite details
    const { data: invite, error: inviteError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      console.error('Invite not found:', inviteError)
      return new Response(
        JSON.stringify({ success: false, error: 'Uitnodiging niet gevonden of al gebruikt' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Deze uitnodiging is verlopen. Vraag een nieuwe aan.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if email matches (case-insensitive)
    if (authUser.email?.toLowerCase() !== invite.email?.toLowerCase()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `U bent ingelogd als ${authUser.email}, maar de uitnodiging is voor ${invite.email}. Log uit en log in met het juiste e-mailadres.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', invite.company_id)
      .single()

    if (companyError || !company) {
      console.error('Company not found:', companyError)
      return new Response(
        JSON.stringify({ success: false, error: 'Het bedrijf bestaat niet meer' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, company_id, status')
      .eq('id', authUser.id)
      .single()

    if (existingUser) {
      // User exists - update their company assignment
      const { error: updateError } = await supabase
        .from('users')
        .update({
          company_id: invite.company_id,
          current_company_id: invite.company_id,
          company_role: invite.company_role || 'painter',
          is_painter: invite.is_painter !== false,
          status: 'active',
          full_name: invite.full_name || existingUser.full_name || authUser.email?.split('@')[0],
          phone: invite.phone_number || null,
          home_address: invite.home_address || null,
          updated_date: new Date().toISOString()
        })
        .eq('id', authUser.id)

      if (updateError) {
        console.error('Update user error:', updateError)
        return new Response(
          JSON.stringify({ success: false, error: 'Kon gebruiker niet bijwerken: ' + updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    } else {
      // Create new user record
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: invite.full_name || authUser.email?.split('@')[0],
          phone: invite.phone_number || null,
          company_id: invite.company_id,
          current_company_id: invite.company_id,
          company_role: invite.company_role || 'painter',
          is_painter: invite.is_painter !== false,
          status: 'active',
          home_address: invite.home_address || null,
          created_date: new Date().toISOString()
        })

      if (insertError) {
        console.error('Insert user error:', insertError)
        return new Response(
          JSON.stringify({ success: false, error: 'Kon gebruiker niet aanmaken: ' + insertError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // Mark invite as accepted
    const { error: updateInviteError } = await supabase
      .from('pending_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    if (updateInviteError) {
      console.error('Update invite error:', updateInviteError)
      // Don't fail the whole operation, just log it
    }

    console.log(`User ${authUser.email} successfully joined company ${company.name}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Welkom bij ${company.name}! U bent nu onderdeel van het team.`,
        company: {
          id: company.id,
          name: company.name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('acceptInvitation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Er is een fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

