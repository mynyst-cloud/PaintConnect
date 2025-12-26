import { Metadata } from "next";
import { Package, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Materiaalbeheer - PaintConnect Docs",
  description: "Materialen aanvragen en beheren",
};

export default function MaterialsPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Materiaalbeheer</h1>
      
      <p className="lead">
        Het Materiaalbeheer systeem helpt je om materiaalaanvragen in te dienen, goed te keuren 
        en te volgen van aanvraag tot levering. Perfect voor het beheren van materialen voor al 
        je projecten.
      </p>

      <h2>Materiaalaanvraag indienen</h2>
      
      <h3>Stap 1: Nieuwe aanvraag</h3>
      <ol>
        <li>Ga naar "Materialen" in het hoofdmenu</li>
        <li>Klik op "Nieuwe aanvraag" of het "+" icoon</li>
        <li>Selecteer het project waarvoor je materialen nodig hebt</li>
      </ol>

      <h3>Stap 2: Materialen toevoegen</h3>
      <p>
        Voeg materialen toe aan je aanvraag:
      </p>
      <ul>
        <li><strong>Materiaal:</strong> Selecteer uit je materiaallijst of voeg een nieuw materiaal toe</li>
        <li><strong>Hoeveelheid:</strong> Geef aan hoeveel je nodig hebt</li>
        <li><strong>Eenheid:</strong> Liter, kilogram, stuks, etc.</li>
        <li><strong>Leverancier:</strong> Selecteer een leverancier (optioneel)</li>
        <li><strong>Opmerkingen:</strong> Voeg extra informatie toe (optioneel)</li>
      </ul>

      <h3>Stap 3: Aanvraag indienen</h3>
      <p>
        Nadat je alle materialen hebt toegevoegd:
      </p>
      <ol>
        <li>Controleer de aanvraag</li>
        <li>Klik op "Aanvraag indienen"</li>
        <li>De aanvraag wordt verstuurd naar de goedkeurder</li>
      </ol>

      <h2>Aanvraagstatus</h2>
      <p>
        Elke aanvraag heeft een status die aangeeft in welke fase deze zich bevindt:
      </p>

      <div className="my-8 space-y-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h3 className="m-0">In behandeling</h3>
          </div>
          <p className="mb-0">
            De aanvraag is ingediend en wacht op goedkeuring.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Goedgekeurd</h3>
          </div>
          <p className="mb-0">
            De aanvraag is goedgekeurd en kan worden besteld bij de leverancier.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="m-0">Afgewezen</h3>
          </div>
          <p className="mb-0">
            De aanvraag is afgewezen. Je kunt de reden bekijken en eventueel een nieuwe aanvraag indienen.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="m-0">Besteld</h3>
          </div>
          <p className="mb-0">
            De materialen zijn besteld bij de leverancier en zijn onderweg.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Geleverd</h3>
          </div>
          <p className="mb-0">
            De materialen zijn geleverd en ontvangen.
          </p>
        </div>
      </div>

      <h2>Aanvragen goedkeuren</h2>
      
      <h3>Voor goedkeurders</h3>
      <p>
        Als je rechten hebt om aanvragen goed te keuren:
      </p>
      <ol>
        <li>Ga naar "Materialen" in het hoofdmenu</li>
        <li>Klik op "Goedkeuren" in de navigatie</li>
        <li>Je ziet alle aanvragen die goedkeuring nodig hebben</li>
        <li>Klik op een aanvraag om details te bekijken</li>
        <li>Kies "Goedkeuren" of "Afwijzen"</li>
        <li>Voeg eventueel opmerkingen toe</li>
        <li>Bevestig je keuze</li>
      </ol>

      <h3>Goedkeuringscriteria</h3>
      <p>
        Bij het goedkeuren kun je letten op:
      </p>
      <ul>
        <li>Of de materialen nodig zijn voor het project</li>
        <li>Of de hoeveelheden redelijk zijn</li>
        <li>Of het budget toereikend is</li>
        <li>Of er alternatieven zijn</li>
      </ul>

      <h2>Leveranciers beheren</h2>
      <p>
        Beheer je leveranciers in PaintConnect:
      </p>
      <ol>
        <li>Ga naar "Materialen" → "Leveranciers"</li>
        <li>Klik op "Nieuwe leverancier"</li>
        <li>Vul de gegevens in:
          <ul>
            <li>Bedrijfsnaam</li>
            <li>Contactpersoon</li>
            <li>E-mailadres en telefoonnummer</li>
            <li>Adres</li>
            <li>Opmerkingen</li>
          </ul>
        </li>
        <li>Sla de leverancier op</li>
      </ol>

      <h2>Materialen beheren</h2>
      <p>
        Beheer je materiaallijst:
      </p>
      <ol>
        <li>Ga naar "Materialen" → "Materialenlijst"</li>
        <li>Klik op "Nieuw materiaal"</li>
        <li>Vul de gegevens in:
          <ul>
            <li>Materiaalnaam</li>
            <li>Categorie (verf, gereedschap, etc.)</li>
            <li>Standaard eenheid</li>
            <li>Standaard leverancier (optioneel)</li>
            <li>Standaard prijs (optioneel)</li>
          </ul>
        </li>
        <li>Sla het materiaal op</li>
      </ol>

      <h2>Bestellingen volgen</h2>
      <p>
        Volg de status van je bestellingen:
      </p>
      <ul>
        <li>Bekijk wanneer materialen zijn besteld</li>
        <li>Zie wanneer leveringen worden verwacht</li>
        <li>Markeer leveringen als ontvangen</li>
        <li>Upload leveringsbonnen</li>
      </ul>

      <h2>Kostenbeheer</h2>
      <p>
        Het Materiaalbeheer systeem helpt je bij kostenbeheer:
      </p>
      <ul>
        <li>Bekijk de kosten per aanvraag</li>
        <li>Zie de totale kosten per project</li>
        <li>Vergelijk kosten met budget</li>
        <li>Exporteer kostenrapporten</li>
      </ul>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-emerald-900 dark:text-emerald-100 font-semibold mb-2">Tip</h3>
            <p className="text-emerald-800 dark:text-emerald-200 mb-0">
              Dien materiaalaanvragen ruim van tevoren in om te zorgen dat materialen op tijd 
              beschikbaar zijn. Dit voorkomt vertragingen in je projecten.
            </p>
          </div>
        </div>
      </div>

      <h2>Tips</h2>
      <ul>
        <li>Dien aanvragen ruim van tevoren in</li>
        <li>Gebruik duidelijke materiaalnamen</li>
        <li>Voeg opmerkingen toe voor extra context</li>
        <li>Houd leveranciers up-to-date</li>
        <li>Markeer leveringen direct als ontvangen</li>
        <li>Upload leveringsbonnen voor administratie</li>
        <li>Gebruik de kostenrapporten om budgetten te bewaken</li>
      </ul>
    </article>
  );
}


