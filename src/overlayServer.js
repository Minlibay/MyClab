const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 7890;

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'overlay', 'standalone.html'));
});

app.get('/overlay', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'overlay', 'obs-overlay.html'));
});

// Track connected clients
let panelWs = null;
const overlayClients = new Set();

wss.on('connection', (ws, req) => {
  const url = req.url;

  if (url === '/panel' || url === '/') {
    // Control panel
    panelWs = ws;
    console.log('[SERVER] ✓ Control panel connected');

    // Send current overlay count
    ws.send(JSON.stringify({
      type: 'system',
      overlayCount: overlayClients.size,
    }));

    ws.on('message', (data) => {
      try {
        const message = data.toString();
        let sent = 0;
        overlayClients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(message);
            sent++;
          }
        });
        if (sent === 0) {
          console.log('[SERVER] ⚠ No overlay clients connected — message dropped');
        } else {
          console.log(`[SERVER] → Relayed to ${sent} overlay(s)`);
        }
      } catch (e) {
        console.error('[SERVER] Relay error:', e);
      }
    });

    ws.on('close', () => {
      if (panelWs === ws) panelWs = null;
      console.log('[SERVER] ✗ Control panel disconnected');
    });
  } else {
    // Overlay client (OBS Browser Source)
    overlayClients.add(ws);
    console.log(`[SERVER] ✓ Overlay connected (${overlayClients.size} total)`);

    // Notify panel about new overlay
    if (panelWs && panelWs.readyState === 1) {
      panelWs.send(JSON.stringify({
        type: 'system',
        overlayCount: overlayClients.size,
      }));
    }

    ws.on('close', () => {
      overlayClients.delete(ws);
      console.log(`[SERVER] ✗ Overlay disconnected (${overlayClients.size} total)`);

      // Notify panel
      if (panelWs && panelWs.readyState === 1) {
        panelWs.send(JSON.stringify({
          type: 'system',
          overlayCount: overlayClients.size,
        }));
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`[SERVER] StreamTitles running on http://localhost:${PORT}`);
  console.log(`[SERVER]   Control panel: http://localhost:${PORT}`);
  console.log(`[SERVER]   OBS overlay:   http://localhost:${PORT}/overlay`);
});

module.exports = { broadcast: () => {} };
