// ===== OK MART - FCM TOKEN AUTO-SAVE SYSTEM =====
// Yeh file automatically token capture karegi aur Firebase mein save karegi

(function() {
  'use strict';

  // Firebase Messaging Configuration
  const VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

  let messaging = null;
  let tokenSaved = false;

  // ========== CHECK IF FIREBASE IS READY ==========
  function isFirebaseReady() {
    return typeof firebase !== 'undefined' && firebase.messaging;
  }

  // ========== GET OR CREATE USER ID ==========
  function getUserId() {
    let userId = localStorage.getItem('okmart_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('okmart_user_id', userId);
      console.log('✅ New user ID created:', userId);
    }
    return userId;
  }

  // ========== SAVE TOKEN TO FIRESTORE ==========
  async function saveTokenToFirestore(token, userId) {
    try {
      // Check if Firestore is available
      if (!window.db) {
        console.warn('⚠️ Firestore not available yet, retrying in 2 seconds...');
        setTimeout(() => saveTokenToFirestore(token, userId), 2000);
        return;
      }

      const tokenData = {
        token: token,
        userId: userId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: getBrowserName(),
        lastIP: await getClientIP()
      };

      // Save to fcm_tokens collection
      await db.collection('fcm_tokens').doc(userId).set(tokenData, { merge: true });
      console.log('✅ FCM Token saved to Firestore for user:', userId);
      tokenSaved = true;
      
      // Also save to localStorage
      localStorage.setItem('fcm_token_saved', 'true');
      localStorage.setItem('fcm_token', token);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving token to Firestore:', error);
      return false;
    }
  }

  // ========== GET BROWSER NAME ==========
  function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  // ========== GET CLIENT IP (Optional) ==========
  async function getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // ========== REQUEST PERMISSION AND GET TOKEN ==========
  async function requestPermissionAndGetToken() {
    // Check if token already saved recently
    const tokenSavedFlag = localStorage.getItem('fcm_token_saved');
    const tokenSavedTime = localStorage.getItem('fcm_token_time');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    if (tokenSavedFlag === 'true' && tokenSavedTime && parseInt(tokenSavedTime) > oneDayAgo) {
      console.log('✅ Token already saved recently, skipping...');
      return;
    }
    
    if (!messaging) {
      console.warn('⚠️ Firebase Messaging not initialized');
      return;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Get token
        const token = await messaging.getToken({ vapidKey: VAPID_KEY });
        
        if (token) {
          console.log('📨 FCM Token generated:', token.substring(0, 20) + '...');
          
          // Get user ID
          const userId = getUserId();
          
          // Save to Firestore
          await saveTokenToFirestore(token, userId);
          
          // Store token save time
          localStorage.setItem('fcm_token_time', Date.now().toString());
          
          // Show success message (optional)
          showToast('✅ Notifications enabled! You will receive order updates.', 'success');
        } else {
          console.log('⚠️ No FCM token received');
        }
      } else if (permission === 'denied') {
        console.log('❌ Notification permission denied');
        localStorage.setItem('notifications_blocked', 'true');
      } else {
        console.log('⚠️ Notification permission not granted yet');
        // Show a gentle prompt
        showNotificationPrompt();
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
    }
  }

  // ========== SHOW GENTLE NOTIFICATION PROMPT ==========
  function showNotificationPrompt() {
    // Check if already shown or blocked
    if (localStorage.getItem('notification_prompt_shown') === 'true') return;
    if (localStorage.getItem('notifications_blocked') === 'true') return;
    
    // Create prompt element
    const promptDiv = document.createElement('div');
    promptDiv.id = 'notificationPrompt';
    promptDiv.innerHTML = `
      <div style="position:fixed; bottom:80px; left:16px; right:16px; background:white; border-radius:20px; padding:16px; box-shadow:0 8px 32px rgba(0,0,0,0.2); z-index:10000; border:1px solid #e5e7eb; animation:slideUp 0.3s ease;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <span style="font-size:28px;">🔔</span>
          <div style="flex:1;">
            <strong style="font-size:14px;">Get Order Updates</strong>
            <p style="font-size:12px; color:#6b7280; margin:0;">Enable notifications to receive order updates and offers</p>
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button id="enableNotifBtn" style="flex:1; padding:10px; background:#2ecc71; color:white; border:none; border-radius:30px; font-weight:600; cursor:pointer;">Enable</button>
          <button id="laterNotifBtn" style="flex:1; padding:10px; background:#f1f5f9; border:none; border-radius:30px; font-weight:600; cursor:pointer;">Later</button>
        </div>
      </div>
      <style>
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(promptDiv);
    localStorage.setItem('notification_prompt_shown', 'true');
    
    document.getElementById('enableNotifBtn')?.addEventListener('click', () => {
      promptDiv.remove();
      requestPermissionAndGetToken();
    });
    
    document.getElementById('laterNotifBtn')?.addEventListener('click', () => {
      promptDiv.remove();
    });
  }

  // ========== TOAST MESSAGE ==========
  function showToast(message, type) {
    let toast = document.getElementById('fcm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fcm-toast';
      toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1a1e2b;color:white;padding:10px 20px;border-radius:40px;font-size:13px;z-index:10001;opacity:0;transition:0.3s;pointer-events:none;white-space:nowrap;';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#10b981' : '#1a1e2b';
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
  }

  // ========== CHECK AND REFRESH TOKEN ON PAGE LOAD ==========
  async function checkAndRefreshToken() {
    if (!messaging) return;
    
    try {
      const currentToken = await messaging.getToken({ vapidKey: VAPID_KEY });
      const savedToken = localStorage.getItem('fcm_token');
      
      if (currentToken && currentToken !== savedToken) {
        console.log('🔄 Token changed, updating...');
        const userId = getUserId();
        await saveTokenToFirestore(currentToken, userId);
        localStorage.setItem('fcm_token', currentToken);
        localStorage.setItem('fcm_token_time', Date.now().toString());
      }
    } catch (error) {
      console.error('Error checking token:', error);
    }
  }

  // ========== INITIALIZE MESSAGING ==========
  function initMessaging() {
    // Wait for Firebase to be ready
    const checkInterval = setInterval(() => {
      if (isFirebaseReady() && firebase.messaging) {
        clearInterval(checkInterval);
        
        try {
          if (firebase.messaging.isSupported()) {
            messaging = firebase.messaging();
            console.log('✅ Firebase Messaging initialized');
            
            // Check if already granted
            if (Notification.permission === 'granted') {
              requestPermissionAndGetToken();
            } else if (Notification.permission !== 'denied') {
              // Auto request after 3 seconds
              setTimeout(() => {
                requestPermissionAndGetToken();
              }, 3000);
            }
            
            // Handle token refresh
            messaging.onTokenRefresh(async () => {
              console.log('🔄 Token refreshed');
              const newToken = await messaging.getToken({ vapidKey: VAPID_KEY });
              if (newToken) {
                const userId = getUserId();
                await saveTokenToFirestore(newToken, userId);
                localStorage.setItem('fcm_token', newToken);
              }
            });
            
            // Handle foreground messages
            messaging.onMessage((payload) => {
              console.log('📨 Foreground message:', payload);
              const title = payload.notification?.title || 'OK Mart';
              const body = payload.notification?.body || 'New update';
              showToast(`${title}: ${body}`, 'info');
            });
            
          } else {
            console.log('⚠️ Firebase Messaging not supported in this browser');
          }
        } catch (error) {
          console.error('Error initializing messaging:', error);
        }
      }
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!messaging) {
        console.warn('⚠️ Firebase not loaded within timeout');
      }
    }, 10000);
  }

  // ========== EXPOSE FUNCTIONS GLOBALLY ==========
  window.FCMToken = {
    requestPermission: requestPermissionAndGetToken,
    getToken: () => localStorage.getItem('fcm_token'),
    refreshToken: checkAndRefreshToken,
    isEnabled: () => Notification.permission === 'granted'
  };

  // ========== START ==========
  function start() {
    console.log('🚀 FCM Token Auto-Save System Started');
    initMessaging();
    
    // Check token on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkAndRefreshToken();
      }
    });
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  
})();
