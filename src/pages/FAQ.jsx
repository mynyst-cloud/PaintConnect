
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, LifeBuoy } from 'lucide-react';
import { faqData } from '@/components/faq/faqData';
import { User, Company } from '@/api/entities';
import SupportChatModal from '@/components/faq/SupportChatModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/components/providers/ThemeProvider';

const paintConnectLogoLightUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
const paintConnectLogoDarkUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png';

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const { resolvedTheme } = useTheme();
  const paintConnectLogoUrl = resolvedTheme === 'dark' ? paintConnectLogoDarkUrl : paintConnectLogoLightUrl;

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser && (currentUser.current_company_id || currentUser.company_id)) {
          const companyId = currentUser.current_company_id || currentUser.company_id;
          const companyData = await Company.get(companyId);
          setCompany(companyData);
        }
      } catch (error) {
        console.warn("Niet ingelogd of geen bedrijf gevonden, support knop wordt niet getoond.");
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return faqData;
    }

    const lowercasedTerm = searchTerm.toLowerCase();

    return faqData.
    map((section) => {
      const filteredQuestions = section.questions.filter(
        (q) =>
        q.question.toLowerCase().includes(lowercasedTerm) ||
        q.answer.toLowerCase().includes(lowercasedTerm)
      );

      return { ...section, questions: filteredQuestions };
    }).
    filter((section) => section.questions.length > 0);
  }, [searchTerm]);

  const isEnterprise = company?.subscription_plan === 'enterprise';

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img
              src={paintConnectLogoUrl}
              alt="PaintConnect Logo" className="h-16 w-auto object-contain" />


                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Veelgestelde Vragen</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                        Vind snel antwoorden op de meest gestelde vragen over PaintConnect
                    </p>
                </header>

                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
            type="text"
            placeholder="Zoek naar een vraag of trefwoord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-base py-6 rounded-lg" />

                </div>

                <Card className="shadow-lg">
                    <CardContent className="p-0">
                        {filteredData.length > 0 ?
            filteredData.map((section, sectionIndex) =>
            <div key={sectionIndex} className="p-6 border-b dark:border-gray-700 last:border-b-0">
                                    <h2 className="text-2xl font-semibold mb-4 text-emerald-700 dark:text-emerald-400">{section.category}</h2>
                                    <Accordion type="multiple" className="w-full">
                                        {section.questions.map((item, itemIndex) =>
                <AccordionItem value={`item-${sectionIndex}-${itemIndex}`} key={itemIndex}>
                                                <AccordionTrigger className="text-left text-lg hover:no-underline">
                                                    {item.question}
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div
                      className="prose dark:prose-invert max-w-full text-base"
                      dangerouslySetInnerHTML={{ __html: item.answer }} />

                                                </AccordionContent>
                                            </AccordionItem>
                )}
                                    </Accordion>
                                </div>
            ) :

            <div className="text-center py-16">
                                <p className="text-xl text-gray-500">Geen resultaten gevonden voor "{searchTerm}".</p>
                            </div>
            }
                    </CardContent>
                </Card>

                <footer className="mt-12 text-center">
                    <Card className="inline-block p-6 bg-white dark:bg-slate-800 shadow-md">
                       <div className="flex flex-col items-center gap-4">
                           <LifeBuoy className="w-12 h-12 text-emerald-500" />
                            <div>
                                <h3 className="text-xl font-bold">Niet gevonden wat u zocht?</h3>
                                <p className="text-gray-600 dark:text-gray-400">Ons support team staat voor u klaar.</p>
                            </div>
                            {isLoading ?
              <LoadingSpinner /> :
              isEnterprise ?
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowSupportChat(true)}>
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    Contacteer Enterprise Support
                                </Button> :

              <p className="text-sm text-gray-500 bg-gray-100 dark:bg-slate-700 p-3 rounded-md">
                                    Upgrade naar ons <strong className="text-emerald-600 dark:text-emerald-400">Enterprise</strong> plan voor directe support via chat.
                                </p>
              }
                       </div>
                    </Card>
                </footer>
            </div>
            {showSupportChat && <SupportChatModal onClose={() => setShowSupportChat(false)} />}
        </div>);

}