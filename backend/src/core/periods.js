// Périodes trimestrielles "AAAA-Qn" (ADR-013), comparables lexicographiquement.
export const isPeriod = (p) => /^\d{4}-Q[1-4]$/.test(p);

export function previousPeriod(p) {
  const m = /^(\d{4})-Q([1-4])$/.exec(p);
  if (!m) return null;
  const y = Number(m[1]);
  const n = Number(m[2]);
  return n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`;
}
