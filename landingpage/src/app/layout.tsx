import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Font optimalisatie voor betere FCP en CLS
});

// PaintConnect branding URLs
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const FAVICON_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png";

export const metadata: Metadata = {
  title: {
    default: "PaintConnect – Dé Complete App voor Schildersbedrijven | Tijdsregistratie & Planning",
    template: "%s | PaintConnect"
  },
  description: "PaintConnect is dé complete software voor schildersbedrijven in Nederland en België. Automatische GPS-tijdsregistratie, slimme planning, klantportaal en materiaalbeheer. 100% klaar voor de verplichte urenregistratie 2027. Start vandaag met 14 dagen gratis proefperiode.",
  keywords: [
    // Primaire keywords
    "schildersbedrijf software",
    "schilder app",
    "schilders app belgie",
    "schildersbedrijf app",
    // Tijdsregistratie
    "tijdsregistratie schilders",
    "urenregistratie app",
    "urenregistratie 2027",
    "verplichte tijdsregistratie 2027",
    "gps tijdregistratie",
    "digitale urenregistratie",
    // Planning
    "planning schildersbedrijf",
    "projectplanning schilders",
    "werkplanning app",
    // Functies
    "klantportaal schilders",
    "materiaal beheer schilders",
    "offerte software schilders",
    "werkbon app",
    "projectmanagement schilders",
    // Geo - België first
    "schildersbedrijf software belgie",
    "schildersbedrijf software vlaanderen",
    "schilder app antwerpen",
    "schilder app gent",
    "schilder app brussel",
    "schildersbedrijf software nederland",
    "schilder administratie",
    // Long-tail
    "beste app voor schildersbedrijven",
    "schildersbedrijf digitaliseren",
    "bouw urenregistratie app belgie"
  ],
  authors: [{ name: "PaintConnect", url: "https://paintconnect.nl" }],
  creator: "PaintConnect",
  publisher: "PaintConnect",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: FAVICON_URL,
    shortcut: FAVICON_URL,
    apple: FAVICON_URL,
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "nl_BE",
    alternateLocale: "nl_NL",
    url: "https://paintconnect.be",
    title: "PaintConnect – Dé Complete App voor Schildersbedrijven",
    description: "Automatische GPS-tijdsregistratie, slimme planning en klantportaal. 100% klaar voor de verplichte urenregistratie 2027. 14 dagen gratis proberen!",
    siteName: "PaintConnect",
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: "PaintConnect - De complete software voor schildersbedrijven in België en Nederland",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PaintConnect – Dé App voor Schildersbedrijven",
    description: "GPS-tijdsregistratie, planning & klantportaal. Klaar voor 2027. 14 dagen gratis!",
    images: [LOGO_URL],
    creator: "@paintconnect",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://paintconnect.be",
    languages: {
      "nl-BE": "https://paintconnect.be",
      "nl-NL": "https://paintconnect.nl",
    },
  },
  category: "technology",
  metadataBase: new URL("https://paintconnect.be"),
  verification: {
    google: "your-google-verification-code", // TODO: Add real verification code
  },
};

// Structured Data / JSON-LD for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    // Organization Schema
    {
      "@type": "Organization",
      "@id": "https://paintconnect.be/#organization",
      "name": "PaintConnect",
      "url": "https://paintconnect.be",
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL,
        "width": 512,
        "height": 512
      },
      "description": "PaintConnect is de complete software-oplossing voor schildersbedrijven in België en Nederland.",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "BE"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "support@paintconnect.be",
        "availableLanguage": ["Dutch", "English", "French"]
      },
      "sameAs": [
        "https://www.linkedin.com/company/paintconnect",
        "https://www.facebook.com/paintconnect"
      ]
    },
    // SoftwareApplication Schema
    {
      "@type": "SoftwareApplication",
      "@id": "https://paintconnect.be/#software",
      "name": "PaintConnect",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "description": "Complete bedrijfssoftware voor schildersbedrijven met GPS-tijdsregistratie, planning, klantportaal en materiaalbeheer.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "EUR",
        "lowPrice": "29",
        "highPrice": "199",
        "offerCount": "3",
        "offers": [
          {
            "@type": "Offer",
            "name": "Starter",
            "price": "29",
            "priceCurrency": "EUR",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock"
          },
          {
            "@type": "Offer",
            "name": "Professional",
            "price": "79",
            "priceCurrency": "EUR",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock"
          },
          {
            "@type": "Offer",
            "name": "Enterprise",
            "price": "199",
            "priceCurrency": "EUR",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock"
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127",
        "bestRating": "5",
        "worstRating": "1"
      },
      "featureList": [
        "GPS-tijdsregistratie",
        "Automatische urenregistratie",
        "Projectplanning",
        "Klantportaal",
        "Materiaalbeheer met AI",
        "Team communicatie",
        "Analytics dashboard",
        "Offerte generator"
      ]
    },
    // WebSite Schema with SearchAction
    {
      "@type": "WebSite",
      "@id": "https://paintconnect.be/#website",
      "url": "https://paintconnect.be",
      "name": "PaintConnect",
      "description": "De complete app voor schildersbedrijven",
      "publisher": {
        "@id": "https://paintconnect.be/#organization"
      },
      "inLanguage": "nl-BE"
    },
    // FAQPage Schema - Uitgebreid met conversational content voor GEO
    {
      "@type": "FAQPage",
      "@id": "https://paintconnect.be/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Hoe snel kan ik starten met PaintConnect?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Je kunt binnen 5 minuten aan de slag. Maak een account aan, voeg je bedrijfsgegevens toe en nodig je schilders uit. Ze krijgen een mail met de download-link voor de app."
          }
        },
        {
          "@type": "Question",
          "name": "Wat is de verplichte tijdsregistratie 2027?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Vanaf 2027 zijn werkgevers in Nederland verplicht om de werktijden van hun medewerkers digitaal te registreren. PaintConnect is hier volledig op voorbereid met automatische check-in/out, GPS-verificatie en exporteerbare rapporten."
          }
        },
        {
          "@type": "Question",
          "name": "Kunnen mijn klanten ook de voortgang zien?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ja! Elke klant krijgt toegang tot een eigen portaal waar ze foto's en updates zien, de planning kunnen bekijken en direct met je kunnen communiceren."
          }
        },
        {
          "@type": "Question",
          "name": "Hoe werkt de GPS-tracking?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Wanneer een schilder incheckt op een project, wordt de locatie vastgelegd. De reistijd tussen projecten wordt automatisch berekend. Alle data is AVG-compliant."
          }
        },
        {
          "@type": "Question",
          "name": "Kan ik maandelijks opzeggen?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absoluut. Er zijn geen langdurige contracten. Je betaalt maandelijks en kunt elk moment opzeggen. Je data kun je altijd exporteren."
          }
        },
        {
          "@type": "Question",
          "name": "Bieden jullie ook support en training?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Jazeker. Alle klanten krijgen toegang tot onze kennisbank en chat-support. Professional en Enterprise klanten krijgen daarnaast een persoonlijke onboarding en prioriteit support."
          }
        },
        {
          "@type": "Question",
          "name": "Hoe werkt tijdsregistratie voor schilders?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Tijdsregistratie voor schilders werkt door middel van GPS-check-in. Wanneer een schilder aankomt op een projectlocatie, checkt hij in via de PaintConnect app op zijn smartphone. De GPS-locatie wordt automatisch vastgelegd, wat zorgt voor een betrouwbare en objectieve registratie van de werktijden. Bij het uitchecken wordt de eindtijd geregistreerd en wordt automatisch de reistijd tussen projecten berekend. Dit systeem voldoet volledig aan de nieuwe wetgeving die vanaf 2027 van kracht is, waarbij werkgevers verplicht zijn om de werktijden van hun medewerkers digitaal te registreren. Alle data kan worden geëxporteerd naar Excel voor loonverwerking en administratie."
          }
        },
        {
          "@type": "Question",
          "name": "Wat is de beste app voor schildersbedrijven in België?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "PaintConnect is speciaal ontwikkeld voor schildersbedrijven in België en Nederland. De app combineert alle essentiële functies die een schildersbedrijf nodig heeft: GPS-tijdsregistratie, projectplanning, klantportaal, materiaalbeheer en team communicatie. Wat PaintConnect uniek maakt is dat het volledig is afgestemd op de Belgische en Nederlandse markt, inclusief ondersteuning voor de nieuwe tijdsregistratie wetgeving die vanaf 2027 verplicht is. Met meer dan 200 actieve schildersbedrijven en een klanttevredenheid van 98% is PaintConnect de meest vertrouwde oplossing voor schildersbedrijven in de Benelux. De app is beschikbaar in het Nederlands en biedt lokale support."
          }
        },
        {
          "@type": "Question",
          "name": "Hoe kan ik mijn schildersbedrijf digitaliseren?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Het digitaliseren van je schildersbedrijf begint met het implementeren van een alles-in-één software oplossing zoals PaintConnect. In plaats van verschillende systemen voor planning, urenregistratie en administratie te gebruiken, brengt PaintConnect alles samen in één platform. Het proces is eenvoudig: maak een account aan, nodig je team uit via email, en start met het aanmaken van je eerste project. Binnen 5 minuten ben je operationeel. Schilders downloaden de app op hun smartphone en kunnen direct beginnen met check-in op projectlocaties. Alle data wordt automatisch gesynchroniseerd en is real-time beschikbaar voor het hele team. Door te digitaliseren bespaar je gemiddeld 5+ uur per week aan administratie, verminder je fouten in urenregistratie, en verhoog je de transparantie naar je klanten toe via het klantportaal."
          }
        },
        {
          "@type": "Question",
          "name": "Is PaintConnect geschikt voor kleine schildersbedrijven?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ja, PaintConnect is perfect geschikt voor kleine schildersbedrijven. Het Starter plan is speciaal ontwikkeld voor freelancers en kleine teams tot 3 gebruikers, tegen een betaalbare prijs van €29 per maand. Dit plan bevat alle essentiële functies zoals basis projectmanagement, materiaal aanvragen, en het check-in systeem. Voor groeiende bedrijven is er het Professional plan (€79/maand) met uitgebreide functies zoals klantportaal, referral systeem en prioriteit support. Alle plannen kunnen maandelijks worden opgezegd, zonder langdurige contracten. Je kunt PaintConnect 14 dagen gratis uitproberen zonder creditcard."
          }
        }
      ]
    },
    // HowTo Schema - Voor GEO optimalisatie
    {
      "@type": "HowTo",
      "@id": "https://paintconnect.be/#howto-start",
      "name": "Hoe start je met PaintConnect",
      "description": "Stap-voor-stap gids om te beginnen met PaintConnect voor schildersbedrijven",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Account aanmaken",
          "text": "Vraag toegang aan via de invite pagina. Wij nemen contact met je op om je account aan te maken. Geen creditcard nodig."
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Team uitnodigen",
          "text": "Nodig je schilders uit via email. Ze ontvangen automatisch een uitnodigingsmail met download-link voor de app."
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Eerste project aanmaken",
          "text": "Maak je eerste project aan met projectnaam, klantgegevens en adres. Wijs schilders toe aan het project."
        },
        {
          "@type": "HowToStep",
          "position": 4,
          "name": "Check-in activeren",
          "text": "Schilders kunnen nu inchecken op projectlocaties met GPS-verificatie. Tijdregistratie start automatisch."
        }
      ]
    },
    // Article Schema - Voor E-E-A-T en GEO
    {
      "@type": "Article",
      "@id": "https://paintconnect.be/#article-tijdsregistratie-2027",
      "headline": "Complete Gids: Tijdsregistratie voor Schildersbedrijven 2027",
      "description": "Alles wat je moet weten over de verplichte digitale tijdsregistratie voor schildersbedrijven vanaf 2027",
      "author": {
        "@type": "Organization",
        "@id": "https://paintconnect.be/#organization",
        "name": "PaintConnect"
      },
      "publisher": {
        "@id": "https://paintconnect.be/#organization"
      },
      "datePublished": "2024-01-01",
      "dateModified": "2025-01-01",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://paintconnect.be/#wetgeving-2027"
      },
      "articleSection": "Wetgeving",
      "keywords": "tijdsregistratie 2027, urenregistratie schilders, digitale tijdsregistratie, GPS tijdsregistratie"
    },
    // Author Schema - Voor E-E-A-T
    {
      "@type": "Person",
      "@id": "https://paintconnect.be/#author",
      "name": "PaintConnect Team",
      "jobTitle": "Software Development Team",
      "worksFor": {
        "@id": "https://paintconnect.be/#organization"
      },
      "knowsAbout": [
        "Software voor schildersbedrijven",
        "GPS tijdsregistratie",
        "Projectmanagement",
        "Digitale transformatie voor bouwbedrijven"
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={inter.variable}>
      <head>
        {/* Structured Data / JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://qtrypzzcjebvfcihiynt.supabase.co" />
        <link rel="dns-prefetch" href="https://qtrypzzcjebvfcihiynt.supabase.co" />
        {/* Preload critical hero images for better LCP */}
        <link rel="preload" href="/hero-mockup.png" as="image" fetchPriority="high" />
        {/* Geo targeting - Belgium first */}
        <meta name="geo.region" content="BE" />
        <meta name="geo.region" content="NL" />
        <meta name="geo.placename" content="België, Nederland" />
        {/* Additional SEO */}
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PaintConnect" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
