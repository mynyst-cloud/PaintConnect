// Server Component - Main Landing Page
import Navigation from "@/components/Navigation";
import AppPreviewSection from "@/components/AppPreviewSection";
import FAQSection from "@/components/FAQSection";
import {
  Check,
  Clock,
  Smartphone,
  Users,
  Calendar,
  Camera,
  Shield,
  ChevronDown,
  Star,
  ArrowRight,
  Play,
  MapPin,
  FileText,
  Bell,
  Calculator,
  AlertTriangle,
  MessageCircle,
  BarChart3,
  Building2,
  CreditCard,
} from "lucide-react";

// PaintConnect Logo URLs from Supabase storage
const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";
const FAVICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/c4fa1d0cb_Android.png";

// Invite URL - alle CTA's linken naar invite pagina
const INVITE_URL = "/invite";

// Hero Section - Server Component
function HeroSection() {
  return (
    <section className="relative min-h-[100svh] lg:min-h-screen pt-20 lg:pt-16 overflow-hidden bg-black" aria-label="PaintConnect - Software voor schildersbedrijven">
      {/* Background Image - iPhone Mockup */}
      <div className="absolute inset-0">
        {/* Desktop: Large mockup on right */}
        <img
          src="/hero-mockup.png"
          alt="PaintConnect schildersbedrijf app - Dashboard met GPS tijdsregistratie en projectplanning op iPhone"
          className="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-90 hidden lg:block"
          loading="eager"
          fetchPriority="high"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent lg:to-black/30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:min-h-screen">
        {/* Text Content */}
        <div className="flex-1 pt-4 pb-6 lg:py-0 lg:max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[var(--color-emerald-600)]/20 backdrop-blur-sm border border-[var(--color-emerald-500)]/30 rounded-full px-3 py-1.5 mb-4 lg:mb-6">
            <Bell className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[var(--color-emerald-400)]" aria-hidden="true" />
            <span className="text-[var(--color-emerald-300)] text-xs lg:text-sm font-medium">
              100% klaar voor tijdsregistratie 2027
            </span>
          </div>

          {/* Heading - Primary H1 with keywords */}
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 lg:mb-6 leading-tight">
            Dé complete app voor{" "}
            <span className="text-[var(--color-emerald-400)]">
              schildersbedrijven
            </span>
            <span className="sr-only"> in Nederland en België - GPS tijdsregistratie, planning en klantportaal software</span>
          </h1>

          {/* Subheading with keywords */}
          <p className="text-base lg:text-xl text-white/80 max-w-xl mb-6 lg:mb-10 leading-relaxed">
            Automatische GPS-urenregistratie, klantportaal en slimme planning – zonder extra administratie. 
            <strong className="text-white"> Bespaar 5+ uur per week.</strong>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 lg:mb-10">
            <a
              href={INVITE_URL}
              className="btn-primary flex items-center justify-center gap-2 text-base lg:text-lg py-3 lg:py-4"
            >
              Vraag toegang aan
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#features"
              className="btn-outline-white flex items-center justify-center gap-2 text-base lg:text-lg py-3 lg:py-4"
            >
              <Play className="w-5 h-5" />
              Ontdek functies
            </a>
          </div>

          {/* Trust indicators - Horizontal on mobile */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/70 text-xs lg:text-sm">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[var(--color-emerald-400)]" />
              <span>Geen creditcard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[var(--color-emerald-400)]" />
              <span>5 min. actief</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[var(--color-emerald-400)]" />
              <span>NL/BE support</span>
            </div>
          </div>
        </div>

        {/* Mobile: Phone Mockup below text */}
        <div className="lg:hidden relative flex-shrink-0 flex justify-center pb-4">
          <div className="relative">
            <img
              src="/hero-mockup.png"
              alt="PaintConnect mobiele app voor schilders"
              className="h-[45vh] max-h-[400px] w-auto object-contain"
              loading="eager"
              fetchPriority="high"
            />
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
        <ChevronDown className="w-8 h-8 text-white/50" />
      </div>
    </section>
  );
}

// Hero Section - Server Component

// Features Section
function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--color-orange-600)] font-semibold text-sm uppercase tracking-wider">
            Alle Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-gray-900)] mt-3 mb-4">
            Eén platform voor je hele bedrijf
          </h2>
          <p className="text-lg text-[var(--color-gray-600)] max-w-2xl mx-auto">
            Van check-in tot facturatie – alles wat je nodig hebt om je schildersbedrijf 
            efficiënt te runnen, in één overzichtelijke app.
          </p>
        </div>

        {/* Hero Feature - Check-in System */}
        <div className="mb-16 bg-gradient-to-br from-[var(--color-emerald-600)] to-[var(--color-emerald-800)] rounded-2xl p-8 md:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm mb-4">
                <Clock className="w-4 h-4" />
                <span>Klaar voor 2027</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Automatisch Check-in Systeem
              </h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Schilders checken met één tik in en uit op projecten. GPS-verificatie zorgt voor 
                betrouwbare registratie. Reistijd wordt automatisch berekend tussen projecten.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>GPS-verificatie bij check-in/out</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Automatische reistijdberekening</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Export naar Excel voor loonverwerking</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>100% conform tijdsregistratie wetgeving 2027</span>
                </li>
              </ul>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-sm">
                <div className="bg-white rounded-xl p-4 text-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Check-in</span>
                    <span className="text-[var(--color-emerald-600)] text-sm">Actief</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[var(--color-emerald-50)] rounded-lg">
                      <div className="w-10 h-10 bg-[var(--color-emerald-600)] rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Ursulinenhof Hasselt</p>
                        <p className="text-xs text-gray-500">Ingecheckt om 08:15</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vandaag gewerkt</span>
                      <span className="font-semibold">4u 32m</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Reistijd</span>
                      <span className="font-semibold">45m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Materiaalbeheer */}
          <div className="bg-[var(--color-gray-50)] rounded-xl p-6 border border-[var(--color-gray-200)] card-hover group">
            <div className="w-12 h-12 bg-[var(--color-orange-100)] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-[var(--color-orange-600)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Slim Materiaalbeheer
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Upload facturen en laat AI automatisch de producten herkennen en toevoegen aan je voorraad.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>AI factuur-scanning</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Automatische voorraadtelling</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Materiaalaanvragen goedkeuren</span>
              </li>
            </ul>
          </div>

          {/* Klantportaal */}
          <div className="bg-[var(--color-gray-50)] rounded-xl p-6 border border-[var(--color-gray-200)] card-hover group">
            <div className="w-12 h-12 bg-[var(--color-emerald-100)] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-[var(--color-emerald-600)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Klantportaal
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Klanten volgen live de voortgang met foto's. Minder telefoontjes, meer transparantie.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Live foto-updates</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Planning inzien</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Direct communiceren</span>
              </li>
            </ul>
          </div>

          {/* Planning */}
          <div className="bg-[var(--color-gray-50)] rounded-xl p-6 border border-[var(--color-gray-200)] card-hover group">
            <div className="w-12 h-12 bg-[var(--color-emerald-100)] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-[var(--color-emerald-600)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Slimme Planning
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Drag & drop je projecten. Wijs schilders toe en voorkom dubbele boekingen.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Drag & drop kalender</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Team-toewijzing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Weerswaarschuwingen</span>
              </li>
            </ul>
          </div>

          {/* Dagelijkse Updates */}
          <div className="bg-[var(--color-gray-50)] rounded-xl p-6 border border-[var(--color-gray-200)] card-hover group">
            <div className="w-12 h-12 bg-[var(--color-emerald-100)] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-[var(--color-emerald-600)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Dagelijkse Updates
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Schilders maken met één klik een update met foto's. Jij ziet alles real-time.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Foto's met één tik</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Voortgangspercentage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Notities toevoegen</span>
              </li>
            </ul>
          </div>

          {/* Calculaties */}
          <div className="bg-[var(--color-gray-50)] rounded-xl p-6 border border-[var(--color-gray-200)] card-hover group">
            <div className="w-12 h-12 bg-[var(--color-orange-100)] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calculator className="w-6 h-6 text-[var(--color-orange-600)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Calculaties & Offertes
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Bereken verfhoeveelheden en maak professionele offertes. Na-calculatie per project.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Verfcalculator</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Offerte-generator</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Na-calculatie analyse</span>
              </li>
            </ul>
          </div>

          {/* Beschadigingen */}
          <div className="bg-[var(--color-gray-50)] rounded-xl p-6 border border-[var(--color-gray-200)] card-hover group">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Schademeldingen
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Documenteer beschadigingen met foto's vóór en tijdens het werk. Bescherm jezelf.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Foto-documentatie</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Tijdstempel & GPS</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                <span>Exporteren als rapport</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom features row */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          
          {/* Team Chat */}
          <div className="bg-[var(--color-gray-900)] rounded-xl p-6 text-white card-hover">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--color-emerald-600)] rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Team Communicatie</h3>
                <p className="text-gray-400 mb-4">
                  Ingebouwde teamchat en notificaties. Iedereen blijft op de hoogte zonder 
                  WhatsApp-chaos. Klanten kunnen ook reageren via het portaal.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">Groepschat</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">Push notificaties</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">Klant berichten</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-[var(--color-gray-900)] rounded-xl p-6 text-white card-hover">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--color-orange-600)] rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Analytics & Rapportages</h3>
                <p className="text-gray-400 mb-4">
                  Inzicht in je bedrijfsprestaties. Hoeveel uur per project? Welke schilder 
                  is het meest productief? Exporteer naar Excel of PDF.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">Dashboard</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">Excel export</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-sm">Grafieken</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Extra features row */}
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          
          {/* Referral Systeem */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 card-hover group">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Referral Systeem
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Motiveer je schilders met een gamified referral systeem. Punten, leaderboard en beloningen.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600" />
                <span>Punten per referral</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600" />
                <span>Team leaderboard</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-600" />
                <span>Periodes & prijzen</span>
              </li>
            </ul>
          </div>

          {/* Lead Management */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 card-hover group">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              Lead Management
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Beheer al je potentiële klanten op één plek. Van eerste contact tot conversie.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Lead tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Bronvermelding</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span>Conversie analyse</span>
              </li>
            </ul>
          </div>

          {/* AI Support */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 card-hover group">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-gray-900)] mb-2">
              AI Assistent
            </h3>
            <p className="text-[var(--color-gray-600)] mb-4 leading-relaxed">
              Stel vragen aan onze AI-assistent. Krijg direct antwoord over de app of schildersadvies.
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-gray-600)]">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                <span>24/7 beschikbaar</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                <span>App hulp & tips</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                <span>Schildersadvies</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}

// Legislation 2027 Section - SEO Content
function Legislation2027Section() {
  return (
    <section id="wetgeving-2027" className="py-20 md:py-28 bg-gradient-to-b from-[var(--color-gray-900)] to-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm font-medium">Nieuwe wetgeving</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Tijdsregistratie verplicht
            <span className="text-[var(--color-emerald-400)]"> vanaf 2027</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            De Belgische regering heeft beslist: vanaf 1 januari 2027 moet elk bedrijf 
            een systeem hebben om de gewerkte uren van werknemers te registreren. 
            <strong className="text-white"> Bent u al voorbereid?</strong>
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          
          {/* Left: The Problem */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              Wat houdt de wetgeving in?
            </h3>
            
            <div className="space-y-6 text-gray-300">
              <p>
                In de marge van het begrotingsakkoord heeft de Belgische regering besloten dat 
                alle bedrijven vanaf <strong className="text-white">1 januari 2027</strong> een 
                systeem moeten hebben waarmee de gewerkte uren van werknemers worden geregistreerd.
              </p>
              
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="font-semibold text-white mb-3 text-lg">Wat zijn de vereisten?</h3>
                <p className="text-sm mb-4">
                  Volgens de Europese rechtspraak moet het systeem voldoen aan drie criteria:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--color-emerald-400)] mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white">Objectief</strong> – Meetbare, verifieerbare gegevens</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--color-emerald-400)] mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white">Betrouwbaar</strong> – Niet manipuleerbaar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--color-emerald-400)] mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white">Toegankelijk</strong> – Werknemers kunnen hun eigen gegevens inzien</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-400">
                Het goede nieuws: een traditionele &apos;prikklok&apos; is niet verplicht. 
                Digitale systemen en registratie via een app worden ook toegelaten.
              </p>
            </div>
          </div>

          {/* Right: The Solution */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-emerald-500)]/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
              </div>
              PaintConnect is 100% compliant
            </h3>

            <div className="bg-gradient-to-br from-[var(--color-emerald-600)]/20 to-[var(--color-emerald-800)]/20 rounded-xl p-6 border border-[var(--color-emerald-500)]/30 mb-6">
              <p className="text-gray-300 mb-4">
                PaintConnect voldoet aan alle Europese en Belgische vereisten voor tijdsregistratie:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-emerald-500)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-white">GPS-verificatie bij check-in</strong>
                    <p className="text-sm text-gray-400">Locatie wordt vastgelegd bij start en einde werkdag</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-emerald-500)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-white">Automatische tijdregistratie</strong>
                    <p className="text-sm text-gray-400">Geen handmatige invoer, dus geen manipulatie mogelijk</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-emerald-500)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-white">Exporteerbare rapporten</strong>
                    <p className="text-sm text-gray-400">Excel/PDF exports voor de boekhouding en inspectie</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-emerald-500)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-white">Werknemers-toegang</strong>
                    <p className="text-sm text-gray-400">Elke schilder kan zijn eigen uren inzien via de app</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--color-emerald-500)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-white">AVG/GDPR-compliant</strong>
                    <p className="text-sm text-gray-400">Alle data wordt veilig opgeslagen conform privacywetgeving</p>
                  </div>
                </li>
              </ul>
            </div>

            <a 
              href={INVITE_URL} 
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
            >
              Vraag toegang aan
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold mb-6 text-center">Tijdlijn: Van EU-rechtspraak naar Belgische wet</h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">2019</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-lg">EU Uitspraak</h3>
              <p className="text-sm text-gray-400">
                Europees Hof oordeelt: lidstaten moeten tijdsregistratie verplichten
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-400 font-bold">2020</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-lg">Belgisch Arrest</h3>
              <p className="text-sm text-gray-400">
                Arbeidshof Brussel volgt Europese rechtspraak
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-400 font-bold">2025</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-lg">Regeringsbesluit</h3>
              <p className="text-sm text-gray-400">
                België besluit: verplichting vanaf 2027
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--color-emerald-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[var(--color-emerald-400)] font-bold">2027</span>
              </div>
              <h3 className="font-semibold text-white mb-1 text-lg">Deadline</h3>
              <p className="text-sm text-gray-400">
                Alle bedrijven moeten compliant zijn
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Nog <strong className="text-white">minder dan 2 jaar</strong> om u voor te bereiden. 
            Start vandaag nog met PaintConnect en vermijd stress en boetes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={INVITE_URL} className="btn-primary flex items-center justify-center gap-2">
              Vraag toegang aan
              <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#features" className="btn-outline-white flex items-center justify-center gap-2">
              Bekijk alle functies
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-[var(--color-gray-50)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--color-orange-600)] font-semibold text-sm uppercase tracking-wider">
            Hoe het werkt
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-gray-900)] mt-3 mb-4">
            Binnen 5 minuten operationeel
          </h2>
          <p className="text-lg text-[var(--color-gray-600)] max-w-2xl mx-auto">
            Geen ingewikkelde installatie, geen lange trainingen. 
            Onze stap-voor-stap gids helpt je direct op weg.
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Connection line - hidden on mobile */}
          <div className="hidden lg:block absolute top-24 left-[16.5%] right-[16.5%] h-1 bg-gradient-to-r from-[var(--color-emerald-200)] via-[var(--color-emerald-400)] to-[var(--color-emerald-600)]" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-gray-200)] shadow-sm hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-emerald-500)] to-[var(--color-emerald-600)] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                  <span className="text-white text-xl font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-gray-900)] mb-2">
                  Account aanmaken
                </h3>
                <p className="text-[var(--color-gray-600)] text-sm mb-4">
                  Registreer je bedrijf in minder dan 2 minuten. Geen creditcard nodig.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Bedrijfsnaam invullen</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Email verificatie</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Direct toegang tot dashboard</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-gray-200)] shadow-sm hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                  <span className="text-white text-xl font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-gray-900)] mb-2">
                  Team uitnodigen
                </h3>
                <p className="text-[var(--color-gray-600)] text-sm mb-4">
                  Nodig je schilders uit via email. Zij ontvangen automatisch een link.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Naam en email invoeren</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Automatische uitnodigingsmail</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Één klik om te accepteren</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-gray-200)] shadow-sm hover:shadow-lg transition-shadow h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-orange-500)] to-[var(--color-orange-600)] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-200">
                  <span className="text-white text-xl font-bold">3</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-gray-900)] mb-2">
                  Eerste project starten
                </h3>
                <p className="text-[var(--color-gray-600)] text-sm mb-4">
                  Maak je eerste project aan en wijs schilders toe.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Projectnaam, klant & adres</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Start- en einddatum kiezen</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--color-gray-600)]">
                    <Check className="w-4 h-4 text-[var(--color-emerald-600)]" />
                    <span>Schilders toewijzen</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-[var(--color-emerald-600)] to-[var(--color-emerald-700)] rounded-2xl p-6 shadow-lg shadow-emerald-200 h-full text-white">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-[var(--color-emerald-600)]" />
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Klaar! 🎉
                </h3>
                <p className="text-white/90 text-sm mb-4">
                  Je team kan nu inchecken op projecten, updates maken en uren registreren.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>GPS check-in actief</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Klantportaal live</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Rapporten beschikbaar</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-6 py-3 shadow-lg border border-[var(--color-gray-200)]">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-[var(--color-emerald-500)] rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">JD</div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">MV</div>
              <div className="w-8 h-8 bg-[var(--color-orange-500)] rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">PB</div>
            </div>
            <span className="text-[var(--color-gray-600)] text-sm">
              <strong className="text-[var(--color-gray-900)]">200+</strong> schildersbedrijven gingen je voor
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: 29,
      description: "Perfect voor freelancers en kleine teams",
      badge: "Voor kleine zelfstandigen",
      features: [
        "Tot 3 gebruikers",
        "Basis projectmanagement",
        "Materiaal aanvragen",
        "Check-in systeem",
        "Email support (48u)",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: 79,
      description: "Voor groeiende bedrijven die meer nodig hebben",
      badge: "Meest gekozen",
      features: [
        "Tot 10 gebruikers",
        "Uitgebreid projectmanagement",
        "Klantportaal toegang",
        "Referral & Lead systeem",
        "GPS check-in & reistijd",
        "Prioriteit support (24u)",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: 199,
      description: "De complete oplossing voor grote teams",
      badge: "Voor grote teams",
      features: [
        "Onbeperkt gebruikers",
        "Alle Pro functies",
        "Geavanceerde analytics",
        "API toegang",
        "Persoonlijke accountmanager",
        "Custom integraties",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-to-b from-white to-[var(--color-gray-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[var(--color-orange-600)] font-semibold text-sm uppercase tracking-wider">
            Prijzen
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-gray-900)] mt-3 mb-4">
            Start vandaag nog – 14 dagen gratis
          </h2>
          <p className="text-lg text-[var(--color-gray-600)] max-w-2xl mx-auto">
            Probeer PaintConnect 14 dagen vrijblijvend. Geen creditcard nodig om te starten.
            Pas na de proefperiode kies je een plan.
          </p>
        </div>

        {/* Trial Banner */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-[var(--color-emerald-600)] to-[var(--color-emerald-700)] rounded-2xl p-6 md:p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1 text-sm mb-4">
                <Star className="w-4 h-4 fill-current" />
                <span>Geen risico</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                14 dagen gratis uitproberen
              </h3>
              <p className="text-white/90 mb-6 max-w-xl mx-auto">
                Test alle functies van het Professional plan. Geen creditcard nodig. 
                Na de proefperiode bepaal jij of je doorgaat.
              </p>
              <a href={INVITE_URL} className="inline-flex items-center gap-2 bg-white text-[var(--color-emerald-700)] font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Vraag toegang aan
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-6 lg:p-8 relative ${
                plan.popular
                  ? "bg-[var(--color-gray-900)] text-white shadow-2xl scale-105 z-10"
                  : "bg-white border-2 border-[var(--color-gray-200)] shadow-sm"
              }`}
            >
              {/* Badge */}
              <div className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
                plan.popular 
                  ? "bg-gradient-to-r from-[var(--color-emerald-500)] to-blue-500 text-white" 
                  : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]"
              }`}>
                {plan.badge}
              </div>

              <h3 className={`text-xl font-bold mb-1 ${plan.popular ? "text-white" : "text-[var(--color-gray-900)]"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.popular ? "text-gray-400" : "text-[var(--color-gray-500)]"}`}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-[var(--color-gray-900)]"}`}>
                    €{plan.price}
                  </span>
                  <span className={`ml-2 ${plan.popular ? "text-gray-400" : "text-[var(--color-gray-500)]"}`}>
                    /maand
                  </span>
                </div>
                <p className={`text-xs mt-1 ${plan.popular ? "text-gray-500" : "text-[var(--color-gray-400)]"}`}>
                  excl. BTW • maandelijks opzegbaar
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      plan.popular ? "text-[var(--color-emerald-400)]" : "text-[var(--color-emerald-600)]"
                    }`} />
                    <span className={`text-sm ${plan.popular ? "text-gray-300" : "text-[var(--color-gray-600)]"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <a
                href={INVITE_URL}
                className={`block text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? "bg-white text-[var(--color-gray-900)] hover:bg-gray-100"
                    : "bg-[var(--color-emerald-600)] text-white hover:bg-[var(--color-emerald-700)]"
                }`}
              >
                Vraag toegang aan
              </a>
            </div>
          ))}
        </div>

        {/* Payment & Security Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[var(--color-gray-900)] mb-2">
              Veilig betalen via Mollie & Stripe
            </h3>
            <p className="text-[var(--color-gray-600)]">
              Kies de betaalmethode die bij jou past
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Mollie */}
            <div className="bg-white rounded-xl p-6 border border-[var(--color-gray-200)] hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--color-emerald-100)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-[var(--color-emerald-600)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[var(--color-gray-900)]">Mollie</h4>
                    <span className="text-xs bg-[var(--color-emerald-100)] text-[var(--color-emerald-700)] px-2 py-0.5 rounded-full">
                      🇳🇱 🇧🇪 Aanbevolen
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-gray-600)] mb-2">
                    iDEAL, Bancontact, creditcard
                  </p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    Nederlands betaalplatform, optimaal voor BeNeLux
                  </p>
                </div>
              </div>
            </div>

            {/* Stripe */}
            <div className="bg-white rounded-xl p-6 border border-[var(--color-gray-200)] hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[var(--color-gray-900)]">Stripe</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      🌍 Internationaal
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-gray-600)] mb-2">
                    Creditcard, SEPA domiciliëring
                  </p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    Wereldwijd vertrouwd, 135+ valuta's
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--color-gray-50)] rounded-lg p-4 text-center">
              <Shield className="w-6 h-6 text-[var(--color-emerald-600)] mx-auto mb-2" />
              <p className="text-xs font-medium text-[var(--color-gray-700)]">SSL Encrypted</p>
            </div>
            <div className="bg-[var(--color-gray-50)] rounded-lg p-4 text-center">
              <Check className="w-6 h-6 text-[var(--color-emerald-600)] mx-auto mb-2" />
              <p className="text-xs font-medium text-[var(--color-gray-700)]">30 dagen geld terug</p>
            </div>
            <div className="bg-[var(--color-gray-50)] rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-[var(--color-emerald-600)] mx-auto mb-2" />
              <p className="text-xs font-medium text-[var(--color-gray-700)]">Direct opzegbaar</p>
            </div>
            <div className="bg-[var(--color-gray-50)] rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-[var(--color-emerald-600)] mx-auto mb-2" />
              <p className="text-xs font-medium text-[var(--color-gray-700)]">Gratis overstap-hulp</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Sinds we PaintConnect gebruiken besparen we minstens 5 uur per week aan administratie. De klanten zijn ook veel tevredener door het portaal.",
      author: "Mark de Vries",
      role: "Eigenaar, De Vries Schilderwerken",
      rating: 5,
    },
    {
      quote:
        "De automatische tijdsregistratie is perfect. Geen gedoe meer met urenbriefjes en we zijn helemaal klaar voor de nieuwe wetgeving van 2027.",
      author: "Sandra Bakker",
      role: "Directeur, Bakker & Zonen Schilders",
      rating: 5,
    },
    {
      quote:
        "Eindelijk een app die écht voor schilders is gemaakt. De planning en het materiaalenbeheer werken fantastisch.",
      author: "Peter Janssen",
      role: "Bedrijfsleider, Janssen Painting",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[var(--color-gray-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[var(--color-orange-600)] font-semibold text-sm uppercase tracking-wider">
            Ervaringen
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-gray-900)] mt-3 mb-4">
            Wat onze klanten zeggen
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-[var(--color-gray-200)] card-hover"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>
              <p className="text-[var(--color-gray-600)] mb-6 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-[var(--color-gray-900)]">
                  {testimonial.author}
                </p>
                <p className="text-sm text-[var(--color-gray-500)]">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section

// CTA Section
function CTASection() {
  return (
    <section id="trial" className="py-20 md:py-28 bg-black relative overflow-hidden">
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-emerald-900)]/20 via-transparent to-[var(--color-orange-600)]/10" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo with slogan - using dark version (white text) */}
        <div className="mb-10">
          <img
            src={LOGO_DARK}
            alt="PaintConnect"
            className="h-14 md:h-16 w-auto mx-auto mb-3"
            loading="lazy"
            decoding="async"
          />
          <p className="text-[var(--color-orange-500)] text-sm md:text-base font-medium tracking-wider uppercase">
            Naadloze verbinding op de werf
          </p>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Klaar om je schildersbedrijf
          <br />
          naar het volgende niveau te brengen?
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          Start vandaag nog met PaintConnect. 14 dagen gratis, geen creditcard
          nodig, en je kunt elk moment opzeggen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={INVITE_URL}
            className="btn-primary flex items-center justify-center gap-2 text-lg"
          >
            Vraag toegang aan
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href={INVITE_URL}
            className="btn-outline-white flex items-center justify-center gap-2 text-lg"
          >
            Inloggen
          </a>
        </div>
        <p className="mt-8 text-white/50 text-sm">
          Al meer dan 200+ schildersbedrijven gingen je voor
        </p>
    </div>
    </section>
  );
}

// Footer with SEO-rich content
function Footer() {
  return (
    <footer className="bg-black text-white py-16" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <img
                src={LOGO_DARK}
                alt="PaintConnect - Software voor schildersbedrijven"
                className="h-10 w-auto mb-2"
                loading="lazy"
                decoding="async"
              />
              <p className="text-[var(--color-orange-500)] text-xs font-medium tracking-wider uppercase">
                Naadloze verbinding op de werf
              </p>
            </div>
            <p className="text-[var(--color-gray-400)] text-sm mt-4">
              PaintConnect is dé complete software voor schildersbedrijven in Nederland en België. 
              GPS-tijdsregistratie, slimme planning en klantportaal – 100% klaar voor 2027.
            </p>
          </div>

          {/* Product/Features */}
          <div>
            <h4 className="font-semibold mb-4">Functies</h4>
            <ul className="space-y-2 text-[var(--color-gray-400)] text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  GPS Tijdsregistratie
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Projectplanning
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Klantportaal
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Materiaalbeheer
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Prijzen & Pakketten
                </a>
              </li>
            </ul>
          </div>

          {/* Voor Schilders (SEO-rich) */}
          <div>
            <h4 className="font-semibold mb-4">Oplossingen</h4>
            <ul className="space-y-2 text-[var(--color-gray-400)] text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Urenregistratie 2027
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  App voor Schilders
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Werkbon Digitaal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Offerte Software
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Veelgestelde Vragen
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact & Support</h4>
            <ul className="space-y-2 text-[var(--color-gray-400)] text-sm">
              <li>
                <a href="mailto:support@paintconnect.nl" className="hover:text-white transition-colors">
                  support@paintconnect.nl
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Algemene Voorwaarden
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* SEO-rich bottom section */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <p className="text-[var(--color-gray-400)] text-sm">
              © {new Date().getFullYear()} PaintConnect. Alle rechten voorbehouden.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[var(--color-gray-400)] text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                Nederland & België
              </span>
              <a 
                href="mailto:support@paintconnect.nl" 
                className="text-[var(--color-gray-400)] text-sm hover:text-white transition-colors"
                aria-label="Stuur een e-mail naar PaintConnect support"
              >
                support@paintconnect.nl
              </a>
            </div>
          </div>
          
          {/* SEO Keywords Footer Text */}
          <p className="text-[var(--color-gray-600)] text-xs text-center max-w-4xl mx-auto">
            PaintConnect is de toonaangevende software voor schildersbedrijven, 
            met functies voor automatische tijdsregistratie, GPS check-in, projectplanning, 
            klantportaal, materiaalbeheer en team communicatie. Geschikt voor kleine 
            schildersbedrijven tot grote ondernemingen in Nederland en België. 
            Voldoet aan de verplichte digitale urenregistratie wetgeving 2027.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function Home() {
  return (
    <main>
      <Navigation />
      <HeroSection />
      <AppPreviewSection />
      <FeaturesSection />
      <Legislation2027Section />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
