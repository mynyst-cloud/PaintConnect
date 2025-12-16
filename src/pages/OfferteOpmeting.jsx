import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OfferteOpmeting, User, Company } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Save, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/components/utils';
import { base44 } from '@/api/base44Client';

import SpeechRecognitionComponent from '@/components/offerte/SpeechRecognitionComponent';
import MetingenTable from '@/components/offerte/MetingenTable';
import ConceptOfferte from '@/components/offerte/ConceptOfferte';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function OfferteOpmetingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const opmetingId = searchParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const [projectSectionOpen, setProjectSectionOpen] = useState(true);
  const [projectSaved, setProjectSaved] = useState(false);
  const [correctingMetingIndex, setCorrectingMetingIndex] = useState(null);

  const [formData, setFormData] = useState({
    project_naam: '',
    voornaam_klant: '',
    achternaam_klant: '',
    straat_huisnummer: '',
    postcode: '',
    gemeente: '',
    email_klant: '',
    locatie: '',
    standaard_m2_prijs: 10,
    standaard_aantal_lagen: 2,
    btw_percentage: '21',
    opmerkingen: '',
    status: 'concept',
    spraak_transcript: '',
    huidige_ruimte: '',
    metingen: [],
    offerte_nummer: '',
    verzonden_datum: null
  });

  useEffect(() => {
    loadData();
  }, [opmetingId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Only super admin can access
      if (user.role !== 'admin') {
        toast.error('Deze functie is alleen toegankelijk voor super admins');
        navigate(createPageUrl('Dashboard'));
        return;
      }

      const companyId = user.company_id || user.current_company_id;
      if (companyId) {
        const companyData = await Company.get(companyId);
        setCompany(companyData);
      }

      if (opmetingId) {
        const opmeting = await OfferteOpmeting.get(opmetingId);
        setFormData(opmeting);
        setProjectSaved(true);
        setProjectSectionOpen(false);
      } else {
        // New opmeting - set company_id
        setFormData(prev => ({ ...prev, company_id: companyId }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fout bij laden data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async () => {
    // Validation
    if (!formData.voornaam_klant || !formData.achternaam_klant || !formData.email_klant) {
      toast.error('Voornaam, achternaam en e-mail zijn verplicht');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        company_id: currentUser.company_id || currentUser.current_company_id
      };

      let savedOpmeting;
      if (opmetingId) {
        await OfferteOpmeting.update(opmetingId, dataToSave);
        savedOpmeting = await OfferteOpmeting.get(opmetingId);
      } else {
        savedOpmeting = await OfferteOpmeting.create(dataToSave);
        // Update URL with new ID
        navigate(`${createPageUrl('OfferteOpmeting')}?id=${savedOpmeting.id}`, { replace: true });
      }

      setFormData(savedOpmeting);
      setProjectSaved(true);
      setProjectSectionOpen(false);
      toast.success('Project opgeslagen');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Fout bij opslaan project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTranscriptUpdate = useCallback(async (fullTranscript, newText) => {
    if (!newText || !projectSaved || !opmetingId) return;

    setIsProcessingAI(true);
    try {
      // Call InvokeLLM to process the speech
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Je bent een expert in het verwerken van gesproken metingen van schilders.
        
TAAK: Converteer het volgende gesproken fragment naar gestructureerde metingen voor schilderwerk.

TERMINOLOGIE:
- Wand: verticale muur
- Plafond: bovenkant ruimte
- Kozijn: raamkozijn of deurkozijn
- Plinten: lijstwerk onderaan de wand
- Raam: raam oppervlak
- Deur: deur oppervlak

VEELVOORKOMENDE SPRAAKFOUTEN (corrigeer deze):
- "want" → "wand"
- "kossijn" / "kozijn" → "kozijn"
- "plafon" → "plafond"
- "twee en een half" / "tweeënhalf" → 2.5
- "drie veertig" → 3.40
- "vier meter zestig" → 4.60
- "4,40 m" / "4,40m" / "vier veertig" → 4.40 (komma naar punt, verwijder 'm'/'meter')
- "3 meter" / "3 m" → 3 (verwijder eenheden)
- "nu naar de X" → dit is een ruimte wissel, update huidige_ruimte

BELANGRIJKE CIJFERHERKENNING:
- Komma's ALTIJD omzetten naar punten: "2,60" → 2.60
- Eenheden ALTIJD verwijderen: "meter", "m" weglaten uit cijfers
- Meerdere cijfers achter elkaar = meerdere afmetingen
- "3 meter 60" betekent TWEE metingen: 3 en 60 (NIET 3.60!)
- "zijn 3 meter 60 op 2,60" = twee wanden van 3m en 60m (of 6m) hoogte 2.6m

HUIDIGE CONTEXT:
Huidige ruimte: ${formData.huidige_ruimte || 'Onbekend'}
Standaard m² prijs: €${formData.standaard_m2_prijs}
Standaard aantal lagen: ${formData.standaard_aantal_lagen}
${correctingMetingIndex !== null ? `CORRECTIE MODUS: Je gaat meting #${correctingMetingIndex + 1} vervangen` : ''}

GESPROKEN TEKST:
"${newText}"

INSTRUCTIES:
1. Detecteer als het een ruimte-wissel is (bijv. "nu naar de keuken", "volgende kamer is de badkamer")
   - Zo ja: vul alleen nieuwe_ruimte in, geen metingen
2. Anders: extraheer metingen met:
   - ruimte: ALLEEN als er expliciet een ruimte wordt genoemd (bijv. "woonkamer wand..."). Anders gebruik je "Onbekend". VERZIN NOOIT ZELF EEN RUIMTE.
   - type: wand/plafond/kozijn/deur/plinten/raam/overig
   - breedte en hoogte in meters (als genoemd)
   - bereken oppervlakte automatisch (breedte × hoogte)
   - als alleen oppervlakte genoemd: gebruik die
   - notities: materiaal, behandeling, kleur (bijv. "latex", "spuiten", "wit")
   - gebruik standaard m2_prijs en aantal_lagen tenzij anders vermeld

3. **MEERDERE METINGEN IN ÉÉN ZIN:**
   - Als iemand zegt "de muren zijn 3 meter  4,40 m  3 m  en 4,40 m  de hoogte is 2,60 m"
   - Dit zijn 4 APARTE wanden met dezelfde hoogte!
   - Creëer 4 APARTE metingen:
     * wand 1: breedte=3, hoogte=2.6, oppervlakte=7.8
     * wand 2: breedte=4.40, hoogte=2.6, oppervlakte=11.44
     * wand 3: breedte=3, hoogte=2.6, oppervlakte=7.8
     * wand 4: breedte=4.40, hoogte=2.6, oppervlakte=11.44
   - Nummering toevoegen in notities als "wand 1", "wand 2", etc.
   - LET OP: lijst van getallen VOOR de hoogte = breedtes van verschillende wanden!
   
   SPECIALE GEVALLEN:
   - "3 meter 60" = TWEE aparte getallen: 3 en 60 (of interpreteer 60 als 6.0)
   - "keuken muren zijn 3 meter 60 op 2,60" = twee wanden (3m breed en 60cm/6m breed)

4. Wees flexibel met spreektaal en variaties
5. Als onduidelijk: doe je best met context

VOORBEELDEN:
"woonkamer wand 4 bij 2 meter 60 latex spuiten"
→ {metingen: [{ruimte: "woonkamer", type: "wand", breedte: 4, hoogte: 2.6, oppervlakte: 10.4, notities: "latex spuiten"}]}

"de muren zijn 3 meter  4,40 m  3 m  en 4,40 m  de hoogte is 2,60 m"
→ {metingen: [
  {ruimte: "Onbekend", type: "wand", breedte: 3, hoogte: 2.6, oppervlakte: 7.8, notities: "wand 1"},
  {ruimte: "Onbekend", type: "wand", breedte: 4.40, hoogte: 2.6, oppervlakte: 11.44, notities: "wand 2"},
  {ruimte: "Onbekend", type: "wand", breedte: 3, hoogte: 2.6, oppervlakte: 7.8, notities: "wand 3"},
  {ruimte: "Onbekend", type: "wand", breedte: 4.40, hoogte: 2.6, oppervlakte: 11.44, notities: "wand 4"}
]}

"nu naar de keuken"
→ {nieuwe_ruimte: "keuken"}

"plafond 3 bij 4"
→ {metingen: [{ruimte: "Onbekend", type: "plafond", breedte: 3, hoogte: 4, oppervlakte: 12}]}

"wand 4 bij 2.6"
→ {metingen: [{ruimte: "Onbekend", type: "wand", breedte: 4, hoogte: 2.6, oppervlakte: 10.4}]}

"keuken muren zijn 3 meter 60 op 2,60 m"
→ {nieuwe_ruimte: "keuken", metingen: [
  {ruimte: "keuken", type: "wand", breedte: 3, hoogte: 2.6, oppervlakte: 7.8, notities: "wand 1"},
  {ruimte: "keuken", type: "wand", breedte: 6, hoogte: 2.6, oppervlakte: 15.6, notities: "wand 2"}
]}`,
        response_json_schema: {
          type: 'object',
          properties: {
            nieuwe_ruimte: { type: ['string', 'null'] },
            metingen: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ruimte: { type: 'string' },
                  type: { type: 'string', enum: ['wand', 'plafond', 'kozijn', 'deur', 'plinten', 'raam', 'overig'] },
                  breedte: { type: ['number', 'null'] },
                  hoogte: { type: ['number', 'null'] },
                  oppervlakte: { type: 'number' },
                  notities: { type: ['string', 'null'] },
                  m2_prijs: { type: 'number' },
                  aantal_lagen: { type: 'number' }
                },
                required: ['ruimte', 'type', 'oppervlakte', 'm2_prijs', 'aantal_lagen']
              }
            }
          }
        }
      });

      const aiOutput = response;
      
      // Update transcript
      const updatedTranscript = fullTranscript;
      let updates = { spraak_transcript: updatedTranscript };

      // Check for room change
      if (aiOutput.nieuwe_ruimte) {
        updates.huidige_ruimte = aiOutput.nieuwe_ruimte;
        toast.info(`📍 Ruimte gewijzigd naar: ${aiOutput.nieuwe_ruimte}`);
      }

      // Add new metingen or replace correcting one
      if (aiOutput.metingen && aiOutput.metingen.length > 0) {
        const newMetingen = aiOutput.metingen.map(m => ({
          ...m,
          m2_prijs: m.m2_prijs || formData.standaard_m2_prijs,
          aantal_lagen: m.aantal_lagen || formData.standaard_aantal_lagen
        }));

        if (correctingMetingIndex !== null) {
          // Replace the specific meting being corrected
          const updatedMetingen = [...formData.metingen];
          updatedMetingen[correctingMetingIndex] = newMetingen[0]; // Take first result
          updates.metingen = updatedMetingen;
          toast.success('✅ Meting gecorrigeerd');
          setCorrectingMetingIndex(null);
        } else {
          // Add new metingen
          updates.metingen = [...formData.metingen, ...newMetingen];
          toast.success(`✅ ${newMetingen.length} meting(en) toegevoegd`);
        }
      }

      // Update in database
      await OfferteOpmeting.update(opmetingId, updates);
      const updatedOpmeting = await OfferteOpmeting.get(opmetingId);
      setFormData(updatedOpmeting);

    } catch (error) {
      console.error('Error processing AI:', error);
      toast.error('Fout bij verwerken spraak');
    } finally {
      setIsProcessingAI(false);
    }
  }, [projectSaved, opmetingId, formData, correctingMetingIndex]);

  const handleMetingUpdate = async (index, updatedMeting) => {
    const newMetingen = [...formData.metingen];
    newMetingen[index] = updatedMeting;

    try {
      await OfferteOpmeting.update(opmetingId, { metingen: newMetingen });
      setFormData(prev => ({ ...prev, metingen: newMetingen }));
    } catch (error) {
      console.error('Error updating meting:', error);
      toast.error('Fout bij bijwerken meting');
    }
  };

  const handleMetingDelete = async (index) => {
    const newMetingen = formData.metingen.filter((_, i) => i !== index);

    try {
      await OfferteOpmeting.update(opmetingId, { metingen: newMetingen });
      setFormData(prev => ({ ...prev, metingen: newMetingen }));
    } catch (error) {
      console.error('Error deleting meting:', error);
      toast.error('Fout bij verwijderen meting');
    }
  };

  const handleRoomNameChange = async (oldRoom, newRoomName) => {
    const updatedMetingen = formData.metingen.map(meting => {
      if (meting.ruimte === oldRoom) {
        return { ...meting, ruimte: newRoomName };
      }
      return meting;
    });

    try {
      await OfferteOpmeting.update(opmetingId, { metingen: updatedMetingen });
      setFormData(prev => ({ ...prev, metingen: updatedMetingen }));
      toast.success(`Ruimtenaam "${oldRoom}" gewijzigd naar "${newRoomName}"`);
    } catch (error) {
      console.error('Error updating room name:', error);
      toast.error('Fout bij wijzigen ruimtenaam');
    }
  };

  const handleRoomDelete = async (room) => {
    const updatedMetingen = formData.metingen.filter(meting => meting.ruimte !== room);

    try {
      await OfferteOpmeting.update(opmetingId, { metingen: updatedMetingen });
      setFormData(prev => ({ ...prev, metingen: updatedMetingen }));
      toast.success(`Ruimte "${room}" verwijderd`);
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Fout bij verwijderen ruimte');
    }
  };

  const handleSendOfferte = async () => {
    if (!formData.email_klant) {
      toast.error('E-mailadres van klant is verplicht');
      return;
    }

    if (formData.metingen.length === 0) {
      toast.error('Voeg eerst metingen toe voordat u de offerte verstuurt');
      return;
    }

    setIsSending(true);
    try {
      // Generate PDF
      const { data: pdfData } = await base44.functions.invoke('generateOffertePDF', {
        opmeting: formData,
        company: company
      });

      if (!pdfData.success || !pdfData.pdfBase64) {
        throw new Error('PDF generatie mislukt');
      }

      // Send email via Resend backend function
      const subject = `Uw offerte voor ${formData.project_naam || 'schilderwerk'} - ${formData.achternaam_klant}`;
      const body = `Beste ${formData.voornaam_klant},

Bijgevoegd vindt u de offerte op basis van onze opmeting vandaag.

${formData.project_naam ? `Project: ${formData.project_naam}\n` : ''}Offertenummer: ${pdfData.offerteNummer}

Heeft u vragen of opmerkingen? Neem gerust contact met ons op.

Met vriendelijke groet,
${company?.name || 'Uw schildersbedrijf'}
${company?.email ? `\n${company.email}` : ''}
${company?.phone_number ? `\n${company.phone_number}` : ''}`;

      const { data: emailResult } = await base44.functions.invoke('sendOfferteEmail', {
        to: formData.email_klant,
        subject: subject,
        body: body,
        from_name: company?.name || 'Schildersbedrijf',
        pdfBase64: pdfData.pdfBase64,
        pdfFilename: `Offerte_${pdfData.offerteNummer}.pdf`
      });

      if (!emailResult.success) {
        throw new Error('E-mail verzenden mislukt');
      }

      // Update status
      const updates = {
        status: 'offerte_verzonden',
        verzonden_datum: new Date().toISOString(),
        offerte_nummer: pdfData.offerteNummer
      };

      await OfferteOpmeting.update(opmetingId, updates);
      setFormData(prev => ({ ...prev, ...updates }));

      toast.success('✅ Offerte succesvol verzonden naar ' + formData.email_klant);

    } catch (error) {
      console.error('Error sending offerte:', error);
      toast.error('Fout bij versturen offerte: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Laden..." />;
  }

  const totaalM2 = formData.metingen.reduce((sum, m) => sum + m.oppervlakte, 0);
  const totaalPrijs = formData.metingen.reduce((sum, m) => sum + (m.oppervlakte * m.m2_prijs * m.aantal_lagen), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar Dashboard
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              🎙️ Offerte Agent
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Maak razendsnel professionele offertes ter plaatse
            </p>
          </div>
          {projectSaved && (
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">€{totaalPrijs.toFixed(2)}</div>
              <div className="text-sm text-gray-600">{totaalM2.toFixed(2)} m² totaal</div>
            </div>
          )}
        </div>

        {/* Section 1: Project & Client Info */}
        <Card>
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setProjectSectionOpen(!projectSectionOpen)}
          >
            <CardTitle className="flex items-center justify-between">
              <span>1. Project- en Klantgegevens</span>
              {projectSectionOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </CardTitle>
          </CardHeader>
          <AnimatePresence>
            {projectSectionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Voornaam Klant *</Label>
                      <Input
                        value={formData.voornaam_klant}
                        onChange={(e) => setFormData({ ...formData, voornaam_klant: e.target.value })}
                        placeholder="Jan"
                      />
                    </div>
                    <div>
                      <Label>Achternaam Klant *</Label>
                      <Input
                        value={formData.achternaam_klant}
                        onChange={(e) => setFormData({ ...formData, achternaam_klant: e.target.value })}
                        placeholder="Janssen"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>E-mail Klant *</Label>
                    <Input
                      type="email"
                      value={formData.email_klant}
                      onChange={(e) => setFormData({ ...formData, email_klant: e.target.value })}
                      placeholder="jan.janssen@email.com"
                    />
                  </div>

                  <div>
                    <Label>Project Naam</Label>
                    <Input
                      value={formData.project_naam}
                      onChange={(e) => setFormData({ ...formData, project_naam: e.target.value })}
                      placeholder="Schilderwerk woning"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label>Straat en Huisnummer</Label>
                      <Input
                        value={formData.straat_huisnummer}
                        onChange={(e) => setFormData({ ...formData, straat_huisnummer: e.target.value })}
                        placeholder="Hoofdstraat 123"
                      />
                    </div>
                    <div>
                      <Label>Postcode</Label>
                      <Input
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        placeholder="1234 AB"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Gemeente</Label>
                    <Input
                      value={formData.gemeente}
                      onChange={(e) => setFormData({ ...formData, gemeente: e.target.value })}
                      placeholder="Amsterdam"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Standaard m² Prijs</Label>
                      <Input
                        type="number"
                        step="0.50"
                        value={formData.standaard_m2_prijs}
                        onChange={(e) => setFormData({ ...formData, standaard_m2_prijs: parseFloat(e.target.value) || 10 })}
                      />
                    </div>
                    <div>
                      <Label>Standaard Aantal Lagen</Label>
                      <Input
                        type="number"
                        value={formData.standaard_aantal_lagen}
                        onChange={(e) => setFormData({ ...formData, standaard_aantal_lagen: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                    <div>
                      <Label>BTW %</Label>
                      <Input
                        value={formData.btw_percentage}
                        onChange={(e) => setFormData({ ...formData, btw_percentage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Opmerkingen</Label>
                    <Textarea
                      rows={3}
                      value={formData.opmerkingen}
                      onChange={(e) => setFormData({ ...formData, opmerkingen: e.target.value })}
                      placeholder="Speciale wensen, aandachtspunten..."
                    />
                  </div>

                  <Button
                    onClick={handleSaveProject}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Opslaan...' : (projectSaved ? 'Project Bijwerken' : 'Project Opslaan en Starten')}
                  </Button>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Section 2: Speech Recognition (only after project saved) */}
        {projectSaved && (
          <>
            <SpeechRecognitionComponent
              onTranscriptUpdate={handleTranscriptUpdate}
              isProcessing={isProcessingAI}
              isCorrectingMode={correctingMetingIndex !== null}
              correctingMetingNumber={correctingMetingIndex !== null ? correctingMetingIndex + 1 : null}
            />

            <MetingenTable
              metingen={formData.metingen}
              onUpdate={handleMetingUpdate}
              onDelete={handleMetingDelete}
              onRespeak={(index) => {
                setCorrectingMetingIndex(index);
                toast.info(`🎙️ Spreek meting #${index + 1} opnieuw in`);
              }}
              correctingIndex={correctingMetingIndex}
              onRoomNameChange={handleRoomNameChange}
              onRoomDelete={handleRoomDelete}
            />

            <ConceptOfferte opmeting={formData} company={company} />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleSaveProject}
                disabled={isSaving}
                size="lg"
                variant="outline"
                className="text-lg px-8"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Opslaan...' : '💾 Meting Opslaan'}
              </Button>
              <Button
                onClick={handleSendOfferte}
                disabled={isSending || formData.metingen.length === 0}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8"
              >
                <Send className="w-5 h-5 mr-2" />
                {isSending ? 'Versturen...' : '📧 Offerte Direct Versturen naar Klant'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}