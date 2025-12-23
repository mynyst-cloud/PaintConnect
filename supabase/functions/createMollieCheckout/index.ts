import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Mollie plan pricing configuration
const MOLLIE_PLANS = {
  starter: {
    monthly: { amount: '29.00', description: 'PaintConnect Starter - Maandelijks' },
    yearly: { amount: '290.00', description: 'PaintConnect Starter - Jaarlijks (2 maanden gratis)' },
  },
  professional: {
    monthly: { amount: '79.00', description: 'PaintConnect Professional - Maandelijks' },
    yearly: { amount: '790.00', description: 'PaintConnect Professional - Jaarlijks (2 maanden gratis)' },
  },
  enterprise: {
    monthly: { amount: '199.00', description: 'PaintConnect Enterprise - Maandelijks' },
    yearly: { amount: '1990.00', description: 'PaintConnect Enterprise - Jaarlijks (2 maanden gratis)' },
  },
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const APP_URL = Deno.env.get('APP_URL') || 'https://paintcon.vercel.app'

    if (!MOLLIE_API_KEY) {
      console.error('[createMollieCheckout] Missing MOLLIE_API_KEY')
      return new Response(
        JSON.stringify({ success: false, error: 'Mollie API key niet geconfigureerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { planType, companyId, billingCycle = 'monthly', userId, action = 'new' } = await req.json()
    console.log('[createMollieCheckout] Request:', { planType, companyId, billingCycle, userId, action })

    if (!planType || !companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'planType en companyId zijn verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const planConfig = MOLLIE_PLANS[planType]
    if (!planConfig) {
      return new Response(
        JSON.stringify({ success: false, error: `Ongeldig plan: ${planType}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const pricing = planConfig[billingCycle] || planConfig.monthly

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get company data
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, mollie_customer_id, subscription_tier, subscription_status')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      console.error('[createMollieCheckout] Company not found:', companyError)
      return new Response(
        JSON.stringify({ success: false, error: 'Bedrijf niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    let mollieCustomerId = company.mollie_customer_id

    // Create Mollie customer if not exists
    if (!mollieCustomerId) {
      console.log('[createMollieCheckout] Creating new Mollie customer for:', company.name)
      
      const createCustomerResponse = await fetch('https://api.mollie.com/v2/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: company.name,
          metadata: {
            company_id: companyId,
          },
        }),
      })

      if (!createCustomerResponse.ok) {
        const errorText = await createCustomerResponse.text()
        console.error('[createMollieCheckout] Failed to create Mollie customer:', errorText)
        return new Response(
          JSON.stringify({ success: false, error: 'Kon Mollie klant niet aanmaken' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      const customer = await createCustomerResponse.json()
      mollieCustomerId = customer.id

      // Save Mollie customer ID to company
      await supabaseAdmin
        .from('companies')
        .update({ mollie_customer_id: mollieCustomerId })
        .eq('id', companyId)

      console.log('[createMollieCheckout] Created Mollie customer:', mollieCustomerId)
    }

    // Determine interval for subscription
    const interval = billingCycle === 'yearly' ? '12 months' : '1 month'
    
    // Create a first payment (for subscription mandate)
    // Mollie requires a first payment to create a subscription mandate
    const paymentMetadata = {
      company_id: companyId,
      plan_type: planType,
      billing_cycle: billingCycle,
      action: action, // 'new', 'upgrade', 'switch_cycle'
      subscription_tier: planType,
      interval: interval,
    }

    console.log('[createMollieCheckout] Creating first payment with metadata:', paymentMetadata)

    // Create a first payment to set up the mandate
    const createPaymentResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: pricing.amount,
        },
        description: pricing.description,
        redirectUrl: `${APP_URL}/Subscription?mollie_checkout=success&plan=${planType}`,
        webhookUrl: `${SUPABASE_URL}/functions/v1/mollieWebhook`,
        metadata: paymentMetadata,
        customerId: mollieCustomerId,
        sequenceType: 'first', // This creates a mandate for future payments
      }),
    })

    if (!createPaymentResponse.ok) {
      const errorText = await createPaymentResponse.text()
      console.error('[createMollieCheckout] Failed to create payment:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'Kon Mollie betaling niet aanmaken' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const payment = await createPaymentResponse.json()
    console.log('[createMollieCheckout] Created payment:', payment.id, 'Checkout URL:', payment._links.checkout.href)

    // Store pending subscription info
    await supabaseAdmin
      .from('companies')
      .update({
        pending_subscription: {
          plan_type: planType,
          billing_cycle: billingCycle,
          mollie_payment_id: payment.id,
          created_at: new Date().toISOString(),
        },
      })
      .eq('id', companyId)

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: payment._links.checkout.href,
        paymentId: payment.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[createMollieCheckout] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Onbekende fout' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

