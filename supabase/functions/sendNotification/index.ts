// supabase/functions/sendNotification/index.ts
// Creates in-app notifications and optionally sends email via Resend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://paintcon.vercel.app'

interface NotificationPayload {
  recipient_emails: string[]          // Array of recipient emails
  type: string                        // Notification type (e.g., 'project_assigned', 'material_requested')
  title?: string                      // Optional title
  message: string                     // Main notification message
  link_to?: string                    // Optional link to page
  project_id?: string                 // Optional project reference
  company_id?: string                 // Company context
  data?: Record<string, any>          // Extra data
  send_email?: boolean                // Whether to also send email (default: false)
  triggering_user_name?: string       // Name of user who triggered this
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: NotificationPayload = await req.json()
    
    const {
      recipient_emails,
      type = 'generic',
      title,
      message,
      link_to,
      project_id,
      company_id,
      data = {},
      send_email = false,
      triggering_user_name
    } = payload

    if (!recipient_emails || !Array.isArray(recipient_emails) || recipient_emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'recipient_emails array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const created: string[] = []
    const failed: string[] = []
    const emailsSent: string[] = []
    const emailsFailed: string[] = []

    // Create notifications for each recipient
    for (const email of recipient_emails) {
      try {
        // Get user_id from email if possible
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.toLowerCase())
          .single()

        const notificationData = {
          recipient_email: email.toLowerCase(),
          user_id: userData?.id || null,
          company_id: company_id || null,
          type,
          title: title || getDefaultTitle(type),
          message,
          link_to: link_to || getDefaultLink(type),
          project_id: project_id || null,
          data: {
            ...data,
            triggering_user_name
          },
          read: false,
          created_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('notifications')
          .insert(notificationData)

        if (error) {
          console.error(`Failed to create notification for ${email}:`, error)
          failed.push(email)
        } else {
          created.push(email)
        }

        // Send email if requested
        if (send_email && RESEND_API_KEY) {
          try {
            const emailHtml = getNotificationEmailHtml({
              title: title || getDefaultTitle(type),
              message,
              link_to: link_to ? `${APP_URL}${link_to}` : APP_URL,
              type,
              triggering_user_name
            })

            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
              },
              body: JSON.stringify({
                from: 'PaintConnect <noreply@notifications.paintconnect.be>',
                to: email,
                subject: title || getDefaultTitle(type),
                html: emailHtml
              })
            })

            if (emailResponse.ok) {
              emailsSent.push(email)
            } else {
              const emailError = await emailResponse.text()
              console.error(`Failed to send email to ${email}:`, emailError)
              emailsFailed.push(email)
            }
          } catch (emailError) {
            console.error(`Email error for ${email}:`, emailError)
            emailsFailed.push(email)
          }
        }

      } catch (err) {
        console.error(`Error processing ${email}:`, err)
        failed.push(email)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: created.length,
        notifications_failed: failed.length,
        emails_sent: emailsSent.length,
        emails_failed: emailsFailed.length,
        created,
        failed
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('sendNotification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    'project_assigned': 'Nieuw project toegewezen',
    'material_requested': 'Materiaal aangevraagd',
    'material_approved': 'Materiaal goedgekeurd',
    'damage_reported': 'Nieuwe beschadiging gemeld',
    'hours_confirmed': 'Uren bevestigd',
    'materials_confirmed': 'Materialen bevestigd',
    'planning_change': 'Planning gewijzigd',
    'client_message': 'Nieuw bericht van klant',
    'team_message': 'Nieuw teambericht',
    'generic': 'Nieuwe melding'
  }
  return titles[type] || titles.generic
}

function getDefaultLink(type: string): string {
  const links: Record<string, string> = {
    'project_assigned': '/Planning',
    'material_requested': '/MateriaalBeheer',
    'material_approved': '/MateriaalBeheer',
    'damage_reported': '/Beschadigingen',
    'hours_confirmed': '/Dashboard',
    'materials_confirmed': '/Dashboard',
    'planning_change': '/Planning',
    'client_message': '/TeamChat',
    'team_message': '/TeamChat',
    'generic': '/Dashboard'
  }
  return links[type] || links.generic
}

function getNotificationEmailHtml(params: {
  title: string
  message: string
  link_to: string
  type: string
  triggering_user_name?: string
}): string {
  const { title, message, link_to, type, triggering_user_name } = params
  
  const typeColors: Record<string, string> = {
    'project_assigned': '#059669',
    'material_requested': '#2563eb',
    'material_approved': '#16a34a',
    'damage_reported': '#ea580c',
    'hours_confirmed': '#16a34a',
    'materials_confirmed': '#16a34a',
    'planning_change': '#7c3aed',
    'client_message': '#ec4899',
    'team_message': '#0891b2',
    'generic': '#6b7280'
  }
  
  const accentColor = typeColors[type] || typeColors.generic

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${accentColor}; padding: 24px; text-align: center;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png" alt="PaintConnect" style="height: 40px; width: auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">
                ${title}
              </h1>
              
              ${triggering_user_name ? `
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
                Van: <strong style="color: #374151;">${triggering_user_name}</strong>
              </p>
              ` : ''}
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                ${message}
              </p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: ${accentColor}; border-radius: 8px;">
                    <a href="${link_to}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Bekijken in PaintConnect
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Dit is een automatische melding van PaintConnect.<br>
                Je ontvangt deze e-mail omdat je een account hebt bij PaintConnect.
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

