import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Stripe price IDs for each plan and cycle
const STRIPE_PRICES: Record<string, Record<string, string>> = {
  starter: {
    monthly: 'price_1Rt7eHGxJl201SwK5BAFWWgT',
    yearly: 'price_1Rt7eHGxJl201SwK5BAFWWgT_YEARLY',
  },
  professional: {
    monthly: 'price_1Rt7fHGxJl201SwKjxlzrdJs',
    yearly: 'price_1Rt7fHGxJl201SwKjxlzrdJs_YEARLY',
  },
  enterprise: {
    monthly: 'price_1Rt7ftGxJl201SwKqvLuLWSf',
    yearly: 'price_1Rt7ftGxJl201SwKqvLuLWSf_YEARLY',
  },
}

// Mollie pricing
const MOLLIE_PRICES: Record<string, Record<string, string>> = {
  starter: { monthly: '29.00', yearly: '290.00' },
  professional: { monthly: '79.00', yearly: '790.00' },
  enterprise: { monthly: '199.00', yearly: '1990.00' },
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const APP_URL = Deno.env.get('APP_URL') || 'https://paintcon.vercel.app'

    const { 
      companyId, 
      action,  // 'upgrade', 'downgrade', 'switch_cycle', 'cancel'
      newPlan,
      newCycle,
    } = await req.json()

    console.log('[manageSubscription] Request:', { companyId, action, newPlan, newCycle })

    if (!companyId || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId en action zijn verplicht' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Get company data
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bedrijf niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Determine payment provider
    const isStripe = !!company.stripe_subscription_id
    const isMollie = !!company.mollie_subscription_id

    if (!isStripe && !isMollie) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen actief abonnement gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'switch_cycle': {
        if (!newCycle) {
          return new Response(
            JSON.stringify({ success: false, error: 'newCycle is verplicht voor switch_cycle' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const currentPlan = company.subscription_tier || 'starter'

        if (isStripe) {
          const stripe = new Stripe(STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })
          
          // Get current subscription
          const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id)
          const currentItem = subscription.items.data[0]

          // Get new price ID
          const newPriceId = STRIPE_PRICES[currentPlan]?.[newCycle]
          if (!newPriceId) {
            return new Response(
              JSON.stringify({ success: false, error: 'Geen prijsplan gevonden' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // Update subscription with new price
          // proration_behavior: 'create_prorations' means customer gets credit for unused time
          await stripe.subscriptions.update(company.stripe_subscription_id, {
            items: [
              {
                id: currentItem.id,
                price: newPriceId,
              },
            ],
            proration_behavior: 'create_prorations',
            metadata: {
              ...subscription.metadata,
              billing_cycle: newCycle,
            },
          })

          // Update company
          await supabaseAdmin
            .from('companies')
            .update({ billing_cycle: newCycle })
            .eq('id', companyId)

          console.log('[manageSubscription] Switched Stripe billing cycle to:', newCycle)

          return new Response(
            JSON.stringify({ success: true, message: `Facturatiecyclus gewijzigd naar ${newCycle === 'yearly' ? 'jaarlijks' : 'maandelijks'}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (isMollie) {
          // For Mollie, we need to cancel current and create new subscription
          // First cancel the old one
          await fetch(`https://api.mollie.com/v2/customers/${company.mollie_customer_id}/subscriptions/${company.mollie_subscription_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` },
          })

          // Create new subscription with new cycle
          const newAmount = MOLLIE_PRICES[currentPlan]?.[newCycle]
          const interval = newCycle === 'yearly' ? '12 months' : '1 month'

          const createSubResponse = await fetch(`https://api.mollie.com/v2/customers/${company.mollie_customer_id}/subscriptions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MOLLIE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: { currency: 'EUR', value: newAmount },
              interval: interval,
              description: `PaintConnect ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} - ${newCycle === 'yearly' ? 'Jaarlijks' : 'Maandelijks'}`,
              webhookUrl: `${SUPABASE_URL}/functions/v1/mollieWebhook`,
              metadata: { company_id: companyId, plan_type: currentPlan, billing_cycle: newCycle },
            }),
          })

          if (!createSubResponse.ok) {
            throw new Error('Kon nieuwe Mollie subscription niet aanmaken')
          }

          const newSub = await createSubResponse.json()

          await supabaseAdmin
            .from('companies')
            .update({
              billing_cycle: newCycle,
              mollie_subscription_id: newSub.id,
            })
            .eq('id', companyId)

          console.log('[manageSubscription] Switched Mollie billing cycle to:', newCycle)

          return new Response(
            JSON.stringify({ success: true, message: `Facturatiecyclus gewijzigd naar ${newCycle === 'yearly' ? 'jaarlijks' : 'maandelijks'}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
      }

      case 'upgrade':
      case 'downgrade': {
        if (!newPlan) {
          return new Response(
            JSON.stringify({ success: false, error: 'newPlan is verplicht voor upgrade/downgrade' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        const currentCycle = company.billing_cycle || 'monthly'

        if (isStripe) {
          const stripe = new Stripe(STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })
          
          const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id)
          const currentItem = subscription.items.data[0]
          const newPriceId = STRIPE_PRICES[newPlan]?.[currentCycle]

          if (!newPriceId) {
            return new Response(
              JSON.stringify({ success: false, error: 'Geen prijsplan gevonden' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
          }

          // For upgrades, prorate immediately
          // For downgrades, apply at end of current period
          const prorationBehavior = action === 'upgrade' ? 'create_prorations' : 'none'

          await stripe.subscriptions.update(company.stripe_subscription_id, {
            items: [{ id: currentItem.id, price: newPriceId }],
            proration_behavior: prorationBehavior,
            metadata: { ...subscription.metadata, plan_type: newPlan },
          })

          await supabaseAdmin
            .from('companies')
            .update({ subscription_tier: newPlan })
            .eq('id', companyId)

          console.log(`[manageSubscription] ${action} to ${newPlan} via Stripe`)

          return new Response(
            JSON.stringify({ success: true, message: `Abonnement gewijzigd naar ${newPlan}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // For Mollie, redirect to new checkout (simpler than modifying subscription)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Voor wijziging van Mollie abonnement, neem contact op met support@paintconnect.be',
            requiresContact: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      case 'cancel': {
        if (isStripe) {
          const stripe = new Stripe(STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })
          
          // Cancel at period end (customer keeps access until then)
          await stripe.subscriptions.update(company.stripe_subscription_id, {
            cancel_at_period_end: true,
          })

          await supabaseAdmin
            .from('companies')
            .update({ subscription_status: 'canceling' })
            .eq('id', companyId)

          console.log('[manageSubscription] Scheduled Stripe cancellation')

          return new Response(
            JSON.stringify({ success: true, message: 'Abonnement wordt geannuleerd aan het einde van de huidige periode' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (isMollie) {
          await fetch(`https://api.mollie.com/v2/customers/${company.mollie_customer_id}/subscriptions/${company.mollie_subscription_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${MOLLIE_API_KEY}` },
          })

          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: 'canceled',
              mollie_subscription_id: null,
            })
            .eq('id', companyId)

          console.log('[manageSubscription] Canceled Mollie subscription')

          return new Response(
            JSON.stringify({ success: true, message: 'Abonnement geannuleerd' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Onbekende actie: ${action}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Geen actie uitgevoerd' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('[manageSubscription] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Onbekende fout' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

