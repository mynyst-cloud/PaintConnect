import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, FileText, Package, AlertTriangle, CheckCircle, AlertCircle, Calendar, Users, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl, formatDateTime } from '@/components/utils';
import { Notification } from '@/api/entities';
import { markAllNotificationsAsRead } from '@/api/functions';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // Beperk details lengte
  if (details.length > 150) {
    details = details.substring(0, 150) + '...';
  }
  
  return { title, details, alert, status, ...iconConfig };
};

export default function NotificationDropdown({ notifications = [], unreadCount = 0, onRefresh }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const handleNotificationClick = async (notification) => {
        setIsOpen(false);
        
        // Mark notification as read
        if (!notification.read) {
            try {
                await Notification.update(notification.id, { read: true });
                await onRefresh?.();
            } catch (error) {
                console.error('[NotificationDropdown] Error marking notification as read:', error);
            }
        }
        
        // Navigate to link if present
        if (notification.link_to) {
            const path = notification.link_to.startsWith('/') ? notification.link_to : `/${notification.link_to}`;
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

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative group"
                    aria-label={`Meldingen${unreadCount > 0 ? `, ${unreadCount} ongelezen` : ''}`}
                >
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    </motion.div>
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 25 
                                }}
                            >
                                <Badge
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                    <motion.span
                                        key={displayCount}
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        {displayCount}
                                    </motion.span>
                                </Badge>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 max-h-[32rem] overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Meldingen</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingAll}
                            className="text-xs h-auto px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <CheckCheck className="w-3 h-3 mr-1" />
                            {isMarkingAll ? 'Bezig...' : 'Alles gelezen'}
                        </Button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium mb-1">Geen nieuwe meldingen</p>
                        <p className="text-xs">Updates verschijnen hier</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.slice(0, 10).map((notification) => {
                            const { title, details, alert, status, icon: Icon, color } = getNotificationVisuals(notification);
                            
                            return (
                                <DropdownMenuItem
                                    key={notification.id}
                                    onSelect={() => handleNotificationClick(notification)}
                                    className={`px-4 py-3 cursor-pointer transition-colors ${
                                        !notification.read 
                                            ? 'bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20' 
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        {/* Icoon */}
                                        <div className={`flex-shrink-0 mt-0.5 ${color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Titel + Status */}
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className={`text-sm font-semibold ${
                                                    !notification.read 
                                                        ? 'text-gray-900 dark:text-gray-100' 
                                                        : 'text-gray-800 dark:text-gray-200'
                                                }`}>
                                                    {title}
                                                </h4>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                                )}
                                            </div>
                                            
                                            {/* Status badge */}
                                            {status && (
                                                <div className="mb-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        {status.text}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Details */}
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                                                {details}
                                            </p>
                                            
                                            {/* Alert */}
                                            {alert && (
                                                <div className="flex items-start gap-1.5 mb-2 text-orange-700 dark:text-orange-400">
                                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                    <span className="text-xs font-medium">Check: {alert}</span>
                                                </div>
                                            )}
                                            
                                            {/* Tijdstempel */}
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDateTime(notification.created_date)}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                )}

                <DropdownMenuSeparator />
                <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
                    <Link to={createPageUrl("Notificaties")} onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
                            Alle notificaties bekijken
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}