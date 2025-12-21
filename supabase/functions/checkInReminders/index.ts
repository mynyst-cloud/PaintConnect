import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Check-in/Check-out Reminder Cron Job
 * 
 * This function should be called every minute via:
 * - Supabase pg_cron
 * - External cron service (e.g., cron-job.org)
 * - Vercel Cron
 * 
 * It checks for projects where:
 * 1. Work start time is within 5 minutes of NOW - send check-in reminder
 * 2. Work end time is within 5 minutes of NOW - send check-out reminder
 * 
 * IMPORTANT: This uses the `assigned_painters` field (array of emails) 
 * from the projects table, NOT the project_assignments table.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') || ''
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') || ''

async function sendPush(playerIds: string[], title: string, message: string, data: Record<string, any>) {
  console.log(`[sendPush] Attempting to send to ${playerIds.length} players`)
  
  if (!ONESIGNAL_APP_ID) {
    console.error('[sendPush] ONESIGNAL_APP_ID not configured')
    return { error: 'ONESIGNAL_APP_ID not configured' }
  }
  
  if (!ONESIGNAL_REST_API_KEY) {
    console.error('[sendPush] ONESIGNAL_REST_API_KEY not configured')
    return { error: 'ONESIGNAL_REST_API_KEY not configured' }
  }
  
  if (playerIds.length === 0) {
    console.log('[sendPush] No player IDs provided')
    return { error: 'No player IDs' }
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { nl: title, en: title },
        contents: { nl: message, en: message },
        data,
        chrome_web_icon: 'https://paintconnect.be/logo-192.png',
        web_push_topic: data.notification_type || 'reminder'
      })
    })

    const result = await response.json()
    console.log('[sendPush] OneSignal response:', JSON.stringify(result))
    return result
  } catch (error) {
    console.error('[sendPush] Error:', error)
    return { error: error.message }
  }
}

// Helper to check if time is within window (in minutes)
function isTimeWithinWindow(targetTime: string, currentTime: string, windowMinutes: number = 5): boolean {
  if (!targetTime) return false
  
  // Parse times (format: "HH:MM" or "HH:MM:SS")
  const [targetHour, targetMin] = targetTime.split(':').map(Number)
  const [currentHour, currentMin] = currentTime.split(':').map(Number)
  
  const targetMinutes = targetHour * 60 + targetMin
  const currentMinutes = currentHour * 60 + currentMin
  
  const diff = currentMinutes - targetMinutes
  
  // Check if current time is within [0, windowMinutes] of target
  // This means we trigger at or shortly after the target time
  return diff >= 0 && diff < windowMinutes
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const debugLog: string[] = []
  const log = (msg: string) => {
    console.log(msg)
    debugLog.push(msg)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    
    // Convert to CET/CEST (Europe/Amsterdam) timezone
    const cetOptions: Intl.DateTimeFormatOptions = { 
      timeZone: 'Europe/Amsterdam',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
    
    const currentTime = now.toLocaleTimeString('nl-NL', cetOptions) // "HH:MM" format in CET
    const dateParts = now.toLocaleDateString('nl-NL', dateOptions).split('-')
    const today = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` // "YYYY-MM-DD" format

    log(`[CheckInReminders] Running at ${currentTime} CET on ${today}`)
    log(`[CheckInReminders] OneSignal configured: APP_ID=${ONESIGNAL_APP_ID ? 'yes' : 'NO'}, API_KEY=${ONESIGNAL_REST_API_KEY ? 'yes' : 'NO'}`)

    let checkInReminders = 0
    let checkOutReminders = 0

    // ===============================================
    // 1. GET ALL ACTIVE PROJECTS WITH WORK TIMES
    // ===============================================
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, project_name, work_start_time, work_end_time, status, assigned_painters')
      .eq('status', 'in_uitvoering')
      .not('assigned_painters', 'is', null)

    if (projectsError) {
      log(`[CheckInReminders] Error fetching projects: ${JSON.stringify(projectsError)}`)
    }

    log(`[CheckInReminders] Found ${projects?.length || 0} active projects with assignments`)

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          timestamp: now.toISOString(),
          currentTime,
          check_in_reminders_sent: 0,
          check_out_reminders_sent: 0,
          message: 'No active projects with assignments found',
          debug: debugLog
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ===============================================
    // 2. CHECK-IN REMINDERS (at work_start_time)
    // ===============================================
    for (const project of projects) {
      const startTime = project.work_start_time?.slice(0, 5)
      const assignedEmails = project.assigned_painters || []
      
      log(`[Project: ${project.project_name}] Start time: ${startTime}, Assigned: ${assignedEmails.length} painters`)
      
      if (!startTime || assignedEmails.length === 0) {
        log(`[Project: ${project.project_name}] Skipping - no start time or no painters`)
        continue
      }

      // Check if it's time to send check-in reminder
      if (!isTimeWithinWindow(startTime, currentTime, 5)) {
        log(`[Project: ${project.project_name}] Not within check-in window (${startTime} vs ${currentTime})`)
        continue
      }

      log(`[Project: ${project.project_name}] WITHIN check-in window!`)

      // Get user IDs from emails
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('email', assignedEmails)

      if (usersError) {
        log(`[Project: ${project.project_name}] Error fetching users: ${JSON.stringify(usersError)}`)
        continue
      }

      if (!users || users.length === 0) {
        log(`[Project: ${project.project_name}] No users found for emails: ${assignedEmails.join(', ')}`)
        continue
      }

      log(`[Project: ${project.project_name}] Found ${users.length} users`)

      const userIds = users.map(u => u.id)

      // Check who already checked in today
      const { data: checkedIn } = await supabase
        .from('check_in_records')
        .select('user_id')
        .eq('project_id', project.id)
        .gte('check_in_time', `${today}T00:00:00`)

      const checkedInUserIds = (checkedIn || []).map((c: any) => c.user_id)
      const notCheckedInUserIds = userIds.filter((id: string) => !checkedInUserIds.includes(id))

      log(`[Project: ${project.project_name}] Checked in: ${checkedInUserIds.length}, Not checked in: ${notCheckedInUserIds.length}`)

      if (notCheckedInUserIds.length === 0) {
        log(`[Project: ${project.project_name}] All users already checked in`)
        continue
      }

      // Check if we already sent a reminder today for this project
      const { data: existingReminders } = await supabase
        .from('push_notification_log')
        .select('id')
        .eq('project_id', project.id)
        .eq('notification_type', 'check_in_reminder')
        .gte('sent_at', `${today}T00:00:00`)
        .limit(1)

      if (existingReminders && existingReminders.length > 0) {
        log(`[Project: ${project.project_name}] Already sent check-in reminder today, skipping`)
        continue
      }

      // Get push subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('onesignal_player_id, user_id')
        .in('user_id', notCheckedInUserIds)
        .eq('is_active', true)

      if (subsError) {
        log(`[Project: ${project.project_name}] Error fetching subscriptions: ${JSON.stringify(subsError)}`)
      }

      log(`[Project: ${project.project_name}] Found ${subscriptions?.length || 0} push subscriptions`)

      if (!subscriptions || subscriptions.length === 0) {
        log(`[Project: ${project.project_name}] No active push subscriptions found`)
        continue
      }

      const playerIds = subscriptions.map((s: any) => s.onesignal_player_id)
      log(`[Project: ${project.project_name}] Sending to player IDs: ${playerIds.join(', ')}`)

      // Send check-in reminder
      const result = await sendPush(
        playerIds,
        '⏰ Tijd om in te checken!',
        `De werkdag bij ${project.project_name} begint nu. Bent u al ingecheckt?`,
        {
          notification_type: 'check_in_reminder',
          project_id: project.id,
          url: `/dashboard?checkin=${project.id}`
        }
      )

      // Log notifications
      for (const userId of notCheckedInUserIds) {
        await supabase.from('push_notification_log').insert({
          user_id: userId,
          project_id: project.id,
          notification_type: 'check_in_reminder',
          title: '⏰ Tijd om in te checken!',
          message: `De werkdag bij ${project.project_name} begint nu. Bent u al ingecheckt?`,
          onesignal_response: result
        })
      }

      checkInReminders += notCheckedInUserIds.length
      log(`[Project: ${project.project_name}] Sent ${notCheckedInUserIds.length} check-in reminders`)
    }

    // ===============================================
    // 3. CHECK-OUT REMINDERS (at work_end_time)
    // ===============================================
    for (const project of projects) {
      const endTime = project.work_end_time?.slice(0, 5)
      
      if (!endTime) continue

      // Check if it's time to send check-out reminder
      if (!isTimeWithinWindow(endTime, currentTime, 5)) {
        continue
      }

      log(`[Project: ${project.project_name}] WITHIN check-out window!`)

      // Check if we already sent a checkout reminder today
      const { data: existingReminders } = await supabase
        .from('push_notification_log')
        .select('id')
        .eq('project_id', project.id)
        .eq('notification_type', 'check_out_reminder')
        .gte('sent_at', `${today}T00:00:00`)
        .limit(1)

      if (existingReminders && existingReminders.length > 0) {
        log(`[Project: ${project.project_name}] Already sent check-out reminder today, skipping`)
        continue
      }

      // Find users still checked in
      const { data: stillCheckedIn } = await supabase
        .from('check_in_records')
        .select('user_id')
        .eq('project_id', project.id)
        .gte('check_in_time', `${today}T00:00:00`)
        .is('check_out_time', null)

      if (!stillCheckedIn || stillCheckedIn.length === 0) {
        log(`[Project: ${project.project_name}] No users still checked in`)
        continue
      }

      const userIds = stillCheckedIn.map((c: any) => c.user_id)
      log(`[Project: ${project.project_name}] Users still checked in: ${userIds.length}`)

      // Get push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('onesignal_player_id, user_id')
        .in('user_id', userIds)
        .eq('is_active', true)

      if (!subscriptions || subscriptions.length === 0) {
        log(`[Project: ${project.project_name}] No push subscriptions for checked-in users`)
        continue
      }

      const playerIds = subscriptions.map((s: any) => s.onesignal_player_id)

      // Send check-out reminder
      const result = await sendPush(
        playerIds,
        '🏠 Werkdag eindigt!',
        `De werkdag bij ${project.project_name} is afgelopen. Vergeet niet uit te checken!`,
        {
          notification_type: 'check_out_reminder',
          project_id: project.id,
          url: `/dashboard?checkout=${project.id}`
        }
      )

      // Log notifications
      for (const userId of userIds) {
        await supabase.from('push_notification_log').insert({
          user_id: userId,
          project_id: project.id,
          notification_type: 'check_out_reminder',
          title: '🏠 Werkdag eindigt!',
          message: `De werkdag bij ${project.project_name} is afgelopen. Vergeet niet uit te checken!`,
          onesignal_response: result
        })
      }

      checkOutReminders += userIds.length
      log(`[Project: ${project.project_name}] Sent ${userIds.length} check-out reminders`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: now.toISOString(),
        currentTime,
        projectsChecked: projects.length,
        check_in_reminders_sent: checkInReminders,
        check_out_reminders_sent: checkOutReminders,
        debug: debugLog
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('checkInReminders error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug: debugLog 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
