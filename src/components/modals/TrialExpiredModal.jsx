import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/components/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function TrialExpiredModal({ companyName, trialEnd }) {
    const navigate = useNavigate();

    const handleUpgradeClick = () => {
        navigate(createPageUrl('Subscription'));
    };

    const formattedTrialEnd = trialEnd ? format(new Date(trialEnd), 'dd MMMM yyyy', { locale: nl }) : 'onbekende datum';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999]" 
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        <CardHeader className="text-center p-6">
                            <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center">
                                <img 
                                    src={paintConnectLogoUrl}
                                    alt="PaintConnect Logo" 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        console.error('Logo failed to load:', paintConnectLogoUrl);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                            <CardTitle className="text-2xl font-bold">Proefperiode Verlopen</CardTitle>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Helaas is uw gratis proefperiode voor PaintConnect afgelopen.
                            </p>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 text-center space-y-4">
                            <p className="text-sm">
                                Om verder gebruik te maken van alle functies van PaintConnect voor <strong>{companyName || 'uw bedrijf'}</strong>, dient u een abonnement te kiezen.
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Uw proefperiode eindigde op: {formattedTrialEnd}
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Geen zorgen, al uw gegevens zijn veilig opgeslagen!
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 pt-0">
                            <Button
                                onClick={handleUpgradeClick}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Upgrade Nu <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}