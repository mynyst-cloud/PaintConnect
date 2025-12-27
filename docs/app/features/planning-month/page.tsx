import { Metadata } from "next";
import { Calendar, Users, Clock, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Planning - Maandweergave - PaintConnect Docs",
  description: "Projecten plannen in maandoverzicht",
};

export default function PlanningMonthPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Planning - Maandweergave</h1>
      
      <p className="lead">
        De maandweergave geeft je een overzichtelijk beeld van alle projecten die gepland staan 
        voor de komende maand. Perfect voor strategische planning en capaciteitsbeheer.
      </p>

      <h2>Overzicht</h2>
      <p>
        De maandweergave toont:
      </p>
      <ul>
        <li>Alle projecten in een kalenderweergave</li>
        <li>Projecten per dag, week en maand</li>
        <li>Toegewezen schilders per project</li>
        <li>Projectstatus en voortgang</li>
        <li>Conflicten en overlappingen</li>
      </ul>

      <h2>Planning gebruiken</h2>
      
      <h3>Projecten toevoegen aan planning</h3>
      <ol>
        <li>Ga naar de Planning pagina</li>
        <li>Zorg dat je in de "Maandweergave" bent (standaard)</li>
        <li>Klik op een dag in de kalender</li>
        <li>Selecteer een project om toe te voegen</li>
        <li>Het project wordt automatisch toegevoegd aan de geselecteerde dag</li>
      </ol>

      <h3>Projecten verplaatsen</h3>
      <p>
        Je kunt projecten eenvoudig verplaatsen:
      </p>
      <ul>
        <li><strong>Drag & Drop:</strong> Sleep een project naar een andere dag</li>
        <li><strong>Bewerken:</strong> Klik op een project en wijzig de start- of einddatum</li>
      </ul>

      <h3>Projectdetails bekijken</h3>
      <p>
        Klik op een project in de planning om:
      </p>
      <ul>
        <li>Projectdetails te bekijken</li>
        <li>Toegewezen schilders te zien</li>
        <li>De projectstatus te wijzigen</li>
        <li>Naar de projectdetailpagina te gaan</li>
      </ul>

      <h2>Navigatie</h2>
      
      <div className="my-8 space-y-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Maand navigatie</h3>
          </div>
          <p className="mb-0">
            Gebruik de pijltjes links en rechts om naar de vorige of volgende maand te gaan. 
            Klik op "Vandaag" om terug te gaan naar de huidige maand.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="m-0">Filteren</h3>
          </div>
          <p className="mb-0">
            Filter projecten op schilder, status, of prioriteit om alleen relevante projecten te zien.
          </p>
        </div>
      </div>

      <h2>Capaciteitsplanning</h2>
      <p>
        De maandweergave helpt je bij capaciteitsplanning:
      </p>
      <ul>
        <li><strong>Overzicht:</strong> Zie in één oogopslag welke schilders wanneer bezet zijn</li>
        <li><strong>Conflicten:</strong> Wordt automatisch gewaarschuwd bij overlappingen</li>
        <li><strong>Beschikbaarheid:</strong> Zie wanneer schilders beschikbaar zijn voor nieuwe projecten</li>
      </ul>

      <h2>Projectstatus</h2>
      <p>
        Projecten worden in de planning getoond met verschillende kleuren op basis van hun status:
      </p>
      <ul>
        <li><strong>Groen:</strong> Project is voltooid</li>
        <li><strong>Blauw:</strong> Project is in uitvoering</li>
        <li><strong>Geel:</strong> Project is gepland maar nog niet gestart</li>
        <li><strong>Rood:</strong> Project heeft aandacht nodig (achterstand of probleem)</li>
      </ul>

      <h2>Weekweergave</h2>
      <p>
        Voor een gedetailleerder overzicht kun je overschakelen naar de weekweergave:
      </p>
      <ol>
        <li>Klik op de toggle "Weekweergave" bovenaan de planning</li>
        <li>Je ziet nu een gedetailleerd overzicht per week</li>
        <li>In de weekweergave kun je ook voertuigen, onderaannemers en taken beheren</li>
      </ol>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-900 dark:text-blue-100 font-semibold mb-2">Let op</h3>
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              De weekweergave is alleen beschikbaar voor Professional en Enterprise abonnementen. 
              De maandweergave is beschikbaar voor alle abonnementen vanaf Starter.
            </p>
          </div>
        </div>
      </div>

      <h2>Tips</h2>
      <ul>
        <li>Plan projecten ruim van tevoren om conflicten te voorkomen</li>
        <li>Gebruik de filterfunctie om overzicht te houden bij veel projecten</li>
        <li>Check regelmatig op conflicten en overlappingen</li>
        <li>Update de projectstatus regelmatig voor accurate planning</li>
        <li>Gebruik de weekweergave voor gedetailleerde resource planning</li>
      </ul>
    </article>
  );
}



