import React, { useState, useEffect, useCallback } from 'react';
import { ReferralPoint, User, ReferralPeriod } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Users, Crown, Settings } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PeriodManager from '@/components/referrals/PeriodManager';
import { formatDate } from '@/components/utils'; // CRITICAL FIX: Add this import

export default function ReferralsPage() {
  const [points, setPoints] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      setIsAdmin(user.company_role === 'admin');

      const [pointsData, periodsData] = await Promise.all([
        ReferralPoint.filter({ company_id: user.company_id }),
        user.company_role === 'admin' ? ReferralPeriod.filter({ company_id: user.company_id }) : Promise.resolve([])
      ]);
      
      setPoints(pointsData || []);
      setPeriods(periodsData || []);

      const painterScores = {};
      (pointsData || []).forEach(point => {
        if (!painterScores[point.painter_id]) {
          painterScores[point.painter_id] = {
            painter_id: point.painter_id,
            painter_name: point.painter_name,
            total_points: 0,
            leads: []
          };
        }
        painterScores[point.painter_id].total_points += point.points;
        painterScores[point.painter_id].leads.push({
          lead_name: point.lead_name,
          points: point.points,
          created_date: point.created_date
        });
      });

      const sortedLeaderboard = Object.values(painterScores)
        .sort((a, b) => b.total_points - a.total_points);

      setLeaderboard(sortedLeaderboard);
      
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingSpinner text="Referral data laden..." />;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Referral Ranglijst</h1>
      </div>
      
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-purple-500" /> Beheerderspaneel</CardTitle>
            <CardDescription>Beheer hier de instellingen en periodes voor het referral programma.</CardDescription>
          </CardHeader>
          <CardContent>
            <PeriodManager periods={periods} companyId={currentUser.company_id} onPeriodUpdate={loadData} />
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Ranglijst</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nog geen referral punten</p>
                <p className="text-sm mt-2">Zet een referral lead op 'gewonnen' om punten te krijgen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((painter, index) => (
                  <div 
                    key={painter.painter_id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 border-2 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800' :
                      index === 1 ? 'bg-gray-100 border border-gray-200 dark:bg-slate-800 dark:border-slate-700' :
                      index === 2 ? 'bg-orange-50 border border-orange-200 dark:bg-orange-950/50 dark:border-orange-800' :
                      'bg-white border border-gray-100 dark:bg-slate-900 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{painter.painter_name}</div>
                        <div className="text-sm text-gray-500">{painter.leads.length} lead(s)</div>
                      </div>
                    </div>
                    <Badge className="text-lg font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                      {painter.total_points}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Points */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Recente Punten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {points.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                   <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nog geen referral punten toegekend</p>
                </div>
              ) : (
                [...points]
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .slice(0, 10)
                  .map(point => (
                    <div key={point.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <div className="font-medium">{point.painter_name}</div>
                        <div className="text-sm text-gray-600">Lead: {point.lead_name}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(point.created_date)}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                        +{point.points}
                      </Badge>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}