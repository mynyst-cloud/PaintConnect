import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Mapping plan types to subscription tiers
const PLAN_TO_TIER: Record<string, string> = {
  starter: 'starter',
  professional: 'professional',
  enterprise: 'enterprise',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Health check endpoint for testing
  if (req.method === 'GET') {
    console.log('[mollieWebhook] Health check request received')
    return new Response(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Mollie webhook endpoint is running'
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  try {
    console.log('[mollieWebhook] ====== WEBHOOK RECEIVED ======')
    console.log('[mollieWebhook] Method:', req.method)
    console.log('[mollieWebhook] Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())))

    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('[mollieWebhook] Environment check:', {
      hasMOLLIE_API_KEY: !!MOLLIE_API_KEY,
      hasSUPABASE_URL: !!SUPABASE_URL,
      hasSUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    })

    if (!MOLLIE_API_KEY) {
      console.error('[mollieWebhook] Missing MOLLIE_API_KEY')
      return new Response('Configuration error', { status: 500 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[mollieWebhook] Missing Supabase credentials')
      return new Response('Configuration error', { status: 500 })
    }

    // Mollie sends webhook as form data with 'id' parameter
    let paymentId: string | null = null
    
    try {
      const formData = await req.formData()
      paymentId = formData.get('id') as string
      console.log('[mollieWebhook] Parsed form data, paymentId:', paymentId)
    } catch (formError) {
      console.error('[mollieWebhook] Failed to parse form data:', formError)
      // Try JSON as fallback
      try {
        const body = await req.text()
        console.log('[mollieWebhook] Raw body:', body)
        const json = JSON.parse(body)
        paymentId = json.id
      } catch (jsonError) {
        console.error('[mollieWebhook] Also failed to parse JSON:', jsonError)
      }
    }

    if (!paymentId) {
      console.error('[mollieWebhook] No payment ID found in webhook')
      return new Response('No payment ID', { status: 400 })
    }

    console.log('[mollieWebhook] Received webhook for payment:', paymentId)

    // Fetch payment details from Mollie
    const paymentResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
      },
    })

    if (!paymentResponse.ok) {
      console.error('[mollieWebhook] Failed to fetch payment:', await paymentResponse.text())
      return new Response('Failed to fetch payment', { status: 500 })
    }

    const payment = await paymentResponse.json()
    console.log('[mollieWebhook] Payment status:', payment.status, 'Metadata:', JSON.stringify(payment.metadata))

    // Only process paid payments
    if (payment.status !== 'paid') {
      console.log('[mollieWebhook] Payment not yet paid, status:', payment.status)
      return new Response('OK', { status: 200 })
    }

    const metadata = payment.metadata
    if (!metadata?.company_id) {
      console.error('[mollieWebhook] No company_id in payment metadata')
      return new Response('No company ID', { status: 400 })
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const companyId = metadata.company_id
    const planType = metadata.plan_type || metadata.subscription_tier
    const billingCycle = metadata.billing_cycle || 'monthly'
    const subscriptionTier = PLAN_TO_TIER[planType] || 'starter'

    console.log('[mollieWebhook] Activating subscription:', {
      companyId,
      planType,
      billingCycle,
      subscriptionTier,
    })

    // Calculate next billing date
    const now = new Date()
    let nextBillingDate: Date
    if (billingCycle === 'yearly') {
      nextBillingDate = new Date(now.setFullYear(now.getFullYear() + 1))
    } else {
      nextBillingDate = new Date(now.setMonth(now.getMonth() + 1))
    }

    // Update company subscription
    const updateData: Record<string, any> = {
      subscription_tier: subscriptionTier,
      subscription_status: 'active',
      billing_cycle: billingCycle,
      last_payment_date: new Date().toISOString(),
      next_billing_date: nextBillingDate.toISOString(),
      pending_subscription: null, // Clear pending subscription
      trial_ends_at: null, // Clear trial
    }

    // If this was a first payment, create a subscription for recurring payments
    if (payment.sequenceType === 'first' && payment.mandateId) {
      console.log('[mollieWebhook] First payment completed, creating subscription...')

      // Get interval for subscription
      const interval = billingCycle === 'yearly' ? '12 months' : '1 month'
      
      // Get pricing
      const prices: Record<string, Record<string, string>> = {
        starter: { monthly: '29.00', yearly: '290.00' },
        professional: { monthly: '79.00', yearly: '790.00' },
        enterprise: { monthly: '199.00', yearly: '1990.00' },
      }
      const amount = prices[planType]?.[billingCycle] || '29.00'

      // Create recurring subscription
      const createSubResponse = await fetch(`https://api.mollie.com/v2/customers/${payment.customerId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MOLLIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: {
            currency: 'EUR',
            value: amount,
          },
          interval: interval,
          description: `PaintConnect ${planType.charAt(0).toUpperCase() + planType.slice(1)} - ${billingCycle === 'yearly' ? 'Jaarlijks' : 'Maandelijks'}`,
          webhookUrl: `${SUPABASE_URL}/functions/v1/mollieWebhook`,
          metadata: {
            company_id: companyId,
            plan_type: planType,
            billing_cycle: billingCycle,
          },
          mandateId: payment.mandateId,
          startDate: nextBillingDate.toISOString().split('T')[0], // Start after first payment period
        }),
      })

      if (createSubResponse.ok) {
        const subscription = await createSubResponse.json()
        console.log('[mollieWebhook] Created recurring subscription:', subscription.id)
        updateData.mollie_subscription_id = subscription.id
      } else {
        console.error('[mollieWebhook] Failed to create subscription:', await createSubResponse.text())
        // Continue anyway - first payment was successful
      }
    }

    // Apply update
    console.log('[mollieWebhook] Updating company with data:', JSON.stringify(updateData, null, 2))
    
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select()
      .single()

    if (updateError) {
      console.error('[mollieWebhook] Failed to update company:', updateError)
      return new Response(`Database update failed: ${updateError.message}`, { status: 500 })
    }

    console.log('[mollieWebhook] ====== SUCCESS ======')
    console.log('[mollieWebhook] Company updated:', updatedCompany?.id)
    console.log('[mollieWebhook] New subscription_tier:', updatedCompany?.subscription_tier)
    console.log('[mollieWebhook] New subscription_status:', updatedCompany?.subscription_status)

    // Send notification to admins
    try {
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .eq('company_id', companyId)
        .eq('company_role', 'admin')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await supabaseAdmin.from('notifications').insert({
            user_id: admin.id,
            type: 'subscription_activated',
            title: '🎉 Abonnement geactiveerd!',
            message: `Je ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} abonnement is nu actief. Bedankt voor je vertrouwen!`,
            link_to: '/Subscription',
            read: false,
          })
        }
      }
    } catch (notifyError) {
      console.error('[mollieWebhook] Failed to send notification:', notifyError)
      // Non-critical, continue
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('[mollieWebhook] Error:', error)
    return new Response('Internal error', { status: 500 })
  }
})

