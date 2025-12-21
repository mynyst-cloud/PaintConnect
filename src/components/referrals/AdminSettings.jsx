
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Settings,
  Euro,
  Calendar,
  Trophy,
  Crown,
  Edit,
  Save,
  Plus,
  MoreVertical,
  Star,
  Users,
  Upload,
  Loader2
} from "lucide-react";
import { ReferralPeriod, Referral } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile, SendEmail } from "@/api/integrations";
import { createPageUrl } from "@/components/utils"; // Updated import path

export default function AdminSettings({ periods, activePeriod, painters, referrals, onRefresh }) {
  const [isEditingPeriod, setIsEditingPeriod] = useState(false);
  const [editingPeriodData, setEditingPeriodData] = useState(null);
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [newPeriodData, setNewPeriodData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    bonus_amount: "",
    points_per_referral: "50",
    bonus_increase_per_referral: "5"
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const handleEditActivePeriod = () => {
    if (!activePeriod) return;
    setEditingPeriodData({
      bonus_amount: activePeriod.bonus_amount.toString(),
      points_per_referral: (activePeriod.points_per_referral || 50).toString(),
      bonus_increase_per_referral: (activePeriod.bonus_increase_per_referral || 0).toString()
    });
    setIsEditingPeriod(true);
  };

  const handleSaveActivePeriod = async () => {
    if (!activePeriod || !editingPeriodData) return;

    try {
      await ReferralPeriod.update(activePeriod.id, {
        bonus_amount: parseFloat(editingPeriodData.bonus_amount),
        points_per_referral: parseFloat(editingPeriodData.points_per_referral),
        bonus_increase_per_referral: parseFloat(editingPeriodData.bonus_increase_per_referral)
      });

      setIsEditingPeriod(false);
      setEditingPeriodData(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating period:", error);
    }
  };

  const handleCreatePeriod = async (e) => {
    e.preventDefault();

    try {
      if (activePeriod) {
        await ReferralPeriod.update(activePeriod.id, { is_active: false });
      }

      await ReferralPeriod.create({
        ...newPeriodData,
        bonus_amount: parseFloat(newPeriodData.bonus_amount),
        points_per_referral: parseFloat(newPeriodData.points_per_referral),
        bonus_increase_per_referral: parseFloat(newPeriodData.bonus_increase_per_referral),
        is_active: true
      });

      for (const painter of painters) {
        await User.update(painter.id, { current_period_referrals: 0 });
      }

      setNewPeriodData({
        name: "",
        start_date: "",
        end_date: "",
        bonus_amount: "",
        points_per_referral: "50",
        bonus_increase_per_referral: "5"
      });
      setShowCreatePeriod(false);
      onRefresh();
    } catch (error) {
      console.error("Error creating period:", error);
    }
  };
  
  const getAwardedBonusAmount = (period, winnerReferrals) => {
    if (!period) return 0;
    const baseBonus = parseFloat(period.bonus_amount || '0');
    return (baseBonus).toFixed(2);
  };

  const handleAwardBonus = async (painterId) => {
    if (!activePeriod) return;

    const winnerPainter = painters.find(p => p.id === painterId);
    if (!winnerPainter) {
      console.error("Winner painter not found.");
      return;
    }

    const winnerReferralCount = winnerPainter.current_period_referrals || 0;
    const calculatedBonus = getAwardedBonusAmount(activePeriod, winnerReferralCount);

    if (confirm(`Weet je zeker dat je de bonus van €${calculatedBonus} wilt uitkeren?`)) {
      try {
        await ReferralPeriod.update(activePeriod.id, {
          winner_painter_id: painterId,
          winner_referral_count: winnerReferralCount
        });

        onRefresh();
        alert("Bonus toegekend!");
      } catch (error) {
        console.error("Error awarding bonus:", error);
      }
    }
  };

  const handleImportCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const { file_url } = await UploadFile({ file });

      const json_schema = {
        type: "object",
        properties: {
          referrals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                client_name: { type: "string", description: "The full name of the client, from the 'Volledige naam' column" },
                client_email: { type: "string", description: "The client's email, from the 'E-mailadres' column" },
                client_phone: { type: "string", description: "The client's phone number, from the 'Telefoonnummer' column" },
                message: { type: "string", description: "The client's message, from the 'Bericht' column" },
                referral_code: { type: "string", description: "The painter's referral code, from the 'Referral Code' column" }
              },
              required: ["client_name", "client_email", "referral_code"]
            }
          }
        }
      };

      const extractionResult = await ExtractDataFromUploadedFile({ file_url, json_schema });

      if (extractionResult.status !== 'success' || !extractionResult.output?.referrals) {
        throw new Error(extractionResult.details || "Could not extract data from CSV.");
      }

      const extractedReferrals = extractionResult.output.referrals;

      const painterMap = new Map(painters.map(p => [p.referral_code, p]));
      const referralsToCreate = [];

      for (const ref of extractedReferrals) {
        const painter = painterMap.get(ref.referral_code);
        if (painter) {
          referralsToCreate.push({
            client_name: ref.client_name,
            client_email: ref.client_email,
            client_phone: ref.client_phone || null,
            message: ref.message || null,
            referral_code: ref.referral_code,
            painter_id: painter.id,
            painter_name: painter.full_name || painter.email,
          });
        }
      }

      if (referralsToCreate.length === 0) {
        setImportStatus({ success: false, message: "Geen geldige referrals gevonden om te importeren. Controleer de 'Referral Code' kolom in uw CSV." });
        setIsImporting(false);
        return;
      }
      
      await Referral.bulkCreate(referralsToCreate);
      
      try {
          const pageUrl = window.location.origin + createPageUrl("Referrals");
          await SendEmail({
              to: 'info@freshdecor.be',
              from_name: 'Fresh Decor App Notificatie',
              subject: `${referralsToCreate.length} Nieuwe Referrals Geïmporteerd`,
              body: `
                  <p>Er zijn zojuist <strong>${referralsToCreate.length}</strong> nieuwe referrals succesvol geïmporteerd vanuit het CSV-bestand.</p>
                  <p>Bekijk de nieuwe leads, wijzig hun status en ken punten toe aan de schilders.</p>
                  <a href="${pageUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #F59E0B; text-decoration: none; border-radius: 5px;">
                      Bekijk Referrals
                  </a>
              `
          });
      } catch (emailError) {
          console.error("Failed to send referral import notification email:", emailError);
      }

      setImportStatus({ success: true, message: `${referralsToCreate.length} referrals succesvol geïmporteerd!` });
      onRefresh();

    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({ success: false, message: `Import mislukt: ${error.message}` });
    }

    setIsImporting(false);
    event.target.value = null;
  };

  const topPainters = useMemo(() => {
    return (painters || [])
      .filter(p => (p.current_period_referrals || 0) > 0)
      .sort((a, b) => (b.current_period_referrals || 0) - (a.current_period_referrals || 0))
      .slice(0, 5);
  }, [painters]);

  const periodStats = useMemo(() => {
    if (!referrals || !painters) {
      return { totalReferrals: 0, totalEarningsThisPeriod: 0, activePainters: 0 };
    }
    const approvedReferrals = (referrals || []).filter(r => r.status === 'approved');
    return {
      totalReferrals: approvedReferrals.length,
      totalEarningsThisPeriod: activePeriod ?
        approvedReferrals.length * (activePeriod.points_per_referral || 50) : 0,
      activePainters: (painters || []).filter(p => (p.current_period_referrals || 0) > 0).length
    };
  }, [referrals, painters, activePeriod]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Crown className="w-7 h-7 text-yellow-600" />
          Admin Instellingen
        </h2>
        <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
          Administrator
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5"/>
            Import Referrals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <Alert>
             <AlertTitle>Importeer vanuit Google Forms</AlertTitle>
             <AlertDescription>
              Download de antwoorden van uw Google Form als een CSV-bestand. Upload dat bestand hier om de nieuwe referrals automatisch aan te maken.
             </AlertDescription>
           </Alert>
           <Input 
             type="file" 
             accept=".csv"
             onChange={handleImportCSV}
             disabled={isImporting}
             className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
           />
           {isImporting && (
             <div className="flex items-center gap-2 text-gray-600">
               <InlineSpinner />
               <span>Bezig met importeren, een moment geduld...</span>
             </div>
           )}
           {importStatus && (
              <Alert className={importStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                 <AlertTitle className={importStatus.success ? "text-green-800" : "text-red-800"}>
                   {importStatus.success ? "Import Succesvol" : "Import Mislukt"}
                 </AlertTitle>
                 <AlertDescription className={importStatus.success ? "text-green-700" : "text-red-700"}>
                    {importStatus.message}
                 </AlertDescription>
              </Alert>
           )}
        </CardContent>
      </Card>

      {activePeriod && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Calendar className="w-5 h-5" />
              Actieve Periode: {activePeriod.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEditingPeriod ? (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Huidige Bonus Pot</div>
                  <div className="text-2xl font-bold text-emerald-700">€{activePeriod.bonus_amount}</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Beloning per Referral</div>
                  <div className="text-2xl font-bold text-emerald-700">€{activePeriod.points_per_referral || 50}</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Bonus Groei</div>
                  <div className="text-2xl font-bold text-emerald-700">+€{activePeriod.bonus_increase_per_referral || 0}</div>
                  <div className="text-xs text-gray-500">per goedgekeurde referral</div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Bonus Pot (€)</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={editingPeriodData.bonus_amount}
                    onChange={(e) => setEditingPeriodData({...editingPeriodData, bonus_amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beloning per Referral (€)</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={editingPeriodData.points_per_referral}
                    onChange={(e) => setEditingPeriodData({...editingPeriodData, points_per_referral: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Groei / Referral (€)</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    value={editingPeriodData.bonus_increase_per_referral}
                    onChange={(e) => setEditingPeriodData({...editingPeriodData, bonus_increase_per_referral: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {!isEditingPeriod ? (
                <Button onClick={handleEditActivePeriod} className="bg-emerald-600 hover:bg-emerald-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Instellingen Wijzigen
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveActivePeriod} className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />
                    Opslaan
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingPeriod(false)}>
                    Annuleren
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nieuwe Periode Starten
            </CardTitle>
            <Button onClick={() => setShowCreatePeriod(!showCreatePeriod)} variant="outline">
              {showCreatePeriod ? "Sluiten" : "Nieuwe Periode"}
            </Button>
          </div>
        </CardHeader>

        {showCreatePeriod && (
          <CardContent>
            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Periode Naam *</Label>
                  <Input required value={newPeriodData.name} onChange={(e) => setNewPeriodData({...newPeriodData, name: e.target.value})} placeholder="Q2 2024 Competition"/>
                </div>
                <div className="space-y-2">
                  <Label>Start Bonus Pot (€) *</Label>
                  <Input required type="number" min="0" step="0.01" value={newPeriodData.bonus_amount} onChange={(e) => setNewPeriodData({...newPeriodData, bonus_amount: e.target.value})} placeholder="1000"/>
                </div>
                <div className="space-y-2">
                  <Label>Startdatum *</Label>
                  <Input required type="date" value={newPeriodData.start_date} onChange={(e) => setNewPeriodData({...newPeriodData, start_date: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <Label>Einddatum *</Label>
                  <Input required type="date" value={newPeriodData.end_date} onChange={(e) => setNewPeriodData({...newPeriodData, end_date: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <Label>Beloning per Goedgekeurde Referral (€) *</Label>
                  <Input required type="number" min="0" step="0.01" value={newPeriodData.points_per_referral} onChange={(e) => setNewPeriodData({...newPeriodData, points_per_referral: e.target.value})} placeholder="50"/>
                </div>
                <div className="space-y-2">
                  <Label>Bonus Groei per Goedgekeurde Referral (€) *</Label>
                  <Input required type="number" min="0" step="0.01" value={newPeriodData.bonus_increase_per_referral} onChange={(e) => setNewPeriodData({...newPeriodData, bonus_increase_per_referral: e.target.value})} placeholder="5"/>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Let op:</strong> Het starten van een nieuwe periode zal de huidige periode beëindigen
                  en alle current_period_referrals van schilders resetten naar 0.
                </p>
              </div>

              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Periode Starten
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {activePeriod && topPainters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Top Presteerders Deze Periode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPainters.map((painter, index) => (
                <div key={painter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{painter.full_name || painter.email}</div>
                      <div className="text-sm text-gray-600">
                        {painter.current_period_referrals} referrals = €{(painter.current_period_referrals || 0) * (activePeriod.points_per_referral || 50)}
                      </div>
                    </div>
                  </div>
                  {index === 0 && !activePeriod.winner_painter_id && (
                    <Button size="sm" onClick={() => handleAwardBonus(painter.id)} className="bg-yellow-600 hover:bg-yellow-700">
                      <Crown className="w-4 h-4 mr-2" />
                      Bonus Uitkeren
                    </Button>
                  )}
                  {activePeriod.winner_painter_id === painter.id && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Crown className="w-3 h-3 mr-1" />
                      Winnaar!
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {activePeriod.winner_painter_id && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✅ Bonus van €{getAwardedBonusAmount(activePeriod, activePeriod.winner_referral_count)} is uitgekeerd aan de winnaar!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Periode Statistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{periodStats.totalReferrals}</div>
              <div className="text-sm text-blue-600">Goedgekeurde Referrals</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">€{periodStats.totalEarningsThisPeriod}</div>
              <div className="text-sm text-green-600">Totaal Uitbetaald</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{periodStats.activePainters}</div>
              <div className="text-sm text-purple-600">Actieve Schilders</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
