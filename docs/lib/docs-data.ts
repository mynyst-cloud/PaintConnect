// Documentation structure and content

export interface DocSection {
  title: string;
  icon: string;
  items: DocItem[];
}

export interface DocItem {
  title: string;
  href: string;
  description?: string;
  category?: string;
}

export const docsStructure: DocSection[] = [
  {
    title: "Aan de slag",
    icon: "BookOpen",
    items: [
      {
        title: "Overzicht",
        href: "/overview",
        description: "Welkom bij PaintConnect - een introductie",
        category: "getting-started"
      },
      {
        title: "Account aanmaken",
        href: "/account-setup",
        description: "Hoe maak je een PaintConnect account aan",
        category: "getting-started"
      },
      {
        title: "Team uitnodigen",
        href: "/invite-team",
        description: "Schilders uitnodigen en toevoegen aan je team",
        category: "getting-started"
      },
      {
        title: "Eerste project",
        href: "/first-project",
        description: "Je eerste project aanmaken en beheren",
        category: "getting-started"
      },
    ]
  },
  {
    title: "Functies",
    icon: "LayoutDashboard",
    items: [
      {
        title: "Dashboard",
        href: "/features/dashboard",
        description: "Centraal overzicht van je bedrijf",
        category: "features"
      },
      {
        title: "Planning - Maandweergave",
        href: "/features/planning-month",
        description: "Projecten plannen in maandoverzicht",
        category: "features"
      },
      {
        title: "Planning - Weekweergave",
        href: "/features/planning-week",
        description: "Gedetailleerde weekplanning met resources",
        category: "features"
      },
      {
        title: "Projecten",
        href: "/features/projects",
        description: "Projecten beheren en volgen",
        category: "features"
      },
      {
        title: "Check-in Systeem",
        href: "/features/check-in",
        description: "GPS-tijdsregistratie voor 2027 wetgeving",
        category: "features"
      },
      {
        title: "Materiaalbeheer",
        href: "/features/materials",
        description: "Materialen aanvragen en beheren",
        category: "features"
      },
      {
        title: "Klantportaal",
        href: "/features/client-portal",
        description: "Klanten toegang geven tot projectvoortgang",
        category: "features"
      },
      {
        title: "Analytics",
        href: "/features/analytics",
        description: "Inzicht in bedrijfsprestaties",
        category: "features"
      },
      {
        title: "Team Communicatie",
        href: "/features/team-chat",
        description: "Interne teamchat en notificaties",
        category: "features"
      },
      {
        title: "Beschadigingen",
        href: "/features/damages",
        description: "Schademeldingen documenteren",
        category: "features"
      },
      {
        title: "Referrals",
        href: "/features/referrals",
        description: "Referral systeem en beloningen",
        category: "features"
      },
      {
        title: "Leads",
        href: "/features/leads",
        description: "Lead management en tracking",
        category: "features"
      },
      {
        title: "Verfcalculator",
        href: "/features/paint-calculator",
        description: "Bereken verfhoeveelheden",
        category: "features"
      },
      {
        title: "Offertes",
        href: "/features/quotes",
        description: "Offertes maken en beheren",
        category: "features"
      },
    ]
  },
  {
    title: "Gidsen",
    icon: "CheckCircle",
    items: [
      {
        title: "Tijdsregistratie 2027",
        href: "/guides/time-tracking-2027",
        description: "Wetgeving en compliance voor tijdsregistratie",
        category: "guides"
      },
      {
        title: "Materiaalbeheer",
        href: "/guides/material-management",
        description: "Complete gids voor materiaalbeheer",
        category: "guides"
      },
      {
        title: "Klant Onboarding",
        href: "/guides/client-onboarding",
        description: "Klanten onboarden in het portaal",
        category: "guides"
      },
      {
        title: "Team Setup",
        href: "/guides/team-setup",
        description: "Je team optimaal configureren",
        category: "guides"
      },
    ]
  },
  {
    title: "Account & Instellingen",
    icon: "Settings",
    items: [
      {
        title: "Account Instellingen",
        href: "/settings/account",
        description: "Je account beheren",
        category: "settings"
      },
      {
        title: "Abonnement",
        href: "/settings/subscription",
        description: "Abonnement beheren en upgraden",
        category: "settings"
      },
      {
        title: "Notificaties",
        href: "/settings/notifications",
        description: "Notificatie voorkeuren instellen",
        category: "settings"
      },
    ]
  }
];

// Flatten all docs for search
export const allDocs: DocItem[] = docsStructure.flatMap(section => 
  section.items.map(item => ({
    ...item,
    section: section.title
  }))
);


