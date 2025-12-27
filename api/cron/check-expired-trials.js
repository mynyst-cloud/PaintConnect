/**
 * Vercel Cron API Route for Check Expired Trials
 * 
 * This endpoint is called by an external cron service (e.g., cron-job.org)
 * or Vercel Cron and triggers the Supabase Edge Function that checks for expired trials.
 * 
 * URL: https://paintcon.vercel.app/api/cron/check-expired-trials?secret=paintconnect-cron-2024
 * 
 * Schedule: Daily at 2:00 AM UTC
 */

export default async function handler(req, res) {
  // Verify the secret to prevent unauthorized access
  const { secret } = req.query;
  
  if (secret !== 'paintconnect-cron-2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call the Supabase Edge Function
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hhnbxutsmnkypbwydebo.supabase.co';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/checkExpiredTrials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Edge Function error:', data);
      return res.status(response.status).json({ 
        error: 'Edge Function failed', 
        details: data 
      });
    }

    console.log('Check expired trials triggered:', data);
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      ...data
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}



