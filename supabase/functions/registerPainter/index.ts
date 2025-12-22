import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Register Painter Edge Function
 * 
 * Creates a user with email+password using admin API (no email confirmation required)
 * Then links the user to the company via pending_invite
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, full_name, invite_token } = await req.json()

    console.log('[registerPainter] Request:', { email, hasPassword: !!password, invite_token: invite_token?.substring(0, 8) })

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'E-mail en wachtwoord zijn verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Wachtwoord moet minimaal 8 tekens bevatten' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!invite_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen uitnodigingstoken opgegeven' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify the invite token exists and is valid
    const { data: invite, error: inviteError } = await supabase
      .from('pending_invites')
      .select('*, companies(name)')
      .eq('token', invite_token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      console.error('[registerPainter] Invalid invite:', inviteError)
      return new Response(
        JSON.stringify({ success: false, error: 'Ongeldige of verlopen uitnodiging' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if invite email matches
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ success: false, error: 'E-mailadres komt niet overeen met de uitnodiging' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('[registerPainter] Valid invite found:', { 
      company: invite.companies?.name, 
      inviteEmail: invite.email 
    })

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (existingUser) {
      console.log('[registerPainter] User already exists:', existingUser.id)
      userId = existingUser.id

      // Try to update password if user exists
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true
      })

      if (updateError) {
        console.error('[registerPainter] Could not update password:', updateError)
        // Continue anyway - user might be able to use their existing password
      } else {
        console.log('[registerPainter] Password updated for existing user')
      }
    } else {
      // Create new user using admin API (bypasses email confirmation)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Mark email as confirmed immediately
        user_metadata: {
          full_name: full_name || email.split('@')[0]
        }
      })

      if (createError) {
        console.error('[registerPainter] Create user error:', createError)
        return new Response(
          JSON.stringify({ success: false, error: createError.message || 'Kon gebruiker niet aanmaken' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      userId = newUser.user.id
      console.log('[registerPainter] New user created:', userId)
    }

    // Create or update user record in users table
    const { error: userRecordError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email.toLowerCase(),
        full_name: full_name || invite.full_name || email.split('@')[0],
        company_id: invite.company_id,
        company_role: invite.company_role || 'painter',
        status: 'active',
        has_password: true
      }, { onConflict: 'id' })

    if (userRecordError) {
      console.error('[registerPainter] User record error:', userRecordError)
      // Continue anyway - the auth user exists
    }

    // Mark invite as accepted
    const { error: updateInviteError } = await supabase
      .from('pending_invites')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('token', invite_token)

    if (updateInviteError) {
      console.error('[registerPainter] Update invite error:', updateInviteError)
    }

    console.log('[registerPainter] Success! User linked to company:', invite.company_id)

    // Generate a session for the user
    // Note: We return success and the frontend will sign in with password
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account succesvol aangemaakt',
        user_id: userId,
        company_id: invite.company_id,
        company_name: invite.companies?.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[registerPainter] Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Er is een onverwachte fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

