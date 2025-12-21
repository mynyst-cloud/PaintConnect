import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Verify Magic Link Edge Function
 * 
 * Verifies the magic link token and creates/returns a Supabase session
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

    console.log('[DEBUG HYP-G] Received token:', token?.substring(0, 8))

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen token opgegeven' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // First, check if table exists by trying to count all records
    const { count, error: countError } = await supabase
      .from('magic_links')
      .select('*', { count: 'exact', head: true })

    console.log('[DEBUG HYP-F] Table check:', { count, error: countError?.message, code: countError?.code })

    // Find the magic link - first without the used=false filter to debug
    const { data: allMatches, error: allError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)

    console.log('[DEBUG HYP-G/H] All matches for token:', { 
      found: allMatches?.length || 0, 
      error: allError?.message,
      records: allMatches?.map(m => ({ id: m.id?.substring(0, 8), used: m.used, email: m.email }))
    })

    // Now find with the used=false filter
    const { data: magicLink, error: findError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    console.log('[DEBUG HYP-E] Magic link query result:', { 
      found: !!magicLink, 
      error: findError?.message,
      code: findError?.code,
      email: magicLink?.email
    })

    if (findError || !magicLink) {
      console.error('Magic link not found:', findError)
      return new Response(
        JSON.stringify({ success: false, error: 'Ongeldige of verlopen link', debug: { findError: findError?.message, code: findError?.code } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Deze link is verlopen. Vraag een nieuwe aan.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Mark as used
    await supabase
      .from('magic_links')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', magicLink.id)

    // Check if user exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === magicLink.email.toLowerCase()
    )

    let userId: string
    let isNewUser = false

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: magicLink.email,
        email_confirm: true, // Auto-confirm since we verified via email
        user_metadata: {
          created_via: 'magic_link'
        }
      })

      if (createError || !newUser.user) {
        console.error('Create user error:', createError)
        return new Response(
          JSON.stringify({ success: false, error: 'Kon gebruiker niet aanmaken' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      userId = newUser.user.id
      isNewUser = true
    }

    // Generate a session for the user
    // We use generateLink to create a magic link that auto-logs in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: magicLink.email,
      options: {
        redirectTo: magicLink.redirect_to || '/Dashboard'
      }
    })

    if (linkError) {
      console.error('Generate link error:', linkError)
      // Fallback: return success and let user try Google login
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'E-mail geverifieerd! Log in via Google om door te gaan.',
          email: magicLink.email,
          isNewUser,
          redirectTo: magicLink.redirect_to || '/Dashboard',
          requiresGoogleLogin: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Extract the token from the generated link
    const actionLink = linkData.properties?.action_link
    
    console.log(`Magic link verified for: ${magicLink.email}, isNewUser: ${isNewUser}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Inloggen geslaagd!',
        email: magicLink.email,
        isNewUser,
        redirectTo: magicLink.redirect_to || '/Dashboard',
        actionLink // This link will auto-login the user
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('verifyMagicLink error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Er is een fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

