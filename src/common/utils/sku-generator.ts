// Stop words to ignore when generating SKU
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'of',
  'in',
  'on',
  'at',
  'to',
  'with',
  'by',
  'from',
  'inch',
  'inches',
  'pro',
  'max',
  'ultra',
]);

/**
 * Create SKU from product name.
 *
 * Examples:
 *   "Macbook Pro M4"         → "MBP-M4-A3X9"
 *   "Dell XPS 15"            → "DXS-15-K2M7"
 *   "Logitech MX Master 3"   → "LMX-M3-P9Q1"
 *   "Samsung 4K Monitor 27"  → "S4K-27-B8F2"
 */

export function generateSku(productName: string): string {
  const name = productName.trim().toUpperCase();
  // Split name into tokens, removing non-alphanumeric characters and splitting by whitespace
  const tokens = name
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  // Separate tokens into numbers and words
  const numbers: string[] = [];
  const words: string[] = [];

  for (const token of tokens) {
    if (/^\d+(\.\d+)?$/.test(token)) {
      numbers.push(token);
    } else {
      words.push(token);
    }
  }

  // Filter out stop words from the list of words
  const meaningful = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));

  // Build abbreviation from meaningful words
  const abbr = buildAbbreviation(meaningful);

  // Merge: ABBR[-VERSION]-RANDOM
  const parts = [abbr];
  if (numbers.length > 0) {
    parts.push(numbers.join('-'));
  }
  parts.push(randomSuffix(4));

  return parts.join('-');
}

// Build abbreviation from meaningful words
function buildAbbreviation(words: string[]): string {
  if (words.length === 0) return 'PRD';

  if (words.length === 1) {
    // one word -> get first 3 characters
    return words[0].slice(0, 3);
  }

  if (words.length === 2) {
    // 2 words -> get 2 characters from the first word + 1 character from the second word
    return words[0].slice(0, 2) + words[1].slice(0, 1);
  }

  // 3+ words → get 1 character from the first 3 words
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('');
}

//// ─── Random suffix has only alphanumeric characters (A-Z, 0-9) and is of the specified length
// Skip vowels to avoid forming words: 0/O, 1/I, 8/B
const SAFE_CHARS = 'ACDEFGHJKLMNPQRSTUVWXYZ2345679';

function randomSuffix(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return result;
}
