
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Users,
  Building,
  Truck,
  Briefcase,
  Package,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock,
  Info
} from 'lucide-react';
import { Company, Supplier, Project, MaterialRequest, Damage, ChatMessage, Referral } from '@/api/entities';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';

// Realistic Dutch company names and data
const COMPANY_NAMES = [
  'Schildersbedrijf De Verfkwast', 'Van der Berg Schilders', 'Kleur & Co', 'Amsterdam Painters',
  'Rotterdam Verfspecialisten', 'Utrecht Schilders', 'Den Haag Painting', 'Eindhoven Verfdiensten',
  'Groningen Schilderwerk', 'Tilburg Kleurexperts', 'Almere Schilders', 'Breda Verfmeesters',
  'Nijmegen Painting Services', 'Apeldoorn Schildersbedrijf', 'Haarlem Kleur Studio',
  'Arnhem Verfprojecten', 'Zaanstad Schilders', 'Zoetermeer Painting', 'Leeuwarden Verfwerk',
  'Maastricht Schilderservice'
];

const DUTCH_CITIES = [
  'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen',
  'Tilburg', 'Almere', 'Breda', 'Nijmegen', 'Apeldoorn', 'Haarlem', 'Arnhem',
  'Zaanstad', 'Zoetermeer', 'Leeuwarden', 'Maastricht', 'Dordrecht', 'Leiden',
  'Emmen', 'Ede', 'Westland', 'Delft', 'Venlo', 'Deventer'
];

const SUPPLIER_NAMES = [
  'Sigma Coatings Nederland', 'AkzoNobel Decorative Paints', 'Flexa Professional',
  'Sikkens Center', 'Histor Verfspecialist', 'Wijzonol Lakken', 'Boss Paints',
  'Jotun Benelux', 'Rust-Oleum Nederland', 'Poliet Verf & Chemie',
  'Koopmans Verven', 'Gamma Professional', 'Praxis Zakelijk', 'Hornbach Pro',
  'ToolStation Nederland', 'Brico Professional', 'Van Cranenbroek',
  'Verfgigant.nl', 'Verfshop Nederland', 'PaintStore Professional'
];

const PROJECT_TYPES = [
  'Woonkamer schilderen', 'Slaapkamer renovatie', 'Keuken opknappen', 
  'Badkamer verven', 'Gevel onderhoud', 'Kantoor renovatie',
  'Winkel make-over', 'Hal en trap schilderen', 'Zolder verbouwen',
  'Garage verven', 'Schuurtje onderhoud', 'Hekwerk lakken'
];

// Rate limiting helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createWithRetry = async (entityClass, data, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await entityClass.create(data);
    } catch (error) {
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed to create after ${maxRetries} attempts`);
};

const createIndividuallyWithDelay = async (entityClass, dataArray, delayMs = 500) => {
  const results = [];
  
  for (let i = 0; i < dataArray.length; i++) {
    try {
      const result = await createWithRetry(entityClass, dataArray[i]);
      results.push(result);
      
      // Add delay between individual creates to avoid rate limiting
      if (i < dataArray.length - 1) {
        await delay(delayMs);
      }
    } catch (error) {
      console.error(`Failed to create item ${i}:`, error.message);
      // Continue with other items instead of failing completely
    }
  }
  
  return results;
};

export default function DataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [warnings, setWarnings] = useState([]);

  const generateRealisticData = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedData(null);
    setWarnings([]);
    setStatusMessage('Voorbereiden van extreme load test data generatie...');

    try {
      // Step 1: Generate Companies (increased for stress test)
      setCurrentStep('Schildersbedrijven aanmaken (individueel)...');
      setStatusMessage('Companies worden individueel aangemaakt om platform beperkingen te respecteren');
      
      const companies = [];
      const totalCompanies = 250; // Increased from 50 to 250 for more data
      
      const companyData = [];
      for (let i = 0; i < totalCompanies; i++) {
        const baseName = COMPANY_NAMES[i % COMPANY_NAMES.length] || 'Schildersbedrijf';
        const companyName = i >= COMPANY_NAMES.length ? `${baseName} ${i}` : baseName;
        const city = DUTCH_CITIES[i % DUTCH_CITIES.length] || 'Amsterdam';
        
        const safeCompanyName = companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '') : `bedrijf${i}`;
        
        companyData.push({
          name: companyName,
          owner_email: `info@${safeCompanyName}${i > 19 ? i : ''}.nl`,
          address: `${Math.floor(Math.random() * 999) + 1} ${city}straat, ${Math.floor(Math.random() * 8999) + 1000} AA ${city}`,
          email: `contact@${safeCompanyName}${i > 19 ? i : ''}.nl`,
          phone_number: `06-${Math.floor(Math.random() * 90000000) + 10000000}`,
          vat_number: `NL${Math.floor(Math.random() * 900000000) + 100000000}B01`,
          subscription_status: Math.random() > 0.3 ? 'active' : 'trial'
        });
      }

      const companyResults = await createIndividuallyWithDelay(Company, companyData, 800);
      companies.push(...companyResults);
      setProgress(30);

      if (companies.length === 0) {
        throw new Error('Geen bedrijven succesvol aangemaakt. Platform beperkingen of rate limits.');
      }

      setWarnings(prev => [...prev, 
        `✓ ${companies.length} bedrijven succesvol aangemaakt`,
        `⚠️ Users worden NIET aangemaakt - platform vereist invite systeem`,
        `ℹ️ Dit simuleert de enterprise constraints van het platform`
      ]);

      // Step 2: Generate Suppliers
      setCurrentStep('Leveranciers aanmaken...');
      setStatusMessage('Leveranciers worden toegevoegd');
      setProgress(40);
      
      const suppliers = [];
      const supplierData = [];
      
      for (let i = 0; i < 50; i++) { // Increased from 25 to 50
        const supplierName = SUPPLIER_NAMES[i] || `Leverancier ${i}`;
        const safeSupplierName = supplierName ? supplierName.toLowerCase().replace(/[^a-z0-9]/g, '') : `leverancier${i}`;
        
        supplierData.push({
          name: supplierName,
          owner_email: `sales@${safeSupplierName}.nl`,
          address: `${Math.floor(Math.random() * 999) + 1} Industrieweg, ${Math.floor(Math.random() * 8999) + 1000} AA ${DUTCH_CITIES[i % DUTCH_CITIES.length] || 'Amsterdam'}`,
          vat_number: `NL${Math.floor(Math.random() * 900000000) + 100000000}B01`,
          status: 'active',
          specialties: ['Verf', 'Gereedschap', 'Kwasten', 'Rollers'].slice(0, Math.floor(Math.random() * 4) + 1)
        });
      }

      const supplierResults = await createIndividuallyWithDelay(Supplier, supplierData, 600);
      suppliers.push(...supplierResults);
      setProgress(55);

      // Step 3: Generate Sample Projects (within permissions)
      setCurrentStep('Projecten genereren (beperkt door permissions)...');
      setStatusMessage('Sample projecten worden aangemaakt binnen platform beperkingen');
      setProgress(65);
      
      const projects = [];
      
      // Only create projects for a few companies to avoid permission issues
      for (let i = 0; i < Math.min(10, companies.length); i++) { // Increased from 5 to 10
        const company = companies[i];
        if (!company || !company.id) {
          console.warn(`Skipping projects for company ${i} - invalid company data (company: ${JSON.stringify(company)})`);
          continue;
        }

        const projectData = [];
        for (let j = 0; j < 5; j++) { // Increased from 3 to 5 projects per company
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 365));
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 30) + 7);

          const projectType = PROJECT_TYPES[j % PROJECT_TYPES.length] || 'Schilderwerk';
          const clientName = `Test Klant ${i}-${j}`;
          const city = DUTCH_CITIES[j % DUTCH_CITIES.length] || 'Amsterdam';

          projectData.push({
            company_id: company.id,
            project_name: `${projectType} - ${clientName}`,
            client_name: clientName,
            client_email: `testklant${i}${j}@example.nl`,
            address: `${Math.floor(Math.random() * 999) + 1} ${city}straat, ${Math.floor(Math.random() * 8999) + 1000} AA ${city}`,
            start_date: startDate.toISOString().split('T')[0],
            expected_end_date: endDate.toISOString().split('T')[0],
            status: ['nieuw', 'in_uitvoering', 'planning', 'afgerond'][Math.floor(Math.random() * 4)],
            progress_percentage: Math.floor(Math.random() * 101),
            description: `Load test project: ${projectType.toLowerCase()} inclusief voorbehandeling en afwerking`,
            estimated_hours: Math.floor(Math.random() * 80) + 20,
            actual_hours: Math.floor(Math.random() * 60) + 15,
            assigned_painters: [] // Empty due to user creation restrictions
          });
        }

        try {
          const projectResults = await createIndividuallyWithDelay(Project, projectData, 1000);
          projects.push(...projectResults);
          setProgress(65 + Math.floor((i / 10) * 15));
        } catch (error) {
          setWarnings(prev => [...prev, `Fout bij projecten voor bedrijf ${company.name || 'Onbekend'}: ${error.message}`]);
        }
      }

      // Step 4: Generate Sample Material Requests
      setCurrentStep('Materiaal aanvragen genereren...');
      setProgress(85);
      
      const materials = ['Muurverf', 'Primer', 'Lakverf', 'Kwasten', 'Rollers', 'Afplaktape'];
      const materialRequests = [];
      
      for (const project of projects.slice(0, 20)) { // Increased from 10 to 20
        if (!project || !project.id || !project.company_id) {
          console.warn('Skipping material request - invalid project data (project: ', JSON.stringify(project), ')');
          continue;
        }

        const requestData = {
          company_id: project.company_id,
          project_id: project.id,
          material_name: materials[Math.floor(Math.random() * materials.length)],
          quantity: Math.floor(Math.random() * 20) + 1,
          unit: ['liter', 'kg', 'stuks', 'rol'][Math.floor(Math.random() * 4)],
          priority: ['laag', 'normaal', 'hoog', 'urgent'][Math.floor(Math.random() * 4)],
          status: ['aangevraagd', 'goedgekeurd', 'besteld', 'geleverd'][Math.floor(Math.random() * 4)],
          requested_by: 'Load Test Schilder',
          supplier_id: suppliers.length > 0 ? suppliers[Math.floor(Math.random() * suppliers.length)].id : null
        };

        try {
          const request = await createWithRetry(MaterialRequest, requestData);
          materialRequests.push(request);
          await delay(400);
        } catch (error) {
          setWarnings(prev => [...prev, `Fout bij materiaal aanvraag: ${error.message}`]);
        }
      }

      setCurrentStep('Load test data generatie voltooid!');
      setProgress(100);
      setStatusMessage('Load test data succesvol gegenereerd binnen platform beperkingen');

      setGeneratedData({
        companies: companies.length,
        users: 0, // Cannot create users via API
        suppliers: suppliers.length,
        projects: projects.length,
        materialRequests: materialRequests.length,
        messages: 0,
        damages: 0,
        platformConstraints: [
          'Users: Moeten via invite systeem aangemaakt worden',
          'Projects: Beperkte bulk creation door permissions',
          'Rate Limits: Actieve bescherming tegen overbelasting',
          'Security: Enterprise-level access controls actief'
        ]
      });

    } catch (error) {
      console.error('Error generating load test data:', error);
      setStatusMessage(`Fout bij het genereren van data: ${error.message}`);
      setWarnings(prev => [...prev, `Kritieke fout: ${error.message}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Stress Test Data Generator</h2>
          <p className="text-gray-600 dark:text-slate-400">
            Genereert een grotere dataset voor de extreme load test.
          </p>
        </div>
        <Button 
          onClick={generateRealisticData} 
          disabled={isGenerating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4 mr-2" />}
          {isGenerating ? 'Genereren...' : 'Start Data Generatie'}
        </Button>
      </div>

      {/* Platform Constraints Info */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>Platform Beperkingen:</strong> Deze load test werkt binnen enterprise beveiligingsconstraints. 
          Users worden via invite-systeem beheerd, projecten hebben permission checks, en rate limiting beschermt tegen overbelasting.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Stress Test Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <Building className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">250</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Schildersbedrijven</div>
              <div className="text-xs text-gray-500 dark:text-slate-500">↑ verhoogd voor stress test</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
              <Users className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Users</div>
              <div className="text-xs text-gray-500 dark:text-slate-500">Platform vereist invite systeem</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
              <Truck className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">50</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Leveranciers</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
              <Briefcase className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">~50</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Sample Projecten</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 animate-pulse" />
                Data Generatie Voortgang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{currentStep}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                {statusMessage}
              </div>
              {warnings.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  {warnings.map((warning, index) => (
                    <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {generatedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Load Test Data Succesvol Gegenereerd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-bold">{generatedData.companies.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">Bedrijven</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-bold">{generatedData.users.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">Gebruikers (API Beperking)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-bold">{generatedData.projects.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">Projecten</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-bold">{generatedData.materialRequests.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">Materiaal Aanvragen</div>
                  </div>
                </div>
              </div>

              {/* Platform Constraints Info */}
              {generatedData.platformConstraints && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                    <Info className="w-5 h-5" />
                    <span className="font-semibold">Platform Beveiligings Features:</span>
                  </div>
                  <ul className="space-y-1">
                    {generatedData.platformConstraints.map((constraint, index) => (
                      <li key={index} className="text-sm text-blue-700 dark:text-blue-300">
                        • {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Load Test Data Klaar!</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Test data succesvol gegenereerd binnen platform enterprise beveiligingsbeperkingen. 
                  Nu kunt u de performance monitoring testen.
                </p>
              </div>

              {warnings.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-950/50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Generatie Log:</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
