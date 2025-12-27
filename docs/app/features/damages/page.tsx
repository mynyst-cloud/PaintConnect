import { Metadata } from "next";
import { AlertTriangle, Camera, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Beschadigingen - PaintConnect Docs",
  description: "Schademeldingen documenteren",
};

export default function DamagesPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Beschadigingen</h1>
      
      <p className="lead">
        Het Beschadigingen systeem helpt je om schademeldingen te documenteren en te beheren. 
        Voeg foto's toe, beschrijf de schade en houd de status bij.
      </p>

      <h2>Schade melden</h2>
      <ol>
        <li>Ga naar "Beschadigingen" in het hoofdmenu</li>
        <li>Klik op "Nieuwe melding"</li>
        <li>Selecteer het project</li>
        <li>Beschrijf de schade</li>
        <li>Upload foto's</li>
        <li>Sla de melding op</li>
      </ol>

      <h2>Schade beheren</h2>
      <p>
        Houd de status van schademeldingen bij:
      </p>
      <ul>
        <li><strong>Nieuw:</strong> Schade is gemeld maar nog niet behandeld</li>
        <li><strong>In behandeling:</strong> Schade wordt onderzocht</li>
        <li><strong>Afgehandeld:</strong> Schade is afgehandeld</li>
      </ul>
    </article>
  );
}



