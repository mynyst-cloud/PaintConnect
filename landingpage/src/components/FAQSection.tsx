"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Korte FAQ's voor accordion
  const faqs = [
    {
      question: "Hoe snel kan ik starten met PaintConnect?",
      answer:
        "Je kunt binnen 5 minuten aan de slag. Maak een account aan, voeg je bedrijfsgegevens toe en nodig je schilders uit. Ze krijgen een mail met de download-link voor de app.",
    },
    {
      question: "Wat is de verplichte tijdsregistratie 2027?",
      answer:
        "Vanaf 2027 zijn werkgevers in Nederland verplicht om de werktijden van hun medewerkers digitaal te registreren. PaintConnect is hier volledig op voorbereid met automatische check-in/out, GPS-verificatie en exporteerbare rapporten.",
    },
    {
      question: "Kunnen mijn klanten ook de voortgang zien?",
      answer:
        "Ja! Elke klant krijgt toegang tot een eigen portaal waar ze foto's en updates zien, de planning kunnen bekijken en direct met je kunnen communiceren. Dit vermindert telefoontjes en verhoogt de klanttevredenheid.",
    },
    {
      question: "Hoe werkt de GPS-tracking?",
      answer:
        "Wanneer een schilder incheckt op een project, wordt de locatie vastgelegd. De reistijd tussen projecten wordt automatisch berekend. Alle data is AVG-compliant en schilders hebben inzicht in hun eigen gegevens.",
    },
    {
      question: "Kan ik maandelijks opzeggen?",
      answer:
        "Absoluut. Er zijn geen langdurige contracten. Je betaalt maandelijks en kunt elk moment opzeggen. Je data kun je altijd exporteren.",
    },
    {
      question: "Bieden jullie ook support en training?",
      answer:
        "Jazeker. Alle klanten krijgen toegang tot onze kennisbank en chat-support. Professional en Enterprise klanten krijgen daarnaast een persoonlijke onboarding en prioriteit support.",
    },
  ];

  // Uitgebreide conversational content voor voice search & GEO
  const detailedFaqs = [
    {
      question: "Hoe werkt tijdsregistratie voor schilders?",
      answer: (
        <>
          <p className="mb-4">
            Tijdsregistratie voor schilders werkt door middel van GPS-check-in. 
            Wanneer een schilder aankomt op een projectlocatie, checkt hij in via 
            de PaintConnect app op zijn smartphone. De GPS-locatie wordt automatisch 
            vastgelegd, wat zorgt voor een betrouwbare en objectieve registratie van 
            de werktijden. Bij het uitchecken wordt de eindtijd geregistreerd en wordt 
            automatisch de reistijd tussen projecten berekend.
          </p>
          <p>
            Dit systeem voldoet volledig aan de nieuwe wetgeving die vanaf 2027 van 
            kracht is, waarbij werkgevers verplicht zijn om de werktijden van hun 
            medewerkers digitaal te registreren. Alle data kan worden geëxporteerd 
            naar Excel voor loonverwerking en administratie.
          </p>
        </>
      ),
    },
    {
      question: "Wat is de beste app voor schildersbedrijven in België?",
      answer: (
        <>
          <p className="mb-4">
            PaintConnect is speciaal ontwikkeld voor schildersbedrijven in België en 
            Nederland. De app combineert alle essentiële functies die een schildersbedrijf 
            nodig heeft: GPS-tijdsregistratie, projectplanning, klantportaal, materiaalbeheer 
            en team communicatie. Wat PaintConnect uniek maakt is dat het volledig is 
            afgestemd op de Belgische en Nederlandse markt, inclusief ondersteuning voor 
            de nieuwe tijdsregistratie wetgeving die vanaf 2027 verplicht is.
          </p>
          <p>
            Met meer dan 200 actieve schildersbedrijven en een klanttevredenheid van 98% 
            is PaintConnect de meest vertrouwde oplossing voor schildersbedrijven in de 
            Benelux. De app is beschikbaar in het Nederlands en biedt lokale support.
          </p>
        </>
      ),
    },
    {
      question: "Hoe kan ik mijn schildersbedrijf digitaliseren?",
      answer: (
        <>
          <p className="mb-4">
            Het digitaliseren van je schildersbedrijf begint met het implementeren van 
            een alles-in-één software oplossing zoals PaintConnect. In plaats van 
            verschillende systemen voor planning, urenregistratie en administratie te 
            gebruiken, brengt PaintConnect alles samen in één platform.
          </p>
          <p className="mb-4">
            Het proces is eenvoudig: maak een account aan, nodig je team uit via email, 
            en start met het aanmaken van je eerste project. Binnen 5 minuten ben je 
            operationeel. Schilders downloaden de app op hun smartphone en kunnen direct 
            beginnen met check-in op projectlocaties. Alle data wordt automatisch 
            gesynchroniseerd en is real-time beschikbaar voor het hele team.
          </p>
          <p>
            Door te digitaliseren bespaar je gemiddeld 5+ uur per week aan administratie, 
            verminder je fouten in urenregistratie, en verhoog je de transparantie naar 
            je klanten toe via het klantportaal.
          </p>
        </>
      ),
    },
    {
      question: "Is PaintConnect geschikt voor kleine schildersbedrijven?",
      answer: (
        <>
          <p className="mb-4">
            Ja, PaintConnect is perfect geschikt voor kleine schildersbedrijven. Het 
            Starter plan is speciaal ontwikkeld voor freelancers en kleine teams tot 3 
            gebruikers, tegen een betaalbare prijs van €29 per maand. Dit plan bevat 
            alle essentiële functies zoals basis projectmanagement, materiaal aanvragen, 
            en het check-in systeem.
          </p>
          <p>
            Voor groeiende bedrijven is er het Professional plan (€79/maand) met 
            uitgebreide functies zoals klantportaal, referral systeem en prioriteit 
            support. Alle plannen kunnen maandelijks worden opgezegd, zonder langdurige 
            contracten. Je kunt PaintConnect 14 dagen gratis uitproberen zonder 
            creditcard.
          </p>
        </>
      ),
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--color-orange-600)] font-semibold text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-gray-900)] mt-3 mb-4">
            Veelgestelde vragen
          </h2>
          <p className="text-lg text-[var(--color-gray-600)] max-w-2xl mx-auto">
            Alles wat je moet weten over PaintConnect voor schildersbedrijven
          </p>
        </div>

        {/* Korte FAQ's - Accordion */}
        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-[var(--color-gray-200)] rounded-lg overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[var(--color-gray-50)] transition-colors"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <span className="font-semibold text-[var(--color-gray-900)]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--color-gray-500)] transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-[var(--color-gray-600)]">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Uitgebreide FAQ's - Conversational Content voor Voice Search & GEO */}
        <div className="space-y-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-gray-900)] mb-4">
              Uitgebreide informatie
            </h3>
            <p className="text-[var(--color-gray-600)]">
              Meer gedetailleerde antwoorden op veelgestelde vragen
            </p>
          </div>

          {detailedFaqs.map((faq, index) => (
            <article
              key={`detailed-${index}`}
              className="bg-[var(--color-gray-50)] rounded-xl p-6 md:p-8 border border-[var(--color-gray-200)] shadow-sm"
            >
              <h3 className="text-xl md:text-2xl font-bold text-[var(--color-gray-900)] mb-4">
                {faq.question}
              </h3>
              <div className="text-[var(--color-gray-600)] leading-relaxed">
                {faq.answer}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

