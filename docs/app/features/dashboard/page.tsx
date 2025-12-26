import { Metadata } from "next";
import { LayoutDashboard, TrendingUp, Clock, Package, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - PaintConnect Docs",
  description: "Leer hoe je het Dashboard gebruikt",
};

export default function DashboardPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Dashboard</h1>
      
      <p className="lead">
        Het Dashboard is je centrale hub in PaintConnect. Hier zie je een overzicht van alle 
        belangrijke activiteiten, statistieken en recente projecten op één plek.
      </p>

      <h2>Overzicht</h2>
      <p>
        Het Dashboard geeft je direct inzicht in:
      </p>
      <ul>
        <li>Actieve projecten en hun status</li>
        <li>Openstaande taken en meldingen</li>
        <li>Team activiteit en check-ins</li>
        <li>Recente updates en foto's</li>
        <li>Materiaalaanvragen die aandacht nodig hebben</li>
        <li>Belangrijke statistieken en trends</li>
      </ul>

      <h2>Dashboard secties</h2>
      
      <div className="my-8 space-y-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Projecten overzicht</h3>
          </div>
          <p className="mb-0">
            Zie alle actieve projecten met hun status, voortgang en belangrijke informatie. 
            Klik op een project om direct naar de detailpagina te gaan.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="m-0">Statistieken</h3>
          </div>
          <p className="mb-0">
            Belangrijke statistieken zoals aantal actieve projecten, gewerkte uren deze week, 
            openstaande materiaalaanvragen en team productiviteit.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="m-0">Recente activiteit</h3>
          </div>
          <p className="mb-0">
            Een tijdlijn van recente activiteiten zoals nieuwe projecten, check-ins, foto uploads, 
            en materiaalaanvragen.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h3 className="m-0">Materiaalaanvragen</h3>
          </div>
          <p className="mb-0">
            Overzicht van materiaalaanvragen die aandacht nodig hebben, zoals nieuwe aanvragen, 
            aanvragen die goedgekeurd moeten worden, of leveringen die onderweg zijn.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="m-0">Meldingen</h3>
          </div>
          <p className="mb-0">
            Belangrijke meldingen en waarschuwingen, zoals projecten die achterlopen, 
            materiaalaanvragen die goedkeuring nodig hebben, of teamleden die nog niet hebben ingecheckt.
          </p>
        </div>
      </div>

      <h2>Snelle acties</h2>
      <p>
        Vanuit het Dashboard kun je snel:
      </p>
      <ul>
        <li>Een nieuw project aanmaken</li>
        <li>Een materiaalaanvraag indienen</li>
        <li>Een beschadiging melden</li>
        <li>Een dagelijkse update maken</li>
        <li>Naar de planning gaan</li>
        <li>Teamleden uitnodigen</li>
      </ul>

      <h2>Dashboard aanpassen</h2>
      <p>
        Je kunt het Dashboard aanpassen aan je voorkeuren:
      </p>
      <ul>
        <li><strong>Widgets verbergen/tonen:</strong> Klik op het instellingen-icoon om widgets te verbergen of tonen</li>
        <li><strong>Volgorde wijzigen:</strong> Sleep widgets om ze te herordenen</li>
        <li><strong>Filteren:</strong> Filter projecten op status, prioriteit of toegewezen teamlid</li>
      </ul>

      <h2>Statistieken begrijpen</h2>
      
      <h3>Gewerkte uren</h3>
      <p>
        Het totaal aantal uren dat deze week is gewerkt door alle teamleden, gebaseerd op 
        check-in/check-out registraties.
      </p>

      <h3>Actieve projecten</h3>
      <p>
        Het aantal projecten dat momenteel "In uitvoering" is. Dit geeft je een overzicht van 
        je huidige werkdruk.
      </p>

      <h3>Openstaande aanvragen</h3>
      <p>
        Het aantal materiaalaanvragen dat nog niet is goedgekeurd of afgehandeld. Dit helpt je 
        om prioriteiten te stellen.
      </p>

      <h3>Team productiviteit</h3>
      <p>
        Een overzicht van de productiviteit van je team, gebaseerd op gewerkte uren en 
        voltooide taken.
      </p>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 my-8">
        <p className="text-emerald-800 dark:text-emerald-200 font-medium mb-2">
          💡 Tip
        </p>
        <p className="text-emerald-700 dark:text-emerald-300 mb-0">
          Gebruik het Dashboard dagelijks om een overzicht te krijgen van wat er gebeurt in je 
          bedrijf. Het helpt je om prioriteiten te stellen en snel te reageren op belangrijke zaken.
        </p>
      </div>
    </article>
  );
}


