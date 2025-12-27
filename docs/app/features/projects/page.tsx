import { Metadata } from "next";
import { Briefcase, Camera, FileText, Users, Calendar, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Projecten - PaintConnect Docs",
  description: "Projecten beheren en volgen",
};

export default function ProjectsPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Projecten</h1>
      
      <p className="lead">
        Projecten zijn de centrale eenheid in PaintConnect. Elk schilderproject wordt beheerd als 
        een project, van offerte tot oplevering. Hier leer je hoe je projecten aanmaakt, beheert 
        en volgt.
      </p>

      <h2>Project aanmaken</h2>
      
      <h3>Basisgegevens</h3>
      <p>
        Bij het aanmaken van een project vul je de volgende gegevens in:
      </p>
      <ul>
        <li><strong>Projectnaam:</strong> Een duidelijke, beschrijvende naam</li>
        <li><strong>Klant:</strong> Selecteer een bestaande klant of maak een nieuwe aan</li>
        <li><strong>Adres:</strong> Het adres waar het werk wordt uitgevoerd</li>
        <li><strong>Startdatum:</strong> Wanneer het project start</li>
        <li><strong>Einddatum:</strong> Verwachte opleveringsdatum</li>
        <li><strong>Budget:</strong> Het budget voor het project (optioneel)</li>
        <li><strong>Beschrijving:</strong> Details over het project (optioneel)</li>
      </ul>

      <h3>Projectstatus</h3>
      <p>
        Elke project heeft een status die aangeeft in welke fase het project zich bevindt:
      </p>
      <ul>
        <li><strong>Nieuw:</strong> Project is aangemaakt maar nog niet gestart</li>
        <li><strong>In uitvoering:</strong> Project is actief en wordt uitgevoerd</li>
        <li><strong>Gepauzeerd:</strong> Project is tijdelijk gestopt</li>
        <li><strong>Voltooid:</strong> Project is afgerond</li>
        <li><strong>Geannuleerd:</strong> Project is geannuleerd</li>
      </ul>

      <h2>Project beheren</h2>
      
      <div className="my-8 space-y-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Schilders toewijzen</h3>
          </div>
          <p className="mb-0">
            Wijs schilders toe aan het project zodat ze kunnen check-in, foto's uploaden en updates maken. 
            Je kunt meerdere schilders toewijzen aan één project.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="m-0">Inplannen</h3>
          </div>
          <p className="mb-0">
            Plan het project in de maand- of weekplanning. Dit helpt je om overzicht te houden en 
            conflicten te voorkomen.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Camera className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="m-0">Foto's uploaden</h3>
          </div>
          <p className="mb-0">
            Upload foto's van de voortgang. Foto's worden automatisch gedateerd en kunnen worden 
            gedeeld met klanten via het klantportaal.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h3 className="m-0">Documenten</h3>
          </div>
          <p className="mb-0">
            Upload offertes, contracten, facturen en andere relevante documenten. Documenten kunnen 
            worden gedeeld met klanten en teamleden.
          </p>
        </div>
      </div>

      <h2>Voortgang bijhouden</h2>
      
      <h3>Updates maken</h3>
      <p>
        Maak regelmatig updates om de voortgang bij te houden:
      </p>
      <ol>
        <li>Ga naar de projectdetailpagina</li>
        <li>Klik op "Update maken"</li>
        <li>Voeg een beschrijving toe van wat er is gedaan</li>
        <li>Upload eventueel foto's</li>
        <li>Sla de update op</li>
      </ol>

      <h3>Foto's uploaden</h3>
      <p>
        Foto's zijn een belangrijk onderdeel van projectdocumentatie:
      </p>
      <ul>
        <li>Upload foto's van de voortgang</li>
        <li>Foto's worden automatisch gedateerd</li>
        <li>Foto's kunnen worden gedeeld met klanten</li>
        <li>Foto's worden opgeslagen in de cloud</li>
      </ul>

      <h3>Check-ins bekijken</h3>
      <p>
        Bekijk wanneer schilders hebben ingecheckt en uitgecheckt:
      </p>
      <ol>
        <li>Ga naar de projectdetailpagina</li>
        <li>Klik op "Check-ins"</li>
        <li>Je ziet alle check-ins met locatie en tijd</li>
        <li>Check-ins worden ook getoond op een kaart</li>
      </ol>

      <h2>Projectweergaven</h2>
      
      <h3>Lijstweergave</h3>
      <p>
        Standaard worden projecten getoond in een lijst met:
      </p>
      <ul>
        <li>Projectnaam en klant</li>
        <li>Status en voortgang</li>
        <li>Start- en einddatum</li>
        <li>Toegewezen schilders</li>
      </ul>

      <h3>Kaartweergave</h3>
      <p>
        Bekijk projecten op een kaart:
      </p>
      <ol>
        <li>Klik op het kaart-icoon in de projectenlijst</li>
        <li>Je ziet alle projecten op een kaart</li>
        <li>Klik op een project om details te zien</li>
        <li>Filter op status of schilder</li>
      </ol>

      <h2>Klantportaal</h2>
      <p>
        Geef klanten toegang tot het project via het klantportaal:
      </p>
      <ol>
        <li>Ga naar de projectdetailpagina</li>
        <li>Klik op "Klantportaal"</li>
        <li>Kopieer de link of verstuur een uitnodiging per e-mail</li>
        <li>Klanten kunnen nu de voortgang bekijken en updates ontvangen</li>
      </ol>

      <h2>Project zoeken en filteren</h2>
      <p>
        Bij veel projecten kun je gebruik maken van zoeken en filteren:
      </p>
      <ul>
        <li><strong>Zoeken:</strong> Zoek op projectnaam, klant of adres</li>
        <li><strong>Filter op status:</strong> Toon alleen projecten met een bepaalde status</li>
        <li><strong>Filter op schilder:</strong> Toon alleen projecten van een bepaalde schilder</li>
        <li><strong>Filter op datum:</strong> Toon alleen projecten binnen een bepaalde periode</li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>Gebruik duidelijke en beschrijvende projectnamen</li>
        <li>Wijs altijd minstens één schilder toe aan elk project</li>
        <li>Plan projecten ruim van tevoren in de planning</li>
        <li>Upload regelmatig foto's voor documentatie</li>
        <li>Houd de projectstatus up-to-date</li>
        <li>Gebruik het klantportaal voor transparantie</li>
        <li>Maak regelmatig updates om de voortgang bij te houden</li>
      </ul>
    </article>
  );
}



