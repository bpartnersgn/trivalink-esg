// Erreurs métier : la seule façon de renvoyer une erreur au client.
// Les messages sont en français, destinés à l'utilisateur final, et expliquent la règle.
export class HttpError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}
export const bad = (msg) => new HttpError(400, msg, 'bad_request');
export const unauthorized = (msg = 'Session expirée ou invalide', code = 'unauthorized') => new HttpError(401, msg, code);
export const forbidden = (msg = 'Action non autorisée pour votre rôle', code = 'forbidden') => new HttpError(403, msg, code);
export const notFound = (what = 'Ressource') => new HttpError(404, `${what} introuvable`, 'not_found');
export const tooMany = (msg) => new HttpError(429, msg, 'too_many_requests');
