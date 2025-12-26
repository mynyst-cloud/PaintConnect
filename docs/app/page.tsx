import Link from "next/link";
import { 
  BookOpen, ArrowRight,
  LayoutDashboard, Calendar, Briefcase,
  MapPin, Package, Users, Sparkles, Search
} from "lucide-react";
import SearchBar from "@/components/SearchBar";

const quickLinks = [
  {
    title: "Aan de slag",
    description: "Leer hoe je PaintConnect opzet en je eerste project start",
    href: "/overview",
    icon: BookOpen,
    gradient: "from-emerald-500 to-emerald-600"
  },
  {
    title: "Dashboard",
    description: "Ontdek alle functies van het dashboard",
    href: "/features/dashboard",
    icon: LayoutDashboard,
    gradient: "from-blue-500 to-blue-600"
  },
  {
    title: "Planning",
    description: "Maand- en weekplanning beheren",
    href: "/features/planning-month",
    icon: Calendar,
    gradient: "from-purple-500 to-purple-600"
  },
  {
    title: "Check-in Systeem",
    description: "GPS-tijdsregistratie voor 2027",
    href: "/features/check-in",
    icon: MapPin,
    gradient: "from-orange-500 to-orange-600"
  },
];

const popularTopics = [
  {
    title: "Check-in Systeem",
    href: "/features/check-in",
    description: "GPS-tijdsregistratie"
  },
  {
    title: "Planning",
    href: "/features/planning-month",
    description: "Maand- en weekplanning"
  },
  {
    title: "Tijdsregistratie 2027",
    href: "/guides/time-tracking-2027",
    description: "Wetgeving en compliance"
  },
  {
    title: "Materiaalbeheer",
    href: "/features/materials",
    description: "Materialen aanvragen en beheren"
  },
  {
    title: "Projecten",
    href: "/features/projects",
    description: "Projecten beheren en volgen"
  },
  {
    title: "Klantportaal",
    href: "/features/client-portal",
    description: "Klanten toegang geven"
  },
];

export default function DocsHome() {
  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium mb-6 border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-4 h-4" />
          <span>Volledige documentatie</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          PaintConnect
          <span className="block text-emerald-600 dark:text-emerald-400 mt-2">Documentatie</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          Alles wat je moet weten om PaintConnect optimaal te gebruiken voor je schildersbedrijf
        </p>
      </div>

      {/* Search */}
      <div className="mb-16">
        <SearchBar />
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group relative p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${link.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {link.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {link.description}
              </p>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                Lees meer
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Popular Topics */}
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Populaire onderwerpen
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTopics.map((topic) => (
              <Link
                key={topic.href}
                href={topic.href}
                className="group p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {topic.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started CTA */}
      <div className="mt-16 p-10 bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-emerald-50 dark:from-emerald-900/20 dark:via-emerald-800/20 dark:to-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Nieuw bij PaintConnect?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
          Start met onze gids "Aan de slag" om snel op weg te komen en alle functies te ontdekken.
        </p>
        <Link
          href="/overview"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Begin hier
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
