import { Metadata } from "next";
import { Users, Mail, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Team uitnodigen - PaintConnect Docs",
  description: "Schilders uitnodigen en toevoegen aan je team",
};

export default function InviteTeamPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Team uitnodigen</h1>
      
      <p className="lead">
        Nodig je schilders en teamleden uit om samen te werken in PaintConnect. Je kunt verschillende 
        rollen toewijzen om de juiste toegang te geven.
      </p>

      <h2>Teamleden uitnodigen</h2>
      
      <h3>Stap 1: Ga naar Team beheer</h3>
      <ol>
        <li>Klik op "Team" in het hoofdmenu</li>
        <li>Klik op "Teamlid uitnodigen" of het "+" icoon</li>
      </ol>

      <h3>Stap 2: Vul de gegevens in</h3>
      <ul>
        <li><strong>E-mailadres:</strong> Het e-mailadres van de persoon die je wilt uitnodigen</li>
        <li><strong>Naam:</strong> De volledige naam van het teamlid</li>
        <li><strong>Rol:</strong> Kies de juiste rol (zie hieronder)</li>
        <li><strong>Telefoonnummer:</strong> Optioneel, maar aanbevolen voor notificaties</li>
      </ul>

      <h3>Stap 3: Verstuur de uitnodiging</h3>
      <p>
        Klik op "Uitnodiging versturen". Het teamlid ontvangt een e-mail met een link om zich 
        aan te melden. Ze kunnen direct beginnen met werken zodra ze hun account hebben aangemaakt.
      </p>

      <h2>Rollen en rechten</h2>
      <p>
        PaintConnect heeft verschillende rollen met verschillende rechten:
      </p>

      <div className="my-8 space-y-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="m-0">Admin / Eigenaar</h3>
          </div>
          <p className="mb-0">
            Volledige toegang tot alle functies, inclusief accountinstellingen, abonnementen en 
            teambeheer. Kan andere admins aanstellen.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="m-0">Projectmanager</h3>
          </div>
          <p className="mb-0">
            Kan projecten aanmaken en beheren, planning bekijken en aanpassen, materialen aanvragen, 
            en teamleden toewijzen aan projecten. Geen toegang tot accountinstellingen.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="m-0">Schilder / Medewerker</h3>
          </div>
          <p className="mb-0">
            Kan projecten bekijken waaraan ze zijn toegewezen, check-in/check-out doen, foto's 
            uploaden, en updates maken. Beperkte toegang tot andere functies.
          </p>
        </div>
      </div>

      <h2>Uitnodigingen beheren</h2>
      
      <h3>Uitnodigingen bekijken</h3>
      <p>
        In het Team overzicht zie je alle uitnodigingen met hun status:
      </p>
      <ul>
        <li><strong>Verzonden:</strong> Uitnodiging is verstuurd, maar nog niet geaccepteerd</li>
        <li><strong>Geaccepteerd:</strong> Teamlid heeft de uitnodiging geaccepteerd en is actief</li>
        <li><strong>Verlopen:</strong> Uitnodiging is verlopen (na 7 dagen)</li>
      </ul>

      <h3>Uitnodiging opnieuw versturen</h3>
      <p>
        Als een uitnodiging verlopen is of niet is aangekomen, kun je deze opnieuw versturen:
      </p>
      <ol>
        <li>Ga naar het Team overzicht</li>
        <li>Klik op de uitnodiging met status "Verzonden" of "Verlopen"</li>
        <li>Klik op "Opnieuw versturen"</li>
      </ol>

      <h3>Uitnodiging annuleren</h3>
      <p>
        Je kunt een uitnodiging op elk moment annuleren:
      </p>
      <ol>
        <li>Ga naar het Team overzicht</li>
        <li>Klik op de uitnodiging die je wilt annuleren</li>
        <li>Klik op "Annuleren"</li>
      </ol>

      <h2>Teamleden beheren</h2>
      
      <h3>Rol wijzigen</h3>
      <p>
        Je kunt de rol van een teamlid op elk moment wijzigen:
      </p>
      <ol>
        <li>Ga naar het Team overzicht</li>
        <li>Klik op het teamlid</li>
        <li>Klik op "Rol wijzigen"</li>
        <li>Selecteer de nieuwe rol</li>
        <li>Bevestig de wijziging</li>
      </ol>

      <h3>Teamlid verwijderen</h3>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 my-8">
        <p className="text-red-800 dark:text-red-200 mb-0">
          <strong>Let op:</strong> Als je een teamlid verwijdert, verliest deze persoon toegang tot 
          alle projecten en data. Deze actie kan niet ongedaan worden gemaakt. Zorg ervoor dat je 
          belangrijke data hebt geback-upt voordat je een teamlid verwijdert.
        </p>
      </div>

      <h2>Tips</h2>
      <ul>
        <li>Nodig teamleden uit met hun werk-e-mailadres voor betere beveiliging</li>
        <li>Geef nieuwe teamleden de rol "Schilder" en upgrade later indien nodig</li>
        <li>Verstuur uitnodigingen in batches om het overzicht te behouden</li>
        <li>Gebruik duidelijke namen zodat je teamleden gemakkelijk kunt vinden</li>
      </ul>
    </article>
  );
}



