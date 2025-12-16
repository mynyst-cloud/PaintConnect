import React from 'react';
import { websocketManager } from './websocketManager';

class RealtimeNotifications {
    constructor() {
        this.listeners = new Set();
        this.isInitialized = false;
        this.notificationQueue = [];
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Listen for notification events from WebSocket
            websocketManager.on('notification', (data) => {
                this.handleNotification(data);
            });

            // Listen for project updates
            websocketManager.on('project_update', (data) => {
                this.handleProjectUpdate(data);
            });

            // Listen for chat messages
            websocketManager.on('chat_message', (data) => {
                this.handleChatMessage(data);
            });

            // Listen for material requests
            websocketManager.on('material_request', (data) => {
                this.handleMaterialRequest(data);
            });

            // Listen for damage reports
            websocketManager.on('damage_report', (data) => {
                this.handleDamageReport(data);
            });

            this.isInitialized = true;
            console.log('Realtime notifications initialized');

        } catch (error) {
            console.error('Failed to initialize realtime notifications:', error);
        }
    }

    handleNotification(data) {
        console.log('Realtime notification received:', data);
        
        // Show browser notification if permission granted
        this.showBrowserNotification(data);
        
        // Notify all listeners
        this.listeners.forEach(callback => {
            try {
                callback('notification', data);
            } catch (error) {
                console.error('Notification listener error:', error);
            }
        });
    }

    handleProjectUpdate(data) {
        console.log('Project update received:', data);
        
        // Notify listeners
        this.listeners.forEach(callback => {
            try {
                callback('project_update', data);
            } catch (error) {
                console.error('Project update listener error:', error);
            }
        });
    }

    handleChatMessage(data) {
        console.log('Chat message received:', data);
        
        // Show notification for new chat messages
        if (data.sender_email !== this.getCurrentUserEmail()) {
            this.showBrowserNotification({
                title: 'Nieuw bericht',
                message: `${data.sender_name}: ${data.message}`,
                type: 'chat_message',
                link_to: '/TeamChat'
            });
        }

        // Notify listeners
        this.listeners.forEach(callback => {
            try {
                callback('chat_message', data);
            } catch (error) {
                console.error('Chat message listener error:', error);
            }
        });
    }

    handleMaterialRequest(data) {
        console.log('Material request received:', data);
        
        // Show notification for new material requests
        this.showBrowserNotification({
            title: 'Nieuwe materiaalaanvraag',
            message: `${data.material_name} - ${data.requested_by}`,
            type: 'material_request',
            link_to: '/Materialen'
        });

        // Notify listeners
        this.listeners.forEach(callback => {
            try {
                callback('material_request', data);
            } catch (error) {
                console.error('Material request listener error:', error);
            }
        });
    }

    handleDamageReport(data) {
        console.log('Damage report received:', data);
        
        // Show notification for new damage reports
        this.showBrowserNotification({
            title: 'Nieuwe beschadiging gemeld',
            message: `${data.title} - ${data.reported_by}`,
            type: 'damage_report',
            link_to: '/Beschadigingen'
        });

        // Notify listeners
        this.listeners.forEach(callback => {
            try {
                callback('damage_report', data);
            } catch (error) {
                console.error('Damage report listener error:', error);
            }
        });
    }

    async showBrowserNotification(data) {
        // Check if notifications are supported and enabled
        if (!('Notification' in window)) {
            return;
        }

        // Request permission if not granted
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return;
            }
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification(data.title || 'PaintConnect', {
                body: data.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: data.type || 'paintconnect',
                requireInteraction: false,
                silent: false
            });

            // Handle notification click
            notification.onclick = () => {
                window.focus();
                if (data.link_to) {
                    window.location.href = data.link_to;
                }
                notification.close();
            };

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);
        }
    }

    getCurrentUserEmail() {
        // Try to get current user email from localStorage or other source
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.email;
            }
        } catch (error) {
            // Ignore errors
        }
        return null;
    }

    // Subscribe to realtime updates
    subscribe(callback) {
        this.listeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    // Send realtime message
    async send(type, data) {
        try {
            await websocketManager.send({
                type,
                ...data
            });
        } catch (error) {
            console.error('Failed to send realtime message:', error);
        }
    }

    // Get connection status
    getConnectionStatus() {
        return websocketManager.getStatus();
    }
}

// Create singleton instance
export const realtimeNotifications = new RealtimeNotifications();

// Hook for React components
export const useRealtimeNotifications = (callback) => {
    React.useEffect(() => {
        const unsubscribe = realtimeNotifications.subscribe(callback);
        return unsubscribe;
    }, [callback]);

    return {
        send: realtimeNotifications.send.bind(realtimeNotifications),
        status: realtimeNotifications.getConnectionStatus()
    };
};

export default realtimeNotifications;