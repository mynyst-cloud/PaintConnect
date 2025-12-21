import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check of al geïnstalleerd
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check localStorage voor dismissed
    const dismissedAt = localStorage.getItem('pwaInstallDismissed')
    if (dismissedAt) {
      const hoursAgo = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60)
      if (hoursAgo < 72) { // 3 dagen
        setDismissed(true)
        return
      }
      localStorage.removeItem('pwaInstallDismissed')
    }

    // Luister naar beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Toon prompt na 5 seconden
      setTimeout(() => setShowPrompt(true), 5000)
    }

    // Check of er al een deferred prompt is
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('[PWA] App installed')
        setIsInstalled(true)
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('[PWA] Install error:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwaInstallDismissed', Date.now().toString())
  }

  if (isInstalled || dismissed || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">Installeer PaintConnect</h3>
                <p className="text-white/90 text-sm mt-1">
                  Krijg snellere toegang en notificaties als native app
                </p>
              </div>
              <button 
                onClick={handleDismiss}
                className="text-white/70 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Werkt offline
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Sneller laden
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Push meldingen
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Later
              </Button>
              <Button
                onClick={handleInstall}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Installeren
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Compacte versie voor in de sidebar/menu
export function InstallButton() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    if (window.deferredPrompt) {
      setCanInstall(true)
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      window.deferredPrompt = e
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setCanInstall(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    const prompt = window.deferredPrompt
    if (!prompt) return

    prompt.prompt()
    const { outcome } = await prompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    
    window.deferredPrompt = null
    setCanInstall(false)
  }

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 px-3 py-2">
        <Smartphone className="w-4 h-4" />
        <span>App geïnstalleerd ✓</span>
      </div>
    )
  }

  if (!canInstall) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstall}
      className="w-full justify-start gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
    >
      <Download className="w-4 h-4" />
      Installeer App
    </Button>
  )
}




