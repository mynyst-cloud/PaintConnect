// supabase/functions/sendNotification/index.ts
// Creates in-app notifications, optionally sends email via Resend, and push via OneSignal

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://paintcon.vercel.app'

interface NotificationPayload {
  recipient_emails: string[]          // Array of recipient emails
  type: string                        // Notification type
  title?: string                      // Optional title
  message: string                     // Main notification message
  link_to?: string                    // Optional link to page
  project_id?: string                 // Optional project reference
  company_id?: string                 // Company context
  data?: Record<string, any>          // Extra data
  send_email?: boolean                // Whether to also send email (default: false)
  send_push?: boolean                 // Whether to also send push notification (default: false)
  triggering_user_name?: string       // Name of user who triggered this
}

// Notification types that should trigger push for admins
const ADMIN_PUSH_TYPES = [
  'material_requested',
  'damage_reported', 
  'team_message',
  'painter_activated',
  'client_logged_in',
  'painter_not_checked_in',
  'invoice_received',
  'credit_note_received'
]

// Notification types that should trigger push for painters
const PAINTER_PUSH_TYPES = [
  'planning_change',
  'project_assigned',
  'update_reply',
  'check_in_reminder',
  'check_out_reminder',
  'team_message'
]

Deno.serve(async (req: Request) => {
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
      send_push = false,
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

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const results = {
      notifications_created: [] as string[],
      notifications_failed: [] as string[],
      emails_sent: [] as string[],
      emails_failed: [] as string[],
      push_sent: [] as string[],
      push_failed: [] as string[]
    }

    const notificationTitle = title || getDefaultTitle(type)
    const notificationLink = link_to || getDefaultLink(type)

    // Collect user IDs for push notifications
    const userIdsForPush: string[] = []

    // Create notifications for each recipient
    for (const email of recipient_emails) {
      try {
        // Get user data
        const { data: userData } = await supabase
          .from('users')
          .select('id, company_role')
          .eq('email', email.toLowerCase())
          .single()

        // Only include columns that exist in the notifications table
        const notificationData: Record<string, any> = {
          recipient_email: email.toLowerCase(),
          user_id: userData?.id || null,
          company_id: company_id || null,
          type,
          title: notificationTitle,
          message,
          link_to: notificationLink || null,
          project_id: project_id || null,
          data: data || {},
          read: false,
          created_date: new Date().toISOString(),
          triggering_user_name: triggering_user_name || null
        }
        
        // Log the notification data for debugging
        console.log('[sendNotification] Creating notification:', { email, type, title: notificationTitle })

        const { error } = await supabase
          .from('notifications')
          .insert(notificationData)

        if (error) {
          console.error(`Failed to create notification for ${email}:`, error)
          results.notifications_failed.push(email)
        } else {
          results.notifications_created.push(email)
          
          // Collect user ID for push if applicable
          if (userData?.id && shouldSendPush(type, userData.company_role, send_push)) {
            userIdsForPush.push(userData.id)
          }
        }

        // Send email if requested
        if (send_email && RESEND_API_KEY) {
          const emailResult = await sendEmail(email, notificationTitle, message, notificationLink, type, triggering_user_name)
          if (emailResult) {
            results.emails_sent.push(email)
          } else {
            results.emails_failed.push(email)
          }
        }

      } catch (err) {
        console.error(`Error processing ${email}:`, err)
        results.notifications_failed.push(email)
      }
    }

    // Send push notifications to collected users
    if (userIdsForPush.length > 0 && ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
      const pushResult = await sendPushNotifications(
        supabase,
        userIdsForPush,
        notificationTitle,
        message,
        type,
        notificationLink,
        project_id
      )
      
      if (pushResult.success) {
        results.push_sent = pushResult.sent
      } else {
        results.push_failed = userIdsForPush
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: results.notifications_created.length,
        notifications_failed: results.notifications_failed.length,
        emails_sent: results.emails_sent.length,
        emails_failed: results.emails_failed.length,
        push_sent: results.push_sent.length,
        push_failed: results.push_failed.length,
        details: results
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

// Determine if push should be sent based on notification type and user role
function shouldSendPush(type: string, userRole: string | null, forcePush: boolean): boolean {
  if (forcePush) return true
  
  const isAdmin = userRole === 'admin'
  
  if (isAdmin && ADMIN_PUSH_TYPES.includes(type)) {
    return true
  }
  
  if (!isAdmin && PAINTER_PUSH_TYPES.includes(type)) {
    return true
  }
  
  return false
}

// Send push notifications via OneSignal
async function sendPushNotifications(
  supabase: any,
  userIds: string[],
  title: string,
  message: string,
  type: string,
  link: string,
  projectId?: string
): Promise<{ success: boolean; sent: string[] }> {
  try {
    // Get OneSignal player IDs for these users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('onesignal_player_id, user_id')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for users:', userIds)
      return { success: false, sent: [] }
    }

    const playerIds = subscriptions.map((s: any) => s.onesignal_player_id)
    const sentUserIds = subscriptions.map((s: any) => s.user_id)

    // Build OneSignal payload
    const oneSignalPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title, nl: title },
      contents: { en: message, nl: message },
      data: {
        notification_type: type,
        project_id: projectId,
        url: link
      },
      url: `${APP_URL}${link}`,
      chrome_web_icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png',
      android_accent_color: '10B981',
      web_push_topic: type
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(oneSignalPayload)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('Push notifications sent:', { recipients: playerIds.length, onesignalId: result.id })
      
      // Log push notifications
      const logEntries = sentUserIds.map((userId: string) => ({
        user_id: userId,
        project_id: projectId || null,
        notification_type: type,
        title,
        message,
        onesignal_response: result
      }))
      
      await supabase.from('push_notification_log').insert(logEntries).catch(() => {})
      
      return { success: true, sent: sentUserIds }
    } else {
      console.error('OneSignal error:', result)
      return { success: false, sent: [] }
    }

  } catch (error) {
    console.error('Push notification error:', error)
    return { success: false, sent: [] }
  }
}

// Send email via Resend
async function sendEmail(
  email: string,
  title: string,
  message: string,
  link: string,
  type: string,
  triggeringUserName?: string
): Promise<boolean> {
  try {
    const emailHtml = getNotificationEmailHtml({
      title,
      message,
      link_to: `${APP_URL}${link}`,
      type,
      triggering_user_name: triggeringUserName
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'PaintConnect <noreply@notifications.paintconnect.be>',
        to: email,
        subject: title,
        html: emailHtml
      })
    })

    return response.ok
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    'project_assigned': 'Nieuw project toegewezen',
    'material_requested': 'Nieuwe materiaalaanvraag',
    'material_approved': 'Materiaal goedgekeurd',
    'damage_reported': 'Nieuwe beschadiging gemeld',
    'planning_change': 'Planning gewijzigd',
    'team_message': 'Nieuw teambericht',
    'client_message': 'Bericht van klant',
    'client_logged_in': 'Klant ingelogd op portaal',
    'painter_activated': 'Schilder heeft account geactiveerd',
    'painter_not_checked_in': 'Schilder niet ingecheckt',
    'update_reply': 'Reactie op je update',
    'check_in_reminder': 'Check-in herinnering',
    'check_out_reminder': 'Check-out herinnering',
    'invoice_received': 'Nieuwe factuur ontvangen',
    'credit_note_received': 'Creditnota ontvangen',
    'price_change_detected': 'Prijswijziging gedetecteerd',
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
    'planning_change': '/Planning',
    'team_message': '/TeamChat',
    'client_message': '/TeamChat',
    'client_logged_in': '/Dashboard',
    'painter_activated': '/AccountSettings',
    'painter_not_checked_in': '/TeamActiviteit',
    'update_reply': '/Projecten',
    'check_in_reminder': '/Dashboard',
    'check_out_reminder': '/Dashboard',
    'invoice_received': '/MateriaalBeheer?tab=facturen',
    'credit_note_received': '/MateriaalBeheer?tab=facturen',
    'price_change_detected': '/MateriaalBeheer?tab=facturen',
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
    'planning_change': '#7c3aed',
    'team_message': '#0891b2',
    'client_message': '#ec4899',
    'client_logged_in': '#6366f1',
    'painter_activated': '#10b981',
    'painter_not_checked_in': '#f59e0b',
    'update_reply': '#8b5cf6',
    'check_in_reminder': '#059669',
    'check_out_reminder': '#059669',
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
          <tr>
            <td style="background-color: ${accentColor}; padding: 24px; text-align: center;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png" alt="PaintConnect" style="height: 40px; width: auto;">
            </td>
          </tr>
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
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Dit is een automatische melding van PaintConnect.
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
