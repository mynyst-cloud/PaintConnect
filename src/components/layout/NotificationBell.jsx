import React, { useState, useMemo } from 'react';
import { Bell, CheckCheck, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/components/utils';
import { markAllNotificationsAsRead } from '@/api/functions';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';

// Helper functie om dummy/demo notificaties te genereren (dezelfde als in Notificaties.jsx)
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
    }
  ];
};

export default function NotificationBell({ notifications, unreadCount, onMarkAsRead, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  
  // Bepaal welke notificaties te tonen (echt of dummy)
  const displayNotifications = useMemo(() => {
    const realNotifications = (notifications || []).filter(n => !n.isDummy);
    const hasRealNotifications = realNotifications.length > 0;
    
    if (hasRealNotifications) {
      return realNotifications;
    } else {
      return generateDummyNotifications();
    }
  }, [notifications]);
  
  // Bereken unread count alleen voor echte notificaties
  const realUnreadCount = useMemo(() => {
    const realNotifications = (notifications || []).filter(n => !n.isDummy);
    return realNotifications.filter(n => !n.read).length;
  }, [notifications]);
  
  const hasRealNotifications = (notifications || []).filter(n => !n.isDummy).length > 0;

  const handleMarkAllAsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsMarkingAllRead(true);
      console.log('[NotificationBell] Marking all as read...');
      const response = await markAllNotificationsAsRead();
      console.log('[NotificationBell] Marked all as read:', response.data);
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('[NotificationBell] Error marking all as read:', error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleNotificationClick = (notification) => {
    // Dummy notificaties zijn niet klikbaar
    if (notification.isDummy) {
      return;
    }
    
    if (onMarkAsRead && !notification.read) {
      onMarkAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {realUnreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {realUnreadCount > 9 ? '9+' : realUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header met Alles gelezen knop */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meldingen</h3>
          {hasRealNotifications && realUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
              className="text-xs h-7 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <CheckCheck className="w-3 h-3 mr-1"/>
              {isMarkingAllRead ? 'Bezig...' : 'Alles gelezen'}
            </Button>
          )}
        </div>
        
        {/* Demo meldingen info banner */}
        {!hasRealNotifications && displayNotifications.length > 0 && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Demo meldingen - verdwijnen bij echte meldingen
              </p>
            </div>
          </div>
        )}
        
        {/* Notificaties lijst */}
        <div className="max-h-96 overflow-y-auto">
          {displayNotifications && displayNotifications.length > 0 ? (
            displayNotifications.slice(0, 8).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-3 ${notification.isDummy ? 'cursor-default' : 'cursor-pointer'} border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:bg-gray-50 dark:focus:bg-gray-700/50 ${
                  !notification.read && !notification.isDummy ? 'bg-blue-50 dark:bg-blue-950/20' : notification.isDummy ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  {!notification.read && !notification.isDummy && (
                    <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                  <div className={`flex-1 min-w-0 ${notification.read || notification.isDummy ? 'ml-5' : ''}`}>
                    <div className="flex items-start gap-2 mb-0.5">
                      <p className={`text-xs line-clamp-2 flex-1 ${!notification.read && !notification.isDummy ? 'text-gray-900 dark:text-slate-200 font-medium' : 'text-gray-700 dark:text-slate-300'} ${notification.isDummy ? 'opacity-75' : ''}`}>
                        {notification.message}
                      </p>
                      {notification.isDummy && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-[9px] px-1.5 py-0 flex-shrink-0">
                          DEMO
                        </Badge>
                      )}
                    </div>
                    <p className={`text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 ${notification.isDummy ? 'opacity-60' : ''}`}>
                      {formatDateTime(notification.created_date)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Geen nieuwe meldingen</p>
            </div>
          )}
        </div>
        
        {/* Footer met link naar alle notificaties */}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link to={createPageUrl("Notificaties")} onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full text-sm justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
              Alle notificaties bekijken
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}