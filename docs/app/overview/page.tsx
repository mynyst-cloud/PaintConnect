import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Overzicht - PaintConnect Docs",
  description: "Welkom bij PaintConnect - een introductie tot het platform",
};

export default function OverviewPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Aan de slag</span>
        </div>
        <h1>Welkom bij PaintConnect</h1>
      </div>
      
      <p className="lead text-xl text-gray-600 dark:text-gray-400 mb-8">
        PaintConnect is een alles-in-één softwareplatform, speciaal ontworpen om schildersbedrijven 
        te helpen hun projecten, team en materialen efficiënt te beheren. Van planning en 
        voortgangsrapportages tot communicatie met klanten en leveranciers, PaintConnect stroomlijnt 
        uw volledige workflow.
      </p>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-8">
        <h3 className="text-emerald-900 dark:text-emerald-100 font-semibold mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Wat is PaintConnect?
        </h3>
        <p className="text-emerald-800 dark:text-emerald-200 mb-0">
          PaintConnect is ontwikkeld voor zowel kleine zelfstandige schilders als grote schildersbedrijven 
          met meerdere teams. Het platform helpt je bij projectmanagement, planning, tijdsregistratie, 
          materiaalbeheer en klantcommunicatie - alles op één plek.
        </p>
      </div>

      <h2>Belangrijkste functies</h2>
      <ul>
        <li><strong>Dashboard:</strong> Centraal overzicht van alle belangrijke activiteiten en statistieken</li>
        <li><strong>Planning:</strong> Visuele kalender om projecten in te plannen en toe te wijzen aan schilders</li>
        <li><strong>Projectenbeheer:</strong> Beheer al je schilderprojecten, van start tot finish</li>
        <li><strong>Check-in Systeem:</strong> GPS-tijdsregistratie voor compliance met de 2027 wetgeving</li>
        <li><strong>Materiaalbeheer:</strong> Dien materiaalaanvragen in en volg de status van goedkeuring tot levering</li>
        <li><strong>Klantportaal:</strong> Geef klanten toegang tot projectvoortgang en updates</li>
        <li><strong>Analytics:</strong> Inzicht in bedrijfsprestaties en productiviteit</li>
        <li><strong>Team Communicatie:</strong> Interne teamchat en notificaties</li>
      </ul>

      <h2>Voor wie is PaintConnect?</h2>
      <p>
        PaintConnect is ontwikkeld voor:
      </p>
      <ul>
        <li>Kleine zelfstandige schilders die hun workflow willen stroomlijnen</li>
        <li>Grote schildersbedrijven met meerdere teams en projecten</li>
        <li>Bedrijven die compliance nodig hebben met de nieuwe tijdsregistratie wetgeving (2027)</li>
        <li>Bedrijven die hun klantcommunicatie willen verbeteren</li>
      </ul>

      <h2>Volgende stappen</h2>
      <div className="grid md:grid-cols-2 gap-4 my-8">
        <Link
          href="/account-setup"
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Account aanmaken
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Leer hoe je een PaintConnect account aanmaakt
          </p>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            Start hier
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        <Link
          href="/first-project"
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Eerste project
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Maak je eerste project aan en begin met werken
          </p>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            Leer meer
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </article>
  );
}



