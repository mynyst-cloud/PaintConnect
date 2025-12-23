import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

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
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const APP_URL = Deno.env.get('APP_URL') || 'https://paintcon.vercel.app'

    if (!STRIPE_SECRET_KEY) {
      console.error('[createCustomerPortal] Missing STRIPE_SECRET_KEY')
      return new Response(
        JSON.stringify({ success: false, error: 'Stripe API key niet geconfigureerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    const { companyId } = await req.json()
    console.log('[createCustomerPortal] Request for company:', companyId)

    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId is verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get company data
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, stripe_customer_id')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('[createCustomerPortal] Company not found:', companyError)
      return new Response(
        JSON.stringify({ success: false, error: 'Bedrijf niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (!company.stripe_customer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen Stripe klant gevonden. Mogelijk gebruikt u Mollie voor betalingen.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Stripe Customer Portal session
    console.log('[createCustomerPortal] Creating portal session for customer:', company.stripe_customer_id)
    
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${APP_URL}/Subscription`,
    })

    console.log('[createCustomerPortal] Created portal session:', session.url)

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[createCustomerPortal] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Onbekende fout' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

