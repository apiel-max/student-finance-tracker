// scripts/ui.js
// ── DOM rendering ──

import { state, getFilteredRecords, getStats } from './state.js';
import { highlight } from './search.js';

const fmt = n => `RWF ${Number(n).toLocaleString('en-RW', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
export function renderDashboard() {
  try {
    const stats = getStats();
    document.getElementById('stat-total-count').textContent  = stats.count;
    document.getElementById('stat-total-amount').textContent = fmt(stats.total);
    document.getElementById('stat-top-cat').textContent      = stats.topCat;
    document.getElementById('stat-avg').textContent          = fmt(stats.avg);
    renderBarChart(stats.trend);
    renderCatBreakdown(stats.catMap, stats.total);
    renderBudgetUI();
  } catch(e) {
    console.error('Dashboard render error:', e);
  }
}

function renderBarChart(trend) {
  const container = document.getElementById('bar-chart');
  if (!container || !Array.isArray(trend)) return;
  try {
    const max = Math.max(...trend.map(t => t.sum || 0), 1);
    container.innerHTML = trend.map(t => {
      const pct = Math.round(((t.sum || 0) / max) * 100);
      const safeLabel = escapeHtml(t.label || '');
      const safeValue = escapeHtml(fmt(t.sum || 0));
      return `<div class="bar-wrap">
      <div class="bar" style="height:${pct}%" data-value="${safeValue}" role="presentation"></div>
      <span class="bar-label" aria-label="${safeLabel}: ${safeValue}">${safeLabel}</span>
    </div>`;
    }).join('');
  } catch(e) {
    container.innerHTML = '<p style="color:var(--clr-muted);font-size:.85rem">Chart unavailable.</p>';
  }
}

function renderCatBreakdown(catMap, total) {
  const container = document.getElementById('cat-breakdown');
  if (!container) return;
  try {
    const sorted = Object.entries(catMap || {}).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) {
      container.innerHTML = '<li style="color:var(--clr-muted);font-size:.85rem">No data yet.</li>';
      return;
    }
    container.innerHTML = sorted.map(([cat, amt]) => {
      const pct = total ? Math.round((amt / total) * 100) : 0;
      const safeCat = escapeHtml(cat);
      const safeAmt = escapeHtml(fmt(amt));
      return `<li class="cat-item">
      <div class="cat-item-row">
        <span class="cat-name">${safeCat}</span>
        <span class="cat-amount">${safeAmt} (${pct}%)</span>
      </div>
      <div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${pct}%"></div></div>
    </li>`;
    }).join('');
  } catch(e) {
    container.innerHTML = '<li style="color:var(--clr-muted);font-size:.85rem">Breakdown unavailable.</li>';
  }
}

/* ══════════════════════════════════════════
   RECORDS TABLE + CARDS
══════════════════════════════════════════ */
export function renderRecords() {
  try {
    const records  = getFilteredRecords();
    const re       = state.searchRe;
    const tbody    = document.getElementById('records-tbody');
    const cards    = document.getElementById('records-cards');
    const empty    = document.getElementById('empty-state');
    const countEl  = document.getElementById('records-count');

    countEl.textContent = `${records.length} transaction${records.length !== 1 ? 's' : ''}`;

    if (!records.length) {
      tbody.innerHTML = '';
      cards.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    tbody.innerHTML = records.map(r => `
    <tr data-id="${r.id}">
      <td>${highlight(r.description || '', re)}</td>
      <td>${highlight(fmt(r.amount || 0), re)}</td>
      <td><span class="badge">${highlight(r.category || '', re)}</span></td>
      <td>${r.date || ''}</td>
      <td class="td-actions">
        <button class="btn btn--sm btn-edit"   data-id="${r.id}" aria-label="Edit ${escapeHtml(r.description || '')}">Edit</button>
        <button class="btn btn--sm btn-delete" data-id="${r.id}" aria-label="Delete ${escapeHtml(r.description || '')}">Delete</button>
      </td>
    </tr>
  `).join('');

    cards.innerHTML = records.map(r => `
    <li class="record-card" data-id="${r.id}">
      <div class="card-header">
        <span class="card-desc">${highlight(r.description || '', re)}</span>
        <span class="card-amount">${fmt(r.amount || 0)}</span>
      </div>
      <div class="card-meta">
        <span class="badge">${highlight(r.category || '', re)}</span>
        <span class="card-date">${r.date || ''}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn--sm btn-edit"   data-id="${r.id}" aria-label="Edit ${escapeHtml(r.description || '')}">Edit</button>
        <button class="btn btn--sm btn-delete" data-id="${r.id}" aria-label="Delete ${escapeHtml(r.description || '')}">Delete</button>
      </div>
    </li>
  `).join('');

    syncCardVisibility();
  } catch(e) {
    console.error('Records render error:', e);
    flashStatus('form-status', 'Error displaying records. Please refresh.', true);
  }
}

function syncCardVisibility() {
  const cards = document.getElementById('records-cards');
  // Only toggle hidden on mobile; CSS handles >=768px via display:none !important
  if (window.innerWidth < 768) {
    cards.hidden = false;
  } else {
    cards.hidden = true;
  }
}

/* ══════════════════════════════════════════
   CATEGORIES (settings)
══════════════════════════════════════════ */
export function renderCategories() {
  try {
    const list = document.getElementById('cat-list');
    const select = document.getElementById('f-category');

    list.innerHTML = state.categories.map(cat => {
      const safeCat = escapeHtml(cat);
      return `<li>
      <span class="cat-tag">
        ${safeCat}
        <button data-cat="${safeCat}" aria-label="Remove category ${safeCat}" title="Remove">&times;</button>
      </span>
    </li>`;
    }).join('');

    // Sync <select> options
    const current = select.value;
    select.innerHTML = '<option value="">— Select —</option>' +
      state.categories.map(c => `<option${c === current ? ' selected' : ''}>${c}</option>`).join('');
  } catch(e) {
    console.error('renderCategories error:', e);
    flashStatus('data-status', 'Error rendering categories. Please refresh.', true);
  }
}

/* ══════════════════════════════════════════
   BUDGET UI
══════════════════════════════════════════ */
export function renderBudgetUI() {
  try {
    const total   = getStats().total;
    const budget  = state.budget;
    const remaining = budget - total;
    const pct     = budget ? Math.min((total / budget) * 100, 100) : 0;
    const over    = budget > 0 && total > budget;

    document.getElementById('b-budget').textContent    = fmt(budget);
    document.getElementById('b-spent').textContent     = fmt(total);
    document.getElementById('b-remaining').textContent = fmt(Math.abs(remaining));

    const remCard   = document.getElementById('b-remaining-card');
    const bar       = document.getElementById('budget-progress');
    const msgPolite = document.getElementById('budget-live-polite');
    const msgAssert = document.getElementById('budget-live-assertive');

    bar.style.width = `${pct}%`;
    bar.classList.toggle('over', over);
    remCard.classList.toggle('over', over);

    if (budget === 0) {
      msgPolite.textContent = 'Set a budget above to track your spending limit.';
      msgPolite.className   = 'budget-msg';
      msgAssert.hidden      = true;
      msgAssert.textContent = '';
    } else if (over) {
      msgAssert.textContent = `⚠ Budget exceeded by ${fmt(Math.abs(remaining))}.`;
      msgAssert.className   = 'budget-msg over';
      msgAssert.hidden      = false;
      msgPolite.textContent = '';
    } else {
      msgPolite.textContent = `✓ You have ${fmt(remaining)} remaining.`;
      msgPolite.className   = 'budget-msg ok';
      msgAssert.hidden      = true;
      msgAssert.textContent = '';
    }

    // Sync input placeholder
    const inp = document.getElementById('budget-input');
    if (budget > 0) inp.value = budget;
  } catch(e) {
    console.error('renderBudgetUI error:', e);
    flashStatus('data-status', 'Error updating budget display.', true);
  }
}

/* ══════════════════════════════════════════
   FORM HELPERS
══════════════════════════════════════════ */
export function populateForm(record) {
  document.getElementById('edit-id').value       = record.id;
  document.getElementById('f-description').value = record.description;
  document.getElementById('f-amount').value      = record.amount;
  document.getElementById('f-category').value    = record.category;
  document.getElementById('f-date').value        = record.date;
  document.getElementById('form-submit-btn').textContent = 'Save Changes';
  document.getElementById('form-cancel-btn').hidden = false;
  document.getElementById('add-heading').textContent = 'Edit Transaction';
  document.getElementById('f-description').focus();
}

export function resetForm() {
  document.getElementById('txn-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('form-submit-btn').textContent = 'Add Transaction';
  document.getElementById('form-cancel-btn').hidden = true;
  document.getElementById('add-heading').textContent = 'Add Transaction';
  ['description','amount','category','date'].forEach(f => {
    const el = document.getElementById(`f-${f}`);
    const err = document.getElementById(`err-${f}`);
    if (el)  el.removeAttribute('aria-invalid');
    if (err) err.textContent = '';
  });
}

export function flashStatus(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('status--error', isError);
  el.classList.toggle('status--ok', !isError);
  setTimeout(() => {
    el.textContent = '';
    el.classList.remove('status--error', 'status--ok');
  }, 3500);
}

/* ══════════════════════════════════════════
   SORT BUTTON
══════════════════════════════════════════ */
export function updateSortBtn() {
  const btn = document.getElementById('sort-dir');
  btn.textContent = state.sortAsc ? '↑' : '↓';
  btn.setAttribute('aria-label', `Sort ${state.sortAsc ? 'ascending' : 'descending'}`);
}