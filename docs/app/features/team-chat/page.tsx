import { Metadata } from "next";
import { MessageCircle, Users, Bell, Paperclip } from "lucide-react";

export const metadata: Metadata = {
  title: "Team Communicatie - PaintConnect Docs",
  description: "Interne teamchat en notificaties",
};

export default function TeamChatPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Team Communicatie</h1>
      
      <p className="lead">
        De Team Communicatie functie maakt het eenvoudig om met je team te communiceren. Stuur 
        berichten, deel bestanden en ontvang notificaties over belangrijke updates.
      </p>

      <h2>Overzicht</h2>
      <p>
        Met Team Communicatie kun je:
      </p>
      <ul>
        <li>Berichten sturen naar individuele teamleden</li>
        <li>Groepsgesprekken starten</li>
        <li>Bestanden en foto's delen</li>
        <li>Notificaties ontvangen over belangrijke updates</li>
        <li>Projectgerelateerde discussies voeren</li>
      </ul>

      <h2>Berichten versturen</h2>
      
      <h3>Individuele berichten</h3>
      <ol>
        <li>Ga naar "Team" → "Berichten"</li>
        <li>Klik op "Nieuw bericht"</li>
        <li>Selecteer een teamlid</li>
        <li>Typ je bericht</li>
        <li>Klik op "Versturen"</li>
      </ol>

      <h3>Groepsgesprekken</h3>
      <p>
        Start een groepsgesprek voor projectdiscussies:
      </p>
      <ol>
        <li>Ga naar "Team" → "Berichten"</li>
        <li>Klik op "Nieuw gesprek"</li>
        <li>Selecteer meerdere teamleden</li>
        <li>Geef het gesprek een naam (optioneel)</li>
        <li>Start het gesprek</li>
      </ol>

      <h2>Bestanden delen</h2>
      <p>
        Deel bestanden en foto's in berichten:
      </p>
      <ol>
        <li>Open een gesprek</li>
        <li>Klik op het paperclip-icoon</li>
        <li>Selecteer een bestand of foto</li>
        <li>Voeg eventueel een bericht toe</li>
        <li>Verstuur het bericht</li>
      </ol>

      <h2>Notificaties</h2>
      <p>
        Ontvang notificaties over:
      </p>
      <ul>
        <li>Nieuwe berichten</li>
        <li>Projectupdates</li>
        <li>Materiaalaanvragen</li>
        <li>Check-ins en check-outs</li>
        <li>Belangrijke wijzigingen</li>
      </ul>

      <h2>Notificatie-instellingen</h2>
      <p>
        Pas je notificatievoorkeuren aan:
      </p>
      <ol>
        <li>Ga naar "Instellingen" → "Notificaties"</li>
        <li>Kies welke notificaties je wilt ontvangen</li>
        <li>Stel in of je e-mailnotificaties wilt</li>
        <li>Sla je voorkeuren op</li>
      </ol>
    </article>
  );
}



