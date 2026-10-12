/**
 * Name formatting and normalization utilities.
 * Provides clean capitalization, whitespace cleanup, hyphenated names,
 * and apostrophes without unnecessary special-case rules.
 */

function capitalizePart(part) {
  if (!part) return '';
  const isAllUpper = part === part.toUpperCase() && part !== part.toLowerCase();
  const isAllLower = part === part.toLowerCase() && part !== part.toUpperCase();
  if (isAllUpper || isAllLower) {
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function normalizeWord(word) {
  return word
    .split('-')
    .map((hypPart) =>
      hypPart
        .split("'")
        .map(capitalizePart)
        .join("'")
    )
    .join('-');
}

export function normalizeName(name) {
  if (name == null) return name;
  if (typeof name !== 'string') return String(name);

  const cleaned = name
    .replace(/[’‘ʻʼ]/g, "'")
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*'\s*/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  return cleaned.split(' ').map(normalizeWord).join(' ');
}

export function formatFullName(firstName, middleName = null, lastName = null) {
  const parts = [];
  for (const name of [firstName, middleName, lastName]) {
    if (name) {
      const normalized = normalizeName(name);
      if (normalized) parts.push(normalized);
    }
  }
  return parts.join(' ');
}

export function getInitials(firstName, lastName = null) {
  const fn = (normalizeName(firstName) || '').trim();
  const ln = (normalizeName(lastName) || '').trim();

  const firstInit = fn ? fn.charAt(0).toUpperCase() : '';
  const lastInit = ln ? ln.charAt(0).toUpperCase() : '';

  if (firstInit && lastInit) return `${firstInit}${lastInit}`;
  if (firstInit) return firstInit;
  if (lastInit) return lastInit;
  return 'U';
}
