// ===== OK MART - FCM TOKEN AUTO-SAVE SYSTEM =====
// Yeh file automatically token capture karegi aur Firebase mein save karegi

(function() {
  'use strict';

  const VAPID_KEY = 'BB4zUY58GxVmnRD-M_CW0NVp2YWbIzeV8-DYEkP8J5MX8f9lLR2BbSnvwo4HpiRN1X9u5Pbs8kv8va8TFw7qZdE';

  let messaging = null;
  let tokenSaved = false;

  function isFirebaseReady() {
    return (
      typeof firebase !== 'undefined' &&
      typeof firebase.messaging === 'function'
    );
  }

  function getUserId() {
    let userId = localStorage.getItem('okmart_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('okmart_user_id', userId);
      console.log('New user ID created:', userId);
    }
    return userId;
  }

  async function saveTokenToFirestore(token, userId) {
    try {
      if (!window.db) {
        console.warn('Firestore not available yet, retrying...');
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
        browser: getBrowserName()
      };

      await db.collection('fcmTokens').doc(userId).set(tokenData, { merge: true });
      console.log('FCM Token saved to Firestore for user:', userId);
      tokenSaved = true;
      
      localStorage.setItem('fcm_token_saved', 'true');
      localStorage.setItem('fcm_token', token);
      
      return true;
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
      return false;
    }
  }

  function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  async function requestPermissionAndGetToken() {
    const tokenSavedFlag = localStorage.getItem('fcm_token_saved');
    const tokenSavedTime = localStorage.getItem('fcm_token_time');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    if (tokenSavedFlag === 'true' && tokenSavedTime && parseInt(tokenSavedTime) > oneDayAgo) {
      console.log('Token already saved recently, skipping...');
      return;
    }
    
    if (!messaging) {
      console.warn('Firebase Messaging not initialized');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        const token = await messaging.getToken({ vapidKey: VAPID_KEY });
        
        if (token) {
          console.log('FCM Token generated:', token.substring(0, 20) + '...');
          const userId = getUserId();
          await saveTokenToFirestore(token, userId);
          localStorage.setItem('fcm_token_time', Date.now().toString());
          showToast('Notifications enabled! You will receive order updates.', 'success');
        } else {
          console.log('No FCM token received');
        }
      } else if (permission === 'denied') {
        console.log('Notification permission denied');
        localStorage.setItem('notifications_blocked', 'true');
      } else {
        console.log('Notification permission not granted yet');
        showNotificationPrompt();
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  function showNotificationPrompt() {
    if (localStorage.getItem('notification_prompt_shown') === 'true') return;
    if (localStorage.getItem('notifications_blocked') === 'true') return;
    
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
          <button id="enableNotifBtn" style="flex:1; padding:10px; background:#84c225; color:white; border:none; border-radius:30px; font-weight:600; cursor:pointer;">Enable</button>
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
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3000);
  }

  function initMessaging() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    if (!('PushManager' in window)) {
      console.log('Push Manager not supported');
      return;
    }

    const checkInterval = setInterval(() => {
      if (isFirebaseReady() && firebase.messaging) {
        clearInterval(checkInterval);
        
        try {
          if (firebase.messaging && typeof firebase.messaging === 'function') {
            messaging = firebase.messaging();
            console.log('Firebase Messaging initialized');
            
            if (Notification.permission === 'granted') {
              requestPermissionAndGetToken();
            } else if (Notification.permission !== 'denied') {
              showNotificationPrompt();
            }
            
            if (messaging && typeof messaging.onTokenRefresh === 'function') {
              messaging.onTokenRefresh(async () => {
                console.log('Token refreshed');
                const newToken = await messaging.getToken({ vapidKey: VAPID_KEY });
                if (newToken) {
                  const userId = getUserId();
                  await saveTokenToFirestore(newToken, userId);
                  localStorage.setItem('fcm_token', newToken);
                }
              });
            }
            
            messaging.onMessage((payload) => {
              console.log('Foreground message:', payload);
              const title = payload.notification?.title || 'OK Mart';
              const body = payload.notification?.body || 'New update';
              showToast(title + ': ' + body, 'info');
            });
            
          } else {
            console.log('Firebase Messaging not available');
            return;
          }
        } catch (error) {
          console.error('Error initializing messaging:', error);
        }
      }
    }, 500);
    
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!messaging) {
        console.log('FCM initialization skipped (unsupported browser or messaging unavailable)');
      }
    }, 10000);
  }

  window.FCMToken = {
    requestPermission: requestPermissionAndGetToken,
    getToken: () => localStorage.getItem('fcm_token'),
    isEnabled: () => Notification.permission === 'granted'
  };

  function start() {
    console.log('FCM Token Auto-Save System Started');
    initMessaging();
    
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('Page visible, checking token...');
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  
})();

