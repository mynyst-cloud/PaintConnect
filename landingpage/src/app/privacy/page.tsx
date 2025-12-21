import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";

export const metadata = {
  title: "Privacy Policy – PaintConnect",
  description: "Privacy Policy van PaintConnect. Lees hoe wij uw persoonsgegevens verzamelen, gebruiken en beschermen.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[var(--color-gray-200)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <img
                src={LOGO_DARK}
                alt="PaintConnect Logo"
                className="h-10 w-auto"
              />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--color-gray-600)] hover:text-[var(--color-emerald-600)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Terug naar home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-gray-200)] p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={LOGO_DARK}
                alt="PaintConnect Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-gray-900)] mb-2">
              Privacy Policy – PaintConnect
            </h1>
            <p className="text-sm text-[var(--color-gray-600)]">
              Laatst bijgewerkt: 01-09-2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            <div>
              <p className="text-[var(--color-gray-700)] leading-relaxed">
                PaintConnect ("wij", "ons" of "onze") hecht veel waarde aan de bescherming van uw persoonsgegevens. 
                In deze privacyverklaring leggen wij uit welke gegevens wij verzamelen, hoe wij deze gebruiken en welke rechten u heeft.
              </p>
              <p className="text-[var(--color-gray-700)] leading-relaxed mt-4">
                PaintConnect is een platform voor schildersbedrijven, schilders, leveranciers en klanten om projecten 
                efficiënt te beheren, communiceren en opvolgen.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                1. Wie is verantwoordelijk voor de verwerking van uw gegevens?
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed">
                PaintConnect is verantwoordelijk voor de verwerking van persoonsgegevens die via onze applicatie en website worden verzameld.
              </p>
              <p className="text-[var(--color-gray-700)] leading-relaxed mt-2">
                <strong>Contactgegevens:</strong> PaintConnect Support@paintconnect.be
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                2. Welke gegevens verzamelen wij?
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed mb-4">
                Wij verzamelen de volgende categorieën persoonsgegevens:
              </p>
              
              <div className="ml-4 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-gray-800)] mb-2">
                    2.1 Gegevens van schildersbedrijven (admins)
                  </h3>
                  <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-1">
                    <li>Naam bedrijf</li>
                    <li>Voor- en achternaam contactpersoon</li>
                    <li>E-mailadres</li>
                    <li>Telefoonnummer</li>
                    <li>Betaalgegevens (voor abonnementen)</li>
                    <li>Projectinformatie</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-gray-800)] mb-2">
                    2.2 Gegevens van schilders (teamleden)
                  </h3>
                  <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-1">
                    <li>Voor- en achternaam</li>
                    <li>E-mailadres (voor login en communicatie)</li>
                    <li>Werkuren en materiaalregistratie (gelinkt aan projecten)</li>
                    <li>Chat- en updateberichten</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-gray-800)] mb-2">
                    2.3 Gegevens van leveranciers
                  </h3>
                  <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-1">
                    <li>Bedrijfsnaam</li>
                    <li>Contactgegevens (naam, e-mail, telefoonnummer)</li>
                    <li>Bestellingen en leveringsinformatie</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-gray-800)] mb-2">
                    2.4 Gegevens van klanten (via klantenportaal)
                  </h3>
                  <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-1">
                    <li>Voor- en achternaam</li>
                    <li>E-mailadres</li>
                    <li>Projectinformatie en voortgang</li>
                    <li>Feedback en goedkeuringen (bijv. schadeherstellingen)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-gray-800)] mb-2">
                    2.5 Automatisch verzamelde gegevens
                  </h3>
                  <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-1">
                    <li>IP-adres</li>
                    <li>Browser en apparaatgegevens</li>
                    <li>Gebruiksstatistieken van de app</li>
                    <li>Cookies (op de website/landing page)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                3. Waarvoor gebruiken wij uw gegevens?
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed mb-4">
                Wij verwerken persoonsgegevens uitsluitend voor legitieme doeleinden, zoals:
              </p>
              <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-2">
                <li>Het aanbieden en beheren van gebruikersaccounts</li>
                <li>Het versturen van uitnodigingen en verificatiemails</li>
                <li>Het faciliteren van communicatie tussen schilders, bedrijven, klanten en leveranciers</li>
                <li>Het registreren van projectupdates, schade, materialen en uren</li>
                <li>Het genereren van rapporten (zoals na-calculatie en facturen)</li>
                <li>Het verzenden van notificaties en e-mails (projectupdates, meldingen, reminders)</li>
                <li>Het uitvoeren van betalingen en beheren van abonnementen</li>
                <li>Het verbeteren en beveiligen van onze app</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                4. Op welke grondslagen verwerken wij uw gegevens?
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed mb-4">
                Wij baseren de verwerking van uw persoonsgegevens op:
              </p>
              <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-2">
                <li>Uitvoering van een overeenkomst (bijv. uw abonnement of gebruik van de app)</li>
                <li>Wettelijke verplichting (bijv. facturatie)</li>
                <li>Gerechtvaardigd belang (bijv. verbetering van onze diensten)</li>
                <li>Toestemming (bij marketingcommunicatie)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                5. Delen wij uw gegevens met derden?
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed mb-4">
                <strong>Wij verkopen uw gegevens nooit aan derden.</strong> Uw gegevens kunnen enkel gedeeld worden met:
              </p>
              <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-2">
                <li>Dienstverleners (zoals hosting, e-mailproviders, betalingsverwerkers zoals Stripe)</li>
                <li>Leveranciers binnen de app, indien u een bestelling plaatst</li>
                <li>Overheidsinstanties, indien dit wettelijk verplicht is</li>
              </ul>
              <p className="text-[var(--color-gray-700)] leading-relaxed mt-4">
                Met al onze verwerkers sluiten wij een verwerkersovereenkomst af, zodat uw gegevens veilig blijven.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                6. Bewaartermijnen
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed mb-4">
                Wij bewaren persoonsgegevens niet langer dan noodzakelijk is:
              </p>
              <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-2">
                <li><strong>Accountgegevens:</strong> zolang uw account actief is</li>
                <li><strong>Betaal- en facturatiegegevens:</strong> 7 jaar (wettelijke bewaarplicht)</li>
                <li><strong>Project- en communicatiegegevens:</strong> zolang deze relevant zijn voor het bedrijf of wettelijk verplicht</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                7. Beveiliging
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed mb-4">
                Wij nemen passende technische en organisatorische maatregelen om persoonsgegevens te beschermen 
                tegen verlies, misbruik, onbevoegde toegang en openbaarmaking. Voorbeelden:
              </p>
              <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-2">
                <li>SSL-encryptie bij gegevensoverdracht</li>
                <li>Versleutelde opslag van gevoelige data</li>
                <li>Beperkte toegang tot gegevens (alleen bevoegde medewerkers)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                8. Uw rechten
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed mb-4">
                U heeft te allen tijde het recht om:
              </p>
              <ul className="list-disc ml-6 text-[var(--color-gray-700)] space-y-2">
                <li>Uw gegevens in te zien (recht op inzage)</li>
                <li>Uw gegevens te laten corrigeren (recht op rectificatie)</li>
                <li>Uw gegevens te laten verwijderen (recht op vergetelheid)</li>
                <li>Beperking van de verwerking te vragen</li>
                <li>Uw gegevens over te dragen (recht op dataportabiliteit)</li>
                <li>Bezwaar te maken tegen verwerking</li>
              </ul>
              <p className="text-[var(--color-gray-700)] leading-relaxed mt-4">
                Een verzoek kunt u indienen via <strong>support@paintconnect.be</strong>. Wij reageren binnen 30 dagen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                9. Minderjarigen
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed">
                Onze app is niet bedoeld voor personen jonger dan 16 jaar. Wij verzamelen bewust geen gegevens van minderjarigen. 
                Indien dit per ongeluk gebeurt, verwijderen wij deze onmiddellijk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                10. Wijzigingen in deze privacyverklaring
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed">
                Wij kunnen deze privacyverklaring wijzigen. De meest actuele versie staat altijd op onze website/app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-gray-900)] border-b border-[var(--color-gray-200)] pb-2 mb-4">
                11. Contact
              </h2>
              <p className="text-[var(--color-gray-700)] leading-relaxed">
                Heeft u vragen of klachten over deze privacyverklaring? Neem dan contact met ons op via{' '}
                <strong>support@paintconnect.be</strong>.
              </p>
            </section>

            <div className="bg-[var(--color-gray-100)] p-4 rounded-lg mt-8">
              <p className="text-sm text-[var(--color-gray-600)] text-center">
                Deze privacyverklaring is opgesteld conform de Algemene Verordening Gegevensbescherming (AVG/GDPR).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

