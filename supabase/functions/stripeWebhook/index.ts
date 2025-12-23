import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!STRIPE_SECRET_KEY) {
      console.error('[stripeWebhook] Missing STRIPE_SECRET_KEY')
      return new Response('Configuration error', { status: 500 })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    let event: Stripe.Event

    // Verify webhook signature if secret is configured
    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        console.error('[stripeWebhook] Webhook signature verification failed:', err)
        return new Response('Webhook signature verification failed', { status: 400 })
      }
    } else {
      // Parse without verification (for development)
      event = JSON.parse(body)
      console.warn('[stripeWebhook] Processing without signature verification')
    }

    console.log('[stripeWebhook] Received event:', event.type)

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[stripeWebhook] Checkout session completed:', session.id)

        const metadata = session.metadata
        if (!metadata?.company_id) {
          console.error('[stripeWebhook] No company_id in session metadata')
          break
        }

        const companyId = metadata.company_id
        const planType = metadata.plan_type || 'starter'
        const billingCycle = metadata.billing_cycle || 'monthly'
        const subscriptionTier = PLAN_TO_TIER[planType] || 'starter'

        // Get subscription details
        let stripeSubscriptionId = null
        let nextBillingDate = new Date()
        
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          stripeSubscriptionId = subscription.id
          nextBillingDate = new Date(subscription.current_period_end * 1000)
        }

        console.log('[stripeWebhook] Activating subscription:', {
          companyId,
          planType,
          subscriptionTier,
          stripeSubscriptionId,
        })

        // Update company subscription
        const { error: updateError } = await supabaseAdmin
          .from('companies')
          .update({
            subscription_tier: subscriptionTier,
            subscription_status: 'active',
            billing_cycle: billingCycle,
            stripe_subscription_id: stripeSubscriptionId,
            last_payment_date: new Date().toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            pending_subscription: null,
            trial_ends_at: null,
          })
          .eq('id', companyId)

        if (updateError) {
          console.error('[stripeWebhook] Failed to update company:', updateError)
        } else {
          console.log('[stripeWebhook] Successfully activated subscription')
          
          // Send notification
          await notifyAdmins(supabaseAdmin, companyId, subscriptionTier)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[stripeWebhook] Subscription updated:', subscription.id)

        const metadata = subscription.metadata
        if (!metadata?.company_id) {
          // Try to find company by stripe_subscription_id
          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (!company) {
            console.error('[stripeWebhook] No company found for subscription:', subscription.id)
            break
          }

          // Update subscription status
          const status = subscription.status === 'active' ? 'active' : 
                         subscription.status === 'past_due' ? 'past_due' :
                         subscription.status === 'canceled' ? 'canceled' : 'active'

          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: status,
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', company.id)

          console.log('[stripeWebhook] Updated subscription status to:', status)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[stripeWebhook] Subscription deleted:', subscription.id)

        // Find company and downgrade
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (company) {
          await supabaseAdmin
            .from('companies')
            .update({
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('id', company.id)

          console.log('[stripeWebhook] Subscription canceled for company:', company.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[stripeWebhook] Invoice paid:', invoice.id)

        if (invoice.subscription) {
          // Find company by subscription
          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (company) {
            await supabaseAdmin
              .from('companies')
              .update({
                subscription_status: 'active',
                last_payment_date: new Date().toISOString(),
              })
              .eq('id', company.id)

            console.log('[stripeWebhook] Updated last payment date for company:', company.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[stripeWebhook] Invoice payment failed:', invoice.id)

        if (invoice.subscription) {
          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('id')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (company) {
            await supabaseAdmin
              .from('companies')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', company.id)

            console.log('[stripeWebhook] Marked subscription as past_due for company:', company.id)

            // Notify admin about payment failure
            await notifyPaymentFailed(supabaseAdmin, company.id)
          }
        }
        break
      }

      default:
        console.log('[stripeWebhook] Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[stripeWebhook] Error:', error)
    return new Response('Internal error', { status: 500 })
  }
})

async function notifyAdmins(supabase: any, companyId: string, tier: string) {
  try {
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('company_role', 'admin')

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'subscription_activated',
          title: '🎉 Abonnement geactiveerd!',
          message: `Je ${tier.charAt(0).toUpperCase() + tier.slice(1)} abonnement is nu actief.`,
          link_to: '/Subscription',
          read: false,
        })
      }
    }
  } catch (error) {
    console.error('[stripeWebhook] Failed to notify admins:', error)
  }
}

async function notifyPaymentFailed(supabase: any, companyId: string) {
  try {
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('company_role', 'admin')

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'payment_failed',
          title: '⚠️ Betaling mislukt',
          message: 'Je laatste betaling is mislukt. Update je betaalmethode om toegang te behouden.',
          link_to: '/Subscription',
          read: false,
        })
      }
    }
  } catch (error) {
    console.error('[stripeWebhook] Failed to notify payment failure:', error)
  }
}

