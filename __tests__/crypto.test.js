const { createSecretKey, encryptPayload, decryptPayload } = require('../src/shared/crypto');

describe('crypto helpers', () => {
  it('creates deterministic secret key from payload', () => {
    const payload = {
      name: 'Test User',
      origin: 'City A',
      destination: 'City B',
    };

    const first = createSecretKey(payload);
    const second = createSecretKey({
      destination: 'City B',
      origin: 'City A',
      name: 'Test User',
    });

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it('can encrypt and decrypt a payload', () => {
    const payload = {
      name: 'Test User',
      origin: 'City A',
      destination: 'City B',
      secret_key: 'dummy',
    };
    const passphrase = 'unit-test-passphrase';
    const encrypted = encryptPayload(payload, passphrase);
    const decrypted = decryptPayload(encrypted, passphrase);

    expect(decrypted).toEqual(payload);
  });
});
