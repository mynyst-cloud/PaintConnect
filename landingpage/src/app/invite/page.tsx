"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, ArrowRight, Building2, Mail, User } from "lucide-react";
import Navigation from "@/components/Navigation";

const LOGO_LIGHT = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png";
const LOGO_DARK = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png";

// Supabase configuration
// Note: These are public keys, safe to expose in client-side code
// In production, consider using environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cnlwenzjamVidmZjaWhpeW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzEwNzUsImV4cCI6MjA1MTU0NzA3NX0.EG3b2sQz7JW0r0A9x0pWt0qg8mZKdFZ3b2sQz7JW0r0";

export default function InvitePage() {
  const [formData, setFormData] = useState({
    email: "",
    company_name: "",
    name: ""
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      // Call Edge Function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/submitInviteRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Er ging iets mis");
      }

      setStatus("success");
      setFormData({ email: "", company_name: "", name: "" });
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Er ging iets mis. Probeer het later opnieuw.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[var(--color-gray-50)]">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-emerald-100)] rounded-full mb-6">
              <Mail className="w-10 h-10 text-[var(--color-emerald-600)]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-gray-900)] mb-4">
              Schrijf je in voor PaintConnect
            </h1>
            <p className="text-lg text-[var(--color-gray-600)] max-w-xl mx-auto">
              PaintConnect is momenteel invite-only. Vul hieronder je gegevens in en wij nemen binnenkort contact met je op.
            </p>
          </div>

          {/* Success Message */}
          {status === "success" && (
            <div className="mb-8 p-6 bg-[var(--color-emerald-50)] border border-[var(--color-emerald-200)] rounded-xl">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-[var(--color-emerald-600)] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[var(--color-emerald-900)] mb-1">
                    Bedankt voor uw interesse!
                  </h3>
                  <p className="text-[var(--color-emerald-700)]">
                    We hebben uw verzoek ontvangen en nemen binnenkort contact met u op via e-mail.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === "error" && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Er ging iets mis
                  </h3>
                  <p className="text-red-700">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-[var(--color-gray-200)] p-8 md:p-10">
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[var(--color-gray-900)] mb-2">
                  E-mailadres <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-[var(--color-gray-400)]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-emerald-500)] focus:border-[var(--color-emerald-500)] outline-none transition-colors"
                    placeholder="jouw@emailadres.nl"
                    disabled={status === "submitting"}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[var(--color-gray-900)] mb-2">
                  Naam
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-[var(--color-gray-400)]" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-emerald-500)] focus:border-[var(--color-emerald-500)] outline-none transition-colors"
                    placeholder="Jouw naam"
                    disabled={status === "submitting"}
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="company_name" className="block text-sm font-semibold text-[var(--color-gray-900)] mb-2">
                  Bedrijfsnaam
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-[var(--color-gray-400)]" />
                  </div>
                  <input
                    type="text"
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-[var(--color-gray-300)] rounded-lg focus:ring-2 focus:ring-[var(--color-emerald-500)] focus:border-[var(--color-emerald-500)] outline-none transition-colors"
                    placeholder="Naam van je schildersbedrijf"
                    disabled={status === "submitting"}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "submitting" || status === "success"}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verzenden...
                  </>
                ) : status === "success" ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verzonden!
                  </>
                ) : (
                  <>
                    Verstuur verzoek
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-sm text-center text-[var(--color-gray-500)]">
                Door te verzenden geef je toestemming om contact met je op te nemen via e-mail.
              </p>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-6 bg-[var(--color-emerald-50)] border border-[var(--color-emerald-200)] rounded-xl">
            <h3 className="font-semibold text-[var(--color-emerald-900)] mb-2">
              Wat gebeurt er na je aanmelding?
            </h3>
            <ul className="space-y-2 text-sm text-[var(--color-emerald-700)]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>We beoordelen je aanmelding</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>We nemen contact met je op via e-mail</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Je ontvangt een uitnodiging om te starten</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
