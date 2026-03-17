const crypto = require('crypto');

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function deriveKey(passphrase) {
  return crypto.createHash('sha256').update(passphrase, 'utf8').digest();
}

function createSecretKey(payload) {
  const normalized = {
    name: payload.name,
    origin: payload.origin,
    destination: payload.destination,
  };
  return sha256Hex(JSON.stringify(normalized));
}

function encryptPayload(payload, passphrase) {
  const key = deriveKey(passphrase);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  return iv.toString('hex') + encrypted.toString('hex');
}

function decryptPayload(encryptedHex, passphrase) {
  const key = deriveKey(passphrase);
  const ivHex = encryptedHex.slice(0, 32);
  const ciphertextHex = encryptedHex.slice(32);
  if (!ivHex || !ciphertextHex) {
    throw new Error('invalid encrypted payload');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

module.exports = {
  createSecretKey,
  encryptPayload,
  decryptPayload,
};
