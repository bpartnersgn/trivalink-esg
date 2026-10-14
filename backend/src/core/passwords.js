// Mots de passe : scrypt, sel 16 octets, comparaison à temps constant (format du MVP conservé).
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { bad } from './errors.js';

const scrypt = promisify(crypto.scrypt);
export const PASSWORD_MIN_LENGTH = 12;

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 32);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(pw, stored) {
  const [, saltHex, keyHex] = String(stored ?? '').split('$');
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(String(pw), Buffer.from(saltHex, 'hex'), 32);
  return crypto.timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}

// Empreinte factice : la vérification prend le même temps que l'e-mail existe ou non.
export const DUMMY_HASH = `scrypt$${'00'.repeat(16)}$${'00'.repeat(32)}`;

// Politique minimale (docs-dev/07 §3). [À FAIRE] liste de mots de passe compromis.
export function checkPasswordPolicy(pw, { email } = {}) {
  const s = String(pw ?? '');
  if (s.length < PASSWORD_MIN_LENGTH) throw bad(`Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`);
  if (s.length > 256) throw bad('Le mot de passe est trop long (256 caractères maximum)');
  if (email && s.toLowerCase().includes(String(email).split('@')[0].toLowerCase())) {
    throw bad("Le mot de passe ne doit pas contenir l'identifiant de l'adresse e-mail");
  }
  return s;
}
