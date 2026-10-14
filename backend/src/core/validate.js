// Lecture et validation des champs reçus.
import { bad } from './errors.js';

export function str(v, field, { required = false, max = 2000 } = {}) {
  if (v == null || String(v).trim() === '') {
    if (required) throw bad(`Champ obligatoire : ${field}`);
    return null;
  }
  const s = String(v).trim();
  if (s.length > max) throw bad(`Champ trop long : ${field} (${max} caractères maximum)`);
  return s;
}

export function num(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw bad('Nombre invalide');
  return n;
}

// Identifiant positif reçu dans l'URL ou le corps ; null si absent.
export function id(v, field = 'identifiant') {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n <= 0) throw bad(`Identifiant invalide : ${field}`);
  return n;
}

export function date(v, field) {
  const s = str(v, field);
  if (s == null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) {
    throw bad(`Date invalide (AAAA-MM-JJ) : ${field}`);
  }
  return s;
}

export function oneOf(v, values, field) {
  if (!values.includes(v)) throw bad(`Valeur invalide : ${field}`);
  return v;
}

export const today = () => new Date().toISOString().slice(0, 10);
