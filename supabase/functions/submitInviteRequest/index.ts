import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { email, company_name, name } = await req.json()

    // Validate input
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Geldig e-mailadres is verplicht' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if email already exists
    const { data: existing } = await supabase
      .from('invite_requests')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Uw verzoek is al geregistreerd. We nemen binnenkort contact met u op.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert invite request
    const { data, error } = await supabase
      .from('invite_requests')
      .insert({
        email: email.toLowerCase().trim(),
        company_name: company_name?.trim() || null,
        name: name?.trim() || null,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting invite request:', error)
      return new Response(
        JSON.stringify({ error: 'Er ging iets mis. Probeer het later opnieuw.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notification email to owner
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL') || 'mynysteven@gmail.com'

    if (RESEND_API_KEY) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nieuwe Invite Request</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 40px 0;">
                  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">PaintConnect</h1>
                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Nieuwe Invite Request</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Nieuwe aanmelding voor invite</h2>
                        <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                          Er is een nieuwe invite request binnengekomen via de landingpage.
                        </p>
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                          <tr>
                            <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 150px;">E-mail:</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${email}</td>
                          </tr>
                          ${name ? `
                          <tr>
                            <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Naam:</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${name}</td>
                          </tr>
                          ` : ''}
                          ${company_name ? `
                          <tr>
                            <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Bedrijfsnaam:</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${company_name}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Datum:</td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${new Date().toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' })}</td>
                          </tr>
                        </table>
                        <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                          Log in op het admin dashboard om deze invite request te bekijken en te beheren.
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

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'PaintConnect <noreply@notifications.paintconnect.be>',
            to: [OWNER_EMAIL],
            subject: `Nieuwe invite request: ${company_name || email}`,
            html: emailHtml
          })
        })

        console.log('Notification email sent to owner')
      } catch (emailError) {
        console.error('Error sending notification email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bedankt voor uw interesse! We nemen binnenkort contact met u op.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in submitInviteRequest:', error)
    return new Response(
      JSON.stringify({ error: 'Er ging iets mis. Probeer het later opnieuw.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
