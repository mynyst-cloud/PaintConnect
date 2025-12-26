import type { Metadata } from "next";
import { Inter } from "next/font/google";
import DocsNavigation from "@/components/DocsNavigation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PaintConnect Documentatie",
  description: "Volledige documentatie voor alle functies van PaintConnect - Alles wat je moet weten om PaintConnect optimaal te gebruiken",
  keywords: ["PaintConnect", "documentatie", "handleiding", "schilders", "projectmanagement"],
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="scroll-smooth">
      <body className={`${inter.variable} antialiased bg-gray-50 dark:bg-gray-900`}>
        <div className="flex min-h-screen">
          <DocsNavigation />
          <main className="flex-1 overflow-y-auto lg:ml-72 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
