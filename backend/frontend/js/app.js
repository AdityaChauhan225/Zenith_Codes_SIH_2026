/**
 * Flood Emergency SOS System - User App Script
 * Handles Browser Geolocation API, Network Status, SOS Transmission & Offline Sync
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sosBtn = document.getElementById('sosBtn');
  const emergencyNotesSelect = document.getElementById('emergencyNotes');

  // Status Monitor Elements
  const networkBadge = document.getElementById('networkBadge');
  const networkText = document.getElementById('networkText');
  const statusNetwork = document.getElementById('statusNetwork');
  const statusLocation = document.getElementById('statusLocation');
  const statusSOS = document.getElementById('statusSOS');
  const statusQueue = document.getElementById('statusQueue');

  // Result Card Elements
  const alertResultCard = document.getElementById('alertResultCard');
  const resultBanner = document.getElementById('resultBanner');
  const resultIcon = document.getElementById('resultIcon');
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');

  const resAlertId = document.getElementById('resAlertId');
  const resLat = document.getElementById('resLat');
  const resLng = document.getElementById('resLng');
  const resAcc = document.getElementById('resAcc');
  const resTime = document.getElementById('resTime');
  const resInfo = document.getElementById('resInfo');

  const errorMessage = document.getElementById('errorMessage');

  // State Variables
  let isSending = false;

  // 1. Initial Checks
  checkGeolocationSupport();
  updateNetworkStatus();
  updateQueueCount();

  // Flush queue if any stored offline alerts exist from previous session
  if (navigator.onLine) {
    flushOfflineQueue();
  }

  // 2. Network Listeners
  window.addEventListener('online', () => {
    updateNetworkStatus();
    showNotice('Network connection restored. Attempting offline SOS sync...', 'warning');
    flushOfflineQueue();
  });

  window.addEventListener('offline', () => {
    updateNetworkStatus();
    showNotice('Network connection lost. Offline mode active.', 'warning');
  });

  // Periodic offline queue check every 10s
  setInterval(() => {
    if (navigator.onLine) {
      flushOfflineQueue();
    }
  }, 10000);

  // 3. SOS Button Click Handler
  sosBtn.addEventListener('click', () => {
    if (isSending) return;
    triggerEmergencySOS();
  });

  /**
   * Main SOS Execution Flow
   */
  function triggerEmergencySOS() {
    isSending = true;
    hideNotice();
    hideResultCard();

    setSOSButtonState('sending', 'LOCATING...', 'ACQUIRING GPS');
    statusSOS.textContent = 'Getting Location...';
    statusSOS.className = 'status-val pending';

    if (!('geolocation' in navigator)) {
      handleError('Browser Geolocation is not supported on this device.');
      resetSOSButton();
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success callback: location acquired
        statusLocation.textContent = 'Location Acquired';
        statusLocation.className = 'status-val success';

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        const timestamp = new Date().toISOString();
        const selectedNote = emergencyNotesSelect.value || 'Flood Rescue Needed';

        const sosPayload = {
          id: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          status: 'ACTIVE',
          latitude: lat,
          longitude: lng,
          accuracy: acc ? `${Math.round(acc)} meters` : 'Unknown',
          timestamp: timestamp,
          info: selectedNote
        };

        sendOrQueueSOS(sosPayload);
      },
      (error) => {
        // Error callback: permission denied or location failure
        let msg = 'Failed to acquire location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please enable GPS/Location permissions in your browser.';
            statusLocation.textContent = 'Permission Denied';
            statusLocation.className = 'status-val error';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is unavailable. Please check your GPS hardware.';
            statusLocation.textContent = 'Unavailable';
            statusLocation.className = 'status-val error';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try pressing SOS again.';
            statusLocation.textContent = 'Timeout';
            statusLocation.className = 'status-val warning';
            break;
          default:
            msg = `Geolocation error: ${error.message}`;
            statusLocation.textContent = 'Error';
            statusLocation.className = 'status-val error';
            break;
        }
        handleError(msg);
        resetSOSButton();
      },
      geoOptions
    );
  }

  /**
   * Send SOS to backend if online, else save locally
   */
  async function sendOrQueueSOS(payload) {
    setSOSButtonState('sending', 'SENDING...', 'TRANSMITTING SOS');
    statusSOS.textContent = 'Sending to Backend...';

    if (!navigator.onLine) {
      // Offline -> Save directly to LocalStorage queue
      queueSOSLocally(payload);
      showResultCard(payload, false, 'Network unavailable. Saved to local device queue.');
      resetSOSButton('sent', 'QUEUED', 'OFFLINE SAVED');
      return;
    }

    try {
      const response = await fetch('/api/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Server accepted SOS
        statusSOS.textContent = 'SOS Sent';
        statusSOS.className = 'status-val success';
        showResultCard(payload, true, 'Emergency alert received by rescue authorities.');
        resetSOSButton('sent', 'SOS SENT', 'CONFIRMED');
      } else {
        throw new Error(data.error || 'Server error processing SOS');
      }
    } catch (err) {
      console.warn('[OFFLINE FALLBACK] Failed to reach backend server:', err.message);
      queueSOSLocally(payload);
      showResultCard(payload, false, `Backend unreachable. Alert stored locally for auto-sync.`);
      resetSOSButton('sent', 'QUEUED', 'OFFLINE SAVED');
    }
  }

  /**
   * Save SOS alert to LocalStorage
   */
  function queueSOSLocally(payload) {
    let queue = getLocalQueue();
    // Check if already in queue
    if (!queue.some(item => item.id === payload.id)) {
      queue.push(payload);
      localStorage.setItem('sos_pending_alerts', JSON.stringify(queue));
    }
    updateQueueCount();
    statusSOS.textContent = 'Queued Offline';
    statusSOS.className = 'status-val warning';
  }

  /**
   * Flush LocalStorage Offline Queue when back online
   */
  async function flushOfflineQueue() {
    if (!navigator.onLine) return;
    let queue = getLocalQueue();
    if (queue.length === 0) return;

    console.log(`[SYNC] Attempting to flush ${queue.length} offline SOS alert(s)...`);

    const remainingQueue = [];

    for (const alertPayload of queue) {
      try {
        const response = await fetch('/api/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertPayload)
        });

        const data = await response.json();
        if (response.ok && data.success) {
          console.log(`[SYNC SUCCESS] Offline SOS synced: ${alertPayload.id}`);
          showNotice(`Synced pending offline SOS alert (${alertPayload.id}) to authority dashboard!`, 'success');
        } else {
          remainingQueue.push(alertPayload);
        }
      } catch (err) {
        console.warn(`[SYNC FAIL] Could not sync offline SOS (${alertPayload.id}):`, err.message);
        remainingQueue.push(alertPayload);
      }
    }

    localStorage.setItem('sos_pending_alerts', JSON.stringify(remainingQueue));
    updateQueueCount();
  }

  /**
   * Helpers
   */
  function getLocalQueue() {
    try {
      const raw = localStorage.getItem('sos_pending_alerts');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function updateQueueCount() {
    const queue = getLocalQueue();
    statusQueue.textContent = `${queue.length} Pending`;
    statusQueue.className = queue.length > 0 ? 'status-val warning' : 'status-val neutral';
  }

  function checkGeolocationSupport() {
    if ('geolocation' in navigator) {
      statusLocation.textContent = 'Ready (Permission Required)';
      statusLocation.className = 'status-val neutral';
    } else {
      statusLocation.textContent = 'Not Supported';
      statusLocation.className = 'status-val error';
    }
  }

  function updateNetworkStatus() {
    const isOnline = navigator.onLine;
    if (isOnline) {
      networkBadge.className = 'status-pill online';
      networkText.textContent = 'ONLINE';
      statusNetwork.textContent = 'Online';
      statusNetwork.className = 'status-val success';
    } else {
      networkBadge.className = 'status-pill offline';
      networkText.textContent = 'OFFLINE';
      statusNetwork.textContent = 'Offline';
      statusNetwork.className = 'status-val error';
    }
  }

  function setSOSButtonState(stateClass, mainText, subText) {
    sosBtn.className = `sos-button ${stateClass}`;
    sosBtn.querySelector('.sos-btn-text').textContent = mainText;
    sosBtn.querySelector('.sos-btn-sub').textContent = subText;
  }

  function resetSOSButton(finalState = '', mainText = 'SOS', subText = 'PRESS FOR HELP') {
    isSending = false;
    setTimeout(() => {
      sosBtn.className = `sos-button ${finalState}`;
      sosBtn.querySelector('.sos-btn-text').textContent = mainText;
      sosBtn.querySelector('.sos-btn-sub').textContent = subText;
    }, 400);
  }

  function showResultCard(payload, isOnlineSuccess, subtitleText) {
    alertResultCard.classList.remove('hidden');

    if (isOnlineSuccess) {
      resultBanner.className = 'result-banner success-bg';
      resultIcon.textContent = '✓';
      resultTitle.textContent = 'SOS SENT SUCCESSFULLY';
    } else {
      resultBanner.className = 'result-banner offline-bg';
      resultIcon.textContent = '💾';
      resultTitle.textContent = 'SOS STORED LOCALLY (OFFLINE)';
    }

    resultSubtitle.textContent = subtitleText;
    resAlertId.textContent = payload.id;
    resLat.textContent = payload.latitude.toFixed(6);
    resLng.textContent = payload.longitude.toFixed(6);
    resAcc.textContent = payload.accuracy;
    resTime.textContent = new Date(payload.timestamp).toLocaleString();
    resInfo.textContent = payload.info;

    alertResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideResultCard() {
    alertResultCard.classList.add('hidden');
  }

  function showNotice(text, type = 'error') {
    errorMessage.classList.remove('hidden');
    errorMessage.textContent = text;
    if (type === 'success') {
      errorMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
      errorMessage.style.borderColor = '#10b981';
      errorMessage.style.color = '#10b981';
    } else if (type === 'warning') {
      errorMessage.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
      errorMessage.style.borderColor = '#f59e0b';
      errorMessage.style.color = '#f59e0b';
    } else {
      errorMessage.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      errorMessage.style.borderColor = '#ff3333';
      errorMessage.style.color = '#ff3333';
    }
  }

  function hideNotice() {
    errorMessage.classList.add('hidden');
  }

  function handleError(msg) {
    showNotice(msg, 'error');
    statusSOS.textContent = 'Failed';
    statusSOS.className = 'status-val error';
  }
});
