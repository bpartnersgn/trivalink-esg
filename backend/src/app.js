// Monolithe modulaire (ADR-001) : un socle commun, un module par domaine.
import express from 'express';
import crypto from 'node:crypto';
import { HttpError, unauthorized, forbidden } from './core/errors.js';
import { READ_ONLY } from './core/rbac.js';
import { resolveSession } from './core/sessions.js';
import authModule from './modules/auth.js';
import orgModule from './modules/org.js';
import auditModule from './modules/audit.js';

// Routes accessibles sans session.
const OPEN_ROUTES = new Set(['GET /health', 'POST /auth/login', 'POST /auth/mfa']);
// Routes accessibles à une session dont la MFA est exigée mais pas encore configurée.
const ENROLL_ROUTES = new Set(['GET /me', 'POST /me/mfa/setup', 'POST /me/mfa/confirm', 'POST /auth/logout']);
// Écritures permises aux rôles en lecture seule : leur propre compte uniquement.
const READ_ONLY_ALLOWED = new Set(['POST /auth/logout', 'PATCH /me', 'POST /me/password', 'POST /me/mfa/setup',
  'POST /me/mfa/confirm', 'POST /me/mfa/disable']);

// Traduction des erreurs PostgreSQL usuelles en erreurs métier.
const PG_ERRORS = {
  23505: [409, 'Cet élément existe déjà', 'conflict'],
  23503: [400, 'Valeur invalide : référence inconnue', 'bad_request'],
  23514: [400, 'Valeur invalide', 'bad_request'],
  23502: [400, 'Valeur obligatoire manquante', 'bad_request'],
  '22P02': [400, 'Valeur invalide', 'bad_request'],
  22007: [400, 'Date invalide', 'bad_request'],
  22008: [400, 'Date invalide', 'bad_request'],
  22003: [400, 'Nombre hors limites', 'bad_request'],
};

export function createApp({ config, pool, storage, log }) {
  const ctx = { config, pool, storage, log };
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  // Identifiant de corrélation et journal d'accès
  app.use((req, res, next) => {
    const incoming = req.get('x-request-id');
    req.id = incoming && /^[\w.-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
    res.set('X-Request-Id', req.id);
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      log.info('request', {
        req_id: req.id, method: req.method, path: req.originalUrl.split('?')[0], status: res.statusCode,
        ms: Number((process.hrtime.bigint() - start) / 1_000_000n),
        user_id: req.user?.id, org_id: req.user?.org_id,
      });
    });
    next();
  });

  // En-têtes de sécurité (équivalent minimal de helmet, sans dépendance)
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cache-Control': 'no-store',
    });
    if (config.production) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.use(express.json({ limit: '2mb' }));

  const api = express.Router();

  // 1. Authentification. L'organisation vient toujours de la session, jamais du client.
  api.use(async (req, _res, next) => {
    if (req.query?.token != null) return next(unauthorized('Jeton refusé dans l’URL : utiliser l’en-tête Authorization'));
    const auth = req.get('authorization') || '';
    req.token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
    const route = `${req.method} ${req.path}`;
    if (OPEN_ROUTES.has(route)) return next();
    const s = await resolveSession(pool, req.token, config.session.idleSeconds);
    if (!s || s.stage === 'mfa') return next(unauthorized());
    const { session_id: sessionId, stage, ...user } = s;
    req.user = user;
    req.session = { id: sessionId, stage };
    if (stage === 'enroll' && !ENROLL_ROUTES.has(route)) {
      return next(forbidden('La double authentification est obligatoire pour votre organisation : configurez-la pour continuer', 'mfa_enrollment_required'));
    }
    // 2. Règle globale de lecture seule (livrable 04 §2.1), avant toute route.
    if (READ_ONLY.includes(user.role) && req.method !== 'GET' && !READ_ONLY_ALLOWED.has(route)) {
      return next(forbidden('Accès en lecture seule'));
    }
    next();
  });

  api.get('/health', async (_req, res) => {
    const checks = {};
    try { await pool.query('SELECT 1'); checks.database = 'ok'; } catch { checks.database = 'error'; }
    try { await storage.check(); checks.storage = 'ok'; } catch { checks.storage = 'error'; }
    const ok = Object.values(checks).every((v) => v === 'ok');
    res.status(ok ? 200 : 503).json({ ok, checks });
  });

  authModule(api, ctx);
  orgModule(api, ctx);
  auditModule(api, ctx);

  app.use('/api', api);
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Route inconnue', 'not_found')));

  // Gestion d'erreurs uniforme : { error, code } + statut HTTP.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, code: err.code, ...err.extra });
    }
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide', code: 'bad_request' });
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Requête trop volumineuse', code: 'too_large' });
    const mapped = PG_ERRORS[err?.code];
    if (mapped) return res.status(mapped[0]).json({ error: mapped[1], code: mapped[2] });
    if (err?.code === '42501') {
      // Violation de RLS ou de droits : c'est un défaut du code, jamais un cas normal.
      log.error('privilege_violation', { req_id: req.id, err, user_id: req.user?.id, org_id: req.user?.org_id });
      return res.status(404).json({ error: 'Ressource introuvable', code: 'not_found' });
    }
    log.error('unhandled_error', { req_id: req.id, err });
    res.status(500).json({ error: 'Erreur interne', code: 'internal', request_id: req.id });
  });

  return app;
}
