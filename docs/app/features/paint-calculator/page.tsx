import { Metadata } from "next";
import { Calculator, Ruler } from "lucide-react";

export const metadata: Metadata = {
  title: "Verfcalculator - PaintConnect Docs",
  description: "Bereken verfhoeveelheden",
};

export default function PaintCalculatorPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Verfcalculator</h1>
      
      <p className="lead">
        De Verfcalculator helpt je om de juiste hoeveelheid verf te berekenen voor elk project. 
        Voer de afmetingen in en krijg direct de benodigde hoeveelheid.
      </p>

      <h2>Hoe werkt het?</h2>
      <ol>
        <li>Ga naar "Verfcalculator" in het hoofdmenu</li>
        <li>Voer de afmetingen van de ruimte in</li>
        <li>Selecteer het type verf</li>
        <li>Kies het aantal lagen</li>
        <li>Bereken de benodigde hoeveelheid</li>
      </ol>

      <h2>Factoren</h2>
      <p>
        De calculator houdt rekening met:
      </p>
      <ul>
        <li>Oppervlakte van muren en plafond</li>
        <li>Ramen en deuren (worden afgetrokken)</li>
        <li>Type verf en dekking</li>
        <li>Aantal lagen</li>
        <li>Verlies tijdens het schilderen</li>
      </ul>
    </article>
  );
}



