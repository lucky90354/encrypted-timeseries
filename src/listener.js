const net = require('net');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { decryptPayload, createSecretKey } = require('./shared/crypto');
const { saveEntry, connect: connectDb, close: closeDb } = require('./db');
const {
  SOCKET_PORT,
  WS_PORT,
  AES_PASSPHRASE,
} = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let totalReceived = 0;
let totalValid = 0;

function validateMessage(obj) {
  if (!obj || !obj.name || !obj.origin || !obj.destination || !obj.secret_key) {
    return false;
  }
  const computed = createSecretKey(obj);
  return computed === obj.secret_key;
}

function processPayload(payload) {
  if (!payload.timestamp) {
    payload.timestamp = new Date().toISOString();
  }
  const entry = {
    timestamp: new Date(payload.timestamp),
    name: payload.name,
    origin: payload.origin,
    destination: payload.destination,
  };
  return saveEntry(entry);
}

async function handleStreamLine(line) {
  const parts = line.split('|').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return;

  const results = [];

  for (const part of parts) {
    totalReceived += 1;
    try {
      const payload = decryptPayload(part, AES_PASSPHRASE);
      if (!validateMessage(payload)) {
        continue;
      }
      totalValid += 1;
      await processPayload(payload);
      results.push(payload);
    } catch (err) {
      console.error('Failed to process message:', err.message);
    }
  }

  if (results.length) {
    io.emit('data', { items: results, stats: getStats() });
  }
}

function getStats() {
  const successRate = totalReceived ? (totalValid / totalReceived) * 100 : 0;
  return {
    received: totalReceived,
    valid: totalValid,
    successRate: Number(successRate.toFixed(2)),
  };
}

function startNetListener() {
  const server = net.createServer((socket) => {
    let buffer = '';

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop();
      lines.forEach((line) => {
        if (!line.trim()) return;
        handleStreamLine(line);
      });
    });

    socket.on('error', (err) => {
      console.error('Emitter socket error:', err.message);
    });
  });

  server.listen(SOCKET_PORT, () => {
    console.log('Listener service listening for emitter on port', SOCKET_PORT);
  });
}

app.get('/stats', (req, res) => {
  res.json(getStats());
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  socket.emit('stats', getStats());
});

async function start() {
  // Keep retrying mongo connect until it succeeds.
  // This prevents the service from exiting when Mongo is not yet available.
  while (true) {
    try {
      await connectDb();
      break;
    } catch (err) {
      console.warn('Listener could not connect to MongoDB, retrying in 3s...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  startNetListener();
  server.listen(WS_PORT, () => {
    console.log('WebSocket server listening on', WS_PORT);
  });
}

process.on('SIGINT', async () => {
  await closeDb();
  process.exit(0);
});

start().catch((err) => {
  console.error('Failed to start listener:', err);
  process.exit(1);
});
