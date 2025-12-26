import { Metadata } from "next";
import { Target, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Leads - PaintConnect Docs",
  description: "Lead management en tracking",
};

export default function LeadsPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Leads</h1>
      
      <p className="lead">
        Het Leads systeem helpt je om potentiële klanten te beheren en te volgen. Voeg leads toe, 
        houd contact bij en converteer leads naar projecten.
      </p>

      <h2>Lead toevoegen</h2>
      <ol>
        <li>Ga naar "Leads" in het hoofdmenu</li>
        <li>Klik op "Nieuwe lead"</li>
        <li>Vul de contactgegevens in</li>
        <li>Voeg opmerkingen toe</li>
        <li>Sla de lead op</li>
      </ol>

      <h2>Leads beheren</h2>
      <p>
        Houd de status van leads bij:
      </p>
      <ul>
        <li><strong>Nieuw:</strong> Lead is toegevoegd maar nog niet benaderd</li>
        <li><strong>In behandeling:</strong> Lead wordt benaderd</li>
        <li><strong>Geconverteerd:</strong> Lead is omgezet naar een project</li>
        <li><strong>Niet interessant:</strong> Lead is niet interessant</li>
      </ul>
    </article>
  );
}


