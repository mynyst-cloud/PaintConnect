import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify request is from authorized source (cron job, admin, etc.)
    const authHeader = req.headers.get('Authorization')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Allow service role key or valid auth token
    if (!authHeader && !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet geautoriseerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_KEY = authHeader 
      ? SUPABASE_SERVICE_ROLE_KEY ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      : SUPABASE_SERVICE_ROLE_KEY ?? ''

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Find all companies with expired trials
    const now = new Date().toISOString()
    
    console.log('[checkExpiredTrials] Checking for expired trials at', now)
    
    const { data: expiredCompanies, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('id, name, subscription_status, trial_ends_at, subscription_tier')
      .eq('subscription_status', 'trialing')
      .not('trial_ends_at', 'is', null)
      .lt('trial_ends_at', now)

    if (fetchError) {
      console.error('[checkExpiredTrials] Error fetching expired trials:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'Kon verlopen trials niet ophalen' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!expiredCompanies || expiredCompanies.length === 0) {
      console.log('[checkExpiredTrials] No expired trials found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Geen verlopen trials gevonden',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`[checkExpiredTrials] Found ${expiredCompanies.length} expired trials`)

    // Update all expired trials to 'expired' status
    const companyIds = expiredCompanies.map(c => c.id)
    
    const { data: updatedCompanies, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({ 
        subscription_status: 'expired',
        trial_ended_at: now
      })
      .in('id', companyIds)
      .select('id, name, subscription_status')

    if (updateError) {
      console.error('[checkExpiredTrials] Error updating expired trials:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Kon verlopen trials niet updaten' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`[checkExpiredTrials] Updated ${updatedCompanies?.length || 0} companies`)

    // Send notifications to admins of expired companies
    try {
      for (const company of expiredCompanies) {
        const { data: admins } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name')
          .eq('company_id', company.id)
          .in('company_role', ['admin', 'owner'])

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await supabaseAdmin.from('notifications').insert({
              user_id: admin.id,
              company_id: company.id,
              type: 'trial_expired',
              title: '⏰ Proefperiode verlopen',
              message: `Je proefperiode is verlopen. Upgrade naar een betaald abonnement om verder te gaan.`,
              link_to: '/Subscription',
              read: false,
            }).catch(err => {
              console.error(`[checkExpiredTrials] Failed to send notification to ${admin.email}:`, err)
            })
          }
        }
      }
    } catch (notifyError) {
      console.error('[checkExpiredTrials] Error sending notifications:', notifyError)
      // Non-critical, continue
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${updatedCompanies?.length || 0} expired trials`,
        updated: updatedCompanies?.length || 0,
        companies: updatedCompanies?.map(c => ({ id: c.id, name: c.name }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[checkExpiredTrials] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Er is een onverwachte fout opgetreden'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})



