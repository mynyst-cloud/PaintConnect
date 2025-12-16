import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils";

const StatCard = ({ title, value, icon: Icon, color, linkTo, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="h-full"
  >
    <Link to={linkTo} className="h-full block group">
      <Card className={`relative overflow-hidden bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl dark:shadow-slate-950/50 transition-all duration-300 transform hover:-translate-y-1 border-0 text-white h-full flex flex-col min-h-[140px]`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
        <CardContent className="relative p-4 z-10 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
              <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-auto">
            <p className="text-2xl lg:text-3xl xl:text-4xl font-bold leading-none mb-1">
              {value}
            </p>
            <p className="text-sm font-medium truncate leading-tight opacity-90">
              {title}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

export default function AdminStats({ stats }) {
  if (!stats) return null;

  const adminCards = [
    {
      title: "Nieuwe Leads (7d)",
      value: stats.newLeads,
      icon: Users,
      color: "from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
      linkTo: createPageUrl("Leads")
    },
    {
      title: "Projecten Voltooid (Maand)",
      value: stats.completedProjects,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700",
      linkTo: createPageUrl("Projecten")
    },
    {
      title: "Uren Geregistreerd (7d)",
      value: stats.hoursLogged,
      icon: Clock,
      color: "from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700",
      linkTo: createPageUrl("Analytics") // Placeholder link, maybe to a time tracking page later
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
      <Card className="shadow-lg dark:shadow-slate-950/50 border-0 bg-white dark:bg-slate-800">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Admin Overzicht
          </CardTitle>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Een snelle blik op de belangrijkste statistieken.</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {adminCards.map((card, index) => (
              <StatCard key={card.title} {...card} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}