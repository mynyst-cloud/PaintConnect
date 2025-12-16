import { useEffect } from 'react';

// Dynamisch de juiste function base URL bepalen
function getFunctionBaseUrl() {
    const currentOrigin = window.location.origin;
    const hostname = window.location.hostname;
    
    // Check of we op een custom domain zitten (productie)
    if (hostname === 'app.paintconnect.be' || !hostname.includes('base44.app')) {
        // Custom domain - gebruik /api/functions/ pad
        return `${currentOrigin}/api/functions`;
    }
    
    // Base44 preview/staging - gebruik /api/apps/{appId}/functions/ pad
    return `${currentOrigin}/api/apps/688ddf9fafec117afa44cb01/functions`;
}

export function usePWA() {
    useEffect(() => {
        const currentOrigin = window.location.origin;
        const functionBaseUrl = getFunctionBaseUrl();
        
        console.log('[PWA] Initializing PWA with origin:', currentOrigin);
        console.log('[PWA] Function base URL:', functionBaseUrl);
        
        // Add manifest link
        const manifestLink = document.querySelector('link[rel="manifest"]') || document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = `${functionBaseUrl}/manifest`;
        if (!document.querySelector('link[rel="manifest"]')) {
            document.head.appendChild(manifestLink);
        }

        // Add theme color
        const themeColorMeta = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        themeColorMeta.content = '#10b981';
        if (!document.querySelector('meta[name="theme-color"]')) {
            document.head.appendChild(themeColorMeta);
        }

        // Add apple-mobile-web-app-capable
        const appleMobileWebAppCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]') || document.createElement('meta');
        appleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
        appleMobileWebAppCapable.content = 'yes';
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            document.head.appendChild(appleMobileWebAppCapable);
        }

        // Add apple-mobile-web-app-status-bar-style
        const appleStatusBarStyle = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') || document.createElement('meta');
        appleStatusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
        appleStatusBarStyle.content = 'black-translucent';
        if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
            document.head.appendChild(appleStatusBarStyle);
        }

        // Add apple-mobile-web-app-title
        const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') || document.createElement('meta');
        appleTitle.name = 'apple-mobile-web-app-title';
        appleTitle.content = 'PaintConnect';
        if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
            document.head.appendChild(appleTitle);
        }

        // Add apple touch icon
        const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') || document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';
        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            document.head.appendChild(appleTouchIcon);
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            const serviceWorkerUrl = `${functionBaseUrl}/serviceWorker`;
            
            console.log('[PWA] Service Worker URL:', serviceWorkerUrl);
            
            // Test of de Service Worker URL beschikbaar is voordat we registreren
            fetch(serviceWorkerUrl, { method: 'HEAD' })
                .then((response) => {
                    if (response.ok) {
                        console.log('[PWA] Service Worker endpoint is available, proceeding with registration');
                        return navigator.serviceWorker.register(serviceWorkerUrl, {
                            scope: '/'
                        });
                    } else {
                        throw new Error(`Service Worker endpoint returned ${response.status}`);
                    }
                })
                .then((registration) => {
                    console.log('[PWA] Service Worker registered successfully:', registration);

                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('[PWA] New Service Worker found');

                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[PWA] New content available');
                                
                                // Auto-reload na 3 seconden voor nieuwe versie
                                setTimeout(() => {
                                    if (confirm('Nieuwe versie beschikbaar! Pagina herladen?')) {
                                        window.location.reload();
                                    }
                                }, 3000);
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.warn('[PWA] Service Worker registration failed:', error.message);
                    console.log('[PWA] App will continue to work without offline support');
                });
        } else {
            console.log('[PWA] Service Workers not supported in this browser');
        }

        // Handle beforeinstallprompt event
        let deferredPrompt;
        const handleBeforeInstallPrompt = (e) => {
            console.log('[PWA] beforeinstallprompt event fired');
            e.preventDefault();
            deferredPrompt = e;
            window.deferredPrompt = deferredPrompt;
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed successfully');
            deferredPrompt = null;
            window.deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);
}