import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Check, X } from 'lucide-react'
import { 
  initOneSignal, 
  requestPushPermission, 
  getPlayerId, 
  setExternalUserId,
  isPushSupported,
  getPushPermissionState,
  addTag
} from '@/lib/onesignal'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function PushNotificationPrompt({ currentUser, compact = false }) {
  const [permissionState, setPermissionState] = useState('default')
  const [isLoading, setIsLoading] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    // Check localStorage bij init
    const dismissedAt = localStorage.getItem('pushPromptDismissed')
    if (!dismissedAt) return false
    
    // Check of 24 uur verlopen is
    const hoursAgo = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60)
    if (hoursAgo > 24) {
      localStorage.removeItem('pushPromptDismissed')
      return false
    }
    return true
  })
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    const supported = isPushSupported()
    setIsSupported(supported)
    console.log('[Push] Supported:', supported)
    
    if (!supported) return
    
    const init = async () => {
      await initOneSignal()
      const state = await getPushPermissionState()
      console.log('[Push] Permission state:', state)
      setPermissionState(state)
      
      // Als al toegestaan, registreer de gebruiker
      if (state === true && currentUser) {
        await registerUser()
      }
    }
    
    init()
  }, [currentUser])

  const registerUser = async () => {
    if (!currentUser) return
    
    try {
      await setExternalUserId(currentUser.id, currentUser.email)
      
      // Voeg tags toe voor targeting
      if (currentUser.company_id) {
        await addTag('company_id', currentUser.company_id)
      }
      if (currentUser.company_role) {
        await addTag('role', currentUser.company_role)
      }
      
      // Sla player ID op in database
      const playerId = await getPlayerId()
      if (playerId) {
        // Check of al bestaat
        const { data: existing } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('onesignal_player_id', playerId)
          .maybeSingle()
        
        if (existing) {
          // Update bestaande
          await supabase.from('push_subscriptions').update({
            last_active: new Date().toISOString(),
            is_active: true
          }).eq('id', existing.id)
        } else {
          // Insert nieuwe
          await supabase.from('push_subscriptions').insert({
            user_id: currentUser.id,
            user_email: currentUser.email,
            onesignal_player_id: playerId,
            device_type: 'web',
            last_active: new Date().toISOString(),
            is_active: true
          })
        }
      }
    } catch (error) {
      console.error('[Push] Registration error:', error)
    }
  }

  const handleEnablePush = async () => {
    setIsLoading(true)
    try {
      const granted = await requestPushPermission()
      setPermissionState(granted ? true : 'denied')
      
      if (granted) {
        await registerUser()
        toast.success('Push notificaties ingeschakeld!')
      } else {
        toast.error('Push notificaties geweigerd')
      }
    } catch (error) {
      console.error('[Push] Enable error:', error)
      toast.error('Kon push notificaties niet inschakelen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Sla op met timestamp zodat het na 24 uur opnieuw verschijnt
    localStorage.setItem('pushPromptDismissed', Date.now().toString())
  }

  // Debug log
  console.log('[Push] Render check:', { isSupported, permissionState, dismissed })

  // Niet tonen als niet ondersteund of al toegestaan
  if (!isSupported || permissionState === true || dismissed) {
    console.log('[Push] Banner hidden:', { isSupported, permissionState, dismissed })
    return null
  }

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleEnablePush}
        disabled={isLoading}
        className="gap-2"
      >
        <Bell className="w-4 h-4" />
        Meldingen
      </Button>
    )
  }

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-full">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Push notificaties inschakelen</h3>
          <p className="text-sm text-white/90 mb-3">
            Ontvang herinneringen om in te checken bij projecten en blijf op de hoogte van updates.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleEnablePush}
              disabled={isLoading}
              className="bg-white text-emerald-600 hover:bg-white/90"
            >
              {isLoading ? 'Bezig...' : 'Inschakelen'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20"
            >
              Later
            </Button>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Kleine badge versie voor in de header
export function PushNotificationBadge({ currentUser }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const checkState = async () => {
      const state = await getPushPermissionState()
      setEnabled(state === true)
    }
    checkState()
  }, [])

  if (enabled) {
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-600">
        <Bell className="w-3 h-3" />
        <Check className="w-3 h-3" />
      </div>
    )
  }

  return <PushNotificationPrompt currentUser={currentUser} compact />
}




