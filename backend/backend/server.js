const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from ../frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// In-memory array for active SOS alerts
let sosAlerts = [];

// Load emergency shelters dataset
let sheltersData = [];
const sheltersFilePath = path.join(__dirname, 'data', 'shelters.json');
try {
  const fileRaw = fs.readFileSync(sheltersFilePath, 'utf8');
  sheltersData = JSON.parse(fileRaw);
  console.log(`[INFO] Loaded ${sheltersData.length} emergency shelters from dataset.`);
} catch (err) {
  console.error('[ERROR] Failed to load shelters dataset:', err.message);
  sheltersData = [];
}

/**
 * Haversine formula to calculate distance between two lat/lng coordinates in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // round to 2 decimal places
}

// ================= API ROUTES ================= //

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'SOS Flood Emergency Backend',
    timestamp: new Date().toISOString(),
    activeAlertsCount: sosAlerts.length
  });
});

// 2. Receive SOS Alert
app.post('/api/sos', (req, res) => {
  const { id, latitude, longitude, accuracy, timestamp, info, status } = req.body;

  // Validation
  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return res.status(400).json({
      success: false,
      error: 'Invalid latitude. Must be a number between -90 and 90.'
    });
  }

  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    return res.status(400).json({
      success: false,
      error: 'Invalid longitude. Must be a number between -180 and 180.'
    });
  }

  // Prevent immediate exact duplicates within 3 seconds from same client ID
  const existingIdx = sosAlerts.findIndex(
    a => a.id === id || (a.latitude === latNum && a.longitude === lngNum && Math.abs(new Date(a.receivedAt) - new Date()) < 3000)
  );

  if (existingIdx !== -1) {
    console.log(`[INFO] Duplicate or updated SOS alert received: ID ${id}`);
    return res.json({
      success: true,
      message: 'SOS Alert already processed',
      alert: sosAlerts[existingIdx]
    });
  }

  const sosAlert = {
    id: id || `sos_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    status: status || 'ACTIVE',
    latitude: latNum,
    longitude: lngNum,
    accuracy: accuracy ? parseFloat(accuracy) : null,
    clientTimestamp: timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    info: info || 'Flood Emergency Alert'
  };

  sosAlerts.unshift(sosAlert); // Newest first

  console.log(`[ALERT] New SOS received! ID: ${sosAlert.id}, Location: [${latNum}, ${lngNum}]`);

  // Broadcast in real-time to all connected Socket.IO clients (Authority Dashboard)
  io.emit('new_sos_alert', sosAlert);

  return res.status(201).json({
    success: true,
    message: 'SOS Alert successfully recorded and broadcasted to emergency authorities.',
    alert: sosAlert
  });
});

// 3. Get All SOS Alerts
app.get('/api/sos', (req, res) => {
  res.json({
    success: true,
    count: sosAlerts.length,
    alerts: sosAlerts
  });
});

// 4. Resolve / Update SOS Alert Status
app.patch('/api/sos/:id/resolve', (req, res) => {
  const { id } = req.params;
  const alert = sosAlerts.find(a => a.id === id);

  if (!alert) {
    return res.status(404).json({ success: false, error: 'SOS Alert not found' });
  }

  alert.status = 'RESOLVED';
  alert.resolvedAt = new Date().toISOString();

  console.log(`[INFO] SOS Alert ${id} marked as RESOLVED`);

  // Notify clients
  io.emit('sos_status_updated', alert);

  res.json({
    success: true,
    message: 'SOS alert resolved successfully',
    alert
  });
});

// 5. Get Nearby Shelters for Given Coordinates
app.get('/api/shelters', (req, res) => {
  const { lat, lng } = req.query;

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    // Return default shelters without distance sorting if coordinates not supplied
    return res.json({
      success: true,
      userLocation: null,
      shelters: sheltersData.map(s => ({ ...s, distanceKm: null }))
    });
  }

  // Calculate dynamic distance for each shelter relative to the user's location
  const sheltersWithDistance = sheltersData.map(shelter => {
    const distanceKm = calculateHaversineDistance(
      latNum,
      lngNum,
      shelter.latitude,
      shelter.longitude
    );
    return {
      ...shelter,
      distanceKm
    };
  });

  // Sort by nearest distance first
  sheltersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({
    success: true,
    userLocation: { latitude: latNum, longitude: lngNum },
    shelters: sheltersWithDistance
  });
});

// ================= SOCKET.IO EVENTS ================= //

io.on('connection', (socket) => {
  console.log(`[SOCKET] Authority or User client connected: ${socket.id}`);

  // Send current active alerts immediately on connection
  socket.emit('initial_alerts', sosAlerts);

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Serve frontend SPA fallback if route not found
app.get('*', (req, res) => {
  if (req.path.endsWith('.html')) {
    const file = path.join(frontendPath, req.path);
    if (fs.existsSync(file)) {
      return res.sendFile(file);
    }
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚨 FLOOD EMERGENCY SOS SYSTEM ONLINE 🚨`);
  console.log(`User SOS Interface:      http://localhost:${PORT}/`);
  console.log(`Authority Dashboard:     http://localhost:${PORT}/authority.html`);
  console.log(`Health Check API:        http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});
