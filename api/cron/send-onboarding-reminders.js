/**
 * Vercel Cron Job: Send Onboarding Reminders
 * 
 * Triggers the sendOnboardingReminders Supabase Edge Function daily
 * to send reminder emails to companies in trial (day 3, 5, 7)
 */

export default async function handler(req, res) {
  // Verify secret key to prevent unauthorized access
  // Vercel cron passes secret as query parameter
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
  const secret = url.searchParams.get('secret')
  if (secret !== 'paintconnect-cron-2024') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration')
    }

    // Call the sendOnboardingReminders edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sendOnboardingReminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge function error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    return res.status(200).json({
      success: true,
      message: 'Onboarding reminders processed',
      data
    })
  } catch (error) {
    console.error('[send-onboarding-reminders] Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
}

