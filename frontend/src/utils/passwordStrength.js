/**
 * Password Strength Assessment Utility
 * Evaluates password strength based on entropy, length, character variety,
 * predictable sequences, repetitive patterns, and common dictionary passwords.
 */

const COMMON_DICTIONARY = new Set([
  'password',
  'pass',
  'admin',
  'administrator',
  'qwerty',
  'welcome',
  'doctor',
  'medical',
  'billing',
  'billmd',
  'clinic',
  'hospital',
  'receptionist',
  'letmein',
  'changeme',
  'secret',
  'iloveyou',
  'login',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'shadow',
  'sunshine',
  'princess',
  'master',
  'superman',
  'testing',
  'default',
  'root',
  'system',
]);

// Normalize leetspeak characters
function normalizeLeet(str) {
  return str
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/4/g, 'a')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i');
}

// Detect predictable keyboard or numeric sequences
function hasObviousSequences(str) {
  const lower = str.toLowerCase();
  const sequences = [
    '0123', '1234', '2345', '3456', '4567', '5678', '6789', '7890',
    '9876', '8765', '7654', '6543', '5432', '4321', '3210',
    'abcd', 'bcde', 'cdef', 'defg', 'efgh', 'fghi', 'ghij',
    'qwer', 'asdf', 'zxcv',
  ];
  return sequences.some((seq) => lower.includes(seq));
}

// Check for common dictionary match, including suffix variations like "Password123!"
function checkCommonDictionary(str) {
  const rawLower = str.toLowerCase();
  if (COMMON_DICTIONARY.has(rawLower)) return true;

  // Strip trailing numbers and symbols to find the root word
  const rootRaw = rawLower.replace(/[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, '');
  if (rootRaw && COMMON_DICTIONARY.has(rootRaw)) return true;

  // Check leet normalized versions
  const normalized = normalizeLeet(str);
  if (COMMON_DICTIONARY.has(normalized)) return true;

  const rootNormalized = normalizeLeet(rootRaw);
  if (rootNormalized && COMMON_DICTIONARY.has(rootNormalized)) return true;

  return false;
}

// Multi-word passphrase detection (e.g. "correct horse battery staple" or "correct-horse-battery-staple")
function isPassphrase(str) {
  if (str.length < 14) return false;
  // Split on spaces, dashes, underscores, dots
  const words = str.split(/[\s\-_.]+/).filter((w) => w.length >= 3);
  return words.length >= 3;
}

/**
 * Assesses password strength.
 *
 * @param {string} pwd
 * @returns {{
 *   score: number, // 0 (empty) to 4 (strong)
 *   label: 'Weak' | 'Fair' | 'Good' | 'Strong' | '',
 *   feedback: string,
 * }}
 */
export function getPasswordStrength(pwd) {
  if (!pwd || typeof pwd !== 'string') {
    return { score: 0, label: '', feedback: '' };
  }

  // 1. Strict minimum length: Application requires >= 8 characters
  if (pwd.length < 8) {
    return {
      score: 1,
      label: 'Weak',
      feedback: 'Minimum 8 characters required',
    };
  }

  // 2. Dictionary / Common password check
  if (checkCommonDictionary(pwd)) {
    return {
      score: 1,
      label: 'Weak',
      feedback: 'Too common or easily guessed',
    };
  }

  // 3. Obvious repetitive sequences & single char concentration
  const hasRepeating = /(.)\1{2,}/i.test(pwd); // e.g. "aaa", "111"
  const hasSequential = hasObviousSequences(pwd);

  // Check character frequency (e.g. "aaaaaaaa1A!" has 8 'a's)
  const charFreq = {};
  for (const ch of pwd.toLowerCase()) {
    charFreq[ch] = (charFreq[ch] || 0) + 1;
  }
  const maxSingleCharCount = Math.max(...Object.values(charFreq));
  if (maxSingleCharCount / pwd.length >= 0.45 && pwd.length < 18) {
    return {
      score: 1,
      label: 'Weak',
      feedback: 'Contains too many repeated characters',
    };
  }

  const uniqueCount = Object.keys(charFreq).length;
  if (uniqueCount < 4) {
    return {
      score: 1,
      label: 'Weak',
      feedback: 'Too few unique characters',
    };
  }

  // 4. Check for strong multi-word passphrases
  if (isPassphrase(pwd)) {
    if (pwd.length >= 18) {
      return { score: 4, label: 'Strong', feedback: 'Excellent passphrase length' };
    }
    return { score: 3, label: 'Good', feedback: 'Good multi-word passphrase' };
  }

  // 5. Score calculation based on length, entropy, and character diversity
  let points = 0;

  // Length scoring
  if (pwd.length >= 8) points += 1;
  if (pwd.length >= 10) points += 1;
  if (pwd.length >= 12) points += 2;
  if (pwd.length >= 16) points += 2;

  // Character variety
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigits = /[0-9]/.test(pwd);
  const hasSymbols = /[^A-Za-z0-9]/.test(pwd);

  const varietyCount = [hasLower, hasUpper, hasDigits, hasSymbols].filter(Boolean).length;
  points += varietyCount;

  if (varietyCount >= 3) points += 1;
  if (varietyCount === 4) points += 1;

  // Diversity bonus
  if (uniqueCount >= 8) points += 1;
  if (uniqueCount >= 12) points += 1;

  // Penalties
  if (hasRepeating) points -= 1;
  if (hasSequential) points -= 2;
  if (/^\d+$/.test(pwd)) points -= 4; // numbers only
  if (/^[a-zA-Z]+$/.test(pwd) && pwd.length < 12) points -= 2; // letters only short

  // Map points to score: 1 (Weak), 2 (Fair), 3 (Good), 4 (Strong)
  if (points <= 3) {
    return {
      score: 1,
      label: 'Weak',
      feedback: 'Add more characters or variety',
    };
  }

  if (points <= 5) {
    return {
      score: 2,
      label: 'Fair',
      feedback: 'Moderate strength; add length or symbols',
    };
  }

  if (points <= 7) {
    return {
      score: 3,
      label: 'Good',
      feedback: 'Solid password',
    };
  }

  return {
    score: 4,
    label: 'Strong',
    feedback: 'High-security password',
  };
}
