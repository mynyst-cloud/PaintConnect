import React, { useState, useEffect } from 'react';
import { Notification } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Trash2, ArrowLeft, RefreshCw, FileText, Package, AlertTriangle, CheckCircle, AlertCircle, Calendar, Users, MessageCircle, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { motion } from 'framer-motion';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { markAllNotificationsAsRead } from '@/api/functions';

// Helper functie om dummy/demo notificaties te genereren
const generateDummyNotifications = () => {
  const now = new Date();
  return [
    {
      id: 'dummy-material-1',
      message: 'Materiaal aanvraag - Verf wit 10L - Project: Villa Renovatie',
      type: 'material_requested',
      created_date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 uur geleden
      read: false,
      isDummy: true
    },
    {
      id: 'dummy-project-1',
      message: 'Project update - Voortgang: 65% - Penthouse Amsterdam',
      type: 'project_update',
      created_date: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 uur geleden
      read: false,
      isDummy: true
    },
    {
      id: 'dummy-damage-1',
      message: 'Schademelding - Beschadiging gemeld - Boutique Hotel Lobby',
      type: 'damage_reported',
      created_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dag geleden
      read: true,
      isDummy: true
    },
    {
      id: 'dummy-planning-1',
      message: 'Planning wijziging - Nieuwe schilder toegewezen aan Moderne Loft',
      type: 'planning_change',
      created_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dagen geleden
      read: true,
      isDummy: true
    },
    {
      id: 'dummy-confirmed-1',
      message: 'Materiaal bevestigd - Verf blauw 5L goedgekeurd voor Villa Renovatie',
      type: 'materials_confirmed',
      created_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dagen geleden
      read: true,
      isDummy: true
    }
  ];
};

// Helper functie om notificatie visuele details te bepalen
const getNotificationVisuals = (notification) => {
  const message = notification.message || '';
  const type = notification.type || 'generic';
  
  // Bepaal icoon op basis van type
  const iconMap = {
    'material_requested': { icon: Package, color: 'text-blue-600 dark:text-blue-400' },
    'damage_reported': { icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400' },
    'project_update': { icon: Calendar, color: 'text-emerald-600 dark:text-emerald-400' },
    'planning_change': { icon: Calendar, color: 'text-purple-600 dark:text-purple-400' },
    'materials_confirmed': { icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
    'hours_confirmed': { icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
    'client_logged_in': { icon: Users, color: 'text-indigo-600 dark:text-indigo-400' },
    'team_chat_message': { icon: MessageCircle, color: 'text-pink-600 dark:text-pink-400' },
    'generic': { icon: Bell, color: 'text-gray-600 dark:text-gray-400' }
  };
  
  const iconConfig = iconMap[type] || iconMap.generic;
  
  // Parse titel en details uit bericht
  let title = '';
  let details = message;
  let alert = null;
  let status = null;
  
  // Detecteer facturen
  if (message.includes('Factuur') || message.includes('factuur')) {
    title = message.split(/(?:ontvangen|van)/)[0].trim();
    if (message.includes('REEDS BETAALD')) {
      status = { text: 'REEDS BETAALD', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
      details = message.replace('REEDS BETAALD via bancontact', '').trim();
    }
    if (message.includes('Check:')) {
      const checkMatch = message.match(/Check: (.+?)(?:\.|$)/);
      if (checkMatch) {
        alert = checkMatch[1].trim();
      }
    }
    iconConfig.icon = FileText;
    iconConfig.color = 'text-blue-600 dark:text-blue-400';
  }
  
  // Detecteer creditnota's
  if (message.includes('Creditnota') || message.includes('creditnota')) {
    title = message.split(/(?:ontvangen|van)/)[0].trim();
    if (message.includes('Check:')) {
      const checkMatch = message.match(/Check: (.+?)(?:\.|$)/);
      if (checkMatch) {
        alert = checkMatch[1].trim();
      }
    }
    iconConfig.icon = FileText;
    iconConfig.color = 'text-purple-600 dark:text-purple-400';
  }
  
  // Detecteer materiaal wijzigingen
  if (message.includes('materiaal wijziging')) {
    title = 'Materiaal wijziging';
    details = message;
    iconConfig.icon = Package;
    iconConfig.color = 'text-orange-600 dark:text-orange-400';
    
    if (message.includes('Check:')) {
      const checkMatch = message.match(/Check: (.+?)(?:\.|$)/);
      if (checkMatch) {
        alert = checkMatch[1].trim();
      }
    }
  }
  
  // Als geen specifieke titel gevonden, gebruik eerste deel van bericht
  if (!title) {
    const parts = message.split('.')[0].split('-');
    title = parts[0].trim();
    details = message;
  }
  
  return { title, details, alert, status, ...iconConfig };
};

export default function Notificaties() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const user = await User.me();
      
      if (user?.email) {
        const notifs = await Notification.filter({ 
          recipient_email: user.email 
        }, '-created_date', 100);
        
        const validNotifs = (Array.isArray(notifs) ? notifs : [])
          .filter(n => 
            n && 
            typeof n === 'object' && 
            n.id && 
            n.message && 
            typeof n.message === 'string'
          );
        setNotifications(validNotifs);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setError("Kon notificaties niet laden: " + error.message);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true);
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Kon notificaties niet markeren als gelezen: ' + error.message);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Dummy notificaties zijn niet klikbaar voor acties
    if (notification.isDummy) {
      return;
    }
    
    if (!notification.read) {
      try {
        await Notification.update(notification.id, { read: true });
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    if (notification.link_to) {
      const path = notification.link_to.startsWith('/') 
        ? notification.link_to 
        : `/${notification.link_to}`;
      navigate(path);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    
    // Dummy notificaties kunnen niet verwijderd worden
    const notification = displayNotifications.find(n => n.id === notificationId);
    if (notification?.isDummy) {
      return;
    }
    
    try {
      await Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Onbekend';
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        return formatDistanceToNow(date, { addSuffix: true, locale: nl });
      }
      return format(date, "d MMMM yyyy 'om' HH:mm", { locale: nl });
    } catch {
      return 'Datumfout';
    }
  };

  const unreadCount = notifications.filter(n => !n.read && !n.isDummy).length;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3 animate-pulse">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar Dashboard
            </Button>
          </Link>
          
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Fout bij laden</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={loadNotifications}>Opnieuw proberen</Button>
          </Card>
        </div>
      </div>
    );
  }

  const safeNotifications = (notifications || []).filter(Boolean);
  
  // Als er geen echte notificaties zijn, toon dummy notificaties
  const hasRealNotifications = safeNotifications.length > 0;
  const displayNotifications = hasRealNotifications 
    ? safeNotifications 
    : generateDummyNotifications();
  
  const realNotificationCount = safeNotifications.length;
  const unreadRealCount = safeNotifications.filter(n => !n.read).length;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Bell className="w-6 h-6 text-emerald-600" />
              Notificaties
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {hasRealNotifications ? (
              <>
                <Badge variant="secondary">{realNotificationCount} totaal</Badge>
                {unreadRealCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {unreadRealCount} ongelezen
                  </Badge>
                )}
              </>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                <Info className="w-3 h-3 mr-1" />
                Demo meldingen
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={loadNotifications} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {hasRealNotifications && unreadRealCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {isMarkingAllRead ? 'Bezig...' : 'Alles gelezen'}
              </Button>
            )}
          </div>
        </div>
        
        {!hasRealNotifications && (
          <Card className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Demo meldingen
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Dit zijn voorbeeldmeldingen om te laten zien hoe notificaties eruit zien. Zodra je echte meldingen krijgt, verdwijnen deze demo meldingen automatisch.
                </p>
              </div>
            </div>
          </Card>
        )}
        
        <div className="space-y-3">
          {displayNotifications.map((notif) => {
              if (!notif || !notif.id) return null;
              
              const { title, details, alert, status, icon: Icon, color } = getNotificationVisuals(notif);
              
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <Card 
                    className={`transition-all ${
                      !notif.read && !notif.isDummy
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                        : notif.isDummy
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        : 'bg-white dark:bg-gray-800'
                    } hover:shadow-md ${notif.link_to && !notif.isDummy ? 'cursor-pointer' : notif.isDummy ? 'cursor-default' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Icoon */}
                        <div className={`flex-shrink-0 mt-0.5 ${color} ${notif.isDummy ? 'opacity-60' : ''}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Titel + Badges */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                              <h3 className={`text-base font-semibold ${
                                !notif.read && !notif.isDummy
                                  ? 'text-gray-900 dark:text-gray-100' 
                                  : 'text-gray-800 dark:text-gray-200'
                              } ${notif.isDummy ? 'opacity-75' : ''}`}>
                                {title}
                              </h3>
                              {notif.isDummy && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-xs px-2 py-0">
                                  DEMO
                                </Badge>
                              )}
                            </div>
                            {!notif.read && !notif.isDummy && (
                              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                            )}
                          </div>
                          
                          {/* Status badge */}
                          {status && (
                            <div className="mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                {status.text}
                              </span>
                            </div>
                          )}
                          
                          {/* Details */}
                          <p className={`text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed ${notif.isDummy ? 'opacity-75' : ''}`}>
                            {details}
                          </p>
                          
                          {/* Alert */}
                          {alert && (
                            <div className="flex items-start gap-2 mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                Check: {alert}
                              </span>
                            </div>
                          )}
                          
                          {/* Tijdstempel en Delete button */}
                          <div className="flex items-center justify-between mt-3">
                            <p className={`text-xs text-gray-500 dark:text-gray-400 ${notif.isDummy ? 'opacity-60' : ''}`}>
                              {formatRelativeTime(notif.created_date)}
                            </p>
                            {!notif.isDummy && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={(e) => handleDeleteNotification(e, notif.id)}
                              >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}