import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, Crown, CreditCard, Building, Shield, ExternalLink, Settings, ArrowRight, Check, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { createCheckoutSession } from '@/api/functions';
import { createMollieCheckout } from '@/api/functions';
import { createCustomerPortalSession } from '@/api/functions';
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { User, Company } from '@/api/entities';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
    {
        name: "Starter",
        id: "starter",
        stripePrice: "price_1Rt7eHGxJl201SwK5BAFWWgT",
        stripePriceYearly: "price_1Rt7eHGxJl201SwK5BAFWWgT_YEARLY", // TODO: Create yearly price in Stripe
        monthlyPrice: 29,
        icon: <Zap className="w-8 h-8 text-emerald-500"/>,
        badge: "Voor kleine zelfstandigen",
        badgeColor: "bg-gray-100 text-gray-700 border-gray-300",
        description: "Perfect voor freelancers en kleine teams die net beginnen.",
        features: [
            { text: "Tot 3 gebruikers", tooltip: "Voeg tot 3 teamleden toe aan het platform" },
            { text: "Basis projectmanagement", tooltip: "Creëer en beheer projecten met essentiële tools" },
            { text: "Materiaal aanvragen", tooltip: "Vraag benodigde materialen aan via het systeem" },
            { text: "Standaard support", tooltip: "Email support binnen 48 uur" },
        ],
        highlight: false,
    },
    {
        name: "Professional",
        id: "professional",
        stripePrice: "price_1Rt7fHGxJl201SwKjxlzrdJs",
        stripePriceYearly: "price_1Rt7fHGxJl201SwKjxlzrdJs_YEARLY", // TODO: Create yearly price in Stripe
        monthlyPrice: 79,
        icon: <CheckCircle2 className="w-8 h-8 text-blue-500"/>,
        badge: "Meest gekozen - Beste prijs/kwaliteit",
        badgeColor: "bg-gradient-to-r from-blue-500 to-emerald-500 text-white",
        description: "Voor groeiende bedrijven die meer functies en support nodig hebben.",
        features: [
            { text: "Tot 10 gebruikers", tooltip: "Beheer tot 10 teamleden" },
            { text: "Uitgebreid projectmanagement", tooltip: "Geavanceerde planning, foto's, kleuradvies en meer" },
            { text: "Klantportaal toegang", tooltip: "Geef klanten real-time toegang tot hun projecten" },
            { text: "Referral & Lead systeem", tooltip: "Verdien punten en beheer leads effectief" },
            { text: "Prioriteit support", tooltip: "Email support binnen 24 uur + chat" },
        ],
        highlight: true,
    },
    {
        name: "Enterprise",
        id: "enterprise",
        stripePrice: "price_1Rt7ftGxJl201SwKqvLuLWSf",
        stripePriceYearly: "price_1Rt7ftGxJl201SwKqvLuLWSf_YEARLY", // TODO: Create yearly price in Stripe
        monthlyPrice: 199,
        icon: <Crown className="w-8 h-8 text-amber-500"/>,
        badge: "Voor grote teams",
        badgeColor: "bg-amber-100 text-amber-700 border-amber-300",
        description: "De complete oplossing voor grote organisaties en intensief gebruik.",
        features: [
            { text: "Onbeperkt aantal gebruikers", tooltip: "Geen limiet op teamleden" },
            { text: "Alle Pro functies", tooltip: "Alles van Professional plus extra's" },
            { text: "Geavanceerde analytics", tooltip: "Diepgaande inzichten in uw bedrijfsvoering" },
            { text: "API toegang", tooltip: "Integreer PaintConnect met uw eigen systemen" },
            { text: "Persoonlijke accountmanager", tooltip: "Dedicated support contactpersoon" },
        ],
        highlight: false,
    }
];

const PaymentMethodSelector = ({ selectedMethod, onSelect, isLoading }) => (
    <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Kies uw betalingsmethode
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={() => onSelect('mollie')}
                disabled={isLoading}
                aria-label="Betalen met Mollie"
                className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                    selectedMethod === 'mollie'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                }`}
            >
                <div className="flex items-center space-x-3">
                    <Building className={`w-6 h-6 ${selectedMethod === 'mollie' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">Mollie</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">iDEAL, Bancontact, creditcard</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">🇳🇱 Aanbevolen voor Nederland</div>
                    </div>
                    {selectedMethod === 'mollie' && <Check className="w-5 h-5 text-emerald-600 ml-auto" />}
                </div>
            </button>

            <button
                onClick={() => onSelect('stripe')}
                disabled={isLoading}
                aria-label="Betalen met Stripe"
                className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                    selectedMethod === 'stripe'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                }`}
            >
                <div className="flex items-center space-x-3">
                    <CreditCard className={`w-6 h-6 ${selectedMethod === 'stripe' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">Stripe</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Creditcard, SEPA</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">🌍 Internationaal</div>
                    </div>
                    {selectedMethod === 'stripe' && <Check className="w-5 h-5 text-blue-600 ml-auto" />}
                </div>
            </button>
        </div>
    </div>
);

const PlanCard = ({ plan, isCurrentPlan, onChoosePlan, isLoading, billingCycle, paymentMethod }) => {
    const yearlyPrice = plan.monthlyPrice * 10; // 2 maanden gratis = 10 maanden betalen
    const yearlySavings = plan.monthlyPrice * 2;
    const displayPrice = billingCycle === 'yearly' ? yearlyPrice : plan.monthlyPrice;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative ${plan.highlight ? 'md:-mt-4 md:mb-4' : ''}`}
        >
            {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-1 text-sm font-semibold shadow-lg">
                        <Sparkles className="w-4 h-4 mr-1 inline" />
                        Meest Populair
                    </Badge>
                </div>
            )}
            <Card className={`h-full flex flex-col transition-all duration-300 ${
                plan.highlight 
                    ? 'border-2 border-blue-500 shadow-xl bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20' 
                    : isCurrentPlan 
                        ? 'border-2 border-emerald-500 shadow-lg bg-emerald-50 dark:bg-emerald-900/10'
                        : 'border border-gray-200 dark:border-gray-700 hover:shadow-lg bg-white dark:bg-gray-800'
            }`}>
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">{plan.icon}</div>
                    <Badge className={`mx-auto mb-3 ${plan.badgeColor} border`}>
                        {plan.badge}
                    </Badge>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{plan.name}</CardTitle>
                    
                    <div className="my-4">
                        <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                            €{displayPrice}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {billingCycle === 'yearly' ? 'per jaar' : 'per maand'}
                        </div>
                        {billingCycle === 'yearly' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-2"
                            >
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Bespaar €{yearlySavings} per jaar!
                                </Badge>
                            </motion.div>
                        )}
                    </div>
                    
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow">
                    <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start group">
                                <Check className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div className="flex items-center gap-1 flex-1">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature.text}</span>
                                    {feature.tooltip && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button 
                                                        type="button"
                                                        className="inline-flex"
                                                        disabled={isCurrentPlan}
                                                    >
                                                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-help" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs">{feature.tooltip}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                
                <CardFooter className="pt-4">
                    <Button 
                        className={`w-full ${
                            isCurrentPlan 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : plan.highlight 
                                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg'
                                    : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white'
                        }`}
                        onClick={() => onChoosePlan(plan.id, paymentMethod)}
                        disabled={isLoading || isCurrentPlan}
                    >
                        {isLoading ? (
                            <InlineSpinner />
                        ) : isCurrentPlan ? (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                Huidig Plan
                            </>
                        ) : (
                            <>
                                {plan.highlight && <Sparkles className="w-4 h-4 mr-2" />}
                                Kies {plan.name}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default function Subscription() {
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('mollie');
    const [currentUser, setCurrentUser] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            if (!user.company_id) {
                throw new Error("U bent niet aan een bedrijf gekoppeld.");
            }
            const companyData = await Company.get(user.company_id);
            setCompany(companyData);

            const urlParams = new URLSearchParams(location.search);
            if (urlParams.get('mollie_checkout') === 'success' || urlParams.get('session_id') || urlParams.get('payment') === 'success') {
                toast({
                    title: "Betaling succesvol",
                    description: "Uw abonnement is succesvol bijgewerkt.",
                });
                navigate(location.pathname, { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [location.search, location.pathname, navigate, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleManageSubscription = async () => {
        if (!company) return;

        const provider = company?.mollie_customer_id ? 'mollie' : company?.stripe_customer_id ? 'stripe' : null;
        
        if (!provider) {
            toast({
                variant: "destructive",
                title: "Fout",
                description: "Geen betalingsprovider gevonden. Neem contact op met support@paintconnect.be",
            });
            return;
        }

        if (provider === 'stripe') {
            setIsRedirecting(true);
            try {
                const { data } = await createCustomerPortalSession();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error("Kon de portaal URL niet ophalen.");
                }
            } catch (err) {
                toast({
                    variant: "destructive",
                    title: "Fout",
                    description: "Kon de beheerpagina niet openen: " + err.message,
                });
            } finally {
                setIsRedirecting(false);
            }
        } else {
            // Mollie fallback
            toast({
                title: "Contact support",
                description: "Voor wijzigingen aan uw Mollie-abonnement, neem contact op met support@paintconnect.be",
            });
        }
    };

    const handleChoosePlan = async (planId, provider) => {
        if (!currentUser?.company_id) {
            toast({
                variant: "destructive",
                title: "Fout",
                description: "U moet een bedrijfsprofiel hebben om een abonnement af te sluiten of te wijzigen.",
            });
            return;
        }

        const selectedPlan = plans.find(p => p.id === planId);
        if (!selectedPlan) {
            toast({ variant: "destructive", title: "Fout", description: "Geselecteerd plan niet gevonden." });
            return;
        }

        setIsRedirecting(true);
        
        try {
            if (provider === 'mollie') {
                const { data } = await createMollieCheckout({
                    planType: selectedPlan.id,
                    companyId: currentUser.company_id,
                    billingCycle: billingCycle 
                });
                if (data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                } else {
                    throw new Error('Geen checkout URL ontvangen van Mollie');
                }
            } else if (provider === 'stripe') {
                // Gebruik de juiste priceId op basis van billing cycle
                const priceId = billingCycle === 'yearly' 
                    ? selectedPlan.stripePriceYearly 
                    : selectedPlan.stripePrice;

                const { data } = await createCheckoutSession({ 
                    priceId: priceId,
                    planName: selectedPlan.name,
                    billingCycle: billingCycle 
                });
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error('Geen checkout URL ontvangen van Stripe');
                }
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Fout bij aanmaken checkout",
                description: error.message || "Er is een probleem opgetreden. Probeer het opnieuw.",
            });
        } finally {
            setIsRedirecting(false);
        }
    };

    if (isLoading) return <LoadingSpinner overlay text="Abonnementsgegevens laden..." />;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    // Check of trial is afgelopen
    const isTrialExpired = company?.trial_ends_at && new Date(company.trial_ends_at) < new Date();
    
    // Alleen een actief abonnement als status 'active' is, of 'trialing' EN trial is niet afgelopen
    const hasActiveSubscription = company && (
        company.subscription_status === 'active' || 
        (company.subscription_status === 'trialing' && !isTrialExpired)
    );
    
    // Normaliseer subscription_tier voor correcte vergelijking
    const normalizeTier = (tier) => {
        if (!tier) return null;
        const normalized = tier.toLowerCase();
        if (normalized === 'pro') return 'professional';
        return normalized;
    };
    
    const currentPlanId = normalizeTier(company?.subscription_tier);

    return (
        <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-950 dark:to-black min-h-screen p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-50 mb-4"
                    >
                        Kies het plan dat bij je bedrijf past
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6"
                    >
                        Betaal maandelijks of jaarlijks met <strong className="text-emerald-600 dark:text-emerald-400">2 maanden gratis</strong>. 
                        Geen risico: 30 dagen geld terug garantie.
                    </motion.p>
                    
                    {/* Current Plan Highlight */}
                    {hasActiveSubscription && currentPlanId && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block mb-8"
                        >
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 text-base">
                                Je huidige plan: <strong className="ml-1">{currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1)}</strong>
                            </Badge>
                        </motion.div>
                    )}
                    
                    {/* Billing Cycle Toggle */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center items-center gap-4 mb-8"
                    >
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                billingCycle === 'monthly'
                                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Maandelijks
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
                                billingCycle === 'yearly'
                                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Jaarlijks
                            <span className="ml-2 text-xs bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-bold">
                                2 maanden gratis 🎉
                            </span>
                        </button>
                    </motion.div>
                </div>

                {/* Payment Method Selector - only show if no active subscription */}
                {!hasActiveSubscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <PaymentMethodSelector 
                            selectedMethod={paymentMethod}
                            onSelect={setPaymentMethod}
                            isLoading={isRedirecting}
                        />
                    </motion.div>
                )}

                {/* Pricing Grid */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
                >
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                        >
                            <PlanCard
                                plan={plan}
                                isCurrentPlan={hasActiveSubscription && currentPlanId === plan.id}
                                onChoosePlan={handleChoosePlan}
                                isLoading={isRedirecting}
                                billingCycle={billingCycle}
                                paymentMethod={paymentMethod}
                            />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Manage Subscription Card - only for active subscriptions */}
                {hasActiveSubscription && company && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="max-w-3xl mx-auto mb-12"
                    >
                        <Card className="shadow-xl border-emerald-200 dark:border-emerald-800">
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Settings className="w-6 h-6 text-emerald-600" />
                                    Beheer Abonnement & Facturen
                                </CardTitle>
                                <CardDescription>Pas uw abonnement aan, bekijk facturen en beheer betalingsmethoden.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Huidig plan:</span>
                                        <strong>{company.subscription_tier?.toUpperCase() || 'STARTER'}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                        <Badge className={company.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                            {company.subscription_status?.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Betalingsmethode:</span>
                                        <div className="flex items-center gap-2">
                                            {company?.mollie_customer_id ? (
                                                <>
                                                    <Building className="w-4 h-4 text-emerald-600" />
                                                    <span>Mollie</span>
                                                </>
                                            ) : company?.stripe_customer_id ? (
                                                <>
                                                    <CreditCard className="w-4 h-4 text-blue-600" />
                                                    <span>Stripe</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-500">Niet ingesteld</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    onClick={handleManageSubscription} 
                                    disabled={isRedirecting}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isRedirecting ? (
                                        <InlineSpinner />
                                    ) : (
                                        <>
                                            <ExternalLink className="w-5 h-5 mr-2" />
                                            Beheer via {company?.mollie_customer_id ? 'Mollie' : 'Stripe'}
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {/* Trust & Guarantee Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto"
                >
                    {[
                        { icon: <Shield className="w-8 h-8 text-green-600" />, text: "30 dagen geld terug garantie" },
                        { icon: <CreditCard className="w-8 h-8 text-blue-600" />, text: "Veilig betalen via Mollie & Stripe" },
                        { icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />, text: "SSL-encrypted" },
                        { icon: <Sparkles className="w-8 h-8 text-purple-600" />, text: "Hulp bij overstappen gratis" },
                    ].map((item, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="mb-2">{item.icon}</div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.text}</p>
                        </div>
                    ))}
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="max-w-4xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-50">Veelgestelde Vragen</h2>
                    <Accordion type="single" collapsible className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="px-6 hover:no-underline">
                                Kan ik later upgraden of downgraden?
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                                Ja, u kunt op elk moment van plan wisselen. Bij een upgrade gaat de wijziging direct in. Bij een downgrade blijft uw huidige plan actief tot het einde van de facturatieperiode.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="px-6 hover:no-underline">
                                Hoe werkt de geld-terug-garantie?
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                                Als u binnen 30 dagen niet tevreden bent, krijgt u zonder vragen uw geld volledig terug. Neem gewoon contact met ons op via support@paintconnect.be.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="px-6 hover:no-underline">
                                Welke betalingsmethoden accepteren jullie?
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                                We werken samen met Mollie (iDEAL, Bancontact, creditcard) en Stripe (creditcard, SEPA). Beide zijn veilig en versleuteld.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger className="px-6 hover:no-underline">
                                Wat gebeurt er als mijn proefperiode afloopt?
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                                Na afloop van uw gratis proefperiode wordt u gevraagd een plan te kiezen. Uw gegevens blijven veilig bewaard en u krijgt direct weer toegang zodra u een abonnement activeert.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger className="px-6 hover:no-underline">
                                Kan ik mijn abonnement opzeggen?
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                                Ja, u kunt uw abonnement op elk moment opzeggen via de "Beheer Abonnement" knop. Er zijn geen verborgen kosten of opzegvergoedingen.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </motion.div>
            </div>
        </div>
    );
}