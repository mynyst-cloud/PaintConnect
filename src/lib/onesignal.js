/**
 * OneSignal Push Notification Integration
 * 
 * Requires VITE_ONESIGNAL_APP_ID environment variable
 */

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || ''

let isInitialized = false

/**
 * Check if push notifications are supported
 */
export function isPushSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Initialize OneSignal SDK
 */
export async function initOneSignal() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'Init called',data:{isInitialized,hasAppId:!!ONESIGNAL_APP_ID,appIdLength:ONESIGNAL_APP_ID?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (isInitialized) return true
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] No App ID configured')
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'NO APP ID!',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return false
  }
  if (!isPushSupported()) {
    console.warn('[OneSignal] Push notifications not supported')
    return false
  }

  try {
    // Create OneSignalDeferred array BEFORE loading the script
    window.OneSignalDeferred = window.OneSignalDeferred || []
    
    // Load OneSignal SDK if not already loaded
    if (!document.querySelector('script[src*="OneSignalSDK"]')) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
        script.defer = true
        script.onload = () => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'Script loaded',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          resolve()
        }
        script.onerror = (err) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'Script error',data:{err:String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          reject(err)
        }
        document.head.appendChild(script)
      })
    }
    
    // Initialize OneSignal
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'Init timeout',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        reject(new Error('OneSignal init timeout'))
      }, 10000)
      
      window.OneSignalDeferred.push(async function(OneSignal) {
        clearTimeout(timeout)
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false, // We use our own UI
            },
            welcomeNotification: {
              disable: true
            }
          })
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'SDK initialized',data:{appId:ONESIGNAL_APP_ID?.substring(0,8)+'...'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          resolve()
        } catch (initError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'SDK init error',data:{error:initError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          reject(initError)
        }
      })
    })

    isInitialized = true
    console.log('[OneSignal] Initialized successfully')
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'Fully initialized',data:{isInitialized:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return true
  } catch (error) {
    console.error('[OneSignal] Initialization error:', error)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:initOneSignal',message:'Init failed',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return false
  }
}

/**
 * Get current push permission state
 * @returns {Promise<boolean|'default'|'denied'>}
 */
export async function getPushPermissionState() {
  if (!isPushSupported()) return 'denied'
  
  try {
    const permission = Notification.permission
    if (permission === 'granted') return true
    if (permission === 'denied') return 'denied'
    return 'default'
  } catch (error) {
    console.error('[OneSignal] Permission check error:', error)
    return 'default'
  }
}

/**
 * Request push notification permission
 * @returns {Promise<boolean>}
 */
export async function requestPushPermission() {
  if (!isInitialized) {
    const initResult = await initOneSignal()
    if (!initResult) {
      console.error('[OneSignal] Failed to initialize before permission request')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:requestPushPermission',message:'Init failed',data:{isInitialized,hasDeferred:!!window.OneSignalDeferred},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return false
    }
  }

  // Extra check: ensure OneSignalDeferred exists
  if (!window.OneSignalDeferred) {
    console.error('[OneSignal] OneSignalDeferred not available')
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:requestPushPermission',message:'No OneSignalDeferred',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return false
  }

  try {
    return await new Promise((resolve) => {
      window.OneSignalDeferred.push(async function(OneSignal) {
        const result = await OneSignal.Notifications.requestPermission()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:requestPushPermission',message:'Permission result',data:{result},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        resolve(result)
      })
    })
  } catch (error) {
    console.error('[OneSignal] Permission request error:', error)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:requestPushPermission',message:'Permission error',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return false
  }
}

/**
 * Get the OneSignal Player ID (subscription ID)
 * @returns {Promise<string|null>}
 */
export async function getPlayerId() {
  if (!isInitialized) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:getPlayerId',message:'Not initialized',data:{isInitialized},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return null
  }

  try {
    return await new Promise((resolve) => {
      window.OneSignalDeferred.push(async function(OneSignal) {
        const id = await OneSignal.User.PushSubscription.id
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e3889834-1bb5-40e6-acc6-c759053e31c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onesignal.js:getPlayerId',message:'Got ID',data:{hasId:!!id,idLength:id?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        resolve(id || null)
      })
    })
  } catch (error) {
    console.error('[OneSignal] Get player ID error:', error)
    return null
  }
}

/**
 * Set external user ID for targeting
 * @param {string} userId - Supabase user ID
 * @param {string} email - User email
 */
export async function setExternalUserId(userId, email) {
  if (!isInitialized) return

  try {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.login(userId)
      if (email) {
        await OneSignal.User.addEmail(email)
      }
    })
    console.log('[OneSignal] External user ID set:', userId)
  } catch (error) {
    console.error('[OneSignal] Set external user ID error:', error)
  }
}

/**
 * Add a tag for segmentation
 * @param {string} key - Tag key
 * @param {string} value - Tag value
 */
export async function addTag(key, value) {
  if (!isInitialized) return

  try {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.User.addTag(key, value)
    })
  } catch (error) {
    console.error('[OneSignal] Add tag error:', error)
  }
}

/**
 * Add multiple tags
 * @param {Object} tags - Key-value pairs of tags
 */
export async function addTags(tags) {
  if (!isInitialized) return

  try {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.User.addTags(tags)
    })
  } catch (error) {
    console.error('[OneSignal] Add tags error:', error)
  }
}

/**
 * Remove a tag
 * @param {string} key - Tag key to remove
 */
export async function removeTag(key) {
  if (!isInitialized) return

  try {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.User.removeTag(key)
    })
  } catch (error) {
    console.error('[OneSignal] Remove tag error:', error)
  }
}

/**
 * Logout user from OneSignal
 */
export async function logoutOneSignal() {
  if (!isInitialized) return

  try {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.logout()
    })
    console.log('[OneSignal] User logged out')
  } catch (error) {
    console.error('[OneSignal] Logout error:', error)
  }
}

export default {
  isPushSupported,
  initOneSignal,
  getPushPermissionState,
  requestPushPermission,
  getPlayerId,
  setExternalUserId,
  addTag,
  addTags,
  removeTag,
  logoutOneSignal
}

