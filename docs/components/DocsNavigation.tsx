"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, ChevronRight, Search, 
  LayoutDashboard, Calendar, Briefcase,
  MapPin, Package, Users, BarChart3,
  MessageCircle, CheckCircle, Settings,
  Menu, X
} from "lucide-react";
import { docsStructure } from "@/lib/docs-data";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  BookOpen,
  LayoutDashboard,
  CheckCircle,
  Settings,
};

export default function DocsNavigation() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredStructure = docsStructure.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">PC</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg">Docs</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={cn(
        "w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen fixed lg:sticky top-0 overflow-y-auto z-40 transition-transform duration-300 shadow-sm",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 pt-20 lg:pt-6">
          <div className="mb-8 hidden lg:block">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold">PC</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-lg block">PaintConnect</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Documentatie</span>
              </div>
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek in docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Navigation */}
          <div className="space-y-8">
            {filteredStructure.map((section) => {
              const Icon = iconMap[section.icon] || BookOpen;
              return (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                      {section.title}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                              isActive
                                ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 text-emerald-700 dark:text-emerald-400 font-medium shadow-sm"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-emerald-600 dark:hover:text-emerald-400"
                            )}
                          >
                            <ChevronRight className={cn(
                              "w-3 h-3 transition-transform flex-shrink-0",
                              isActive ? "rotate-90 text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                            )} />
                            <span className="truncate">{item.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
