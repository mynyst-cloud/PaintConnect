import React, { useState, useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, FileText, Package, AlertTriangle, CheckCircle, Calendar, MessageCircle, UserPlus, Clock, LogIn, Reply, Receipt, TrendingUp, ExternalLink, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';
import { Notification } from '@/api/entities';
import { markAllNotificationsAsRead } from '@/api/functions';
import { motion, AnimatePresence } from 'framer-motion';

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
      is_read: false,
      isDummy: true
    },
    {
      id: 'dummy-project-1',
      message: 'Project update - Voortgang: 65% - Penthouse Amsterdam',
      type: 'project_update',
      created_date: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 uur geleden
      read: false,
      is_read: false,
      isDummy: true
    },
    {
      id: 'dummy-damage-1',
      message: 'Schademelding - Beschadiging gemeld - Boutique Hotel Lobby',
      type: 'damage_reported',
      created_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dag geleden
      read: true,
      is_read: true,
      isDummy: true
    }
  ];
};

// Notification type configurations
const notificationConfig = {
  'invoice_received': { 
    icon: Receipt, 
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Factuur'
  },
  'credit_note_received': { 
    icon: FileText, 
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
    label: 'Creditnota'
  },
  'price_change_detected': { 
    icon: TrendingUp, 
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'Prijswijziging'
  },
  'material_requested': { 
    icon: Package, 
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    label: 'Materiaal'
  },
  'material_approved': { 
    icon: CheckCircle, 
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400',
    label: 'Goedgekeurd'
  },
  'damage_reported': { 
    icon: AlertTriangle, 
    bgColor: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    label: 'Schade'
  },
  'project_update': { 
    icon: Calendar, 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Project'
  },
  'project_assigned': { 
    icon: Calendar, 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Toegewezen'
  },
  'planning_change': { 
    icon: Calendar, 
    bgColor: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    label: 'Planning'
  },
  'client_logged_in': { 
    icon: LogIn, 
    bgColor: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    label: 'Klant'
  },
  'team_message': { 
    icon: MessageCircle, 
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    label: 'Team'
  },
  'team_chat_message': { 
    icon: MessageCircle, 
    bgColor: 'bg-pink-100 dark:bg-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
    label: 'Chat'
  },
  'painter_activated': { 
    icon: UserPlus, 
    bgColor: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
    label: 'Schilder'
  },
  'painter_not_checked_in': { 
    icon: Clock, 
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'Check-in'
  },
  'update_reply': { 
    icon: Reply, 
    bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/40',
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    label: 'Reactie'
  },
  'check_in_reminder': { 
    icon: Clock, 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Herinnering'
  },
  'check_out_reminder': { 
    icon: Clock, 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Herinnering'
  },
  'generic': { 
    icon: Bell, 
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400',
    label: 'Melding'
  }
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Zojuist';
  if (diffMins < 60) return `${diffMins} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays === 1) return 'Gisteren';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
};

// Parse notification for better display
const parseNotification = (notification) => {
  const config = notificationConfig[notification.type] || notificationConfig.generic;
  const message = notification.message || '';
  
  // Use title if available, otherwise extract from message
  let title = notification.title || '';
  let body = message;
  
  // Clean up the message - remove [Link: ...] part
  body = body.replace(/\s*\[Link:.*?\]\s*/g, '').trim();
  
  // If no title, try to extract from message
  if (!title) {
    // For invoice notifications, extract supplier name
    if (notification.type === 'invoice_received') {
      const match = message.match(/Van:\s*(.+?)(?:\s*\[|$)/);
      if (match) {
        title = 'Nieuwe factuur ontvangen';
        body = match[1].trim();
      } else {
        title = body.split(' - ')[0] || 'Nieuwe factuur';
        body = body.split(' - ').slice(1).join(' - ') || '';
      }
    } else {
      // Generic: use first sentence as title
      const parts = message.split(/[.!?]/);
      title = parts[0]?.trim() || 'Nieuwe melding';
      body = parts.slice(1).join('. ').trim();
    }
  }
  
  // Limit body length
  if (body.length > 80) {
    body = body.substring(0, 77) + '...';
  }
  
  return { title, body, config };
};

export default function NotificationDropdown({ notifications = [], unreadCount = 0, onRefresh }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  
  // Bepaal welke notificaties te tonen (echt of dummy)
  const realNotifications = useMemo(() => {
    const filtered = (notifications || []).filter(n => !n.isDummy);
    console.log('[NotificationDropdown] Received notifications:', notifications?.length || 0);
    console.log('[NotificationDropdown] Real notifications (filtered):', filtered.length);
    return filtered;
  }, [notifications]);
  
  const hasRealNotifications = realNotifications.length > 0;
  
  const displayNotifications = useMemo(() => {
    if (hasRealNotifications) {
      console.log('[NotificationDropdown] Showing real notifications:', realNotifications.length);
      return realNotifications;
    } else {
      const dummy = generateDummyNotifications();
      console.log('[NotificationDropdown] No real notifications, showing dummy notifications:', dummy.length);
      return dummy;
    }
  }, [hasRealNotifications, realNotifications]);
  
  const realUnreadCount = useMemo(() => {
    return realNotifications.filter(n => !n.read && !n.is_read).length;
  }, [realNotifications]);
  
  console.log('[NotificationDropdown] Render - hasRealNotifications:', hasRealNotifications, 'displayNotifications.length:', displayNotifications.length);

  const handleNotificationClick = async (notification) => {
    // Dummy notificaties zijn niet klikbaar
    if (notification.isDummy) {
      return;
    }
    
    setIsOpen(false);
    
    // Mark notification as read
    if (!notification.read && !notification.is_read) {
      try {
        await Notification.update(notification.id, { read: true, is_read: true });
        await onRefresh?.();
      } catch (error) {
        console.error('[NotificationDropdown] Error marking notification as read:', error);
      }
    }
    
    // Navigate to link if present in message
    const linkMatch = notification.message?.match(/\[Link:\s*(.+?)\]/);
    const linkTo = linkMatch?.[1] || notification.link_to;
    
    if (linkTo) {
      const path = linkTo.startsWith('/') ? linkTo : `/${linkTo}`;
      navigate(path);
    }
  };
  
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    if (isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      await onRefresh?.();
    } catch (error) {
      console.error('[NotificationDropdown] Error marking all as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const displayCount = realUnreadCount > 99 ? '99+' : realUnreadCount;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative group h-10 w-10"
          aria-label={`Meldingen${realUnreadCount > 0 ? `, ${realUnreadCount} ongelezen` : ''}`}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </motion.div>
          <AnimatePresence>
            {realUnreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5"
              >
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-lg">
                  {displayCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-[380px] p-0 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meldingen</h3>
            {hasRealNotifications && realUnreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                {realUnreadCount} nieuw
              </Badge>
            )}
            {!hasRealNotifications && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                DEMO
              </Badge>
            )}
          </div>
          {hasRealNotifications && realUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="h-7 px-2 text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              {isMarkingAll ? 'Bezig...' : 'Alles gelezen'}
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

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {displayNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Geen meldingen</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Je bent helemaal bij!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {displayNotifications.slice(0, 12).map((notification, index) => {
                const { title, body, config } = parseNotification(notification);
                const Icon = config.icon;
                const isUnread = !notification.read && !notification.is_read && !notification.isDummy;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 px-4 py-3 ${notification.isDummy ? 'cursor-default' : 'cursor-pointer'} transition-all duration-200 group
                      ${isUnread 
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30' 
                        : notification.isDummy
                        ? 'bg-gray-50/50 dark:bg-gray-800/30'
                        : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center shadow-sm ${notification.isDummy ? 'opacity-60' : ''}`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Label en DEMO badge */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider ${config.iconColor} ${notification.isDummy ? 'opacity-75' : ''}`}>
                              {config.label}
                            </span>
                            {notification.isDummy && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-[9px] px-1.5 py-0 h-4">
                                DEMO
                              </Badge>
                            )}
                          </div>
                          
                          {/* Title */}
                          <h4 className={`text-sm font-medium truncate ${
                            isUnread 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          } ${notification.isDummy ? 'opacity-75' : ''}`}>
                            {title}
                          </h4>
                          
                          {/* Body */}
                          {body && (
                            <p className={`text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 ${notification.isDummy ? 'opacity-75' : ''}`}>
                              {body}
                            </p>
                          )}
                        </div>
                        
                        {/* Unread indicator & Time */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                          )}
                          <span className={`text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap ${notification.isDummy ? 'opacity-60' : ''}`}>
                            {formatRelativeTime(notification.created_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover arrow - alleen voor echte notificaties */}
                    {!notification.isDummy && (
                      <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-3" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {displayNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
              <Link to={createPageUrl("Notificaties")} onClick={() => setIsOpen(false)}>
                <Button 
                  variant="ghost" 
                  className="w-full h-9 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  Bekijk alle meldingen
                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
