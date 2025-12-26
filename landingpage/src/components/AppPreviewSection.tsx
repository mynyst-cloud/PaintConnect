"use client";

import { useState } from "react";
import { Check, Smartphone } from "lucide-react";

export default function AppPreviewSection() {
  const [activeScreen, setActiveScreen] = useState(0);
  
  const screens = [
    {
      id: 0,
      name: "Dashboard",
      description: "Overzicht met snelle acties, recente projecten en dagelijkse updates",
      image: "/app-dashboard.png",
    },
    {
      id: 1,
      name: "Planning",
      description: "Week-overzicht met alle projecten en schilders in één oogopslag",
      image: "/app-planning.png",
    },
    {
      id: 2,
      name: "Check-in",
      description: "GPS-verificatie bij aankomst op de werf - automatische tijdregistratie",
      image: "/app-checkin.png",
    },
    {
      id: 3,
      name: "Projecten",
      description: "Bekijk al je projecten op de kaart met real-time status",
      image: "/app-map.png",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[var(--color-gray-900)] to-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[var(--color-emerald-400)] font-semibold text-sm uppercase tracking-wider">
            Bekijk de app
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
            Ontworpen voor schilders, door schilders
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Een intuïtieve interface die je team direct kan gebruiken - geen training nodig
          </p>
        </div>

        {/* Screen Selector Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {screens.map((screen) => (
            <button
              key={screen.id}
              onClick={() => setActiveScreen(screen.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeScreen === screen.id
                  ? "bg-[var(--color-emerald-500)] text-white shadow-lg shadow-emerald-500/30"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {screen.name}
            </button>
          ))}
        </div>

        {/* Phone Mockup Display */}
        <div className="relative max-w-6xl mx-auto">
          
          {/* Main Phone - Active Screen */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            
            {/* Phone Frame */}
            <div className="relative flex-shrink-0">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--color-emerald-500)]/20 via-blue-500/20 to-[var(--color-orange-500)]/20 rounded-[3rem] blur-2xl opacity-60" />
              
              {/* Phone Frame */}
              <div className="relative bg-gray-800 rounded-[2.5rem] p-3 shadow-2xl border border-gray-700">
                {/* Screen */}
                <img
                  src={screens[activeScreen].image}
                  alt={screens[activeScreen].name}
                  className="w-[280px] md:w-[320px] h-auto rounded-[2rem] transition-opacity duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* Description Panel */}
            <div className="text-center lg:text-left max-w-md">
              <div className="inline-flex items-center gap-2 bg-[var(--color-emerald-500)]/20 text-[var(--color-emerald-400)] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Smartphone className="w-4 h-4" />
                {screens[activeScreen].name}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {screens[activeScreen].name === "Dashboard" && "Alles in één oogopslag"}
                {screens[activeScreen].name === "Planning" && "Slimme weekplanning"}
                {screens[activeScreen].name === "Check-in" && "GPS-verificatie op locatie"}
                {screens[activeScreen].name === "Projecten" && "Projecten op de kaart"}
              </h3>
              <p className="text-gray-400 text-lg mb-6">
                {screens[activeScreen].description}
              </p>
              
              {/* Feature bullets for active screen */}
              <ul className="space-y-3">
                {screens[activeScreen].name === "Dashboard" && (
                  <>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Snelle acties voor dagelijkse taken
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Recente projecten met foto's
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Eén-klik check-in op werf
                    </li>
                  </>
                )}
                {screens[activeScreen].name === "Planning" && (
                  <>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Week- en maandoverzicht
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Kleurgecodeerde projecten
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Drag & drop schilders toewijzen
                    </li>
                  </>
                )}
                {screens[activeScreen].name === "Check-in" && (
                  <>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Automatische GPS-verificatie
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Tijdregistratie voor 2027 wetgeving
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Notities toevoegen bij aankomst
                    </li>
                  </>
                )}
                {screens[activeScreen].name === "Projecten" && (
                  <>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Alle werven op de kaart
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Route planning geïntegreerd
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[var(--color-emerald-400)]" />
                      Real-time project status
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Small Preview Thumbnails */}
          <div className="hidden lg:flex justify-center gap-4 mt-12">
            {screens.map((screen) => (
              <button
                key={screen.id}
                onClick={() => setActiveScreen(screen.id)}
                className={`relative rounded-xl overflow-hidden transition-all ${
                  activeScreen === screen.id
                    ? "ring-2 ring-[var(--color-emerald-500)] scale-105"
                    : "opacity-50 hover:opacity-80"
                }`}
              >
                <img
                  src={screen.image}
                  alt={screen.name}
                  className="w-16 h-auto"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

