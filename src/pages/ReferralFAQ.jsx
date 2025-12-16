
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  HelpCircle,
  QrCode,
  Trophy,
  Users,
  Euro,
  Star,
  CheckCircle,
  MessageCircle,
  Calendar,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils"; // Fixed: import path for createPageUrl

const faqData = [
  {
    question: "Hoe werkt het referral systeem?",
    answer: "Het referral systeem werkt met unieke QR-codes voor elke schilder. Klanten scannen de code, vullen een formulier in, en de schilder krijgt punten voor elke goedgekeurde referral.",
    icon: <QrCode className="w-5 h-5 text-emerald-600" />
  },
  {
    question: "Hoe krijg ik mijn QR-code?",
    answer: "Ga naar de 'Referrals' pagina en klik op de 'QR Codes' tab. De admin kan hier een unieke code voor je genereren die je kunt gebruiken voor referrals.",
    icon: <QrCode className="w-5 h-5 text-blue-600" />
  },
  {
    question: "Wanneer krijg ik punten voor een referral?",
    answer: "Je krijgt punten wanneer een referral wordt goedgekeurd door de admin. Dit gebeurt meestal nadat er contact is opgenomen met de klant en een offerte is verstuurd.",
    icon: <Star className="w-5 h-5 text-yellow-600" />
  },
  {
    question: "Hoeveel verdien ik per referral?",
    answer: "De beloning per referral wordt bepaald door de actieve periode. Dit staat meestal op €50 per goedgekeurde referral, maar kan variëren per competitie.",
    icon: <Euro className="w-5 h-5 text-green-600" />
  },
  {
    question: "Wat is de referral race/competitie?",
    answer: "De referral race is een periode waarin schilders strijden om de meeste referrals. De winnaar krijgt een extra bonus bovenop de normale beloningen.",
    icon: <Trophy className="w-5 h-5 text-yellow-600" />
  },
  {
    question: "Hoe zie ik mijn positie in de leaderboard?",
    answer: "Op de 'Referrals' pagina zie je de leaderboard met alle schilders en hun aantal referrals voor de huidige periode. Je ziet ook je totale referrals aller tijden.",
    icon: <Users className="w-5 h-5 text-purple-600" />
  },
  {
    question: "Wat gebeurt er na het invullen van het formulier?",
    answer: "Nadat een klant het formulier invult, krijgt de admin een notificatie. De admin neemt contact op met de klant en wijzigt de status van 'pending' naar 'contacted', 'quote sent', etc.",
    icon: <MessageCircle className="w-5 h-5 text-blue-600" />
  },
  {
    question: "Wanneer eindigt een referral periode?",
    answer: "Elke periode heeft een specifieke einddatum. Wanneer deze eindigt, wordt de winnaar bekendgemaakt en krijgen alle schilders hun beloningen. Hun referral teller wordt gereset voor de nieuwe periode.",
    icon: <Calendar className="w-5 h-5 text-red-600" />
  }
];

const processSteps = [
  {
    step: 1,
    title: "QR-code genereren",
    description: "Admin genereert een unieke QR-code voor elke schilder",
    icon: <QrCode className="w-6 h-6" />
  },
  {
    step: 2,
    title: "Code delen",
    description: "Schilder deelt QR-code met potentiële klanten",
    icon: <Users className="w-6 h-6" />
  },
  {
    step: 3,
    title: "Formulier invullen",
    description: "Klant scant code en vult contactformulier in",
    icon: <MessageCircle className="w-6 h-6" />
  },
  {
    step: 4,
    title: "Contact opnemen",
    description: "Admin neemt contact op met de klant",
    icon: <CheckCircle className="w-6 h-6" />
  },
  {
    step: 5,
    title: "Punten toekennen",
    description: "Bij goedkeuring krijgt schilder punten en beloning",
    icon: <Gift className="w-6 h-6" />
  }
];

export default function ReferralFAQ() {
  return (
    <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link to={createPageUrl("Referrals")}> {/* Fixed: was createPageUrl("referrals") */}
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-yellow-600" />
              Referral Systeem - FAQ & Help
            </h1>
            <p className="text-gray-600 mt-1">Alles wat je moet weten over het referral systeem</p>
          </div>
        </motion.div>

        {/* Process Overview */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Hoe werkt het proces?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-yellow-100 p-4 rounded-lg mb-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                      {step.step}
                    </div>
                    <div className="text-yellow-700">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Veelgestelde Vragen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {faq.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-700 text-sm">{faq.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Star className="w-5 h-5" />
              Tips voor Meer Referrals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-1">Toon je QR-code</h4>
                <p className="text-sm text-emerald-700">Plaats je QR-code zichtbaar op je werkplek of gereedschapskist</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-1">Vertel je verhaal</h4>
                <p className="text-sm text-emerald-700">Leg uit dat tevreden klanten anderen kunnen helpen door je QR-code te scannen</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-1">Timing is belangrijk</h4>
                <p className="text-sm text-emerald-700">Vraag om referrals wanneer klanten tevreden zijn met je werk</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-1">Blijf professioneel</h4>
                <p className="text-sm text-emerald-700">Zorg altijd voor kwaliteitswerk - tevreden klanten geven meer referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Nog vragen?</h3>
            <p className="text-gray-600 mb-4">Neem contact op met je admin of het PaintPro support team</p>
            <div className="flex gap-3 justify-center">
              <Link to={createPageUrl("Referrals")}> {/* Fixed: was createPageUrl("referrals") */}
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  Terug naar Referrals
                </Button>
              </Link>
              <Link to={createPageUrl("Help")}>
                <Button variant="outline">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
