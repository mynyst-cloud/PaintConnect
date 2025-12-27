import { Metadata } from "next";
import { CheckCircle, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Account aanmaken - PaintConnect Docs",
  description: "Hoe maak je een PaintConnect account aan",
};

export default function AccountSetupPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Account aanmaken</h1>
      
      <p className="lead">
        Het aanmaken van een PaintConnect account is eenvoudig en duurt slechts een paar minuten. 
        Volg deze stappen om te beginnen.
      </p>

      <h2>Stap 1: Registratie</h2>
      <ol>
        <li>Ga naar <a href="https://app.paintconnect.be" target="_blank" rel="noopener noreferrer">app.paintconnect.be</a></li>
        <li>Klik op "Registreren" of "Account aanmaken"</li>
        <li>Vul je bedrijfsgegevens in:
          <ul>
            <li>Bedrijfsnaam</li>
            <li>Je naam en e-mailadres</li>
            <li>Wachtwoord (minimaal 8 karakters)</li>
            <li>Telefoonnummer</li>
          </ul>
        </li>
        <li>Accepteer de algemene voorwaarden</li>
        <li>Klik op "Account aanmaken"</li>
      </ol>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-900 dark:text-blue-100 font-semibold mb-2">Gratis proefperiode</h3>
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              Bij registratie krijg je automatisch 14 dagen gratis proefperiode. Je kunt alle functies 
              uitproberen zonder verplichtingen.
            </p>
          </div>
        </div>
      </div>

      <h2>Stap 2: E-mail verificatie</h2>
      <p>
        Na registratie ontvang je een verificatie-e-mail. Klik op de link in de e-mail om je 
        account te activeren. Controleer ook je spam/junk folder als je de e-mail niet ziet.
      </p>

      <h2>Stap 3: Onboarding</h2>
      <p>
        Na verificatie word je door een korte onboarding geleid waarin je:
      </p>
      <ul>
        <li>Je bedrijfsprofiel kunt voltooien</li>
        <li>Je eerste teamleden kunt uitnodigen</li>
        <li>Een overzicht krijgt van de belangrijkste functies</li>
      </ul>

      <h2>Stap 4: Abonnement kiezen</h2>
      <p>
        Na de onboarding kun je een abonnement kiezen:
      </p>
      <ul>
        <li><strong>Starter:</strong> Voor kleine bedrijven met basis functies</li>
        <li><strong>Professional:</strong> Voor middelgrote bedrijven met geavanceerde planning</li>
        <li><strong>Enterprise:</strong> Voor grote bedrijven met alle functies</li>
      </ul>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-amber-900 dark:text-amber-100 font-semibold mb-2">Belangrijk</h3>
            <p className="text-amber-800 dark:text-amber-200 mb-0">
              Je kunt tijdens de proefperiode altijd upgraden of downgraden. Wijzigingen worden 
              direct doorgevoerd.
            </p>
          </div>
        </div>
      </div>

      <h2>Veelgestelde vragen</h2>
      
      <h3>Wat als ik mijn wachtwoord ben vergeten?</h3>
      <p>
        Klik op "Wachtwoord vergeten" op de inlogpagina. Je ontvangt een e-mail met instructies 
        om je wachtwoord te resetten.
      </p>

      <h3>Kan ik mijn account later upgraden?</h3>
      <p>
        Ja, je kunt op elk moment upgraden of downgraden via de instellingen. Wijzigingen worden 
        direct doorgevoerd en je krijgt een pro-rata factuur.
      </p>

      <h3>Wat gebeurt er na de proefperiode?</h3>
      <p>
        Na 14 dagen wordt je automatisch overgezet naar het Starter abonnement, tenzij je een 
        ander abonnement kiest. Je ontvangt een herinnering 3 dagen voor het einde van de proefperiode.
      </p>
    </article>
  );
}



