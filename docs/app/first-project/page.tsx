import { Metadata } from "next";
import { Briefcase, Calendar, Users, Package, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Eerste project - PaintConnect Docs",
  description: "Je eerste project aanmaken en beheren",
};

export default function FirstProjectPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Je eerste project</h1>
      
      <p className="lead">
        Leer hoe je je eerste project aanmaakt in PaintConnect. Een project is de centrale 
        eenheid voor het beheren van een schilderklus van begin tot eind.
      </p>

      <h2>Project aanmaken</h2>
      
      <h3>Stap 1: Ga naar Projecten</h3>
      <ol>
        <li>Klik op "Projecten" in het hoofdmenu</li>
        <li>Klik op "Nieuw project" of het "+" icoon</li>
      </ol>

      <h3>Stap 2: Vul de basisgegevens in</h3>
      <p>
        Vul de volgende verplichte velden in:
      </p>
      <ul>
        <li><strong>Projectnaam:</strong> Een duidelijke naam voor het project (bijv. "Woning Janssen - Woonkamer")</li>
        <li><strong>Klant:</strong> Selecteer een bestaande klant of maak een nieuwe aan</li>
        <li><strong>Startdatum:</strong> Wanneer het project start</li>
        <li><strong>Einddatum:</strong> Wanneer het project naar verwachting klaar is</li>
        <li><strong>Adres:</strong> Het adres waar het werk wordt uitgevoerd</li>
      </ul>

      <h3>Stap 3: Voeg details toe</h3>
      <p>
        Optioneel kun je extra informatie toevoegen:
      </p>
      <ul>
        <li><strong>Beschrijving:</strong> Details over het project</li>
        <li><strong>Budget:</strong> Het budget voor het project</li>
        <li><strong>Status:</strong> De huidige status (Nieuw, In uitvoering, Voltooid, etc.)</li>
        <li><strong>Prioriteit:</strong> Laag, Normaal, Hoog</li>
      </ul>

      <h3>Stap 4: Sla het project op</h3>
      <p>
        Klik op "Project aanmaken" om het project op te slaan. Je wordt doorgestuurd naar de 
        projectdetailpagina waar je verder kunt werken.
      </p>

      <h2>Project configureren</h2>
      
      <div className="grid md:grid-cols-2 gap-6 my-8">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Schilders toewijzen</h3>
          </div>
          <p className="mb-0">
            Wijs schilders toe aan het project zodat ze kunnen check-in, foto's uploaden en updates maken.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="m-0">Inplannen</h3>
          </div>
          <p className="mb-0">
            Plan het project in de maand- of weekplanning zodat je overzicht hebt van alle werkzaamheden.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="m-0">Materialen</h3>
          </div>
          <p className="mb-0">
            Voeg materialen toe of dien materiaalaanvragen in voor het project.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h3 className="m-0">Documenten</h3>
          </div>
          <p className="mb-0">
            Upload offertes, contracten, foto's en andere relevante documenten.
          </p>
        </div>
      </div>

      <h2>Project beheren</h2>
      
      <h3>Status bijwerken</h3>
      <p>
        Update de status van je project naarmate het vordert:
      </p>
      <ul>
        <li><strong>Nieuw:</strong> Project is aangemaakt maar nog niet gestart</li>
        <li><strong>In uitvoering:</strong> Project is actief en wordt uitgevoerd</li>
        <li><strong>Gepauzeerd:</strong> Project is tijdelijk gestopt</li>
        <li><strong>Voltooid:</strong> Project is afgerond</li>
        <li><strong>Geannuleerd:</strong> Project is geannuleerd</li>
      </ul>

      <h3>Voortgang bijhouden</h3>
      <p>
        Je kunt de voortgang van je project op verschillende manieren bijhouden:
      </p>
      <ul>
        <li><strong>Foto's:</strong> Upload foto's van de voortgang</li>
        <li><strong>Updates:</strong> Maak dagelijkse of wekelijkse updates</li>
        <li><strong>Check-ins:</strong> Bekijk wanneer teamleden hebben ingecheckt</li>
        <li><strong>Urenregistratie:</strong> Houd bij hoeveel uren er zijn gewerkt</li>
      </ul>

      <h3>Klantportaal delen</h3>
      <p>
        Geef je klant toegang tot het project via het klantportaal:
      </p>
      <ol>
        <li>Ga naar de projectdetailpagina</li>
        <li>Klik op "Klantportaal"</li>
        <li>Kopieer de link of verstuur een uitnodiging per e-mail</li>
        <li>De klant kan nu de voortgang bekijken en updates ontvangen</li>
      </ol>

      <h2>Best practices</h2>
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 my-8">
        <h3 className="text-emerald-900 dark:text-emerald-100 font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Tips voor succesvol projectbeheer
        </h3>
        <ul className="text-emerald-800 dark:text-emerald-200 mb-0">
          <li>Gebruik duidelijke en beschrijvende projectnamen</li>
          <li>Wijs altijd minstens één schilder toe aan elk project</li>
          <li>Plan projecten ruim van tevoren in de planning</li>
          <li>Upload regelmatig foto's voor documentatie</li>
          <li>Houd de projectstatus up-to-date</li>
          <li>Gebruik het klantportaal voor transparantie</li>
        </ul>
      </div>

      <h2>Volgende stappen</h2>
      <p>
        Nu je je eerste project hebt aangemaakt, kun je:
      </p>
      <ul>
        <li>Meer projecten aanmaken</li>
        <li>De planning gebruiken om projecten in te plannen</li>
        <li>Materialen aanvragen voor je projecten</li>
        <li>Het check-in systeem gebruiken voor tijdsregistratie</li>
        <li>Het dashboard bekijken voor een overzicht van alle projecten</li>
      </ul>
    </article>
  );
}


