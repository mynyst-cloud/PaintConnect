import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Send Magic Link Edge Function
 * 
 * Generates a magic link token and sends it via Resend
 * Bypasses Supabase's built-in SMTP
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

// Magic link email template
function getMagicLinkEmailHtml(params: { email: string; magicLinkUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Inloggen bij PaintConnect</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#059669" style="background-color: #059669; border-radius: 16px 16px 0 0; padding: 40px 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png" alt="PaintConnect" width="180" style="display: block; max-width: 180px; height: auto; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; font-family: Arial, Helvetica, sans-serif;">
                Inloggen
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">
                Hallo,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif;">
                Klik op de onderstaande knop om in te loggen bij PaintConnect met <strong>${params.email}</strong>
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#059669" style="background-color: #059669; border-radius: 8px;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${params.magicLinkUrl}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="15%" strokecolor="#059669" fillcolor="#059669">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">Inloggen →</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="${params.magicLinkUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #059669; font-family: Arial, Helvetica, sans-serif;">
                            Inloggen →
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                Of kopieer deze link naar uw browser:<br>
                <a href="${params.magicLinkUrl}" style="color: #059669; word-break: break-all;">${params.magicLinkUrl}</a>
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
                    <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center; font-family: Arial, Helvetica, sans-serif;">
                      Deze link is 15 minuten geldig. Heeft u deze e-mail niet aangevraagd? Dan kunt u deze negeren.
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

    const { email, redirectTo } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'E-mailadres is verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Generate a secure token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store the magic link token
    const { error: insertError } = await supabase
      .from('magic_links')
      .insert({
        email: normalizedEmail,
        token,
        expires_at: expiresAt.toISOString(),
        redirect_to: redirectTo || '/Dashboard'
      })

    if (insertError) {
      console.error('Insert magic link error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Kon magic link niet aanmaken' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Build magic link URL
    const magicLinkUrl = `${APP_URL}/auth/verify?token=${token}`

    // Send email via Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'E-mail service niet geconfigureerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const emailHtml = getMagicLinkEmailHtml({
      email: normalizedEmail,
      magicLinkUrl
    })

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [normalizedEmail],
        subject: 'Inloggen bij PaintConnect',
        html: emailHtml
      })
    })

    const resendResult = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend error:', resendResult)
      return new Response(
        JSON.stringify({ error: 'E-mail versturen mislukt: ' + (resendResult.message || 'Onbekende fout') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Magic link email sent to:', normalizedEmail)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Controleer uw inbox voor de inloglink'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('sendMagicLink error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Er is een fout opgetreden' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

