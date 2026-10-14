// Chiffrement applicatif AES-256-GCM. Une clé maîtresse (TRIVALINK_STORAGE_KEY), des clés
// dérivées par usage et par organisation (HKDF). Cible : clés de données gérées par un KMS.
import crypto from 'node:crypto';

export function deriveKey(master, info) {
  return Buffer.from(crypto.hkdfSync('sha256', Buffer.from(master, 'utf8'), Buffer.alloc(0), info, 32));
}

// Format binaire : [IV 12 octets][tag GCM 16 octets][contenu chiffré] (docs-dev/07 §4).
export function encryptBuffer(key, plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]);
}

export function decryptBuffer(key, raw) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
}

// Variante texte pour les secrets stockés en base (secret MFA) : "v1:<base64>".
export const encryptText = (key, text) => `v1:${encryptBuffer(key, Buffer.from(text, 'utf8')).toString('base64')}`;
export function decryptText(key, value) {
  if (!value?.startsWith('v1:')) throw new Error('Format de secret chiffré inconnu');
  return decryptBuffer(key, Buffer.from(value.slice(3), 'base64')).toString('utf8');
}

export const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
