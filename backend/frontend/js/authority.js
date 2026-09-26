/**
 * Flood Emergency SOS System - Authority Dashboard Script
 * Handles Real-Time Socket.IO Updates, Leaflet Map Visualization & Nearby Shelters
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sosFeed = document.getElementById('sosFeed');
  const emptyFeedNotice = document.getElementById('emptyFeedNotice');
  const activeAlertsCount = document.getElementById('activeAlertsCount');
  const socketConnectionBadge = document.getElementById('socketConnectionBadge');
  const socketConnText = document.getElementById('socketConnText');
  const selectedSosLabel = document.getElementById('selectedSosLabel');
  const shelterList = document.getElementById('shelterList');
  const shelterSub = document.getElementById('shelterSub');

  // Application State
  let alertsList = [];
  let selectedAlertId = null;
  let leafletMap = null;
  let sosMarkersMap = new Map(); // alertId -> Leaflet Marker
  let shelterMarkersArray = [];  // Array of active shelter Leaflet Markers

  // Initialize Map & Socket
  initLeafletMap();
  initSocketIO();

  /**
   * 1. Initialize Leaflet Map
   */
  function initLeafletMap() {
    // Default fallback view centered on India/World
    leafletMap = L.map('map').setView([28.6139, 77.2090], 10);

    // OpenStreetMap Tile Layer (Free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);
  }

  /**
   * Custom Leaflet Icon Creators
   */
  function createSosIcon(isResolved = false) {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="
        background-color: ${isResolved ? '#10b981' : '#ff3333'};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 10px ${isResolved ? 'rgba(16,185,129,0.8)' : 'rgba(255,51,51,0.9)'};
      "></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  function createShelterIcon() {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="
        background-color: #3b82f6;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        border: 2px solid #ffffff;
        box-shadow: 0 0 8px rgba(59,130,246,0.8);
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  /**
   * 2. Initialize Socket.IO Client
   */
  function initSocketIO() {
    const socket = io();

    socket.on('connect', () => {
      console.log(`[SOCKET CONNECTED] Connected with ID: ${socket.id}`);
      socketConnectionBadge.className = 'status-pill online';
      socketConnText.textContent = 'LIVE FEED ACTIVE';
    });

    socket.on('disconnect', () => {
      console.warn('[SOCKET DISCONNECTED] Connection lost');
      socketConnectionBadge.className = 'status-pill offline';
      socketConnText.textContent = 'DISCONNECTED';
    });

    // Received full list on initial connection
    socket.on('initial_alerts', (alerts) => {
      alertsList = alerts;
      renderFeed();
      if (alertsList.length > 0) {
        selectAlert(alertsList[0].id);
      }
    });

    // Received single new real-time SOS alert
    socket.on('new_sos_alert', (newAlert) => {
      console.log('[REAL-TIME SOS RECEIVED]', newAlert);
      
      // Add or update in list
      const existingIdx = alertsList.findIndex(a => a.id === newAlert.id);
      if (existingIdx !== -1) {
        alertsList[existingIdx] = newAlert;
      } else {
        alertsList.unshift(newAlert);
      }

      renderFeed();
      selectAlert(newAlert.id);
      playAlertAudioNotice();
    });

    // SOS Status change event
    socket.on('sos_status_updated', (updatedAlert) => {
      const idx = alertsList.findIndex(a => a.id === updatedAlert.id);
      if (idx !== -1) {
        alertsList[idx] = updatedAlert;
        renderFeed();
        if (selectedAlertId === updatedAlert.id) {
          selectAlert(updatedAlert.id);
        }
      }
    });
  }

  /**
   * Render Incoming SOS Feed
   */
  function renderFeed() {
    const activeCount = alertsList.filter(a => a.status === 'ACTIVE').length;
    activeAlertsCount.textContent = activeCount;

    if (alertsList.length === 0) {
      emptyFeedNotice.style.display = 'block';
      sosFeed.innerHTML = '';
      sosFeed.appendChild(emptyFeedNotice);
      return;
    }

    emptyFeedNotice.style.display = 'none';
    sosFeed.innerHTML = '';

    // Render cards and update map markers
    alertsList.forEach(alert => {
      const isSelected = alert.id === selectedAlertId;
      const isResolved = alert.status === 'RESOLVED';

      const card = document.createElement('div');
      card.className = `feed-card ${isSelected ? 'selected' : ''} ${isResolved ? 'resolved' : ''}`;
      card.dataset.id = alert.id;

      const formattedTime = new Date(alert.receivedAt || alert.clientTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      card.innerHTML = `
        <div class="feed-card-header">
          <span class="${isResolved ? 'badge-resolved' : 'badge-sos'}">
            ${isResolved ? 'RESOLVED' : '🚨 SOS ALERT'}
          </span>
          <span class="feed-time">${formattedTime}</span>
        </div>
        <div class="feed-coords">
          📍 ${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}
        </div>
        <div class="feed-info">
          ${escapeHtml(alert.info || 'Flood Emergency')}
        </div>
        <div class="feed-actions">
          <button class="btn-map-view">Center on Map</button>
          ${!isResolved ? `<button class="btn-resolve" data-id="${alert.id}">Mark Resolved</button>` : ''}
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-resolve')) {
          e.stopPropagation();
          markAlertResolved(alert.id);
        } else {
          selectAlert(alert.id);
        }
      });

      sosFeed.appendChild(card);

      // Update Map Marker for this SOS
      updateSosMarkerOnMap(alert);
    });
  }

  /**
   * Update or place SOS marker on Leaflet Map
   */
  function updateSosMarkerOnMap(alert) {
    const isResolved = alert.status === 'RESOLVED';
    const latLng = [alert.latitude, alert.longitude];

    if (sosMarkersMap.has(alert.id)) {
      const marker = sosMarkersMap.get(alert.id);
      marker.setLatLng(latLng);
      marker.setIcon(createSosIcon(isResolved));
    } else {
      const marker = L.marker(latLng, { icon: createSosIcon(isResolved) }).addTo(leafletMap);
      marker.bindPopup(`
        <div style="color: #111;">
          <strong style="color: #d32f2f;">🚨 FLOOD EMERGENCY SOS</strong><br>
          <strong>ID:</strong> ${alert.id}<br>
          <strong>Coords:</strong> ${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}<br>
          <strong>Time:</strong> ${new Date(alert.clientTimestamp).toLocaleTimeString()}<br>
          <strong>Details:</strong> ${escapeHtml(alert.info || 'N/A')}
        </div>
      `);
      marker.on('click', () => selectAlert(alert.id));
      sosMarkersMap.set(alert.id, marker);
    }
  }

  /**
   * Select SOS alert, highlight UI card, center map, & fetch nearby shelters
   */
  async function selectAlert(alertId) {
    selectedAlertId = alertId;
    const alert = alertsList.find(a => a.id === alertId);

    if (!alert) return;

    // Highlight card in feed
    document.querySelectorAll('.feed-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.id === alertId);
    });

    selectedSosLabel.textContent = `Alert ${alert.id} [${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}]`;

    // Center Map on selected alert
    leafletMap.flyTo([alert.latitude, alert.longitude], 13, { duration: 1 });

    // Open popup for marker
    if (sosMarkersMap.has(alertId)) {
      sosMarkersMap.get(alertId).openPopup();
    }

    // Fetch and display nearby shelters for these coordinates
    await fetchAndRenderNearbyShelters(alert.latitude, alert.longitude);
  }

  /**
   * Fetch nearby shelters from backend REST API
   */
  async function fetchAndRenderNearbyShelters(lat, lng) {
    shelterList.innerHTML = '<p class="placeholder-text">Calculating nearest rescue shelters...</p>';
    clearShelterMarkers();

    try {
      const response = await fetch(`/api/shelters?lat=${lat}&lng=${lng}`);
      const data = await response.json();

      if (data.success && data.shelters && data.shelters.length > 0) {
        shelterSub.textContent = `Showing shelters nearest to [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
        shelterList.innerHTML = '';

        data.shelters.forEach(shelter => {
          const shelterCard = document.createElement('div');
          shelterCard.className = 'shelter-card-item';

          const suppliesTags = shelter.supplies
            ? shelter.supplies.map(s => `<span class="supply-tag">${escapeHtml(s)}</span>`).join('')
            : '';

          const distanceLabel = shelter.distanceKm !== null
            ? `${shelter.distanceKm} km away`
            : 'Distance unknown';

          shelterCard.innerHTML = `
            <div class="shelter-name">${escapeHtml(shelter.name)}</div>
            <div class="shelter-dist">📍 ${distanceLabel}</div>
            <div class="shelter-address">${escapeHtml(shelter.address)}</div>
            <div class="shelter-capacity">
              <span>Capacity:</span>
              <span class="capacity-val">${shelter.available} / ${shelter.capacity} Available</span>
            </div>
            <div class="shelter-address">📞 Contact: ${escapeHtml(shelter.contact)}</div>
            <div class="shelter-supplies">${suppliesTags}</div>
          `;

          shelterList.appendChild(shelterCard);

          // Place shelter marker on map
          const shelterMarker = L.marker([shelter.latitude, shelter.longitude], {
            icon: createShelterIcon()
          }).addTo(leafletMap);

          shelterMarker.bindPopup(`
            <div style="color: #111;">
              <strong style="color: #3b82f6;">⛺ RELIEF SHELTER</strong><br>
              <strong>${escapeHtml(shelter.name)}</strong><br>
              ${distanceLabel}<br>
              <strong>Available:</strong> ${shelter.available}/${shelter.capacity}<br>
              <strong>Contact:</strong> ${escapeHtml(shelter.contact)}
            </div>
          `);

          shelterMarkersArray.push(shelterMarker);
        });
      } else {
        shelterList.innerHTML = '<p class="placeholder-text">No shelters found in dataset.</p>';
      }
    } catch (err) {
      console.error('[ERROR] Failed to fetch shelters:', err);
      shelterList.innerHTML = '<p class="placeholder-text">Error fetching shelter data.</p>';
    }
  }

  function clearShelterMarkers() {
    shelterMarkersArray.forEach(m => leafletMap.removeLayer(m));
    shelterMarkersArray = [];
  }

  /**
   * Mark SOS alert as resolved via PATCH /api/sos/:id/resolve
   */
  async function markAlertResolved(id) {
    try {
      const res = await fetch(`/api/sos/${id}/resolve`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        console.log(`[RESOLVED] SOS Alert ${id} marked resolved`);
      }
    } catch (err) {
      console.error('[ERROR] Failed to resolve alert:', err);
    }
  }

  function playAlertAudioNotice() {
    try {
      // Simple web audio API synth beep for incoming alert
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
