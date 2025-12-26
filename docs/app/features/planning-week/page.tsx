import { Metadata } from "next";
import { Calendar, Users, Truck, Briefcase, Package, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Planning - Weekweergave - PaintConnect Docs",
  description: "Gedetailleerde weekplanning met resources",
};

export default function PlanningWeekPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Planning - Weekweergave</h1>
      
      <p className="lead">
        De weekweergave biedt een gedetailleerd overzicht van alle projecten per week, inclusief 
        werknemers, voertuigen, onderaannemers, taken en materiaalleveringen. Perfect voor 
        dagelijkse planning en resource management.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-900 dark:text-blue-100 font-semibold mb-2">Abonnement vereist</h3>
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              De weekweergave is alleen beschikbaar voor Professional en Enterprise abonnementen. 
              Upgrade je abonnement om toegang te krijgen tot deze functie.
            </p>
          </div>
        </div>
      </div>

      <h2>Overzicht</h2>
      <p>
        De weekweergave toont per project:
      </p>
      <ul>
        <li>Werknemers (schilders) die aan het project werken</li>
        <li>Voertuigen die aan het project zijn toegewezen</li>
        <li>Onderaannemers/freelancers die betrokken zijn</li>
        <li>Taken die moeten worden uitgevoerd</li>
        <li>Materiaalleveringen die gepland staan</li>
      </ul>

      <h2>Weekweergave gebruiken</h2>
      
      <h3>Overschakelen naar weekweergave</h3>
      <ol>
        <li>Ga naar de Planning pagina</li>
        <li>Klik op de toggle "Weekweergave" bovenaan</li>
        <li>Je ziet nu een gedetailleerd overzicht per week</li>
      </ol>

      <h3>Week navigeren</h3>
      <p>
        Gebruik de pijltjes om naar de vorige of volgende week te gaan, of klik op "Deze week" 
        om terug te gaan naar de huidige week.
      </p>

      <h2>Projecten beheren</h2>
      
      <h3>Project uitklappen</h3>
      <p>
        Elk project in de weekweergave kan worden uitgeklapt om details te zien:
      </p>
      <ol>
        <li>Klik op het chevron-icoon naast de projectnaam</li>
        <li>Het project klapt uit en toont alle resources</li>
        <li>Klik opnieuw om het project in te klappen</li>
      </ol>

      <h3>Resources toevoegen</h3>
      <p>
        Per project kun je verschillende resources toevoegen:
      </p>

      <div className="my-8 space-y-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Werknemers</h3>
          </div>
          <p className="mb-3">
            Schilders die aan het project werken. Toegewezen schilders worden automatisch getoond, 
            maar je kunt ook handmatig schilders toevoegen of verwijderen.
          </p>
          <ul className="mb-0">
            <li>Klik op "+" om een schilder toe te voegen</li>
            <li>Selecteer een schilder uit de lijst</li>
            <li>Klik op het X-icoon om een schilder te verwijderen</li>
          </ul>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="m-0">Voertuigen</h3>
          </div>
          <p className="mb-3">
            Voertuigen die aan het project zijn toegewezen voor transport van materialen of teamleden.
          </p>
          <ul className="mb-0">
            <li>Klik op "+" om een voertuig toe te voegen</li>
            <li>Selecteer een voertuig uit je voertuigenlijst</li>
            <li>Voertuigen kunnen aan meerdere projecten worden toegewezen</li>
          </ul>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="m-0">Onderaannemers</h3>
          </div>
          <p className="mb-3">
            Freelancers of onderaannemers die aan het project werken.
          </p>
          <ul className="mb-0">
            <li>Klik op "+" om een onderaannemer toe te voegen</li>
            <li>Selecteer een onderaannemer of voeg een nieuwe toe</li>
            <li>Beheer contactgegevens en tarieven</li>
          </ul>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h3 className="m-0">Taken</h3>
          </div>
          <p className="mb-3">
            Specifieke taken die moeten worden uitgevoerd tijdens het project.
          </p>
          <ul className="mb-0">
            <li>Klik op "+" om een taak toe te voegen</li>
            <li>Geef de taak een naam en beschrijving</li>
            <li>Wijs taken toe aan specifieke schilders</li>
            <li>Markeer taken als voltooid wanneer ze klaar zijn</li>
          </ul>
        </div>
      </div>

      <h2>Automatische toewijzing</h2>
      <p>
        Schilders die aan een project zijn toegewezen worden automatisch getoond in de 
        "Werknemers" sectie van de weekplanning. Dit gebeurt automatisch voor alle dagen 
        binnen de start- en einddatum van het project.
      </p>

      <h2>Materiaalleveringen</h2>
      <p>
        Plan materiaalleveringen voor specifieke dagen:
      </p>
      <ol>
        <li>Klap het project uit in de weekweergave</li>
        <li>Ga naar de "Leveringen" sectie</li>
        <li>Klik op "+" om een levering toe te voegen</li>
        <li>Selecteer de leverancier en materialen</li>
        <li>Kies de leverdatum</li>
      </ol>

      <h2>Mobiele weergave</h2>
      <p>
        De weekweergave is volledig responsive en werkt ook op mobiele apparaten:
      </p>
      <ul>
        <li>Horizontaal scrollen om door de week te navigeren</li>
        <li>Projectnaam blijft zichtbaar aan de linkerkant</li>
        <li>Touch-friendly interface voor eenvoudig beheer</li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>Gebruik de weekweergave voor dagelijkse planning en resource management</li>
        <li>Plan voertuigen en onderaannemers ruim van tevoren</li>
        <li>Voeg taken toe om specifieke werkzaamheden te tracken</li>
        <li>Gebruik materiaalleveringen om te zorgen dat materialen op tijd beschikbaar zijn</li>
        <li>Check regelmatig op conflicten en overlappingen</li>
      </ul>
    </article>
  );
}


