import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
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

export default function NotificationBell({ notifications, unreadCount, onMarkAsRead, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

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
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header met Alles gelezen knop */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meldingen</h3>
          {unreadCount > 0 && (
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
        
        {/* Notificaties lijst */}
        <div className="max-h-96 overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.slice(0, 8).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:bg-gray-50 dark:focus:bg-gray-700/50 ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  {!notification.read && (
                    <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                  <div className={`flex-1 min-w-0 ${notification.read ? 'ml-5' : ''}`}>
                    <p className={`text-xs line-clamp-2 ${!notification.read ? 'text-gray-900 dark:text-slate-200 font-medium' : 'text-gray-700 dark:text-slate-300'}`}>
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
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