import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, Zap, Crown, CreditCard, Building, Shield, ExternalLink, 
  Settings, ArrowRight, Check, HelpCircle, Sparkles, X, Clock, 
  Users, BarChart3, Package, MessageSquare, Palette, Star, Quote,
  ChevronRight, AlertTriangle, Rocket
} from 'lucide-react';
import { createCheckoutSession } from '@/api/functions';
import { createMollieCheckout } from '@/api/functions';
import { createCustomerPortalSession } from '@/api/functions';
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { User, Company } from '@/api/entities';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
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

// ============================================
// PLAN CONFIGURATION
// ============================================
const plans = [
  {
    name: "Starter",
    id: "starter",
    stripePrice: "price_1Rt7eHGxJl201SwK5BAFWWgT",
    stripePriceYearly: "price_1Rt7eHGxJl201SwK5BAFWWgT_YEARLY",
    molliePrice: "starter_monthly",
    molliePriceYearly: "starter_yearly",
    monthlyPrice: 29,
    icon: Zap,
    iconColor: "text-gray-500",
    badge: "Zelfstandigen",
    badgeColor: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    description: "Ideaal voor freelance schilders die net beginnen",
    features: [
      { text: "Tot 2 gebruikers", included: true },
      { text: "Max 10 projecten/maand", included: true },
      { text: "Basis projectbeheer", included: true },
      { text: "Materiaal aanvragen", included: true },
      { text: "Team check-in/out", included: true },
      { text: "Email support", included: true },
      { text: "Analytics dashboard", included: false },
      { text: "Klantportaal", included: false },
      { text: "Voorraadbeheer", included: false },
      { text: "Factuur-import", included: false },
    ],
    highlight: false,
    popular: false,
  },
  {
    name: "Professional",
    id: "professional",
    stripePrice: "price_1Rt7fHGxJl201SwKjxlzrdJs",
    stripePriceYearly: "price_1Rt7fHGxJl201SwKjxlzrdJs_YEARLY",
    molliePrice: "professional_monthly",
    molliePriceYearly: "professional_yearly",
    monthlyPrice: 79,
    icon: CheckCircle2,
    iconColor: "text-blue-500",
    badge: "Meest gekozen",
    badgeColor: "bg-gradient-to-r from-blue-600 to-emerald-600 text-white",
    description: "De complete oplossing voor groeiende schildersbedrijven",
    features: [
      { text: "Tot 5 gebruikers", included: true },
      { text: "30 projecten/maand", included: true },
      { text: "Uitgebreid projectbeheer", included: true },
      { text: "Materiaal aanvragen", included: true },
      { text: "Team check-in/out", included: true },
      { text: "Prioriteit support", included: true },
      { text: "Analytics dashboard", included: true, highlight: true },
      { text: "Klantportaal", included: true, highlight: true },
      { text: "Voorraadbeheer", included: true, highlight: true },
      { text: "Factuur-import", included: true, highlight: true },
    ],
    highlight: true,
    popular: true,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    stripePrice: "price_1Rt7ftGxJl201SwKqvLuLWSf",
    stripePriceYearly: "price_1Rt7ftGxJl201SwKqvLuLWSf_YEARLY",
    molliePrice: "enterprise_monthly",
    molliePriceYearly: "enterprise_yearly",
    monthlyPrice: 199,
    icon: Crown,
    iconColor: "text-amber-500",
    badge: "Grote teams",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    description: "Voor organisaties die alles uit PaintConnect willen halen",
    features: [
      { text: "Onbeperkt gebruikers", included: true },
      { text: "Onbeperkt projecten", included: true },
      { text: "Alle Professional functies", included: true },
      { text: "API toegang", included: true, highlight: true },
      { text: "Persoonlijke accountmanager", included: true, highlight: true },
      { text: "Telefonische support", included: true },
      { text: "Custom integraties", included: true },
      { text: "White-label opties", included: true },
      { text: "SLA garantie", included: true },
      { text: "On-site training", included: true },
    ],
    highlight: false,
    popular: false,
  }
];

// ============================================
// TESTIMONIALS
// ============================================
const testimonials = [
  {
    name: "Peter van der Berg",
    company: "Van der Berg Schilderwerken",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    text: "Sinds we Professional gebruiken besparen we 10+ uur per week aan administratie. Het klantportaal alleen al is de prijs waard!",
    plan: "Professional",
    rating: 5,
  },
  {
    name: "Sandra Jansen",
    company: "Jansen & Zonen",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    text: "Het voorraadbeheer heeft ons geholpen om 20% te besparen op materiaalkosten. Geweldige investering!",
    plan: "Professional",
    rating: 5,
  },
  {
    name: "Mark de Vries",
    company: "De Vries Afwerking BV",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    text: "Met 15 schilders in dienst was organisatie een chaos. PaintConnect Enterprise heeft alles veranderd.",
    plan: "Enterprise",
    rating: 5,
  },
];

// ============================================
// FEATURE COMPARISON MATRIX
// ============================================
const featureMatrix = [
  { 
    category: "Team & Projecten",
    features: [
      { name: "Aantal gebruikers", starter: "2", professional: "5", enterprise: "Onbeperkt" },
      { name: "Projecten per maand", starter: "10", professional: "30", enterprise: "Onbeperkt" },
      { name: "Materialen in systeem", starter: "50", professional: "150", enterprise: "Onbeperkt" },
    ]
  },
  {
    category: "Kernfuncties",
    features: [
      { name: "Projectbeheer", starter: true, professional: true, enterprise: true },
      { name: "Team planning", starter: true, professional: true, enterprise: true },
      { name: "Check-in/Check-out", starter: true, professional: true, enterprise: true },
      { name: "Materiaal aanvragen", starter: true, professional: true, enterprise: true },
      { name: "Beschadigingen melden", starter: true, professional: true, enterprise: true },
    ]
  },
  {
    category: "Pro Functies",
    features: [
      { name: "Analytics dashboard", starter: false, professional: true, enterprise: true },
      { name: "Klantportaal", starter: false, professional: true, enterprise: true },
      { name: "Voorraadbeheer", starter: false, professional: true, enterprise: true },
      { name: "Factuur-import (OCR)", starter: false, professional: true, enterprise: true },
      { name: "Verbruiksanalyse", starter: false, professional: true, enterprise: true },
    ]
  },
  {
    category: "Enterprise Functies",
    features: [
      { name: "API toegang", starter: false, professional: false, enterprise: true },
      { name: "Custom integraties", starter: false, professional: false, enterprise: true },
      { name: "White-label opties", starter: false, professional: false, enterprise: true },
      { name: "SLA garantie", starter: false, professional: false, enterprise: true },
    ]
  },
  {
    category: "Support",
    features: [
      { name: "Email support", starter: "48u", professional: "24u", enterprise: "4u" },
      { name: "Chat support", starter: false, professional: true, enterprise: true },
      { name: "Telefonische support", starter: false, professional: false, enterprise: true },
      { name: "Persoonlijke accountmanager", starter: false, professional: false, enterprise: true },
    ]
  },
];

// ============================================
// TRIAL COUNTDOWN BANNER
// ============================================
const TrialCountdownBanner = ({ company }) => {
  if (!company?.trial_ends_at || company.subscription_status !== 'trialing') return null;
  
  const trialEnd = new Date(company.trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
  const isUrgent = daysRemaining <= 3;
  const isExpired = daysRemaining === 0;
  
  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl shadow-xl text-white"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Je proefperiode is verlopen</h3>
              <p className="text-white/90">Kies een plan om toegang te behouden tot al je gegevens</p>
            </div>
          </div>
          <Button 
            size="lg"
            className="bg-white text-red-600 hover:bg-white/90 font-bold shadow-lg"
            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Kies nu een plan
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 p-6 rounded-2xl shadow-xl text-white ${
        isUrgent 
          ? 'bg-gradient-to-r from-orange-500 to-red-500' 
          : 'bg-gradient-to-r from-blue-600 to-emerald-600'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {isUrgent ? '⚡ Laatste kans!' : '🎉 Je proefperiode loopt'}
            </h3>
            <p className="text-white/90">
              Nog <span className="font-bold text-xl">{daysRemaining}</span> {daysRemaining === 1 ? 'dag' : 'dagen'} om alle functies te ontdekken
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs text-white/70">Upgrade nu en krijg</p>
            <p className="font-bold">2 maanden GRATIS</p>
          </div>
          <Button 
            size="lg"
            className={`font-bold shadow-lg ${
              isUrgent 
                ? 'bg-white text-orange-600 hover:bg-white/90' 
                : 'bg-white text-blue-600 hover:bg-white/90'
            }`}
            onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Bekijk plannen
            <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Proefperiode</span>
          <span>{14 - daysRemaining}/14 dagen gebruikt</span>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((14 - daysRemaining) / 14) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// PAYMENT METHOD SELECTOR
// ============================================
const PaymentMethodSelector = ({ selectedMethod, onSelect, isLoading }) => (
  <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
      <CreditCard className="w-5 h-5 text-gray-500" />
      Kies je betalingsmethode
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        onClick={() => onSelect('mollie')}
        disabled={isLoading}
        className={`p-5 border-2 rounded-xl text-left transition-all hover:shadow-md ${
          selectedMethod === 'mollie'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-2 ring-emerald-500/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedMethod === 'mollie' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Building className={`w-6 h-6 ${selectedMethod === 'mollie' ? 'text-emerald-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Mollie
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5">Aanbevolen</Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">iDEAL, Bancontact, Creditcard</div>
            </div>
          </div>
          {selectedMethod === 'mollie' && (
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/IDEAL_logo.svg" alt="iDEAL" className="h-5" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/52/Bancontact_logo.svg" alt="Bancontact" className="h-5" />
        </div>
      </button>

      <button
        onClick={() => onSelect('stripe')}
        disabled={isLoading}
        className={`p-5 border-2 rounded-xl text-left transition-all hover:shadow-md ${
          selectedMethod === 'stripe'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedMethod === 'stripe' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <CreditCard className={`w-6 h-6 ${selectedMethod === 'stripe' ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Stripe</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Creditcard, SEPA, Apple Pay</div>
            </div>
          </div>
          {selectedMethod === 'stripe' && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2 text-xs text-gray-500">
          🌍 Internationaal
        </div>
      </button>
    </div>
  </div>
);

// ============================================
// PLAN CARD
// ============================================
const PlanCard = ({ plan, isCurrentPlan, onChoosePlan, isLoading, billingCycle, paymentMethod }) => {
  const yearlyPrice = plan.monthlyPrice * 10; // 2 maanden gratis
  const monthlyEquivalentYearly = Math.round(yearlyPrice / 12); // €X/maand bij jaarlijks
  const yearlySavings = plan.monthlyPrice * 2;
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: plan.highlight ? -8 : -4 }}
      transition={{ duration: 0.3 }}
      className={`relative ${plan.highlight ? 'z-10' : ''}`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <Badge className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-1.5 text-sm font-bold shadow-lg flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Meest Populair
          </Badge>
        </div>
      )}
      
      <Card className={`h-full flex flex-col transition-all duration-300 overflow-hidden ${
        plan.highlight 
          ? 'border-2 border-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-b from-blue-50 via-white to-emerald-50 dark:from-blue-950/30 dark:via-gray-800 dark:to-emerald-950/30 scale-[1.02]' 
          : isCurrentPlan 
            ? 'border-2 border-emerald-500 shadow-lg bg-emerald-50 dark:bg-emerald-900/10'
            : 'border border-gray-200 dark:border-gray-700 hover:shadow-xl bg-white dark:bg-gray-800'
      }`}>
        <CardHeader className="text-center pb-2 pt-8">
          {/* Icon */}
          <div className={`mx-auto mb-4 p-4 rounded-2xl ${
            plan.highlight 
              ? 'bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-blue-900/50 dark:to-emerald-900/50' 
              : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            <Icon className={`w-8 h-8 ${plan.iconColor}`} />
          </div>
          
          {/* Name & Badge */}
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{plan.name}</CardTitle>
          <Badge className={`mx-auto mt-2 ${plan.badgeColor}`}>
            {plan.badge}
          </Badge>
          
          {/* Price - Always show monthly first, yearly savings below */}
          <div className="my-6">
            {billingCycle === 'monthly' ? (
              <>
                {/* Monthly pricing - clean and simple */}
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg text-gray-500">€</span>
                  <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {plan.monthlyPrice}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  per maand
                </div>
                {/* Show yearly option as savings */}
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-400">
                    💡 Jaarlijks: <span className="font-semibold">€{monthlyEquivalentYearly}/maand</span>
                    <span className="ml-1 text-green-600 dark:text-green-300">(bespaar €{yearlySavings})</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Yearly pricing - show monthly equivalent */}
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg text-gray-500">€</span>
                  <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {monthlyEquivalentYearly}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  per maand <span className="text-xs">(jaarlijks gefactureerd)</span>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-2"
                >
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                    €{yearlyPrice}/jaar • Bespaar €{yearlySavings}!
                  </Badge>
                </motion.div>
              </>
            )}
          </div>
          
          <CardDescription className="text-sm">{plan.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow px-6">
          <ul className="space-y-3">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                {feature.included ? (
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    feature.highlight 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <X className="w-3 h-3 text-gray-400" />
                  </div>
                )}
                <span className={`text-sm ${
                  feature.included 
                    ? feature.highlight 
                      ? 'text-blue-700 dark:text-blue-300 font-medium' 
                      : 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        
        <CardFooter className="p-6 pt-4">
          <Button 
            className={`w-full h-12 text-base font-semibold transition-all ${
              isCurrentPlan 
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400' 
                : plan.highlight 
                  ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900'
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
                {plan.highlight && <Rocket className="w-5 h-5 mr-2" />}
                {plan.highlight ? 'Start met Professional' : `Kies ${plan.name}`}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// ============================================
// TESTIMONIAL CARD
// ============================================
const TestimonialCard = ({ testimonial }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
  >
    <div className="flex gap-1 mb-4">
      {[...Array(testimonial.rating)].map((_, i) => (
        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
      ))}
    </div>
    <Quote className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
    <p className="text-gray-700 dark:text-gray-300 mb-4 italic">"{testimonial.text}"</p>
    <div className="flex items-center gap-3">
      <img 
        src={testimonial.image} 
        alt={testimonial.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-gray-900 dark:text-gray-100">{testimonial.name}</p>
        <p className="text-sm text-gray-500">{testimonial.company}</p>
      </div>
      <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {testimonial.plan}
      </Badge>
    </div>
  </motion.div>
);

// ============================================
// FEATURE COMPARISON TABLE
// ============================================
const FeatureComparisonTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">Functie</th>
          <th className="text-center py-4 px-4 font-semibold text-gray-500">Starter</th>
          <th className="text-center py-4 px-4 font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">Professional</th>
          <th className="text-center py-4 px-4 font-semibold text-gray-500">Enterprise</th>
        </tr>
      </thead>
      <tbody>
        {featureMatrix.map((category, catIdx) => (
          <React.Fragment key={catIdx}>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <td colSpan={4} className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                {category.category}
              </td>
            </tr>
            {category.features.map((feature, featIdx) => (
              <tr key={featIdx} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{feature.name}</td>
                <td className="py-3 px-4 text-center">
                  {typeof feature.starter === 'boolean' ? (
                    feature.starter ? (
                      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">{feature.starter}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center bg-blue-50/50 dark:bg-blue-900/10">
                  {typeof feature.professional === 'boolean' ? (
                    feature.professional ? (
                      <Check className="w-5 h-5 text-blue-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )
                  ) : (
                    <span className="font-medium text-blue-700 dark:text-blue-400">{feature.professional}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {typeof feature.enterprise === 'boolean' ? (
                    feature.enterprise ? (
                      <Check className="w-5 h-5 text-amber-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">{feature.enterprise}</span>
                  )}
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function Subscription() {
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mollie');
  const [currentUser, setCurrentUser] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // Default to monthly - less intimidating
  const [showComparison, setShowComparison] = useState(false);
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
      const mollieReturn = urlParams.get('mollie_checkout');
      const isPaymentReturn = mollieReturn === 'success' || 
                              mollieReturn === 'return' ||
                              urlParams.get('session_id') || 
                              urlParams.get('payment') === 'success';
      
      if (isPaymentReturn) {
        // Store pre-checkout state for comparison
        const preCheckoutTier = companyData.subscription_tier;
        const preCheckoutStatus = companyData.subscription_status;
        const pendingSub = companyData.pending_subscription;
        
        console.log('[Subscription] Payment return detected:', {
          preCheckoutTier,
          preCheckoutStatus,
          pendingSub,
        });
        
        // Check if this was a checkout attempt
        if (pendingSub && !pendingSub.status) {
          // There's a pending subscription without failure status - poll for result
          toast({
            title: "⏳ Betaling wordt verwerkt...",
            description: "Even geduld, we controleren je betaling.",
            duration: 5000,
          });
          
          const expectedTier = pendingSub.plan_type;
          const expectedCycle = pendingSub.billing_cycle;
          let pollCount = 0;
          const maxPolls = 15;
          
          const pollInterval = setInterval(async () => {
            pollCount++;
            try {
              const refreshedCompany = await Company.get(user.company_id);
              const newPending = refreshedCompany.pending_subscription;
              
              console.log('[Subscription] Poll #' + pollCount, {
                newPending,
                newTier: refreshedCompany.subscription_tier,
                newStatus: refreshedCompany.subscription_status,
              });
              
              // Check if pending_subscription was processed
              if (!newPending || newPending.status === 'failed') {
                clearInterval(pollInterval);
                setCompany(refreshedCompany);
                
                // Payment failed
                if (newPending?.status === 'failed') {
                  console.log('[Subscription] Payment failed:', newPending.failure_reason);
                  toast({
                    title: "❌ Betaling mislukt",
                    description: "Je betaling kon niet worden verwerkt. Probeer het opnieuw of gebruik een andere betaalmethode.",
                    variant: "destructive",
                    duration: 10000,
                  });
                  
                  // Clear the failed pending_subscription after showing message
                  try {
                    await Company.update(user.company_id, { pending_subscription: null });
                  } catch (e) {
                    console.error('Failed to clear pending_subscription:', e);
                  }
                  
                  navigate(location.pathname, { replace: true });
                  return;
                }
                
                // Pending cleared - check what changed
                const tierChanged = refreshedCompany.subscription_tier !== preCheckoutTier;
                const statusChanged = refreshedCompany.subscription_status !== preCheckoutStatus;
                const cycleChanged = refreshedCompany.billing_cycle !== companyData.billing_cycle;
                const isNowActive = refreshedCompany.subscription_status === 'active';
                
                console.log('[Subscription] Changes detected:', { tierChanged, statusChanged, cycleChanged, isNowActive });
                
                if (tierChanged && isNowActive) {
                  // Tier upgrade/downgrade success
                  toast({
                    title: "🎉 Abonnement gewijzigd!",
                    description: `Je bent nu ${refreshedCompany.subscription_tier.charAt(0).toUpperCase() + refreshedCompany.subscription_tier.slice(1)} gebruiker.`,
                  });
                } else if (statusChanged && isNowActive) {
                  // New subscription or trial -> active
                  toast({
                    title: "🎉 Betaling succesvol!",
                    description: "Welkom bij PaintConnect. Je abonnement is nu actief.",
                  });
                } else if (cycleChanged) {
                  // Billing cycle switch
                  toast({
                    title: "🎉 Facturatiecyclus gewijzigd!",
                    description: `Je betaalt nu ${refreshedCompany.billing_cycle === 'yearly' ? 'jaarlijks' : 'maandelijks'}.`,
                  });
                } else {
                  // Something else - but pending is cleared so likely success
                  toast({
                    title: "✅ Verwerkt",
                    description: "Je abonnement is bijgewerkt.",
                  });
                }
                
                navigate(location.pathname, { replace: true });
              } else if (pollCount >= maxPolls) {
                // Timeout - pending still exists without status
                clearInterval(pollInterval);
                setCompany(refreshedCompany);
                toast({
                  title: "⚠️ Betaling in behandeling",
                  description: "De verwerking duurt langer dan verwacht. Je ontvangt een email wanneer je betaling is verwerkt.",
                  duration: 15000,
                });
                navigate(location.pathname, { replace: true });
              }
            } catch (e) {
              console.error('Polling error:', e);
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                toast({
                  title: "⚠️ Status onbekend",
                  description: "Er is iets misgegaan. Ververs de pagina of neem contact op met support.",
                  variant: "destructive",
                });
                navigate(location.pathname, { replace: true });
              }
            }
          }, 2000);
        } else if (pendingSub?.status === 'failed') {
          // Payment already marked as failed
          toast({
            title: "❌ Betaling mislukt",
            description: pendingSub.failure_reason === 'canceled' 
              ? "Je hebt de betaling geannuleerd." 
              : "Je betaling kon niet worden verwerkt. Probeer het opnieuw.",
            variant: "destructive",
            duration: 10000,
          });
          
          // Clear the failed pending_subscription
          try {
            await Company.update(user.company_id, { pending_subscription: null });
          } catch (e) {
            console.error('Failed to clear pending_subscription:', e);
          }
          
          navigate(location.pathname, { replace: true });
        } else if (companyData.subscription_status === 'active' && !pendingSub) {
          // Already active, no pending - probably a page refresh after success
          navigate(location.pathname, { replace: true });
        } else {
          // Trialing without pending - unusual state
          navigate(location.pathname, { replace: true });
        }
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
        description: "U moet een bedrijfsprofiel hebben om een abonnement af te sluiten.",
      });
      return;
    }

    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) {
      toast({ variant: "destructive", title: "Fout", description: "Plan niet gevonden." });
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
        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('Geen checkout URL ontvangen van Mollie');
        }
      } else if (provider === 'stripe') {
        const priceId = billingCycle === 'yearly' 
          ? selectedPlan.stripePriceYearly 
          : selectedPlan.stripePrice;

        const { data } = await createCheckoutSession({ 
          priceId: priceId,
          planName: selectedPlan.name,
          billingCycle: billingCycle,
          companyId: currentUser.company_id,
          userId: currentUser.id
        });
        if (data?.url) {
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

  if (isLoading) return <LoadingSpinner overlay text="Laden..." />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    </div>
  );

  const isTrialExpired = company?.trial_ends_at && new Date(company.trial_ends_at) < new Date();
  const hasActiveSubscription = company && (
    company.subscription_status === 'active' || 
    (company.subscription_status === 'trialing' && !isTrialExpired)
  );
  
  const normalizeTier = (tier) => {
    if (!tier) return null;
    const normalized = tier.toLowerCase();
    if (normalized === 'pro') return 'professional';
    if (normalized === 'starter_trial') return 'starter';
    return normalized;
  };
  
  const currentPlanId = normalizeTier(company?.subscription_tier);
  const isOnTrial = company?.subscription_status === 'trialing';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Trial Countdown Banner */}
        {isOnTrial && <TrialCountdownBanner company={company} />}
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Meer dan 500+ schildersbedrijven gebruiken PaintConnect
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-50 mb-4"
          >
            Investeer in{' '}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              efficiëntie
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8"
          >
            Bespaar uren per week, verminder fouten en laat je team slimmer werken.
            <br />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Jaarlijks betalen = 2 maanden gratis!
            </span>
          </motion.p>
          
          {/* Billing Cycle Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl"
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Maandelijks
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Jaarlijks
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                billingCycle === 'yearly' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                -17%
              </span>
            </button>
          </motion.div>
        </div>

        {/* Payment Method Selector */}
        {(!hasActiveSubscription || isOnTrial) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <PaymentMethodSelector 
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              isLoading={isRedirecting}
            />
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div id="plans" className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <PlanCard
                plan={plan}
                isCurrentPlan={hasActiveSubscription && !isOnTrial && currentPlanId === plan.id}
                onChoosePlan={handleChoosePlan}
                isLoading={isRedirecting}
                billingCycle={billingCycle}
                paymentMethod={paymentMethod}
              />
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto"
        >
          {[
            { icon: Shield, text: "30 dagen geld-terug", color: "text-emerald-600" },
            { icon: CreditCard, text: "Veilig betalen", color: "text-blue-600" },
            { icon: Users, text: "500+ tevreden klanten", color: "text-purple-600" },
            { icon: MessageSquare, text: "Gratis migratie-hulp", color: "text-amber-600" },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-50">
            Wat onze klanten zeggen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </motion.div>

        {/* Feature Comparison Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="mx-auto flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-300 font-medium"
          >
            {showComparison ? 'Verberg' : 'Bekijk'} volledige vergelijking
            <motion.div
              animate={{ rotate: showComparison ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-5 h-5 rotate-90" />
            </motion.div>
          </button>
        </motion.div>

        {/* Feature Comparison Table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-16 overflow-hidden"
            >
              <Card className="max-w-5xl mx-auto shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Volledige functievergelijking</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeatureComparisonTable />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manage Subscription Card */}
        {hasActiveSubscription && !isOnTrial && company && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mb-16"
          >
            <Card className="shadow-lg border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  Abonnement Beheren
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Huidig plan</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {company.subscription_tier?.toUpperCase() || 'STARTER'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <Badge className={company.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {company.subscription_status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleManageSubscription} 
                  disabled={isRedirecting}
                  variant="outline"
                  className="w-full"
                >
                  {isRedirecting ? <InlineSpinner /> : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Beheer Abonnement
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-50">
            Veelgestelde Vragen
          </h2>
          <Accordion type="single" collapsible className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <AccordionItem value="item-1" className="border-b border-gray-100 dark:border-gray-700">
              <AccordionTrigger className="px-6 py-4 hover:no-underline text-left">
                Kan ik later upgraden of downgraden?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                Ja, u kunt op elk moment van plan wisselen. Bij een upgrade gaat de wijziging direct in en betaalt u het verschil pro-rata. Bij een downgrade blijft uw huidige plan actief tot het einde van de facturatieperiode.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b border-gray-100 dark:border-gray-700">
              <AccordionTrigger className="px-6 py-4 hover:no-underline text-left">
                Hoe werkt de 30-dagen geld-terug-garantie?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                Als u binnen 30 dagen na aankoop niet tevreden bent, krijgt u uw geld volledig terug. Geen vragen, geen gedoe. Stuur gewoon een email naar support@paintconnect.be.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-b border-gray-100 dark:border-gray-700">
              <AccordionTrigger className="px-6 py-4 hover:no-underline text-left">
                Welke betalingsmethoden accepteren jullie?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                Via Mollie: iDEAL (Nederland), Bancontact (België), creditcard, en meer. Via Stripe: creditcard, SEPA, Apple Pay, Google Pay. Alle betalingen zijn SSL-beveiligd.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-b border-gray-100 dark:border-gray-700">
              <AccordionTrigger className="px-6 py-4 hover:no-underline text-left">
                Wat gebeurt er als mijn proefperiode afloopt?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                Na afloop van uw gratis proefperiode krijgt u beperkte toegang totdat u een plan kiest. Uw gegevens blijven 90 dagen bewaard, zodat u rustig kunt beslissen.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="px-6 py-4 hover:no-underline text-left">
                Bieden jullie korting voor jaarlijkse betalingen?
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                Ja! Bij jaarlijkse betaling krijgt u <strong>2 maanden gratis</strong>. Dat is een besparing van 17% ten opzichte van maandelijkse betaling.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 pb-8"
        >
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nog vragen? Neem contact op met ons team.
          </p>
          <a 
            href="mailto:support@paintconnect.be" 
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            support@paintconnect.be
          </a>
        </motion.div>
      </div>
    </div>
  );
}
