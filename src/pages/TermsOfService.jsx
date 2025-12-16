
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme, ThemeProvider } from '@/components/providers/ThemeProvider';

const paintConnectLogoLightUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
const paintConnectLogoDarkUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png';

export function TermsOfServiceContent() {
    const { resolvedTheme } = useTheme();
    const paintConnectLogoUrl = resolvedTheme === 'dark' ? paintConnectLogoDarkUrl : paintConnectLogoLightUrl;

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src={paintConnectLogoUrl}
                            alt="PaintConnect Logo"
                            className="h-16 w-auto object-contain"
                        />
                    </div>
                    <CardTitle className="text-3xl font-bold">Algemene Voorwaarden – PaintConnect</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">Laatst bijgewerkt: 01-09-2025</p>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-full space-y-6">
                    <div>
                        <p className="text-gray-700 leading-relaxed">
                            Deze Algemene Voorwaarden ("Voorwaarden") zijn van toepassing op het gebruik van de applicatie en diensten van PaintConnect ("wij", "ons" of "onze"). Door gebruik te maken van onze app en website verklaart u zich akkoord met deze Voorwaarden.
                        </p>
                    </div>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">1. Definities</h2>
                        <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li><strong>Applicatie / App:</strong> de PaintConnect software en diensten.</li>
                            <li><strong>Gebruiker:</strong> elke natuurlijke persoon of rechtspersoon die de app gebruikt, waaronder schildersbedrijven (admins), schilders (teamleden), leveranciers, klanten en super admin.</li>
                            <li><strong>Abonnement:</strong> een betaalde of gratis toegangsvorm tot de functies van PaintConnect.</li>
                            <li><strong>Klant:</strong> een eindgebruiker die via een schildersbedrijf toegang krijgt tot het klantenportaal.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">2. Toepasselijkheid</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Deze Voorwaarden zijn van toepassing op elk gebruik van PaintConnect, inclusief registratie, gebruik van functies, abonnementen en alle communicatie via de app.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">3. Registratie & Accounts</h2>
                        
                        <div className="ml-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">1. Schildersbedrijven (admins)</h3>
                                <ul className="list-disc ml-6 text-gray-700">
                                    <li>Kunnen zich registreren via de website of een uitnodiging.</li>
                                    <li>Ontvangen een 14-daagse proefperiode (Starter-abonnement).</li>
                                    <li>Na afloop van de proefperiode moeten zij een betaald abonnement kiezen om toegang te behouden.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">2. Schilders (teamleden)</h3>
                                <ul className="list-disc ml-6 text-gray-700">
                                    <li>Worden uitgenodigd door een schildersbedrijf.</li>
                                    <li>Betalen geen abonnement.</li>
                                    <li>Hun toegang en rechten worden beheerd door het schildersbedrijf.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">3. Leveranciers</h3>
                                <ul className="list-disc ml-6 text-gray-700">
                                    <li>Registreren via de website of via uitnodiging van de super admin.</li>
                                    <li>Voorlopig gratis toegang. PaintConnect behoudt zich het recht voor om later een abonnement te introduceren.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">4. Super Admin & Helpdesk</h3>
                                <ul className="list-disc ml-6 text-gray-700">
                                    <li>Interne rollen, beheerd door PaintConnect.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">4. Abonnementen & Betaling</h2>
                        
                        <div className="ml-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">1. Abonnementsvormen:</h3>
                                <ul className="list-disc ml-6 text-gray-700">
                                    <li><strong>Starter:</strong> €29/maand – beperkte functies.</li>
                                    <li><strong>Professional:</strong> €79/maand – uitgebreide functies.</li>
                                    <li><strong>Enterprise:</strong> €199/maand – inclusief 24/7 helpdesk en volledige toegang.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">2. Betalingsvoorwaarden</h3>
                                <ul className="list-disc ml-6 text-gray-700">
                                    <li>Betaling gebeurt via automatische incasso of de gekozen betaalprovider.</li>
                                    <li>Abonnementen worden maandelijks verlengd, tenzij tijdig opgezegd.</li>
                                    <li>Bij uitblijven van betaling behoudt PaintConnect zich het recht voor om de toegang te beperken of te blokkeren.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">5. Gebruik van de App</h2>
                        
                        <div className="ml-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">1. Toegestaan gebruik</h3>
                                <p className="text-gray-700 leading-relaxed ml-6">
                                    Gebruikers mogen de app uitsluitend gebruiken voor legitieme bedrijfsdoeleinden binnen de schilder- en bouwsector.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">2. Verboden gebruik</h3>
                                <p className="text-gray-700 leading-relaxed ml-6 mb-2">
                                    Het is verboden de app te misbruiken, waaronder:
                                </p>
                                <ul className="list-disc ml-12 text-gray-700">
                                    <li>Onrechtmatig gebruik van data.</li>
                                    <li>Verspreiden van ongepaste inhoud via de chat of meldingen.</li>
                                    <li>Proberen beveiligingsmaatregelen te omzeilen.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">3. Sancties</h3>
                                <p className="text-gray-700 leading-relaxed ml-6">
                                    PaintConnect behoudt zich het recht voor accounts tijdelijk of permanent te blokkeren bij overtreding van deze regels.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">6. Projecten & Data</h2>
                        <ul className="list-decimal ml-6 text-gray-700 space-y-1">
                            <li>Alle ingevoerde projectdata, uren, materialen en meldingen blijven eigendom van het schildersbedrijf.</li>
                            <li>PaintConnect fungeert uitsluitend als verwerker en biedt de technische middelen om deze data te beheren.</li>
                            <li>Het is de verantwoordelijkheid van het schildersbedrijf om projectdata te controleren en te exporteren indien gewenst.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">7. Leveranciers</h2>
                        <ul className="list-decimal ml-6 text-gray-700 space-y-1">
                            <li>Leveranciers kunnen producten en bestellingen beheren via hun eigen dashboard.</li>
                            <li>PaintConnect is niet verantwoordelijk voor de levering, kwaliteit of prijs van producten die via leveranciers worden aangeboden.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">8. Intellectuele Eigendom</h2>
                        <ul className="list-decimal ml-6 text-gray-700 space-y-1">
                            <li>Alle rechten op de app, merknaam, logo, software en inhoud behoren toe aan PaintConnect.</li>
                            <li>Het is gebruikers niet toegestaan onderdelen van de app te kopiëren, verspreiden of reverse-engineeren.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">9. Aansprakelijkheid</h2>
                        
                        <div className="ml-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">1. Uitgesloten aansprakelijkheid</h3>
                                <p className="text-gray-700 leading-relaxed ml-6 mb-2">
                                    PaintConnect is niet aansprakelijk voor:
                                </p>
                                <ul className="list-disc ml-12 text-gray-700">
                                    <li>Fouten of onvolledigheden in ingevoerde data.</li>
                                    <li>Schade door verkeerd gebruik van de app.</li>
                                    <li>Indirecte of gevolgschade.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">2. Beperking van aansprakelijkheid</h3>
                                <p className="text-gray-700 leading-relaxed ml-6">
                                    PaintConnect beperkt haar aansprakelijkheid tot maximaal het bedrag van het door de gebruiker betaalde abonnement in de laatste 3 maanden.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">10. Beveiliging & Privacy</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Wij behandelen persoonsgegevens volgens onze Privacy Policy, die integraal deel uitmaakt van deze Voorwaarden.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">11. Beëindiging</h2>
                        
                        <div className="ml-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">1. Door gebruiker</h3>
                                <p className="text-gray-700 leading-relaxed ml-6">
                                    Gebruikers kunnen hun abonnement maandelijks opzeggen.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">2. Door PaintConnect</h3>
                                <p className="text-gray-700 leading-relaxed ml-6 mb-2">
                                    PaintConnect kan accounts beëindigen bij:
                                </p>
                                <ul className="list-disc ml-12 text-gray-700">
                                    <li>Overtreding van de Voorwaarden.</li>
                                    <li>Misbruik of fraude.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">12. Wijzigingen</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Wij kunnen deze Voorwaarden wijzigen. De meest recente versie is steeds beschikbaar in de app en op onze website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-2">13. Toepasselijk Recht</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Op deze Voorwaarden is het Belgisch recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechtbanken van België.
                        </p>
                    </section>

                    <div className="bg-gray-100 p-4 rounded-lg mt-8">
                        <p className="text-sm text-gray-600 text-center">
                            Deze algemene voorwaarden zijn opgesteld conform het Belgisch recht en zijn laatst bijgewerkt op 01-09-2025.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function TermsOfService() {
    return (
        <ThemeProvider>
            <TermsOfServiceContent />
        </ThemeProvider>
    );
}
