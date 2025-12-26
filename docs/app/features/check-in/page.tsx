import { Metadata } from "next";
import { MapPin, Clock, AlertCircle, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Check-in Systeem - PaintConnect Docs",
  description: "GPS-tijdsregistratie voor 2027 wetgeving",
};

export default function CheckInPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Check-in Systeem</h1>
      
      <p className="lead">
        Het Check-in Systeem is een GPS-gebaseerde tijdsregistratie die voldoet aan de nieuwe 
        wetgeving voor tijdsregistratie die in 2027 van kracht wordt. Het systeem registreert 
        automatisch waar en wanneer schilders in- en uitchecken.
      </p>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-emerald-900 dark:text-emerald-100 font-semibold mb-2">Wetgeving 2027</h3>
            <p className="text-emerald-800 dark:text-emerald-200 mb-0">
              Vanaf 2027 is GPS-tijdsregistratie verplicht voor alle bedrijven. PaintConnect helpt 
              je om volledig compliant te zijn met deze nieuwe wetgeving.
            </p>
          </div>
        </div>
      </div>

      <h2>Hoe werkt het?</h2>
      
      <h3>Voor schilders</h3>
      <ol>
        <li>Open de PaintConnect app op je telefoon</li>
        <li>Ga naar het project waar je gaat werken</li>
        <li>Klik op "Check-in"</li>
        <li>De app vraagt om locatietoegang (eenmalig)</li>
        <li>Je locatie wordt geregistreerd en je bent ingecheckt</li>
        <li>Bij vertrek klik je op "Check-out"</li>
      </ol>

      <h3>Automatische registratie</h3>
      <p>
        Het systeem registreert automatisch:
      </p>
      <ul>
        <li><strong>Locatie:</strong> GPS-coördinaten van waar je incheckt</li>
        <li><strong>Tijd:</strong> Exacte tijd van check-in en check-out</li>
        <li><strong>Project:</strong> Het project waaraan je werkt</li>
        <li><strong>Duur:</strong> Automatische berekening van gewerkte uren</li>
      </ul>

      <h2>Locatietoegang</h2>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-900 dark:text-blue-100 font-semibold mb-2">Locatie toestemming</h3>
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              De app vraagt om locatietoegang wanneer je voor het eerst incheckt. Deze toestemming 
              is nodig om te voldoen aan de wetgeving. Je locatie wordt alleen gebruikt voor 
              tijdsregistratie en wordt niet gedeeld met derden.
            </p>
          </div>
        </div>
      </div>

      <h3>Locatietoegang instellen</h3>
      <p>
        <strong>iPhone (iOS):</strong>
      </p>
      <ol>
        <li>Ga naar Instellingen → Privacy → Locatieservices</li>
        <li>Zorg dat Locatieservices aan staat</li>
        <li>Zoek PaintConnect en selecteer "Bij gebruik van de app"</li>
      </ol>

      <p>
        <strong>Android:</strong>
      </p>
      <ol>
        <li>Ga naar Instellingen → Apps → PaintConnect</li>
        <li>Klik op "Machtigingen"</li>
        <li>Zet "Locatie" aan</li>
      </ol>

      <h2>Check-in bekijken</h2>
      
      <h3>Voor projectmanagers</h3>
      <p>
        Als projectmanager kun je alle check-ins bekijken:
      </p>
      <ol>
        <li>Ga naar het project</li>
        <li>Klik op "Check-ins" in het menu</li>
        <li>Je ziet alle check-ins met locatie, tijd en duur</li>
        <li>Check-ins worden ook getoond op een kaart</li>
      </ol>

      <h3>Voor bedrijfseigenaren</h3>
      <p>
        Bedrijfseigenaren kunnen alle check-ins van alle projecten bekijken:
      </p>
      <ul>
        <li>Ga naar het Dashboard</li>
        <li>Klik op "Check-ins" of "Tijdsregistratie"</li>
        <li>Je ziet een overzicht van alle check-ins</li>
        <li>Filter op datum, project of schilder</li>
      </ul>

      <h2>Rapportage</h2>
      <p>
        Het Check-in Systeem genereert automatisch rapporten:
      </p>
      <ul>
        <li><strong>Dagelijkse rapporten:</strong> Overzicht van alle check-ins per dag</li>
        <li><strong>Wekelijkse rapporten:</strong> Totaal gewerkte uren per week</li>
        <li><strong>Projectrapporten:</strong> Uren per project</li>
        <li><strong>Schilder rapporten:</strong> Uren per schilder</li>
      </ul>

      <h2>Compliance</h2>
      <p>
        Het Check-in Systeem voldoet aan alle eisen van de nieuwe wetgeving:
      </p>
      <ul>
        <li>✓ GPS-locatie registratie</li>
        <li>✓ Automatische tijdregistratie</li>
        <li>✓ Onveranderbare logs</li>
        <li>✓ Exporteerbare data voor inspecties</li>
        <li>✓ Privacy-compliant (GDPR)</li>
      </ul>

      <h2>Problemen oplossen</h2>
      
      <h3>Locatie wordt niet geregistreerd</h3>
      <ul>
        <li>Controleer of locatietoegang is ingeschakeld in je telefooninstellingen</li>
        <li>Zorg dat je internetverbinding hebt</li>
        <li>Probeer de app opnieuw te starten</li>
        <li>Check of GPS is ingeschakeld op je telefoon</li>
      </ul>

      <h3>Check-in werkt niet</h3>
      <ul>
        <li>Zorg dat je bent toegewezen aan het project</li>
        <li>Check of je internetverbinding hebt</li>
        <li>Probeer de app te updaten naar de nieuwste versie</li>
        <li>Neem contact op met support als het probleem aanhoudt</li>
      </ul>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 my-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-amber-900 dark:text-amber-100 font-semibold mb-2">Belangrijk</h3>
            <p className="text-amber-800 dark:text-amber-200 mb-0">
              Zorg ervoor dat alle schilders regelmatig in- en uitchecken. Vergeten check-outs 
              kunnen worden gecorrigeerd door projectmanagers, maar dit moet worden gedocumenteerd.
            </p>
          </div>
        </div>
      </div>

      <h2>Tips</h2>
      <ul>
        <li>Check altijd in voordat je begint met werken</li>
        <li>Check altijd uit wanneer je klaar bent</li>
        <li>Gebruik de app op je telefoon voor de beste GPS-nauwkeurigheid</li>
        <li>Zorg dat je telefoon is opgeladen voor een hele werkdag</li>
        <li>Controleer regelmatig je check-in geschiedenis</li>
      </ul>
    </article>
  );
}


