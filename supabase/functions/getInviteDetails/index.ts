import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Get Invite Details Edge Function
 * 
 * Fetches invite details by token for unauthenticated users
 * Uses service role to bypass RLS
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

    const { token } = await req.json()

    console.log('[getInviteDetails] Looking for token:', token?.substring(0, 8))

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen token opgegeven' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Find the invite
    const { data: invite, error: findError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    console.log('[getInviteDetails] Query result:', { 
      found: !!invite, 
      error: findError?.message,
      email: invite?.email 
    })

    if (findError || !invite) {
      return new Response(
        JSON.stringify({ success: false, error: 'Uitnodiging niet gevonden of al gebruikt' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Deze uitnodiging is verlopen' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get company name
    let companyName = 'Onbekend bedrijf'
    if (invite.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', invite.company_id)
        .single()
      
      if (company) {
        companyName = company.name
      }
    }

    console.log('[getInviteDetails] Success for:', invite.email, 'company:', companyName)

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite: {
          id: invite.id,
          email: invite.email,
          full_name: invite.full_name,
          company_id: invite.company_id,
          company_name: companyName,
          company_role: invite.company_role,
          expires_at: invite.expires_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('getInviteDetails error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Er is een fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

