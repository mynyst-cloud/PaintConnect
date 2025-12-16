import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Crown,
  Euro,
  Check,
  Zap
} from 'lucide-react';
import { createCheckoutSession } from '@/api/functions';
import { manageSubscription } from '@/api/functions';

const plans = {
  starter: {
    name: 'Starter',
    price: 29,
    currency: 'EUR',
    interval: 'maand',
    features: [
      'Tot 5 teamleden',
      'Basis projectbeheer',
      '5GB opslag',
      'Email support',
      'Mobiele app'
    ],
    popular: false
  },
  professional: {
    name: 'Professional', 
    price: 79,
    currency: 'EUR',
    interval: 'maand',
    features: [
      'Tot 25 teamleden',
      'Geavanceerd projectbeheer',
      '50GB opslag',
      'Priority support',
      'API toegang',
      'Geavanceerde rapportages',
      'Klantportaal'
    ],
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    currency: 'EUR',
    interval: 'maand',
    features: [
      'Onbeperkt teamleden',
      'Alle functies',
      '500GB opslag',
      '24/7 dedicated support',
      'Custom integraties',
      'White-label opties',
      'SLA garanties'
    ],
    popular: false
  }
};

export default function SubscriptionManager({ currentUser, company, onMessage }) {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState('');
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    if (!currentUser?.company_id) return;
    
    setLoading(true);
    try {
      const response = await manageSubscription({
        action: 'get_current_subscription'
      });

      if (response.data?.subscription) {
        setCurrentSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
      onMessage?.({ type: 'error', text: 'Kon abonnementsgegevens niet laden.' });
    }
    setLoading(false);
  };

  const handlePlanUpgrade = async (planType) => {
    setUpgrading(planType);
    try {
      const response = await createCheckoutSession({
        plan_type: planType,
        success_url: `${window.location.origin}/AccountSettings?upgraded=true&plan=${planType}`,
        cancel_url: `${window.location.origin}/AccountSettings`
      });

      if (response.data?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('Geen checkout URL ontvangen van Stripe');
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      onMessage?.({ type: 'error', text: `Plan upgrade mislukt: ${error.message}` });
      setUpgrading('');
    }
  };

  const openBillingPortal = async () => {
    setBillingPortalLoading(true);
    try {
      // For now, we'll redirect to a placeholder. In production, you'd create a customer portal session
      onMessage?.({ type: 'info', text: 'Billing portal functionaliteit wordt binnenkort toegevoegd.' });
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      onMessage?.({ type: 'error', text: 'Kon billing portal niet openen.' });
    }
    setBillingPortalLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Abonnementsgegevens laden...</span>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = company?.subscription_plan || 'starter';

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Huidig Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-emerald-600">
                  {plans[currentPlan]?.name || 'Onbekend Plan'}
                </h3>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {currentSubscription?.status === 'active' ? 'Actief' : 'Trial'}
                </Badge>
              </div>
              <p className="text-3xl font-bold">
                €{plans[currentPlan]?.price || 0}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  /{plans[currentPlan]?.interval || 'maand'}
                </span>
              </p>
              {currentSubscription?.current_period_end && (
                <p className="text-sm text-gray-500 mt-1">
                  Verlengd op: {new Date(currentSubscription.current_period_end).toLocaleDateString('nl-NL')}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={openBillingPortal}
                disabled={billingPortalLoading}
                className="flex items-center gap-2"
              >
                {billingPortalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Beheer Facturering
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Beschikbare Abonnementen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([planKey, plan]) => {
            const isCurrentPlan = planKey === currentPlan;
            const canUpgrade = planKey !== currentPlan;
            
            return (
              <Card 
                key={planKey} 
                className={`relative ${plan.popular ? 'border-2 border-emerald-500 shadow-lg' : ''} ${isCurrentPlan ? 'bg-emerald-50/50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-3 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Populair
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">€{plan.price}</span>
                    <span className="text-gray-500 ml-1">/{plan.interval}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full ${isCurrentPlan ? 'bg-gray-400 cursor-not-allowed' : plan.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    disabled={isCurrentPlan || upgrading === planKey}
                    onClick={() => canUpgrade && handlePlanUpgrade(planKey)}
                  >
                    {upgrading === planKey ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Upgraden...
                      </>
                    ) : isCurrentPlan ? (
                      'Huidig Plan'
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Kies {plan.name}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Success Message Handler */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('upgraded') && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <strong>Gefeliciteerd!</strong> Uw abonnement is succesvol geüpgraded. De wijzigingen zijn direct actief.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}