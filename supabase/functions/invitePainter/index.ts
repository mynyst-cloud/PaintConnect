import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Invite Painter Edge Function
 * 
 * Creates a pending invite and sends an email via Resend
 * 
 * Required env vars:
 * - RESEND_API_KEY
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const APP_URL = 'https://paintcon.vercel.app'
const FROM_EMAIL = 'noreply@notifications.paintconnect.be'
const FROM_NAME = 'PaintConnect'

// Email template for painter invitation - Optimized for all email clients
function getInviteEmailHtml(params: {
  painterName: string
  companyName: string
  inviterName: string
  inviteUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Uitnodiging PaintConnect</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
    .button-link {padding: 16px 40px !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#059669" style="background-color: #059669; border-radius: 16px 16px 0 0; padding: 40px 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png" alt="PaintConnect" width="180" style="display: block; max-width: 180px; height: auto; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; font-family: Arial, Helvetica, sans-serif;">
                U bent uitgenodigd!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">
                Beste ${params.painterName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">
                <strong>${params.inviterName}</strong> van <strong>${params.companyName}</strong> heeft u uitgenodigd om deel te nemen aan PaintConnect - het complete platform voor schildersbedrijven.
              </p>
              
              <!-- Features box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td bgcolor="#f0fdf4" style="background-color: #f0fdf4; padding: 20px; border-radius: 12px;">
                    <p style="color: #059669; font-weight: 600; margin: 0 0 15px 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                      WAT U KUNT DOEN MET PAINTCONNECT:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding: 4px 0; color: #374151; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">✓ Check-in/out bij projecten met GPS</td></tr>
                      <tr><td style="padding: 4px 0; color: #374151; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">✓ Uw planning en toegewezen projecten bekijken</td></tr>
                      <tr><td style="padding: 4px 0; color: #374151; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">✓ Beschadigingen registreren en opvolgen</td></tr>
                      <tr><td style="padding: 4px 0; color: #374151; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">✓ Materialen aanvragen</td></tr>
                      <tr><td style="padding: 4px 0; color: #374151; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">✓ Collega's doorverwijzen en punten verdienen</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button - Email client compatible -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#059669" style="background-color: #059669; border-radius: 8px;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${params.inviteUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="15%" strokecolor="#059669" fillcolor="#059669">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">Account Aanmaken & Starten →</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="${params.inviteUrl}" target="_blank" class="button-link" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #059669; font-family: Arial, Helvetica, sans-serif;">
                            Account Aanmaken & Starten →
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                Klik op de knop hierboven om uw account aan te maken met een wachtwoord.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                      Deze link is 7 dagen geldig. Eén klik is voldoende om uw account aan te maken en te starten!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; font-family: Arial, Helvetica, sans-serif;">
                © ${new Date().getFullYear()} PaintConnect. Alle rechten voorbehouden.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0; font-family: Arial, Helvetica, sans-serif;">
                <a href="https://paintconnect.be/privacy" style="color: #9ca3af; text-decoration: underline;">Privacybeleid</a> · 
                <a href="https://paintconnect.be/terms" style="color: #9ca3af; text-decoration: underline;">Algemene Voorwaarden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
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

    // Get request body
    const body = await req.json()
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      companyRole = 'painter',
      isPainter = true,
      companyId,
      homeAddress
    } = body

    // Validate required fields
    if (!email || !companyId) {
      return new Response(
        JSON.stringify({ error: 'E-mail en bedrijf zijn verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('Company not found:', companyError)
      return new Response(
        JSON.stringify({ error: 'Bedrijf niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get inviter details (from auth header)
    const authHeader = req.headers.get('Authorization')
    let inviterName = company.name
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        const { data: inviterData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        if (inviterData?.full_name) {
          inviterName = inviterData.full_name
        }
      }
    }

    // Check if email already exists as active user in this company
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Deze gebruiker is al lid van uw team' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if there's already a pending invite
    const { data: existingInvite } = await supabase
      .from('pending_invites')
      .select('id, token')
      .eq('email', email.toLowerCase())
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .single()

    let inviteToken: string
    let isResend = false

    if (existingInvite) {
      // Use existing invite token for resend
      inviteToken = existingInvite.token
      isResend = true
      
      // Update expires_at
      await supabase
        .from('pending_invites')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
        })
        .eq('id', existingInvite.id)
    } else {
      // Create new invite
      inviteToken = crypto.randomUUID()
      const fullName = `${firstName || ''} ${lastName || ''}`.trim()
      
      const { error: insertError } = await supabase
        .from('pending_invites')
        .insert({
          company_id: companyId,
          email: email.toLowerCase(),
          full_name: fullName || null,
          phone_number: phoneNumber || null,
          company_role: companyRole,
          is_painter: isPainter,
          home_address: homeAddress || null,
          token: inviteToken,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (insertError) {
        console.error('Insert invite error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Kon uitnodiging niet aanmaken: ' + insertError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // Build painter name
    const painterName = `${firstName || ''} ${lastName || ''}`.trim() || 'Collega'
    const normalizedEmail = email.toLowerCase().trim()

    // ============================================
    // BUILD DIRECT INVITE URL
    // User must register with password on InviteAcceptance page
    // NO magic link - enforces password creation for security
    // ============================================
    const inviteUrl = `${APP_URL}/InviteAcceptance?token=${inviteToken}`

    console.log('Created invite (password required):', { 
      email: normalizedEmail, 
      inviteToken: inviteToken.substring(0, 8), 
      inviteUrl 
    })

    // Send email via Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Uitnodiging aangemaakt, maar e-mail kon niet verstuurd worden (Resend niet geconfigureerd)',
          inviteUrl 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const emailHtml = getInviteEmailHtml({
      painterName,
      companyName: company.name,
      inviterName,
      inviteUrl
    })

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: `${inviterName} nodigt u uit voor ${company.name} op PaintConnect`,
        html: emailHtml
      })
    })

    const resendResult = await resendResponse.json()
    
    if (!resendResponse.ok) {
      console.error('Resend error:', resendResult)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Uitnodiging aangemaakt, maar e-mail versturen mislukt',
          error: resendResult.message || 'E-mail fout',
          inviteUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Email sent successfully:', resendResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isResend 
          ? 'Uitnodiging opnieuw verstuurd naar ' + email
          : 'Uitnodiging verstuurd naar ' + email,
        inviteUrl,
        emailId: resendResult.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('invitePainter error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Er is een fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

