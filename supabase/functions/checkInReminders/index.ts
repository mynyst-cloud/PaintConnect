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
 * 1. Work start time is NOW - send check-in reminder to assigned painters who haven't checked in
 * 2. Work end time is NOW - send check-out reminder to painters who are still checked in
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') || ''
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') || ''

async function sendPush(playerIds: string[], title: string, message: string, data: Record<string, any>) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY || playerIds.length === 0) {
    return null
  }

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

  return response.json()
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

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // "HH:MM" format
    const today = now.toISOString().slice(0, 10) // "YYYY-MM-DD" format

    console.log(`[CheckInReminders] Running at ${currentTime} on ${today}`)

    let checkInReminders = 0
    let checkOutReminders = 0

    // ===============================================
    // 1. CHECK-IN REMINDERS (at work_start_time)
    // ===============================================
    // Find projects where work starts NOW and has active assignments
    const { data: startingProjects, error: startError } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        work_start_time,
        status,
        project_assignments!inner (
          user_id,
          is_active
        )
      `)
      .eq('status', 'in_uitvoering')
      .gte('work_start_time', currentTime)
      .lt('work_start_time', currentTime.slice(0, 4) + (parseInt(currentTime.slice(4)) + 1).toString()) // Within this minute

    if (startError) {
      console.error('Error fetching starting projects:', startError)
    }

    if (startingProjects && startingProjects.length > 0) {
      for (const project of startingProjects) {
        const assignedUserIds = project.project_assignments
          .filter((a: any) => a.is_active)
          .map((a: any) => a.user_id)

        if (assignedUserIds.length === 0) continue

        // Check who already checked in today
        const { data: checkedIn } = await supabase
          .from('check_in_records')
          .select('user_id')
          .eq('project_id', project.id)
          .gte('check_in_time', `${today}T00:00:00`)
          .is('check_out_time', null)

        const checkedInUserIds = (checkedIn || []).map((c: any) => c.user_id)
        const notCheckedInUserIds = assignedUserIds.filter((id: string) => !checkedInUserIds.includes(id))

        if (notCheckedInUserIds.length === 0) continue

        // Get push subscriptions for users who haven't checked in
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('onesignal_player_id, user_id')
          .in('user_id', notCheckedInUserIds)
          .eq('is_active', true)

        if (!subscriptions || subscriptions.length === 0) continue

        const playerIds = subscriptions.map((s: any) => s.onesignal_player_id)

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
        console.log(`[CheckInReminders] Sent ${notCheckedInUserIds.length} check-in reminders for project ${project.project_name}`)
      }
    }

    // ===============================================
    // 2. CHECK-OUT REMINDERS (at work_end_time)
    // ===============================================
    // Find projects where work ends NOW
    const { data: endingProjects, error: endError } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        work_end_time
      `)
      .eq('status', 'in_uitvoering')
      .gte('work_end_time', currentTime)
      .lt('work_end_time', currentTime.slice(0, 4) + (parseInt(currentTime.slice(4)) + 1).toString())

    if (endError) {
      console.error('Error fetching ending projects:', endError)
    }

    if (endingProjects && endingProjects.length > 0) {
      for (const project of endingProjects) {
        // Find users still checked in
        const { data: stillCheckedIn } = await supabase
          .from('check_in_records')
          .select('user_id')
          .eq('project_id', project.id)
          .gte('check_in_time', `${today}T00:00:00`)
          .is('check_out_time', null)

        if (!stillCheckedIn || stillCheckedIn.length === 0) continue

        const userIds = stillCheckedIn.map((c: any) => c.user_id)

        // Get push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('onesignal_player_id, user_id')
          .in('user_id', userIds)
          .eq('is_active', true)

        if (!subscriptions || subscriptions.length === 0) continue

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
        console.log(`[CheckInReminders] Sent ${userIds.length} check-out reminders for project ${project.project_name}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: now.toISOString(),
        check_in_reminders_sent: checkInReminders,
        check_out_reminders_sent: checkOutReminders
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('checkInReminders error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

