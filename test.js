// compute_constant.js
// Node.js (no external libraries). Reads JSON from stdin and prints the constant term.

'use strict';

const fs = require('fs');

function readStdin() {
  return fs.readFileSync(0, 'utf8'); // 0 is stdin
}

function digitValue(ch) {
  if (ch >= '0' && ch <= '9') return BigInt(ch.charCodeAt(0) - '0'.charCodeAt(0));
  const lower = ch.toLowerCase();
  if (lower >= 'a' && lower <= 'z') return BigInt(10 + lower.charCodeAt(0) - 'a'.charCodeAt(0));
  throw new Error('Invalid digit: ' + ch);
}

function parseValueInBase(str, base) {
  let b = BigInt(base);
  let res = 0n;
  for (let i = 0; i < str.length; ++i) {
    const ch = str[i];
    if (ch === '_') continue; // tolerate grouping char if present
    const dv = digitValue(ch);
    if (dv >= b) throw new Error(`Digit '${ch}' not valid for base ${base}`);
    res = res * b + dv;
  }
  return res;
}

function main() {
  const text = readStdin().trim();
  if (!text) {
    console.error('No input provided on stdin.');
    process.exit(1);
  }
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
  }

  if (!obj.keys || typeof obj.keys.k === 'undefined') {
    console.error('JSON must include "keys": {"k": <number>, ... }');
    process.exit(1);
  }

  const k = Number(obj.keys.k);
  if (!Number.isInteger(k) || k <= 0) {
    console.error('Invalid k in keys.');
    process.exit(1);
  }

  // Collect numeric root keys (all keys except "keys")
  const rootKeys = Object.keys(obj).filter(kx => kx !== 'keys')
    .map(kx => ({ id: Number(kx), key: kx }))
    .filter(x => !Number.isNaN(x.id))
    .sort((a,b) => a.id - b.id);

  if (rootKeys.length < k) {
    console.error(`Not enough roots provided. Need at least k=${k}, found ${rootKeys.length}.`);
    process.exit(1);
  }

  const m = k - 1; // polynomial degree
  // We'll take the first k entries and from them the m roots needed (interpretation: use k entries to determine m-degree polynomial; here we use first m roots)
  // Many problem variants use exactly m roots; here we assume roots count = m (k = m+1 gives k entries to solve coefficients)
  // We'll pick the first m root entries (i.e., first (k-1) roots).
  const useCount = m;
  if (useCount <= 0) {
    // degree 0 polynomial: constant only
    console.log('0');
    return;
  }

  let product = 1n;
  for (let i = 0; i < useCount; ++i) {
    const entryKey = rootKeys[i].key;
    const entry = obj[entryKey];
    if (!entry || typeof entry.base === 'undefined' || typeof entry.value === 'undefined') {
      console.error('Malformed root entry at key', entryKey);
      process.exit(1);
    }
    const base = Number(entry.base);
    const valueStr = String(entry.value).trim();
    if (!Number.isInteger(base) || base < 2 || base > 36) {
      console.error('Base must be between 2 and 36. Found:', entry.base);
      process.exit(1);
    }
    const val = parseValueInBase(valueStr, base);
    product *= val;
  }

  // constant term = (-1)^m * product of roots
  const sign = (m % 2 === 0) ? 1n : -1n;
  const constantTerm = sign * product;

  console.log(constantTerm.toString());
}

main();
