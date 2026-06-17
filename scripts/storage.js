// scripts/storage.js
// ── Persistent key-value store backed by localStorage ──

const KEYS = {
  records:    'sft:records',
  budget:     'sft:budget',
  categories: 'sft:categories',
  rates:      'sft:rates',
};

export function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.records) || '[]');
  } catch(e) {
    return [];
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(KEYS.records, JSON.stringify(records));
  } catch(e) {
    console.error('Failed to save records:', e);
  }
}

export function loadBudget() {
  try {
    return parseFloat(localStorage.getItem(KEYS.budget) || '0') || 0;
  } catch(e) {
    return 0;
  }
}

export function saveBudget(amount) {
  try {
    localStorage.setItem(KEYS.budget, String(amount));
  } catch(e) {
    console.error('Failed to save budget:', e);
  }
}

export function loadCategories() {
  try {
    const stored = localStorage.getItem(KEYS.categories);
    if (stored) return JSON.parse(stored);
  } catch(e) { /* fall through */ }
  return ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
}

export function saveCategories(cats) {
  try {
    localStorage.setItem(KEYS.categories, JSON.stringify(cats));
  } catch(e) {
    console.error('Failed to save categories:', e);
  }
}

export function loadRates() {
  try {
    const stored = localStorage.getItem(KEYS.rates);
    if (stored) return JSON.parse(stored);
  } catch(e) { /* fall through */ }
  return { usd: 1320, eur: 1430 };
}

export function saveRates(rates) {
  try {
    localStorage.setItem(KEYS.rates, JSON.stringify(rates));
  } catch(e) {
    console.error('Failed to save rates:', e);
  }
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}