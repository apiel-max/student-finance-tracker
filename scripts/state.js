// scripts/state.js
// ── Central application state ──

import {
  loadRecords, saveRecords,
  loadBudget,   saveBudget,
  loadCategories, saveCategories,
  loadRates,    saveRates,
} from './storage.js';

export const state = {
  records:    [],
  budget:     0,
  categories: [],
  rates:      { usd: 1320, eur: 1430 },
  sortField:  'date',
  sortAsc:    false,
  searchRe:   null,
};

/* ── Bootstrap ── */
export function initState() {
  state.records    = loadRecords();
  state.budget     = loadBudget();
  state.categories = loadCategories();
  state.rates      = loadRates();
}

/* ── Records ── */
export function addRecord(record) {
  state.records.push(record);
  saveRecords(state.records);
}

export function updateRecord(id, changes) {
  const idx = state.records.findIndex(r => r.id === id);
  if (idx === -1) return;
  state.records[idx] = { ...state.records[idx], ...changes, updatedAt: new Date().toISOString() };
  saveRecords(state.records);
}

export function deleteRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
  saveRecords(state.records);
}

/* ── Budget ── */
export function setBudget(amount) {
  state.budget = amount;
  saveBudget(amount);
}

/* ── Categories ── */
export function addCategory(cat) {
  if (!state.categories.includes(cat)) {
    state.categories.push(cat);
    saveCategories(state.categories);
  }
}

export function removeCategory(cat) {
  state.categories = state.categories.filter(c => c !== cat);
  saveCategories(state.categories);
}

/* ── Rates ── */
export function setRates(rates) {
  state.rates = rates;
  saveRates(rates);
}

/* ── Sorted / filtered view ── */
export function getFilteredRecords() {
  try {
    let list = [...state.records];

    if (state.searchRe) {
      list = list.filter(r =>
        state.searchRe.test(r.description) ||
        state.searchRe.test(r.category) ||
        state.searchRe.test(String(r.amount))
      );
    }

    list.sort((a, b) => {
      const field = state.sortField;
      let valA = a[field];
      let valB = b[field];
      if (field === 'amount') { valA = parseFloat(valA); valB = parseFloat(valB); }
      if (valA < valB) return state.sortAsc ? -1 : 1;
      if (valA > valB) return state.sortAsc ?  1 : -1;
      return 0;
    });

    return list;
  } catch(e) {
    console.error('getFilteredRecords error:', e);
    return [];
  }
}

/* ── Stats ── */
export function getStats() {
  try {
    const records = state.records;
    const total = records.reduce((s, r) => { const a = parseFloat(r.amount); return s + (isNaN(a) ? 0 : a); }, 0);
    const avg   = records.length ? total / records.length : 0;

    const catMap = {};
    records.forEach(r => {
      const a = parseFloat(r.amount);
      catMap[r.category] = (catMap[r.category] || 0) + (isNaN(a) ? 0 : a);
    });
    const topCat = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0] || '—';

    const now = new Date();
    const trend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const sum = records
        .filter(r => r.date === key)
        .reduce((s, r) => { const a = parseFloat(r.amount); return s + (isNaN(a) ? 0 : a); }, 0);
      return { label: d.toLocaleDateString('en-RW', { weekday: 'short' }), sum };
    });

    return { total, avg, topCat, catMap, trend, count: records.length };
  } catch(e) {
    console.error('getStats error:', e);
    return { total: 0, avg: 0, topCat: '—', catMap: {}, trend: [], count: 0 };
  }
}

/* ── ID Generator ── */
let _counter = 0;
export function genId() {
  // ensure counter is always ahead of existing records
  const maxN = state.records.reduce((m, r) => {
    const n = parseInt((r.id || '').split('_')[1], 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  _counter = Math.max(_counter, maxN) + 1;
  return `rec_${String(_counter).padStart(4, '0')}_${Date.now()}`;
}

/* ── Import validation ── */
const RE_IMPORT_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function validateImport(data) {
  if (!Array.isArray(data)) return 'Root must be a JSON array.';
  const required = ['id', 'description', 'amount', 'category', 'date'];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (typeof r !== 'object' || r === null) return `Item ${i} is not an object.`;
    for (const key of required) {
      if (!(key in r)) return `Item ${i} is missing field "${key}".`;
    }
    const amount = parseFloat(r.amount);
    if (isNaN(amount)) return `Item ${i} has an invalid amount.`;
    if (amount <= 0) return `Item ${i} has an invalid amount (must be greater than 0).`;
    if (!RE_IMPORT_DATE.test(r.date)) return `Item ${i} has an invalid date (use YYYY-MM-DD).`;
  }
  return null; // valid
}