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
      console.error('[createStripeCheckout] Missing STRIPE_SECRET_KEY')
      return new Response(
        JSON.stringify({ success: false, error: 'Stripe API key niet geconfigureerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    const { priceId, planName, billingCycle = 'monthly', companyId, userId, action = 'new' } = await req.json()
    console.log('[createStripeCheckout] Request:', { priceId, planName, billingCycle, companyId, userId, action })

    if (!priceId || !companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'priceId en companyId zijn verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get company data
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, stripe_customer_id, subscription_tier, subscription_status')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('[createStripeCheckout] Company not found:', companyError)
      return new Response(
        JSON.stringify({ success: false, error: 'Bedrijf niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get user email for Stripe customer
    let userEmail = null
    if (userId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()
      userEmail = user?.email
    }

    let stripeCustomerId = company.stripe_customer_id

    // Create or retrieve Stripe customer
    if (!stripeCustomerId) {
      console.log('[createStripeCheckout] Creating new Stripe customer for:', company.name)
      
      const customer = await stripe.customers.create({
        name: company.name,
        email: userEmail || undefined,
        metadata: {
          company_id: companyId,
        },
      })
      
      stripeCustomerId = customer.id

      // Save Stripe customer ID to company
      await supabaseAdmin
        .from('companies')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', companyId)

      console.log('[createStripeCheckout] Created Stripe customer:', stripeCustomerId)
    }

    // Determine plan type from planName
    const planType = planName?.toLowerCase().replace(' ', '') || 'starter'

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card', 'sepa_debit'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/Subscription?session_id={CHECKOUT_SESSION_ID}&payment=success&plan=${planType}`,
      cancel_url: `${APP_URL}/Subscription?payment=cancelled`,
      metadata: {
        company_id: companyId,
        plan_type: planType,
        billing_cycle: billingCycle,
        action: action,
      },
      subscription_data: {
        metadata: {
          company_id: companyId,
          plan_type: planType,
          billing_cycle: billingCycle,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    }

    console.log('[createStripeCheckout] Creating checkout session...')
    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log('[createStripeCheckout] Created session:', session.id, 'URL:', session.url)

    // Store pending subscription info
    await supabaseAdmin
      .from('companies')
      .update({
        pending_subscription: {
          plan_type: planType,
          billing_cycle: billingCycle,
          stripe_session_id: session.id,
          created_at: new Date().toISOString(),
        },
      })
      .eq('id', companyId)

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[createStripeCheckout] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Onbekende fout' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

