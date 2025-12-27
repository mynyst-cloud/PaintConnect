import { Metadata } from "next";
import { BarChart3, TrendingUp, Users, Clock, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics - PaintConnect Docs",
  description: "Inzicht in bedrijfsprestaties",
};

export default function AnalyticsPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Analytics</h1>
      
      <p className="lead">
        Analytics geeft je inzicht in de prestaties van je bedrijf. Bekijk statistieken over 
        projecten, teamproductiviteit, urenregistratie en meer.
      </p>

      <h2>Overzicht</h2>
      <p>
        Analytics toont verschillende statistieken en rapporten:
      </p>
      <ul>
        <li>Projectstatistieken</li>
        <li>Teamproductiviteit</li>
        <li>Urenregistratie</li>
        <li>Kosten en budgetten</li>
        <li>Trends en patronen</li>
      </ul>

      <h2>Beschikbare rapporten</h2>
      
      <div className="my-8 space-y-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Projectstatistieken</h3>
          </div>
          <p className="mb-0">
            Overzicht van alle projecten met statistieken zoals aantal projecten, voltooiingspercentage, 
            gemiddelde projectduur en meer.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="m-0">Teamproductiviteit</h3>
          </div>
          <p className="mb-0">
            Inzicht in de productiviteit van je team, inclusief gewerkte uren per schilder, 
            aantal projecten per schilder en meer.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="m-0">Urenregistratie</h3>
          </div>
          <p className="mb-0">
            Gedetailleerde rapporten over gewerkte uren, inclusief uren per project, per schilder, 
            per week/maand en trends over tijd.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h3 className="m-0">Kosten en budgetten</h3>
          </div>
          <p className="mb-0">
            Overzicht van kosten per project, materiaalkosten, budgetten versus werkelijke kosten 
            en winstmarges.
          </p>
        </div>
      </div>

      <h2>Rapporten bekijken</h2>
      
      <h3>Standaard rapporten</h3>
      <p>
        Ga naar Analytics om standaard rapporten te bekijken:
      </p>
      <ol>
        <li>Klik op "Analytics" in het hoofdmenu</li>
        <li>Selecteer het type rapport dat je wilt bekijken</li>
        <li>Kies een periode (week, maand, kwartaal, jaar)</li>
        <li>Pas filters toe indien nodig</li>
      </ol>

      <h3>Rapporten exporteren</h3>
      <p>
        Je kunt rapporten exporteren voor gebruik in andere systemen:
      </p>
      <ol>
        <li>Open het rapport dat je wilt exporteren</li>
        <li>Klik op "Exporteren"</li>
        <li>Kies een formaat (PDF, Excel, CSV)</li>
        <li>Download het bestand</li>
      </ol>

      <h2>Filters en periodes</h2>
      <p>
        Je kunt rapporten filteren op:
      </p>
      <ul>
        <li><strong>Periode:</strong> Week, maand, kwartaal, jaar of aangepaste periode</li>
        <li><strong>Project:</strong> Specifiek project of alle projecten</li>
        <li><strong>Schilder:</strong> Specifieke schilder of alle schilders</li>
        <li><strong>Status:</strong> Alleen actieve, voltooide of geannuleerde projecten</li>
      </ul>

      <h2>Trends en patronen</h2>
      <p>
        Analytics helpt je om trends en patronen te identificeren:
      </p>
      <ul>
        <li><strong>Seizoenspatronen:</strong> Zie wanneer je het drukst bent</li>
        <li><strong>Productiviteitstrends:</strong> Bekijk hoe productiviteit verandert over tijd</li>
        <li><strong>Kostentrends:</strong> Zie hoe kosten veranderen</li>
        <li><strong>Teamtrends:</strong> Identificeer welke schilders het meest productief zijn</li>
      </ul>

      <h2>Dashboard widgets</h2>
      <p>
        Belangrijke statistieken worden ook getoond op het Dashboard:
      </p>
      <ul>
        <li>Aantal actieve projecten</li>
        <li>Gewerkte uren deze week</li>
        <li>Openstaande materiaalaanvragen</li>
        <li>Team productiviteit</li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>Bekijk regelmatig je analytics om trends te identificeren</li>
        <li>Gebruik filters om specifieke inzichten te krijgen</li>
        <li>Exporteer rapporten voor presentaties of administratie</li>
        <li>Vergelijk periodes om vooruitgang te meten</li>
        <li>Gebruik trends om toekomstige planning te verbeteren</li>
        <li>Deel belangrijke statistieken met je team</li>
      </ul>
    </article>
  );
}



