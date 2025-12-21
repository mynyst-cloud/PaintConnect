import Layout from "./Layout.jsx";

import Projecten from "./Projecten";

import Materialen from "./Materialen";

import Klantportaal from "./Klantportaal";

import TeamChat from "./TeamChat";

import Beschadigingen from "./Beschadigingen";

import Referrals from "./Referrals";

import Planning from "./Planning";

import AccountSettings from "./AccountSettings";

import SuperAdmin from "./SuperAdmin";

import Help from "./Help";

import ReferralFAQ from "./ReferralFAQ";

import Subscription from "./Subscription";

import Notificaties from "./Notificaties";

import Verfcalculator from "./Verfcalculator";

import Analytics from "./Analytics";

import Leads from "./Leads";

import ClientPortalEntry from "./ClientPortalEntry";

import ClientPortalDashboard from "./ClientPortalDashboard";

import Dashboard from "./Dashboard";

import PrivacyPolicy from "./PrivacyPolicy";

import TermsOfService from "./TermsOfService";

import InviteAcceptance from "./InviteAcceptance";

import MateriaalBeheer from "./MateriaalBeheer";

import NaCalculatie from "./NaCalculatie";

import ActivateAccount from "./ActivateAccount";

import FAQ from "./FAQ";

import PlatformUpdates from "./PlatformUpdates";

import VerifyEmail from "./VerifyEmail";

import RegistratieCompany from "./RegistratieCompany";

import RegistratieSetup from "./RegistratieSetup";

import Privacy from "./Privacy";

import Terms from "./Terms";

import TeamActiviteit from "./TeamActiviteit";

import AISupportChat from "./AISupportChat";

import VoorraadBeheer from "./VoorraadBeheer";

import SuperAdminErrorLog from "./SuperAdminErrorLog";

import OfferteOpmeting from "./OfferteOpmeting";

import OfferteLijst from "./OfferteLijst";

import MagicLinkVerify from "./MagicLinkVerify";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Projecten: Projecten,
    
    Materialen: Materialen,
    
    Klantportaal: Klantportaal,
    
    TeamChat: TeamChat,
    
    Beschadigingen: Beschadigingen,
    
    Referrals: Referrals,
    
    Planning: Planning,
    
    AccountSettings: AccountSettings,
    
    SuperAdmin: SuperAdmin,
    
    Help: Help,
    
    ReferralFAQ: ReferralFAQ,
    
    Subscription: Subscription,
    
    Notificaties: Notificaties,
    
    Verfcalculator: Verfcalculator,
    
    Analytics: Analytics,
    
    Leads: Leads,
    
    ClientPortalEntry: ClientPortalEntry,
    
    ClientPortalDashboard: ClientPortalDashboard,
    
    Dashboard: Dashboard,
    
    PrivacyPolicy: PrivacyPolicy,
    
    TermsOfService: TermsOfService,
    
    InviteAcceptance: InviteAcceptance,
    
    MateriaalBeheer: MateriaalBeheer,
    
    NaCalculatie: NaCalculatie,
    
    ActivateAccount: ActivateAccount,
    
    FAQ: FAQ,
    
    PlatformUpdates: PlatformUpdates,
    
    VerifyEmail: VerifyEmail,
    
    RegistratieCompany: RegistratieCompany,
    
    RegistratieSetup: RegistratieSetup,
    
    Privacy: Privacy,
    
    Terms: Terms,
    
    TeamActiviteit: TeamActiviteit,
    
    AISupportChat: AISupportChat,
    
    VoorraadBeheer: VoorraadBeheer,
    
    SuperAdminErrorLog: SuperAdminErrorLog,
    
    OfferteOpmeting: OfferteOpmeting,
    
    OfferteLijst: OfferteLijst,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Projecten />} />
                
                
                <Route path="/Projecten" element={<Projecten />} />
                
                <Route path="/Materialen" element={<Materialen />} />
                
                <Route path="/Klantportaal" element={<Klantportaal />} />
                
                <Route path="/TeamChat" element={<TeamChat />} />
                
                <Route path="/Beschadigingen" element={<Beschadigingen />} />
                
                <Route path="/Referrals" element={<Referrals />} />
                
                <Route path="/Planning" element={<Planning />} />
                
                <Route path="/AccountSettings" element={<AccountSettings />} />
                
                <Route path="/SuperAdmin" element={<SuperAdmin />} />
                
                <Route path="/Help" element={<Help />} />
                
                <Route path="/ReferralFAQ" element={<ReferralFAQ />} />
                
                <Route path="/Subscription" element={<Subscription />} />
                
                <Route path="/Notificaties" element={<Notificaties />} />
                
                <Route path="/Verfcalculator" element={<Verfcalculator />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Leads" element={<Leads />} />
                
                <Route path="/ClientPortalEntry" element={<ClientPortalEntry />} />
                
                <Route path="/ClientPortalDashboard" element={<ClientPortalDashboard />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/InviteAcceptance" element={<InviteAcceptance />} />
                
                <Route path="/MateriaalBeheer" element={<MateriaalBeheer />} />
                
                <Route path="/NaCalculatie" element={<NaCalculatie />} />
                
                <Route path="/ActivateAccount" element={<ActivateAccount />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/PlatformUpdates" element={<PlatformUpdates />} />
                
                <Route path="/VerifyEmail" element={<VerifyEmail />} />
                
                <Route path="/RegistratieCompany" element={<RegistratieCompany />} />
                
                <Route path="/RegistratieSetup" element={<RegistratieSetup />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/Terms" element={<Terms />} />
                
                <Route path="/TeamActiviteit" element={<TeamActiviteit />} />
                
                <Route path="/AISupportChat" element={<AISupportChat />} />
                
                <Route path="/VoorraadBeheer" element={<VoorraadBeheer />} />
                
                <Route path="/SuperAdminErrorLog" element={<SuperAdminErrorLog />} />
                
                <Route path="/OfferteOpmeting" element={<OfferteOpmeting />} />
                
                <Route path="/OfferteLijst" element={<OfferteLijst />} />
                
                <Route path="/auth/verify" element={<MagicLinkVerify />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}