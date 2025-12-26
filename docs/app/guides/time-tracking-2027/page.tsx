import { Metadata } from "next";
import { AlertCircle, CheckCircle, FileText, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Tijdsregistratie 2027 - PaintConnect Docs",
  description: "Wetgeving en compliance voor tijdsregistratie",
};

export default function TimeTracking2027Page() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Tijdsregistratie 2027</h1>
      
      <p className="lead">
        Vanaf 2027 is GPS-tijdsregistratie verplicht voor alle bedrijven in België. Deze gids 
        legt uit wat de wetgeving inhoudt en hoe PaintConnect je helpt om compliant te zijn.
      </p>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-900 dark:text-red-100 font-semibold mb-2">Verplicht vanaf 2027</h3>
            <p className="text-red-800 dark:text-red-200 mb-0">
              Vanaf 1 januari 2027 is GPS-tijdsregistratie verplicht voor alle bedrijven. Zorg ervoor 
              dat je systeem op tijd is geïmplementeerd.
            </p>
          </div>
        </div>
      </div>

      <h2>Wat is de nieuwe wetgeving?</h2>
      <p>
        De nieuwe wetgeving vereist dat bedrijven:
      </p>
      <ul>
        <li>Automatisch de start- en eindtijd van werk registreren</li>
        <li>De locatie waar het werk wordt uitgevoerd vastleggen</li>
        <li>Onveranderbare logs bijhouden</li>
        <li>Data beschikbaar houden voor inspecties</li>
        <li>Privacy van werknemers respecteren (GDPR)</li>
      </ul>

      <h2>Waarom is dit verplicht?</h2>
      <p>
        De nieuwe wetgeving heeft verschillende doelen:
      </p>
      <ul>
        <li><strong>Fraudepreventie:</strong> Voorkomt valse tijdsregistraties</li>
        <li><strong>Arbeidsrecht:</strong> Zorgt voor correcte registratie van arbeidstijd</li>
        <li><strong>Inspecties:</strong> Maakt inspecties eenvoudiger en betrouwbaarder</li>
        <li><strong>Transparantie:</strong> Verhoogt transparantie tussen werkgever en werknemer</li>
      </ul>

      <h2>Hoe voldoet PaintConnect aan de wetgeving?</h2>
      
      <div className="my-8 space-y-4">
        <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">GPS-locatie registratie</h3>
          </div>
          <p className="mb-0">
            PaintConnect registreert automatisch de GPS-locatie wanneer een schilder in- of uitcheckt. 
            Dit voldoet aan de vereiste voor locatieregistratie.
          </p>
        </div>

        <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Automatische tijdregistratie</h3>
          </div>
          <p className="mb-0">
            Tijden worden automatisch geregistreerd bij check-in en check-out. Er is geen mogelijkheid 
            om handmatig tijden in te voeren, wat fraude voorkomt.
          </p>
        </div>

        <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Onveranderbare logs</h3>
          </div>
          <p className="mb-0">
            Alle check-ins worden opgeslagen in onveranderbare logs. Alleen geautoriseerde gebruikers 
            kunnen correcties aanbrengen, en deze worden gelogd.
          </p>
        </div>

        <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Exporteerbare data</h3>
          </div>
          <p className="mb-0">
            Alle data kan worden geëxporteerd voor inspecties. Rapporten zijn beschikbaar in verschillende 
            formaten (PDF, Excel, CSV).
          </p>
        </div>

        <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">GDPR-compliant</h3>
          </div>
          <p className="mb-0">
            PaintConnect voldoet aan alle GDPR-vereisten. Locatiedata wordt alleen gebruikt voor 
            tijdsregistratie en wordt niet gedeeld met derden.
          </p>
        </div>
      </div>

      <h2>Implementatie</h2>
      
      <h3>Stap 1: Team voorbereiden</h3>
      <p>
        Bereid je team voor op de nieuwe wetgeving:
      </p>
      <ol>
        <li>Leg uit waarom GPS-tijdsregistratie nodig is</li>
        <li>Zorg dat alle teamleden de PaintConnect app hebben geïnstalleerd</li>
        <li>Test het check-in systeem met je team</li>
        <li>Beantwoord vragen en zorgen</li>
      </ol>

      <h3>Stap 2: Locatietoegang instellen</h3>
      <p>
        Zorg dat alle teamleden locatietoegang hebben gegeven:
      </p>
      <ul>
        <li><strong>iPhone:</strong> Instellingen → Privacy → Locatieservices → PaintConnect</li>
        <li><strong>Android:</strong> Instellingen → Apps → PaintConnect → Machtigingen → Locatie</li>
      </ul>

      <h3>Stap 3: Workflow aanpassen</h3>
      <p>
        Pas je workflow aan om check-ins te integreren:
      </p>
      <ul>
        <li>Zorg dat schilders altijd inchecken bij aankomst</li>
        <li>Zorg dat schilders altijd uitchecken bij vertrek</li>
        <li>Controleer regelmatig op vergeten check-outs</li>
        <li>Gebruik de rapporten om compliance te monitoren</li>
      </ul>

      <h2>Inspecties</h2>
      <p>
        Bij een inspectie moet je kunnen aantonen dat je compliant bent:
      </p>
      <ul>
        <li>Toon je tijdsregistratiesysteem</li>
        <li>Exporteer rapporten voor de inspecteur</li>
        <li>Toon dat alle werknemers zijn geregistreerd</li>
        <li>Leg uit hoe je systeem werkt</li>
      </ul>

      <h2>Veelgestelde vragen</h2>
      
      <h3>Wat als een schilder vergeet in te checken?</h3>
      <p>
        Als een schilder vergeet in te checken, kan een projectmanager dit later corrigeren. 
        Correcties worden gelogd en moeten worden gedocumenteerd.
      </p>

      <h3>Wat als GPS niet werkt?</h3>
      <p>
        Als GPS niet werkt, kan de schilder handmatig een locatie selecteren. Dit wordt gelogd 
        als een uitzondering en moet worden gedocumenteerd.
      </p>

      <h3>Is mijn data veilig?</h3>
      <p>
        Ja, alle data wordt veilig opgeslagen en versleuteld. PaintConnect voldoet aan alle 
        GDPR-vereisten en deelt geen data met derden.
      </p>

      <h3>Kan ik oude data importeren?</h3>
      <p>
        Nee, de wetgeving vereist automatische registratie vanaf 2027. Oude data kan niet worden 
        gebruikt voor compliance.
      </p>

      <h2>Tips voor compliance</h2>
      <ul>
        <li>Start op tijd met implementatie (niet wachten tot 2027)</li>
        <li>Train je team goed op het nieuwe systeem</li>
        <li>Controleer regelmatig op vergeten check-ins</li>
        <li>Houd rapporten bij voor inspecties</li>
        <li>Zorg dat alle teamleden de app hebben geïnstalleerd</li>
        <li>Test het systeem regelmatig</li>
      </ul>
    </article>
  );
}


