
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  HelpCircle, 
  Mail, 
  LayoutDashboard, 
  Briefcase, 
  Package, 
  AlertTriangle, 
  Users, 
  MessageCircle, 
  Trophy, 
  Calendar, 
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Play,
  ExternalLink,
  ChevronDown, 
  ChevronUp, 
  Ticket, 
  Clock, 
  User, 
  X,
  LifeBuoy, 
  Send, 
  ArrowRight 
} from "lucide-react";
import { User as AuthUser } from "@/api/entities"; 
import { HelpdeskTicket, HelpdeskReply } from "@/api/entities"; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { format, formatDistanceToNow } from 'date-fns'; 
import { nl } from 'date-fns/locale'; 
import { createPageUrl } from '@/components/utils'; 
import { Link } from 'react-router-dom'; 

const features = [
    { 
      title: "Dashboard", 
      icon: LayoutDashboard, 
      description: "Een centraal overzicht van alle belangrijke activiteiten, statistieken en recente projecten.",
      details: [
        "Real-time overzicht van alle actieve projecten",
        "Snelle toegang tot openstaande taken", 
        "Statistieken over teamproductiviteit",
        "Meldingen van urgente zaken"
      ]
    },
    { 
      title: "Planning", 
      icon: Calendar, 
      description: "Een visuele kalender om projecten in te plannen, toe te wijzen aan schilders en de werkdruk te beheren.",
      details: [
        "Drag & drop planning interface",
        "Capaciteitsplanning per schilder",
        "Automatische conflictdetectie",
        "Export naar externe kalenders"
      ]
    },
    { 
      title: "Projectenbeheer", 
      icon: Briefcase, 
      description: "Beheer al je schilderprojecten, van start tot finish. Volg de voortgang, voeg foto's toe en beheer details.",
      details: [
        "Projectstatus tracking in real-time",
        "Foto's uploaden voor voortgangsdocumentatie",
        "Automatische voortgangsrapportages naar klanten",
        "Kostenregistratie en budgetbewaking"
      ]
    },
    { 
      title: "Materiaalbeheer", 
      icon: Package, 
      description: "Dien materiaalaanvragen in voor projecten en volg de status van goedkeuring tot levering.",
      details: [
        "Eenvoudige materiaalaanvraag workflow",
        "Goedkeuringsproces met kostenbewaking",
        "Leveranciersbeheer en bestellingen",
        "Voorraadtracking en alerts"
      ]
    },
    { 
      title: "Beschadigingenbeheer", 
      icon: AlertTriangle, 
      description: "Meld en documenteer beschadigingen op de werf met foto's, zodat niets over het hoofd wordt gezien.",
      details: [
        "Instant foto-upload met locatiedata",
        "Prioriteitssysteem voor urgente reparaties",
        "Automatische meldingen naar projectmanager",
        "Reparatietracking en kostendocumentatie"  
      ]
    },
    { 
      title: "Referral Marketing", 
      icon: Trophy, 
      description: "Een krachtig doorverwijzingssysteem met QR-codes waarmee schilders nieuwe klanten kunnen werven en beloningen verdienen.",
      details: [
        "Persoonlijke QR-codes per schilder",
        "Automatische lead-tracking en toewijzing",
        "Competitieve leaderboards en bonussen",
        "Geïntegreerd CRM voor follow-up"
      ]
    },
    { 
      title: "Team Communicatie", 
      icon: MessageCircle, 
      description: "Real-time communicatie met je team en een speciaal kanaal om vragen van klanten te beantwoorden.",
      details: [
        "Instant messaging tussen teamleden",
        "Klantenvragen rechtstreeks beantwoorden",
        "Berichtgeschiedenis en zoekfunctie",
        "Push notificaties op mobiele apparaten"
      ]
    },
    { 
      title: "Klantportaal", 
      icon: Users, 
      description: "Een professioneel portaal waar uw klanten de voortgang van hun project kunnen volgen.",
      details: [
        "Beveiligde toegang per project",
        "Real-time voortgangsupdates",
        "Fotogalerij van het werk",
        "Directe communicatielijn met het team"
      ]
    },
    { 
      title: "Accountbeheer", 
      icon: Settings, 
      description: "Beheer je bedrijfsgegevens, bekijk je abonnement en facturen.",
      details: [
        "Bedrijfsprofiel en contact gegevens",
        "Abonnement upgraden/downgraden",
        "Factuurgeschiedenis en downloads",
        "Gebruikersbeheer en toegangsrechten"
      ]
    }
];

const faqs = [
    { 
      question: "Hoe voeg ik een nieuwe schilder toe aan mijn team?", 
      answer: "Ga naar 'Accountinstellingen' en klik op 'Teamleden uitnodigen'. Voer het e-mailadres in van de nieuwe schilder. Deze ontvangt automatisch een uitnodiging om zich te registreren. Na registratie kunt u hun rol instellen op 'schilder' en hen toegang geven tot specifieke projecten." 
    },
    { 
      question: "Hoe werkt het referral systeem precies?", 
      answer: "Elke schilder krijgt een unieke QR-code die ze kunnen delen met potentiële klanten. Wanneer een prospect de QR-code scant, vult ze een contactformulier in dat automatisch wordt toegewezen aan de betreffende schilder. U kunt de status van elke referral opvolgen, van eerste contact tot gesloten deal, en bonussen toekennen aan uw best presterende schilders." 
    },
    { 
      question: "Is mijn bedrijfsdata veilig in PaintConnect?", 
      answer: "Ja, absoluut. Alle data wordt versleuteld opgeslagen volgens de hoogste beveiligingsstandaarden. Toegang tot bedrijfsdata is strikt gescheiden per bedrijf - u heeft alleen toegang tot uw eigen gegevens. Het klantportaal vereist e-mailverificatie om toegang te krijgen tot projectdetails. We volgen GDPR-richtlijnen voor dataprotectie." 
    },
    { 
      question: "Kan ik mijn abonnement op elk moment wijzigen?", 
      answer: "Ja, u kunt uw abonnement op elk moment upgraden of downgraden. Ga naar 'Accountinstellingen' > 'Abonnement beheren'. Upgrades gaan direct in, downgrades worden actief aan het einde van uw huidige facturatieperiode. U betaalt nooit dubbel en krijgt een proportionele vergoeding bij downgrades." 
    },
    { 
      question: "Wat gebeurt er als mijn proefperiode afloopt?", 
      answer: "7 dagen voor het einde van uw proefperiode ontvangt u een herinnering om een betaald abonnement te kiezen. Als u geen actie onderneemt, wordt uw account in 'alleen-lezen' modus gezet - u kunt uw data nog bekijken maar geen nieuwe projecten aanmaken. Uw data blijft 30 dagen bewaard zodat u alsnog kunt upgraden." 
    },
    { 
      question: "Kunnen mijn klanten hun eigen account aanmaken?", 
      answer: "Nee, klanten krijgen automatisch toegang tot hun projectportaal via het e-mailadres dat u bij het project invoert. Ze ontvangen een welkomstmail met instructies. Dit houdt het systeem eenvoudig en veilig - klanten zien alleen hun eigen projecten en kunnen geen wijzigingen aanbrengen." 
    },
    { 
      question: "Hoe kan ik mijn team trainen in het gebruik van PaintConnect?", 
      answer: "We bieden verschillende trainingsopties: online tutorials in de app, video-handleidingen op onze website, en op aanvraag live trainingsessies voor teams. Daarnaast hebben we een uitgebreide kennisbank met stap-voor-stap gidsen. Voor Enterprise-klanten is persoonlijke onboarding inbegrepen." 
    },
    { 
      question: "Kan ik PaintConnect integreren met mijn bestaande boekhoudsoftware?", 
      answer: "Ja, PaintConnect heeft API-koppelingen beschikbaar voor populaire boekhoudpakketten. Voor Enterprise-klanten ontwikkelen we op maat gemaakte integraties. Neem contact op met ons support team om de mogelijkheden voor uw specifieke software te bespreken." 
    }
];

const additionalResourcesData = [
    {
      key: "video-tutorials",
      title: "Video Tutorials",
      icon: Play,
      description: "Bekijk onze uitgebreide videohandleidingen om snel aan de slag te gaan en alle functies van PaintConnect te ontdekken.",
      content: "Hier vindt u een verzameling van onze instructievideo's. Voor een compleet overzicht, bezoek onze officiële YouTube-pagina of de handleidingsectie op onze website.",
      externalLink: "https://www.paintconnect.be/handleiding"
    },
    {
      key: "best-practices",
      title: "Best Practices Gids",
      icon: BookOpen,
      description: "Lees onze gids met tips en trucs om PaintConnect optimaal te gebruiken voor jouw bedrijfsprocessen en maximale efficiëntie.",
      content: "Ontdek de beste werkwijzen en geoptimaliseerde workflows om het meeste uit PaintConnect te halen. Deze gids bevat adviezen van ervaren gebruikers en experts.",
      externalLink: "https://www.paintconnect.be/best-practices"
    },
    {
      key: "api-documentation",
      title: "API Documentatie",
      icon: Settings,
      description: "Gedetailleerde documentatie voor ontwikkelaars die PaintConnect willen integreren met andere systemen en hun eigen applicaties.",
      content: "Voor geavanceerde gebruikers en ontwikkelaars die PaintConnect willen koppelen aan andere software. Hier vindt u alle technische specificaties en voorbeelden.",
      externalLink: "https://www.paintconnect.be/api-docs"
    },
];

const FeatureDetail = ({ feature, onClose }) => (
  <Card className="shadow-lg border-emerald-200">
    <CardHeader className="bg-emerald-50">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-3 text-xl text-emerald-800">
          <feature.icon className="w-6 h-6" />
          {feature.title}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>
    </CardHeader>
    <CardContent className="p-6">
      <p className="text-gray-700 mb-4">{feature.description}</p>
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Belangrijkste functies:</h4>
        <ul className="space-y-2">
          {feature.details.map((detail, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

const AdditionalResourceDetail = ({ resource, onClose }) => (
  <Card className="shadow-lg border-emerald-200">
    <CardHeader className="bg-emerald-50">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-3 text-xl text-emerald-800">
          <resource.icon className="w-6 h-6" />
          {resource.title}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>
    </CardHeader>
    <CardContent className="p-6">
      <p className="text-gray-700 mb-4">{resource.description}</p>
      <p className="text-gray-700">{resource.content}</p>
      {resource.externalLink && (
        <a href={resource.externalLink} target="_blank" rel="noopener noreferrer" 
           className="text-emerald-600 hover:underline flex items-center gap-1 mt-4">
          Ga naar externe bron <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </CardContent>
  </Card>
);

const ContactForm = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState('idle'); // idle, sending, success, error
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        AuthUser.me().then(user => { 
            if (user) {
                setCurrentUser(user);
                setFormData(prev => ({...prev, name: user.full_name || '', email: user.email || ''}));
            }
        }).catch(() => {/* ignore, user not logged in */});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            // 1. Create a Helpdesk Ticket in the database
            const newTicket = await HelpdeskTicket.create({
                ...formData,
                company_id: currentUser?.company_id || 'Niet ingelogd'
            });

            // 2. Send an email notification to the admin/helpdesk
            await SendEmail({
                to: "mynysteven@gmail.com", // Super Admin email
                from_name: `PaintConnect Helpdesk`,
                subject: `Nieuw Helpdesk Ticket (#${newTicket.id}): ${formData.subject}`,
                body: `
                    Een nieuw ticket is aangemaakt in de PaintConnect helpdesk.\n\n
                    Van: ${formData.name}\n
                    Email: ${formData.email}\n
                    Bedrijf ID: ${currentUser?.company_id || 'Niet ingelogd'}\n\n
                    Bericht:\n
                    ${formData.message}\n\n
                    Bekijk en beheer dit ticket in de app via de Helpdesk pagina.
                `
            });
            setStatus('success');
            setFormData(prev => ({...prev, subject: '', message: ''}));
        } catch (error) {
            console.error("Failed to send email or create ticket:", error);
            setStatus('error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="name">Uw Naam</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="email">Uw E-mailadres</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor="subject">Onderwerp</Label>
                <Input id="subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
            </div>
            <div className="space-y-1">
                <Label htmlFor="message">Uw Vraag</Label>
                <Textarea id="message" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={5} required />
            </div>
            <div className="flex items-center justify-between">
                <Button type="submit" disabled={status === 'sending'} className="bg-emerald-600 hover:bg-emerald-700">
                    {status === 'sending' && <InlineSpinner />}
                    Verstuur Bericht
                </Button>
                {status === 'success' && <p className="text-green-600 flex items-center gap-2"><CheckCircle/> Bericht succesvol verzonden!</p>}
                {status === 'error' && <p className="text-red-600 flex items-center gap-2"><AlertCircle/> Er is iets misgegaan. Probeer het opnieuw.</p>}
            </div>
        </form>
    );
};

const TicketDetailsModal = ({ ticket, onClose }) => {
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReplies = async () => {
      setIsLoading(true);
      try {
        const ticketReplies = await HelpdeskReply.filter({ ticket_id: ticket.id }, 'timestamp');
        setReplies(ticketReplies);
      } catch (error) {
        console.error("Error fetching replies:", error);
      }
      setIsLoading(false);
    };

    fetchReplies();
  }, [ticket.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_behandeling': return 'bg-yellow-100 text-yellow-800';
      case 'gesloten': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{ticket.subject}</CardTitle>
              <p className="text-sm text-gray-500">Ticket #{ticket.id} - Gemaakt door {ticket.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusBadge(ticket.status)}>{ticket.status}</Badge>
            <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(ticket.created_date), { addSuffix: true, locale: nl })}</span>
          </div>
        </CardHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Oorspronkelijk bericht</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Antwoorden</h4>
            {isLoading ? <InlineSpinner /> : (
              <div className="space-y-4">
                {replies.length > 0 ? replies.map(reply => (
                  <div key={reply.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4"/>
                    </div>
                    <div className="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-sm text-emerald-900">{reply.sender_name} (Support)</p>
                        <p className="text-xs text-emerald-700">{format(new Date(reply.timestamp), "dd-MM-yy HH:mm", {locale: nl})}</p>
                      </div>
                      <p className="text-sm text-emerald-800 whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">Nog geen antwoorden van het support team.</p>
                )}
              </div>
            )}
          </div>
        </div>
        <CardFooter className="bg-gray-50 border-t">
            <p className="text-xs text-gray-500">U kunt niet rechtstreeks op dit ticket antwoorden. Maak een nieuw ticket aan als u verdere vragen heeft.</p>
        </CardFooter>
      </motion.div>
    </motion.div>
  );
};

const HelpdeskTicketViewer = ({ onCancel, currentUser }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      try {
        if (currentUser && currentUser.company_id) {
          const companyTickets = await HelpdeskTicket.filter({ company_id: currentUser.company_id }, '-created_date');
          setTickets(companyTickets);
        } else {
            setTickets([]); // Clear tickets if no valid user/company_id
        }
      } catch (error) {
        console.error("Error loading tickets:", error);
      }
      setIsLoading(false);
    };

    if (currentUser) {
        loadTickets();
    } else {
        setIsLoading(false);
        setTickets([]);
    }
  }, [currentUser]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_behandeling': return 'bg-yellow-100 text-yellow-800';
      case 'gesloten': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Ticket className="w-6 h-6 text-emerald-600"/>
              Mijn Helpdesk Tickets
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-600 text-sm">Bekijk hier de status van uw ingediende vragen.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">
                <LoadingSpinner size="default" />
                <p>Tickets worden geladen...</p>
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">
                        Ingediend: {format(new Date(ticket.created_date), 'dd MMMM yyyy, HH:mm', { locale: nl })}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(ticket.status)}>{ticket.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>U heeft nog geen tickets aangemaakt.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <AnimatePresence>
        {selectedTicket && <TicketDetailsModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      </AnimatePresence>
    </>
  );
};


export default function Help() {
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [showMyTickets, setShowMyTickets] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
      AuthUser.me().then(setCurrentUser).catch(() => {});
    }, []);

    // Function to scroll to an element by ID
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const MyTickets = () => {
      return <HelpdeskTicketViewer onCancel={() => setShowMyTickets(false)} currentUser={currentUser} />;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Help & Support</h1>
                      <p className="text-gray-600 dark:text-slate-400 mt-1">Alles wat u moet weten over PaintConnect</p>
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                    {showMyTickets && <MyTickets />}
                </AnimatePresence>

                {!showMyTickets && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Left column: Features, FAQs, Additional Resources */}
                    <div className="lg:col-span-2 space-y-8">
                        {selectedFeature ? (
                            <FeatureDetail feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
                        ) : selectedResource ? (
                            <AdditionalResourceDetail resource={selectedResource} onClose={() => setSelectedResource(null)} />
                        ) : (
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <BookOpen className="w-6 h-6 text-emerald-600"/>
                                        Functionaliteiten Overzicht
                                    </CardTitle>
                                    <p className="text-gray-600">Klik op een functie om meer details te bekijken</p>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {features.map(feature => (
                                        <div 
                                            key={feature.title} 
                                            className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                                            onClick={() => setSelectedFeature(feature)}
                                        >
                                            <div className="flex-shrink-0 text-emerald-600 bg-emerald-100 p-2 rounded-full">
                                                <feature.icon className="w-5 h-5"/>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    {feature.title}
                                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                        
                        <Card className="shadow-lg"> 
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <HelpCircle className="w-6 h-6 text-emerald-600"/>
                                    Veelgestelde Vragen (FAQ)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`item-${index}`}>
                                            <AccordionTrigger className="font-semibold text-left">{faq.question}</AccordionTrigger>
                                            <AccordionContent className="text-gray-700 whitespace-pre-line">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>

                        {/* Additional Resources */}
                        <Card className="bg-emerald-50 border-emerald-200">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                                    <ExternalLink className="w-5 h-5" />
                                    Aanvullende Bronnen
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {additionalResourcesData.map(resource => (
                                        <div 
                                            key={resource.key}
                                            className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                                            onClick={() => setSelectedResource(resource)}
                                        >
                                            <resource.icon className="w-4 h-4" />
                                            {resource.title}
                                        </div>
                                    ))}
                                    {/* Direct E-mail Support functionality is now a separate block below */}
                                </div>
                            </CardContent>
                        </Card>

                        {/* New: Direct Contact Block */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">Direct Contact</h3>
                            </div>
                            <p className="text-emerald-700 dark:text-emerald-300 mb-4">
                              Heeft u een vraag die hier niet wordt beantwoord? Neem direct contact met ons op!
                            </p>
                            <a 
                              href="mailto:support@paintconnect.be" 
                              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              support@paintconnect.be
                            </a>
                        </div>
                    </div>

                    {/* Right column: My Tickets, Contact Form */}
                    <div className="space-y-8">
                        {currentUser && currentUser.company_id && (
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-purple-600"/>
                                        Mijn Tickets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4">Bekijk de status van uw ingediende vragen en de antwoorden van ons support team.</p>
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setShowMyTickets(true)}>
                                        Bekijk Mijn Tickets
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card id="contact-form" className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-2xl">
                                    <Mail className="w-6 h-6 text-emerald-600"/>
                                    Neem Contact Op
                                </CardTitle>
                                <p className="text-gray-600 text-sm">Kunt u het antwoord niet vinden? Ons support team staat voor u klaar.</p>
                            </CardHeader>
                            <CardContent>
                                <ContactForm />
                            </CardContent>
                        </Card>
                    </div>
                </div>
                )}
                <div className="mt-12 text-center text-gray-500 dark:text-slate-500">
                    <p>&copy; {new Date().getFullYear()} PaintConnect. PAINTCONNECT BETA 1.</p>
                </div>
            </div>
        </div>
    );
}
