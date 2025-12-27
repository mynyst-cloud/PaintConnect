import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, TrendingDown, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, parseISO, isAfter } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function HoursSummaryWidget({ dailyUpdates = [], users = [], isAdmin = false, companyId }) {
  const [period, setPeriod] = React.useState('week');

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    
    if (period === 'week') {
      const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      
      return {
        current: { start: currentWeekStart, end: currentWeekEnd },
        previous: { start: previousWeekStart, end: previousWeekEnd }
      };
    } else {
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));
      
      return {
        current: { start: currentMonthStart, end: currentMonthEnd },
        previous: { start: previousMonthStart, end: previousMonthEnd }
      };
    }
  }, [period]);

  // Filter and calculate hours
  const hoursData = useMemo(() => {
    if (!dailyUpdates || dailyUpdates.length === 0) {
      return {
        currentTotal: 0,
        previousTotal: 0,
        byPainter: [],
        difference: 0,
        percentageChange: 0
      };
    }

    const completedEntries = dailyUpdates.filter(entry => 
      entry.check_out_time && entry.hours_worked && entry.hours_worked > 0
    );

    const currentHours = completedEntries.filter(entry => {
      if (!entry.work_date) return false;
      const entryDate = typeof entry.work_date === 'string' 
        ? parseISO(entry.work_date) 
        : new Date(entry.work_date);
      return isAfter(entryDate, dateRanges.current.start) && 
             entryDate <= dateRanges.current.end;
    }).reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);

    const previousHours = completedEntries.filter(entry => {
      if (!entry.work_date) return false;
      const entryDate = typeof entry.work_date === 'string' 
        ? parseISO(entry.work_date) 
        : new Date(entry.work_date);
      return isAfter(entryDate, dateRanges.previous.start) && 
             entryDate <= dateRanges.previous.end;
    }).reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);

    // Hours by painter (for current period)
    const hoursByPainterMap = new Map();
    completedEntries.forEach(entry => {
      if (!entry.work_date || !entry.painter_email || !entry.hours_worked) return;
      const entryDate = typeof entry.work_date === 'string' 
        ? parseISO(entry.work_date) 
        : new Date(entry.work_date);
      
      if (isAfter(entryDate, dateRanges.current.start) && 
          entryDate <= dateRanges.current.end) {
        const current = hoursByPainterMap.get(entry.painter_email) || 0;
        hoursByPainterMap.set(entry.painter_email, current + (parseFloat(entry.hours_worked) || 0));
      }
    });

    // Convert to array with user info
    const byPainter = Array.from(hoursByPainterMap.entries())
      .map(([painterEmail, hours]) => {
        const user = users.find(u => u.email === painterEmail);
        const entry = completedEntries.find(e => e.painter_email === painterEmail);
        return {
          email: painterEmail,
          id: user?.id || painterEmail,
          name: user?.full_name || entry?.painter_name || 'Onbekend',
          avatar_url: user?.avatar_url,
          hours: Math.round(hours * 10) / 10
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5); // Top 5

    const difference = currentHours - previousHours;
    const percentageChange = previousHours > 0 
      ? ((difference / previousHours) * 100) 
      : (currentHours > 0 ? 100 : 0);

    return {
      currentTotal: Math.round(currentHours * 10) / 10,
      previousTotal: Math.round(previousHours * 10) / 10,
      byPainter,
      difference: Math.round(difference * 10) / 10,
      percentageChange: Math.round(percentageChange * 10) / 10
    };
  }, [dailyUpdates, dateRanges, users]);

  const goalHours = period === 'week' ? 40 : 160;
  const progressPercentage = Math.min((hoursData.currentTotal / goalHours) * 100, 100);

  return (
    <Card className="bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-sm">
      <CardHeader className="flex flex-row justify-between items-center p-2 lg:p-3 pb-1 lg:pb-2">
        <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-semibold">
          <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
          Werkuren
        </CardTitle>
        <Link 
          to={createPageUrl("TeamActiviteit")} 
          className="text-xs font-medium text-white/90 hover:text-white flex items-center gap-1"
        >
          Details <ArrowRight className="w-3 h-3 inline" />
        </Link>
      </CardHeader>
      <CardContent className="p-2 lg:p-3 pt-0">
        <Tabs value={period} onValueChange={setPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 mb-2.5">
            <TabsTrigger 
              value="week" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white text-xs"
            >
              Week
            </TabsTrigger>
            <TabsTrigger 
              value="month" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white text-xs"
            >
              Maand
            </TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-2.5 mt-0">
            {/* Total Hours with Comparison */}
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl lg:text-3xl font-bold">{hoursData.currentTotal}</p>
                  <p className="text-xs text-white/75">uur {period === 'week' ? 'deze week' : 'deze maand'}</p>
                </div>
                {hoursData.previousTotal > 0 && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    hoursData.difference >= 0 ? 'text-green-200' : 'text-red-200'
                  }`}>
                    {hoursData.difference >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {hoursData.difference >= 0 ? '+' : ''}{hoursData.difference}u
                    </span>
                    <span className="text-white/60 text-[10px]">
                      ({hoursData.percentageChange >= 0 ? '+' : ''}{hoursData.percentageChange}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/75">Doel: {goalHours} uur</span>
                  <span className="font-semibold">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-white/20"
                />
              </div>
            </div>

            {/* Per Person Breakdown (Admin only) - Scrollable */}
            {isAdmin && hoursData.byPainter.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                  <Users className="w-3.5 h-3.5" />
                  Top {hoursData.byPainter.length}
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {hoursData.byPainter.map((painter, index) => (
                    <motion.div
                      key={painter.email}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white/10 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="w-5 h-5 flex-shrink-0">
                          <AvatarImage src={painter.avatar_url} />
                          <AvatarFallback className="text-[9px] bg-white/20 text-white">
                            {painter.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium truncate">{painter.name}</p>
                      </div>
                      <p className="text-xs font-bold text-white ml-2 flex-shrink-0">
                        {painter.hours}u
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {hoursData.currentTotal === 0 && (
              <div className="text-center py-3 text-white/70">
                <Clock className="w-6 h-6 mx-auto mb-1.5 text-white/50" />
                <p className="font-medium text-xs">Nog geen uren geregistreerd</p>
                <p className="text-[10px] mt-0.5">Uren worden automatisch getoond na check-out</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

