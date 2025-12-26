import { Metadata } from "next";
import { Building, Eye, Share2, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Klantportaal - PaintConnect Docs",
  description: "Klanten toegang geven tot projectvoortgang",
};

export default function ClientPortalPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Klantportaal</h1>
      
      <p className="lead">
        Het Klantportaal geeft je klanten toegang tot de voortgang van hun projecten. Klanten kunnen 
        foto's bekijken, updates lezen en direct communiceren met je team - allemaal op één plek.
      </p>

      <h2>Wat is het Klantportaal?</h2>
      <p>
        Het Klantportaal is een beveiligde webpagina waar klanten kunnen:
      </p>
      <ul>
        <li>De voortgang van hun project bekijken</li>
        <li>Foto's van het werk zien</li>
        <li>Updates en notities lezen</li>
        <li>Direct communiceren met je team</li>
        <li>Documenten downloaden (offertes, facturen, etc.)</li>
      </ul>

      <h2>Klantportaal activeren</h2>
      
      <h3>Stap 1: Ga naar het project</h3>
      <ol>
        <li>Open het project waarvoor je het klantportaal wilt activeren</li>
        <li>Klik op "Klantportaal" in het menu</li>
      </ol>

      <h3>Stap 2: Portaal instellen</h3>
      <p>
        Je kunt kiezen wat klanten kunnen zien:
      </p>
      <ul>
        <li><strong>Foto's:</strong> Toon alle foto's of alleen geselecteerde</li>
        <li><strong>Updates:</strong> Toon alle updates of alleen belangrijke</li>
        <li><strong>Documenten:</strong> Selecteer welke documenten zichtbaar zijn</li>
        <li><strong>Communicatie:</strong> Sta toe dat klanten berichten kunnen sturen</li>
      </ul>

      <h3>Stap 3: Link delen</h3>
      <p>
        Er zijn twee manieren om het klantportaal te delen:
      </p>
      <ol>
        <li><strong>Link kopiëren:</strong> Kopieer de unieke link en deel deze met je klant</li>
        <li><strong>E-mail uitnodiging:</strong> Verstuur een uitnodiging per e-mail vanuit PaintConnect</li>
      </ol>

      <h2>Beveiliging</h2>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
        <div className="flex items-center gap-3 mb-3">
          <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="m-0">Privacy en beveiliging</h3>
        </div>
        <p className="mb-0">
          Elke klantportaal link is uniek en beveiligd. Klanten kunnen alleen hun eigen projecten zien 
          en hebben geen toegang tot andere projecten of bedrijfsgegevens.
        </p>
      </div>

      <h3>Link beveiliging</h3>
      <ul>
        <li>Elke link is uniek en kan niet worden geraden</li>
        <li>Links kunnen worden gedeactiveerd op elk moment</li>
        <li>Je kunt zien wanneer een klant het portaal heeft bekeken</li>
        <li>Links verlopen niet automatisch (maar kunnen handmatig worden gedeactiveerd)</li>
      </ul>

      <h2>Klantervaring</h2>
      
      <h3>Wat zien klanten?</h3>
      <p>
        Wanneer een klant het portaal opent, ziet hij:
      </p>
      <ul>
        <li><strong>Projectoverzicht:</strong> Naam, status en belangrijke informatie</li>
        <li><strong>Foto's:</strong> Alle foto's die je hebt gedeeld, chronologisch geordend</li>
        <li><strong>Updates:</strong> Alle updates en notities die je hebt gedeeld</li>
        <li><strong>Documenten:</strong> Offertes, contracten en andere documenten</li>
        <li><strong>Communicatie:</strong> Mogelijkheid om berichten te sturen</li>
      </ul>

      <h3>Mobiele weergave</h3>
      <p>
        Het klantportaal is volledig responsive en werkt perfect op:
      </p>
      <ul>
        <li>Desktop computers</li>
        <li>Tablets</li>
        <li>Smartphones</li>
      </ul>

      <h2>Communicatie</h2>
      <p>
        Klanten kunnen direct communiceren met je team:
      </p>
      <ol>
        <li>Klant opent het portaal</li>
        <li>Klikt op "Bericht sturen"</li>
        <li>Typ een bericht</li>
        <li>Verstuurt het bericht</li>
        <li>Je team ontvangt een notificatie</li>
        <li>Je kunt reageren vanuit PaintConnect</li>
      </ol>

      <h2>Notificaties</h2>
      <p>
        Je kunt klanten automatisch notificaties sturen wanneer:
      </p>
      <ul>
        <li>Nieuwe foto's worden geüpload</li>
        <li>Nieuwe updates worden gemaakt</li>
        <li>De projectstatus verandert</li>
        <li>Nieuwe documenten worden toegevoegd</li>
      </ul>

      <h2>Portaal beheren</h2>
      
      <h3>Instellingen wijzigen</h3>
      <p>
        Je kunt op elk moment de instellingen van het portaal wijzigen:
      </p>
      <ol>
        <li>Ga naar het project</li>
        <li>Klik op "Klantportaal"</li>
        <li>Wijzig de instellingen</li>
        <li>Sla de wijzigingen op</li>
      </ol>

      <h3>Portaal deactiveren</h3>
      <p>
        Je kunt het portaal op elk moment deactiveren:
      </p>
      <ol>
        <li>Ga naar het project</li>
        <li>Klik op "Klantportaal"</li>
        <li>Klik op "Portaal deactiveren"</li>
        <li>Bevestig de deactivering</li>
      </ol>
      <p>
        Na deactivering kunnen klanten het portaal niet meer openen, maar de link blijft bestaan 
        en kan later weer worden geactiveerd.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>Deel het portaal vroeg in het project voor transparantie</li>
        <li>Upload regelmatig foto's om klanten betrokken te houden</li>
        <li>Maak regelmatig updates om klanten op de hoogte te houden</li>
        <li>Reageer snel op berichten van klanten</li>
        <li>Gebruik het portaal om vertrouwen op te bouwen</li>
        <li>Deel belangrijke documenten via het portaal</li>
      </ul>
    </article>
  );
}


