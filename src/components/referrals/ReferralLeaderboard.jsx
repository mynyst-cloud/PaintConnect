import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function ReferralLeaderboard({ painters, activePeriod }) {
  const safePainters = painters || [];
  
  console.log('🏆 LEADERBOARD DEBUG:', {
    totalPainters: safePainters.length,
    paintersData: safePainters.map(p => ({
      id: p.id,
      name: p.full_name,
      total_referrals: p.total_referrals,
      current_period_referrals: p.current_period_referrals
    }))
  });
  
  // FIXED LOGIC: Show painters with ANY referrals (current period OR total)
  const topPainters = safePainters
    .filter(painter => {
      const currentReferrals = Number(painter.current_period_referrals) || 0;
      const totalReferrals = Number(painter.total_referrals) || 0;
      const hasAnyReferrals = currentReferrals > 0 || totalReferrals > 0;
      
      console.log(`🔍 Filtering ${painter.full_name}: current=${currentReferrals}, total=${totalReferrals}, show=${hasAnyReferrals}`);
      return hasAnyReferrals;
    })
    .sort((a, b) => {
      // Primary sort: current period referrals (descending)
      const aCurrentRef = Number(a.current_period_referrals) || 0;
      const bCurrentRef = Number(b.current_period_referrals) || 0;
      
      if (bCurrentRef !== aCurrentRef) {
        return bCurrentRef - aCurrentRef;
      }
      
      // Secondary sort: total referrals (descending)
      const aTotalRef = Number(a.total_referrals) || 0;
      const bTotalRef = Number(b.total_referrals) || 0;
      return bTotalRef - aTotalRef;
    })
    .slice(0, 10);

  console.log('🏆 Final leaderboard painters:', topPainters.length);

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
      <CardHeader className="p-4 md:p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Referral Leaderboard
        </CardTitle>
        {activePeriod && (
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
            Periode: <span className="font-semibold">{activePeriod.name}</span> | 
            Winnaar krijgt: <span className="font-bold text-yellow-600 dark:text-yellow-400">€{activePeriod.bonus_amount}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {topPainters.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-base font-semibold">Nog geen referral punten!</p>
            <p className="text-sm">Zet lead status op "gewonnen" om punten toe te kennen.</p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <strong>Hoe werkt het?</strong><br/>
                1. Lead met bron "referral" komt binnen<br/>
                2. Admin zet status op "gewonnen"<br/>
                3. Schilder krijgt automatisch +1 punt<br/>
                4. Leaderboard werkt meteen
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {topPainters.map((painter, index) => (
              <motion.div
                key={painter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 md:p-4 rounded-lg border ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800' :
                  index === 1 ? 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600' :
                  index === 2 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                  'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    {index < 3 ? (
                      index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'
                    ) : (
                      `#${index + 1}`
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-slate-200 text-sm md:text-base">
                      {painter.full_name || painter.email}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {Number(painter.total_referrals) || 0} totaal
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`text-lg md:text-xl font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {Number(painter.current_period_referrals) || 0}
                  </Badge>
                  {index === 0 && activePeriod && Number(painter.current_period_referrals) > 0 && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">
                      Leider!
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}