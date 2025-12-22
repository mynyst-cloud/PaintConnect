import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') || ''
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') || ''

interface PushPayload {
  user_ids?: string[]        // Supabase user IDs
  player_ids?: string[]      // OneSignal player IDs (direct)
  title: string
  message: string
  notification_type?: string  // 'check_in_reminder', 'check_out_reminder', 'general'
  project_id?: string
  data?: Record<string, string>
  url?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: PushPayload = await req.json()
    const { user_ids, player_ids, title, message, notification_type, project_id, data, url } = payload

    if (!title || !message) {
      throw new Error('Title and message are required')
    }

    let targetPlayerIds: string[] = player_ids || []

    // If user_ids provided, look up their OneSignal player IDs
    if (user_ids && user_ids.length > 0) {
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('onesignal_player_id, user_id')
        .in('user_id', user_ids)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching subscriptions:', error)
      }

      if (subscriptions) {
        targetPlayerIds = [
          ...targetPlayerIds,
          ...subscriptions.map(s => s.onesignal_player_id)
        ]
      }
    }

    // Remove duplicates
    targetPlayerIds = [...new Set(targetPlayerIds)]

    if (targetPlayerIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No valid push subscriptions found for target users' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Build OneSignal notification payload
    const oneSignalPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: targetPlayerIds,
      headings: { en: title, nl: title },
      contents: { en: message, nl: message },
      data: {
        ...data,
        notification_type,
        project_id,
        url: url || '/'
      },
      url: url || undefined,
      chrome_web_icon: 'https://paintconnect.be/logo-192.png',
      chrome_web_badge: 'https://paintconnect.be/logo-96.png',
      // iOS specific
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      // Android specific
      android_accent_color: '10B981', // Emerald green
      android_led_color: '10B981',
      // Web specific
      web_push_topic: notification_type || 'general'
    }

    // Send to OneSignal
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(oneSignalPayload)
    })

    const oneSignalResult = await oneSignalResponse.json()

    // Log the notification
    if (user_ids && user_ids.length > 0) {
      const logEntries = user_ids.map(userId => ({
        user_id: userId,
        project_id: project_id || null,
        notification_type: notification_type || 'general',
        title,
        message,
        onesignal_response: oneSignalResult
      }))

      await supabase.from('push_notification_log').insert(logEntries)
    }

    console.log('Push notification sent:', {
      recipients: targetPlayerIds.length,
      title,
      type: notification_type,
      oneSignalId: oneSignalResult.id
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipients: targetPlayerIds.length,
        onesignal_id: oneSignalResult.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('sendPushNotification error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})



