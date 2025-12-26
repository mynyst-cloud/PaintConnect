import { Metadata } from "next";
import { FileText, Download, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Offertes - PaintConnect Docs",
  description: "Offertes maken en beheren",
};

export default function QuotesPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Offertes</h1>
      
      <p className="lead">
        Het Offertes systeem helpt je om professionele offertes te maken en te beheren. Maak 
        offertes, stuur ze naar klanten en houd de status bij.
      </p>

      <h2>Offerte maken</h2>
      <ol>
        <li>Ga naar "Offertes" in het hoofdmenu</li>
        <li>Klik op "Nieuwe offerte"</li>
        <li>Selecteer de klant</li>
        <li>Voeg items toe (werkzaamheden, materialen, etc.)</li>
        <li>Voeg eventueel kortingen toe</li>
        <li>Bekijk de offerte</li>
        <li>Sla de offerte op</li>
      </ol>

      <h2>Offerte versturen</h2>
      <p>
        Verstuur offertes naar klanten:
      </p>
      <ol>
        <li>Open de offerte</li>
        <li>Klik op "Versturen"</li>
        <li>Kies of je de offerte per e-mail wilt versturen</li>
        <li>Voeg eventueel een bericht toe</li>
        <li>Verstuur de offerte</li>
      </ol>

      <h2>Offerte status</h2>
      <ul>
        <li><strong>Concept:</strong> Offerte is nog niet verstuurd</li>
        <li><strong>Verstuurd:</strong> Offerte is naar de klant verstuurd</li>
        <li><strong>Geaccepteerd:</strong> Klant heeft de offerte geaccepteerd</li>
        <li><strong>Afgewezen:</strong> Klant heeft de offerte afgewezen</li>
        <li><strong>Verlopen:</strong> Offerte is verlopen</li>
      </ul>
    </article>
  );
}


