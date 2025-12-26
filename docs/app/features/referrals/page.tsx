import { Metadata } from "next";
import { Users, Gift } from "lucide-react";

export const metadata: Metadata = {
  title: "Referrals - PaintConnect Docs",
  description: "Referral systeem en beloningen",
};

export default function ReferralsPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1>Referrals</h1>
      
      <p className="lead">
        Het Referral systeem beloont je voor het doorverwijzen van nieuwe klanten. Deel je 
        referral link en ontvang beloningen wanneer iemand zich aanmeldt.
      </p>

      <h2>Hoe werkt het?</h2>
      <ol>
        <li>Ga naar "Referrals" in het hoofdmenu</li>
        <li>Kopieer je unieke referral link</li>
        <li>Deel de link met potentiële klanten</li>
        <li>Ontvang beloningen wanneer ze zich aanmelden</li>
      </ol>

      <h2>Beloningen</h2>
      <p>
        Beloningen worden automatisch toegekend wanneer:
      </p>
      <ul>
        <li>Iemand zich aanmeldt via je referral link</li>
        <li>Ze een abonnement afsluiten</li>
        <li>Ze actief blijven voor een bepaalde periode</li>
      </ul>
    </article>
  );
}


