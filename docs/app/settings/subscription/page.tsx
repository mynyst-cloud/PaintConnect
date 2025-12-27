import { Metadata } from "next";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Abonnement - PaintConnect Docs",
  description: "Abonnement beheren en upgraden",
};

export default function SubscriptionPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Abonnement</h1>
      
      <p className="lead">
        Beheer je PaintConnect abonnement, upgrade of downgrade wanneer nodig, en bekijk je 
        facturatiegeschiedenis.
      </p>

      <h2>Abonnementen</h2>
      <p>
        PaintConnect biedt verschillende abonnementen:
      </p>
      <ul>
        <li><strong>Starter:</strong> Voor kleine bedrijven met basis functies</li>
        <li><strong>Professional:</strong> Voor middelgrote bedrijven met geavanceerde planning</li>
        <li><strong>Enterprise:</strong> Voor grote bedrijven met alle functies</li>
      </ul>

      <h2>Upgraden</h2>
      <ol>
        <li>Ga naar "Instellingen" → "Abonnement"</li>
        <li>Klik op "Upgraden"</li>
        <li>Selecteer het gewenste abonnement</li>
        <li>Bevestig de upgrade</li>
        <li>Wijzigingen worden direct doorgevoerd</li>
      </ol>

      <h2>Facturatie</h2>
      <p>
        Bekijk je facturatiegeschiedenis en download facturen:
      </p>
      <ol>
        <li>Ga naar "Instellingen" → "Abonnement"</li>
        <li>Klik op "Facturen"</li>
        <li>Bekijk alle facturen</li>
        <li>Download facturen als PDF</li>
      </ol>
    </article>
  );
}



