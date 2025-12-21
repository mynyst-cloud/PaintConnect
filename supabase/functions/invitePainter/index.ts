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

// Email template for painter invitation
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
  <title>Uitnodiging PaintConnect</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png" alt="PaintConnect" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                U bent uitgenodigd!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Beste ${params.painterName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${params.inviterName}</strong> van <strong>${params.companyName}</strong> heeft u uitgenodigd om deel te nemen aan PaintConnect - het complete platform voor schildersbedrijven.
              </p>
              
              <!-- Features box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background: #f0fdf4; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #059669; font-weight: 600; margin: 0 0 15px 0; font-size: 14px;">
                      ✨ WAT U KUNT DOEN MET PAINTCONNECT:
                    </p>
                    <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Check-in/out bij projecten met GPS</li>
                      <li>Uw planning en toegewezen projecten bekijken</li>
                      <li>Beschadigingen registreren en opvolgen</li>
                      <li>Materialen aanvragen</li>
                      <li>Collega's doorverwijzen en punten verdienen</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${params.inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                      Uitnodiging Accepteren →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Of kopieer deze link naar uw browser:<br>
                <a href="${params.inviteUrl}" style="color: #059669; word-break: break-all;">${params.inviteUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Deze uitnodiging is 7 dagen geldig. Heeft u vragen? Neem contact op met uw werkgever.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} PaintConnect. Alle rechten voorbehouden.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                <a href="https://paintconnect.be/privacy" style="color: #9ca3af;">Privacybeleid</a> · 
                <a href="https://paintconnect.be/terms" style="color: #9ca3af;">Algemene Voorwaarden</a>
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

    // Build invite URL
    const inviteUrl = `${APP_URL}/InviteAcceptance?token=${inviteToken}`
    const painterName = `${firstName || ''} ${lastName || ''}`.trim() || 'Collega'

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

