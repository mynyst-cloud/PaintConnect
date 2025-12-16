
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Check, AlertTriangle, Euro } from 'lucide-react';
import { Subscription, Invoice } from '@/api/entities';
import { createMollieCheckout } from '@/api/functions';
import { testMollieIntegration } from '@/api/functions';

export default function MollieSubscriptionManager({ user, company }) {
    const [subscription, setSubscription] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const plans = {
        starter: {
            name: 'Starter',
            price: 29,
            description: 'Perfect voor kleine schildersbedrijven',
            features: ['5 actieve projecten', '2 teamleden', 'Basis rapportage', 'E-mail support']
        },
        professional: {
            name: 'Professional',
            price: 79,
            description: 'Voor groeiende schildersbedrijven',
            features: ['25 actieve projecten', '10 teamleden', 'Uitgebreide rapportage', 'Klantenportaal', 'Prioriteitsupport']
        },
        enterprise: {
            name: 'Enterprise',
            price: 199,
            description: 'Voor grote schildersbedrijven',
            features: ['Onbeperkte projecten', 'Onbeperkte teamleden', 'Premium support', 'API toegang', 'White-label optie']
        }
    };

    const loadSubscriptionData = useCallback(async () => {
        if (!company?.id) return;
        
        setIsLoading(true);
        try {
            // Load subscription
            const subs = await Subscription.filter({ company_id: company.id });
            setSubscription(subs[0] || null);

            // Load invoices
            const invoicesList = await Invoice.filter({ company_id: company.id }, '-invoice_date', 10);
            setInvoices(invoicesList || []);
        } catch (err) {
            setError('Kon abonnementgegevens niet laden: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [company?.id]);

    useEffect(() => {
        loadSubscriptionData();
    }, [loadSubscriptionData]);

    const handleUpgrade = async (planType) => {
        setIsProcessing(true);
        setError(null);
        
        try {
            const { data } = await createMollieCheckout({
                planType,
                companyId: company.id
            });
            
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('Geen checkout URL ontvangen');
            }
        } catch (err) {
            setError('Betaling opstarten mislukt: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTestIntegration = async () => {
        if (user?.role !== 'admin') return;
        
        setIsProcessing(true);
        try {
            const { data } = await testMollieIntegration();
            if (data.success) {
                alert('Mollie test succesvol! Check uw e-mail voor details.');
            }
        } catch (err) {
            alert('Test mislukt: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            trial: { variant: 'secondary', text: 'Proefperiode' },
            active: { variant: 'default', text: 'Actief', className: 'bg-green-500' },
            past_due: { variant: 'destructive', text: 'Betaling Achterstallig' },
            canceled: { variant: 'outline', text: 'Geannuleerd' }
        };
        
        const config = variants[status] || variants.trial;
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.text}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Abonnement laden...
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current Subscription */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Euro className="w-5 h-5" />
                        Huidig Abonnement
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {subscription ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-semibold">
                                        {plans[subscription.plan_type]?.name || subscription.plan_type}
                                    </h3>
                                    <p className="text-gray-600 mb-2">
                                        €{subscription.monthly_price}/maand
                                    </p>
                                    {getStatusBadge(subscription.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Volgende factuur</p>
                                    <p className="font-medium">
                                        {new Date(subscription.current_period_end).toLocaleDateString('nl-NL')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Inbegrepen features:</h4>
                                <ul className="space-y-1">
                                    {(subscription.features || []).map((feature, index) => (
                                        <li key={index} className="flex items-center text-sm">
                                            <Check className="w-4 h-4 text-green-500 mr-2" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Geen actief abonnement</h3>
                            <p className="text-gray-600 mb-4">Kies een plan om te beginnen met PaintConnect</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Available Plans */}
            <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(plans).map(([planKey, plan]) => {
                    const isCurrentPlan = subscription?.plan_type === planKey;
                    const isUpgrade = subscription && !isCurrentPlan;
                    
                    return (
                        <Card key={planKey} className={`relative ${isCurrentPlan ? 'ring-2 ring-emerald-500' : ''}`}>
                            {isCurrentPlan && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-emerald-500">Huidig Plan</Badge>
                                </div>
                            )}
                            
                            <CardHeader className="text-center">
                                <CardTitle>{plan.name}</CardTitle>
                                <div className="text-3xl font-bold">€{plan.price}<span className="text-lg font-normal">/maand</span></div>
                                <p className="text-gray-600">{plan.description}</p>
                            </CardHeader>
                            
                            <CardContent>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                
                                <Button
                                    className="w-full"
                                    variant={isCurrentPlan ? "outline" : "default"}
                                    disabled={isCurrentPlan || isProcessing}
                                    onClick={() => handleUpgrade(planKey)}
                                >
                                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {isCurrentPlan ? 'Huidig Plan' : isUpgrade ? `Upgrade naar ${plan.name}` : `Kies ${plan.name}`}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Recent Invoices */}
            {invoices.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recente Facturen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {invoices.map((invoice) => (
                                <div key={invoice.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                    <div>
                                        <p className="font-medium">{invoice.invoice_number}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">€{invoice.amount_due.toFixed(2)}</p>
                                        {getStatusBadge(invoice.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center text-red-700">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Admin Test Button */}
            {user?.role === 'admin' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            variant="outline" 
                            onClick={handleTestIntegration}
                            disabled={isProcessing}
                        >
                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Test Mollie Integratie
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
