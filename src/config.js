const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  EMITTER_INTERVAL_MS: Number(process.env.EMITTER_INTERVAL_MS || 10_000),
  EMITTER_MESSAGE_MIN: Number(process.env.EMITTER_MESSAGE_MIN || 49),
  EMITTER_MESSAGE_MAX: Number(process.env.EMITTER_MESSAGE_MAX || 499),
  SOCKET_HOST: process.env.SOCKET_HOST || '127.0.0.1',
  SOCKET_PORT: Number(process.env.SOCKET_PORT || 5000),
  WS_PORT: Number(process.env.WS_PORT || 4000),
  FRONTEND_PORT: Number(process.env.FRONTEND_PORT || 3000),
  AES_PASSPHRASE: process.env.AES_PASSPHRASE || 'change-me-to-a-secret-key-32b',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/encrypted_timeseries',
  MONGODB_DB: process.env.MONGODB_DB || 'encrypted_timeseries',
  TIMESERIES_COLLECTION: process.env.TIMESERIES_COLLECTION || 'timeseries',
};
