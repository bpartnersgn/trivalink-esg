// Stockage des preuves (ADR-005, TL-PROD-2). Interface stable save / read / check, quel que
// soit le support. Chiffrement côté application avec une clé dérivée par organisation ;
// l'empreinte SHA-256 du clair est revérifiée à chaque lecture.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { deriveKey, encryptBuffer, decryptBuffer, sha256 } from '../core/crypto.js';

export class IntegrityError extends Error {}

export function createStorage(config) {
  if (config.storageDriver !== 'disk') throw new Error(`Pilote de stockage non disponible : ${config.storageDriver}`);
  return diskStorage(path.resolve(config.storageDir), config.storageKey);
}

function diskStorage(root, masterKey) {
  const orgKey = (orgId) => deriveKey(masterKey, `trivalink:evidence:org:${orgId}`);
  const full = (storageKey) => {
    if (!/^\d+\/[0-9a-f]{16}-[0-9a-f]{12}\.bin$/.test(storageKey)) throw new Error('Clé de stockage invalide');
    return path.join(root, storageKey);
  };

  return {
    driver: 'disk',
    async save(orgId, buffer) {
      const hash = sha256(buffer);
      const storageKey = `${Number(orgId)}/${hash.slice(0, 16)}-${crypto.randomBytes(6).toString('hex')}.bin`;
      await fs.mkdir(path.dirname(full(storageKey)), { recursive: true });
      await fs.writeFile(full(storageKey), encryptBuffer(orgKey(orgId), buffer), { flag: 'wx' });
      return { sha256: hash, storageKey, size: buffer.length };
    },
    async read(orgId, storageKey, expectedSha256) {
      if (!storageKey.startsWith(`${Number(orgId)}/`)) throw new IntegrityError('Preuve hors organisation');
      const plain = decryptBuffer(orgKey(orgId), await fs.readFile(full(storageKey)));
      if (expectedSha256 && sha256(plain) !== expectedSha256) throw new IntegrityError('Empreinte de la preuve invalide');
      return plain;
    },
    // Sonde de santé : le dossier existe et est inscriptible.
    async check() {
      await fs.mkdir(root, { recursive: true });
      await fs.access(root, fs.constants.W_OK);
      return true;
    },
  };
}
