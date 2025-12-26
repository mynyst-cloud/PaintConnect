"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

// PaintConnect Logo URLs from Supabase storage
const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";

// App URL - alle CTA's linken naar de app
const APP_URL = "https://app.paintconnect.be";

// Navigation Component
export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll to change nav background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-[var(--color-gray-200)] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img
              src={scrolled ? LOGO_LIGHT : LOGO_DARK}
              alt="PaintConnect Logo"
              className="h-10 w-auto transition-opacity"
              loading="eager"
              fetchPriority="high"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className={`transition-colors ${
                scrolled
                  ? "text-[var(--color-gray-600)] hover:text-[var(--color-emerald-600)]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Features
            </a>
            <a
              href="#wetgeving-2027"
              className={`transition-colors ${
                scrolled
                  ? "text-[var(--color-gray-600)] hover:text-[var(--color-emerald-600)]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Wetgeving 2027
            </a>
            <a
              href="#pricing"
              className={`transition-colors ${
                scrolled
                  ? "text-[var(--color-gray-600)] hover:text-[var(--color-emerald-600)]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Prijzen
            </a>
            <a
              href="#faq"
              className={`transition-colors ${
                scrolled
                  ? "text-[var(--color-gray-600)] hover:text-[var(--color-emerald-600)]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              FAQ
            </a>
            <a
              href={APP_URL}
              className={`transition-colors ${
                scrolled
                  ? "text-[var(--color-gray-600)] hover:text-[var(--color-emerald-600)]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Inloggen
            </a>
            <a href={APP_URL} className="btn-primary text-sm py-2.5 px-5">
              Gratis proberen
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 ${scrolled ? "text-gray-900" : "text-white"}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[var(--color-gray-200)]">
          <div className="px-4 py-4 space-y-3">
            <a
              href="#features"
              className="block py-2 text-[var(--color-gray-600)]"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a
              href="#wetgeving-2027"
              className="block py-2 text-[var(--color-gray-600)]"
              onClick={() => setIsOpen(false)}
            >
              Wetgeving 2027
            </a>
            <a
              href="#pricing"
              className="block py-2 text-[var(--color-gray-600)]"
              onClick={() => setIsOpen(false)}
            >
              Prijzen
            </a>
            <a
              href="#faq"
              className="block py-2 text-[var(--color-gray-600)]"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </a>
            <a
              href={APP_URL}
              className="block py-2 text-[var(--color-gray-600)]"
              onClick={() => setIsOpen(false)}
            >
              Inloggen
            </a>
            <a
              href={APP_URL}
              className="block btn-primary text-center text-sm py-2.5"
              onClick={() => setIsOpen(false)}
            >
              Gratis proberen
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

