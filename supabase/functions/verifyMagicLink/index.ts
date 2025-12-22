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
      
      // Check if token exists but was already used
      const alreadyUsed = allMatches?.some(m => m.used === true)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: alreadyUsed 
            ? 'Deze link is al gebruikt. Vraag een nieuwe uitnodiging aan.' 
            : 'Ongeldige of verlopen link', 
          debug: { 
            findError: findError?.message, 
            code: findError?.code,
            tokenExists: (allMatches?.length || 0) > 0,
            alreadyUsed,
            allMatchesCount: allMatches?.length || 0
          } 
        }),
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

    // ============================================
    // AUTO-ACCEPT INVITE: Link user to company directly
    // If redirect_to contains an invite token, accept it now
    // ============================================
    let companyLinked = false
    let companyName = ''
    let autoLinkDebug: any = { step: 'start' }
    
    const redirectTo = magicLink.redirect_to || ''
    const inviteTokenMatch = redirectTo.match(/[?&]token=([^&]+)/)
    const inviteToken = inviteTokenMatch ? inviteTokenMatch[1] : null
    
    console.log('[AUTO-LINK] Checking for invite token in redirect:', { redirectTo, inviteToken: inviteToken?.substring(0, 8) })
    autoLinkDebug.redirectTo = redirectTo
    autoLinkDebug.inviteToken = inviteToken?.substring(0, 8)

    if (inviteToken) {
      autoLinkDebug.step = 'looking_for_invite'
      
      // Get the invite details - also check for ANY status to debug
      const { data: allInvites, error: allInvitesError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('token', inviteToken)
      
      console.log('[AUTO-LINK] All invites with this token:', { count: allInvites?.length, statuses: allInvites?.map(i => i.status) })
      autoLinkDebug.allInvitesFound = allInvites?.length || 0
      autoLinkDebug.inviteStatuses = allInvites?.map(i => i.status)
      
      // Now get the pending one
      const { data: invite, error: inviteError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('token', inviteToken)
        .eq('status', 'pending')
        .single()

      if (invite && !inviteError) {
        autoLinkDebug.step = 'found_pending_invite'
        autoLinkDebug.inviteCompanyId = invite.company_id
        console.log('[AUTO-LINK] Found pending invite for company:', invite.company_id)
        
        // Check if email matches
        if (invite.email?.toLowerCase() === magicLink.email.toLowerCase()) {
          autoLinkDebug.step = 'email_matched'
          
          // Get company details
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', invite.company_id)
            .single()

          autoLinkDebug.companyFound = !!company
          autoLinkDebug.companyError = companyError?.message

          if (company) {
            autoLinkDebug.step = 'company_found'
            autoLinkDebug.companyName = company.name
            
            // Check if user already exists in users table
            const { data: existingUserRecord, error: existingUserError } = await supabase
              .from('users')
              .select('id')
              .eq('id', userId)
              .single()

            autoLinkDebug.existingUserRecord = !!existingUserRecord
            autoLinkDebug.existingUserError = existingUserError?.message

            if (existingUserRecord) {
              autoLinkDebug.step = 'updating_existing_user'
              
              // Update existing user
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  company_id: invite.company_id,
                  current_company_id: invite.company_id,
                  company_role: invite.company_role || 'painter',
                  is_painter: invite.is_painter !== false,
                  status: 'active',
                  full_name: invite.full_name || magicLink.email.split('@')[0],
                  phone: invite.phone_number || null,
                  home_address: invite.home_address || null,
                  updated_date: new Date().toISOString()
                })
                .eq('id', userId)

              autoLinkDebug.updateError = updateError?.message || updateError?.code

              if (!updateError) {
                companyLinked = true
                companyName = company.name
                autoLinkDebug.step = 'user_updated_success'
                console.log('[AUTO-LINK] Updated user, linked to company:', company.name)
              } else {
                autoLinkDebug.step = 'update_failed'
                console.error('[AUTO-LINK] Failed to update user:', updateError)
              }
            } else {
              autoLinkDebug.step = 'creating_new_user'
              
              // Create new user record
              const { error: insertError } = await supabase
                .from('users')
                .insert({
                  id: userId,
                  email: magicLink.email,
                  full_name: invite.full_name || magicLink.email.split('@')[0],
                  phone: invite.phone_number || null,
                  company_id: invite.company_id,
                  current_company_id: invite.company_id,
                  company_role: invite.company_role || 'painter',
                  is_painter: invite.is_painter !== false,
                  status: 'active',
                  home_address: invite.home_address || null,
                  created_date: new Date().toISOString()
                })

              autoLinkDebug.insertError = insertError?.message || insertError?.code
              autoLinkDebug.insertErrorDetails = insertError?.details

              if (!insertError) {
                companyLinked = true
                companyName = company.name
                autoLinkDebug.step = 'user_created_success'
                console.log('[AUTO-LINK] Created user record, linked to company:', company.name)
              } else {
                autoLinkDebug.step = 'insert_failed'
                console.error('[AUTO-LINK] Failed to create user record:', insertError)
              }
            }

            // Mark invite as accepted and notify admins
            if (companyLinked) {
              const { error: acceptError } = await supabase
                .from('pending_invites')
                .update({
                  status: 'accepted',
                  accepted_at: new Date().toISOString()
                })
                .eq('id', invite.id)
              
              autoLinkDebug.acceptError = acceptError?.message
              console.log('[AUTO-LINK] Marked invite as accepted')
              
              // Send notification to admins that painter activated their account
              try {
                // Get admin emails for this company
                const { data: admins } = await supabase
                  .from('users')
                  .select('email')
                  .eq('company_id', invite.company_id)
                  .eq('company_role', 'admin')
                  .eq('status', 'active')
                
                if (admins && admins.length > 0) {
                  const adminEmails = admins.map(a => a.email).filter(Boolean)
                  const painterName = invite.full_name || magicLink.email.split('@')[0]
                  
                  // Create in-app notifications for admins
                  for (const adminEmail of adminEmails) {
                    await supabase
                      .from('notifications')
                      .insert({
                        recipient_email: adminEmail,
                        type: 'painter_activated',
                        title: 'Schilder heeft account geactiveerd',
                        message: `${painterName} (${magicLink.email}) heeft hun account geactiveerd en is nu lid van je team.`,
                        link_to: '/AccountSettings',
                        company_id: invite.company_id,
                        read: false,
                        created_date: new Date().toISOString(),
                        created_at: new Date().toISOString()
                      })
                  }
                  
                  console.log('[AUTO-LINK] Sent painter_activated notifications to', adminEmails.length, 'admins')
                  autoLinkDebug.notificationsSent = adminEmails.length
                }
              } catch (notifyError) {
                console.error('[AUTO-LINK] Failed to send activation notifications:', notifyError)
                autoLinkDebug.notifyError = notifyError?.message
              }
            }
          }
        } else {
          autoLinkDebug.step = 'email_mismatch'
          autoLinkDebug.inviteEmail = invite.email
          autoLinkDebug.magicLinkEmail = magicLink.email
          console.log('[AUTO-LINK] Email mismatch:', { inviteEmail: invite.email, magicLinkEmail: magicLink.email })
        }
      } else {
        autoLinkDebug.step = 'no_pending_invite'
        autoLinkDebug.inviteError = inviteError?.message
        console.log('[AUTO-LINK] No pending invite found for token:', inviteError?.message)
      }
    } else {
      autoLinkDebug.step = 'no_invite_token_in_redirect'
    }
    
    console.log('[AUTO-LINK] Final debug state:', autoLinkDebug)

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
    
    // If company was linked, redirect to Dashboard directly (no need for InviteAcceptance)
    // Otherwise, use the original redirect_to
    const finalRedirectTo = companyLinked ? '/Dashboard' : (magicLink.redirect_to || '/Dashboard')
    
    // Update the actionLink to use the new redirect
    let finalActionLink = actionLink
    if (companyLinked && actionLink) {
      // Replace the redirect_to in the actionLink with /Dashboard
      try {
        const actionUrl = new URL(actionLink)
        actionUrl.searchParams.set('redirect_to', 'https://paintcon.vercel.app/Dashboard')
        finalActionLink = actionUrl.toString()
      } catch (e) {
        console.error('Failed to update actionLink redirect:', e)
      }
    }
    
    console.log(`Magic link verified for: ${magicLink.email}, isNewUser: ${isNewUser}, companyLinked: ${companyLinked}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: companyLinked 
          ? `Welkom bij ${companyName}! U bent nu onderdeel van het team.`
          : 'Inloggen geslaagd!',
        email: magicLink.email,
        isNewUser,
        companyLinked,
        companyName: companyName || null,
        redirectTo: finalRedirectTo,
        actionLink: finalActionLink, // This link will auto-login the user
        autoLinkDebug // Include debug info for troubleshooting
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

