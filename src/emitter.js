const net = require('net');
const fs = require('fs');
const path = require('path');
const {
  EMITTER_INTERVAL_MS,
  EMITTER_MESSAGE_MIN,
  EMITTER_MESSAGE_MAX,
  SOCKET_HOST,
  SOCKET_PORT,
  AES_PASSPHRASE,
} = require('./config');
const { createSecretKey, encryptPayload } = require('./shared/crypto');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data.json'), 'utf8'));

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomCount() {
  return (
    Math.floor(Math.random() * (EMITTER_MESSAGE_MAX - EMITTER_MESSAGE_MIN + 1)) + EMITTER_MESSAGE_MIN
  );
}

function buildStream() {
  const messages = [];
  const count = randomCount();

  for (let i = 0; i < count; i += 1) {
    const payload = {
      name: pickOne(data.names),
      origin: pickOne(data.origins),
      destination: pickOne(data.destinations),
    };
    payload.secret_key = createSecretKey(payload);
    const encrypted = encryptPayload(payload, AES_PASSPHRASE);
    messages.push(encrypted);
  }

  return messages.join('|');
}

let socket;
let reconnectTimer;

function connect() {
  if (socket && !socket.destroyed) return;

  socket = new net.Socket();

  socket.on('connect', () => {
    console.log('Emitter connected to listener', SOCKET_HOST, SOCKET_PORT);
    sendBatch();
    setInterval(sendBatch, EMITTER_INTERVAL_MS);
  });

  socket.on('error', (err) => {
    console.error('Emitter socket error:', err.message);
  });

  socket.on('close', (hadError) => {
    console.warn('Emitter socket closed', hadError ? 'due to error' : '');
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 5000);
    }
  });

  socket.connect(SOCKET_PORT, SOCKET_HOST);
}

function sendBatch() {
  if (!socket || socket.destroyed) return;
  const stream = buildStream();
  socket.write(stream + '\n');
  console.log('Emitter sent batch of', stream.split('|').length, 'messages');
}

connect();
