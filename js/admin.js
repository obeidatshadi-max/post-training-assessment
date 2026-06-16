// ── State ─────────────────────────────────────────
let allSubmissions = [];
let filtered = [];
let activeRow = null;

// ── Auth ──────────────────────────────────────────
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  errEl.classList.remove('visible');

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = error.message;
    errEl.classList.add('visible');
    return;
  }
  showDashboard();
}

async function handleLogout() {
  await db.auth.signOut();
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginWrap').style.display = 'flex';
}

async function checkSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) showDashboard();
}

async function showDashboard() {
  document.getElementById('loginWrap').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  await loadSubmissions();
}

// ── Data ──────────────────────────────────────────
async function loadSubmissions() {
  const { data, error } = await db
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load submissions:', error.message);
    return;
  }
  allSubmissions = data || [];
  updateStats(allSubmissions);
  applyFilters();
}

function updateStats(rows) {
  document.getElementById('statTotal').textContent = rows.length;
  const avg = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.score_pct, 0) / rows.length)
    : 0;
  document.getElementById('statAvg').textContent = rows.length ? avg + '%' : '—';
  document.getElementById('statAutoFlag').textContent = rows.filter(r => r.auto_flagged).length;
  document.getElementById('statTrainerFlag').textContent = rows.filter(r => r.trainer_flagged).length;
}

// ── Filters ───────────────────────────────────────
function applyFilters() {
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  const score = document.getElementById('filterScore').value;
  const flag = document.getElementById('filterFlag').value;

  filtered = allSubmissions.filter(r => {
    const date = r.created_at.slice(0, 10);
    if (from && date < from) return false;
    if (to && date > to) return false;
    if (score === 'pass' && r.score_pct < 70) return false;
    if (score === 'fail' && r.score_pct >= 70) return false;
    if (flag === 'auto' && !r.auto_flagged) return false;
    if (flag === 'trainer' && !r.trainer_flagged) return false;
    if (flag === 'either' && !r.auto_flagged && !r.trainer_flagged) return false;
    return true;
  });

  renderTable(filtered);
}

function renderTable(rows) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('tableEmpty');
  tbody.innerHTML = '';

  if (!rows.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  rows.forEach(r => {
    const scoreClass = r.score_pct >= 70 ? 'badge-green' : r.score_pct >= 50 ? 'badge-amber' : 'badge-red';
    const date = new Date(r.created_at).toLocaleDateString('en-GB');
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = r.name;
    const mobileTd = document.createElement('td');
    mobileTd.textContent = r.mobile;
    const scoreTd = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge ' + scoreClass;
    badge.textContent = r.score + '/12 (' + r.score_pct + '%)';
    scoreTd.appendChild(badge);
    const autoTd = document.createElement('td');
    autoTd.textContent = r.auto_flagged ? '⚑' : '—';
    if (r.auto_flagged) autoTd.style.color = '#DC2626';
    const trainerTd = document.createElement('td');
    trainerTd.textContent = r.trainer_flagged ? '⚑' : '—';
    if (r.trainer_flagged) trainerTd.style.color = '#D97706';
    const dateTd = document.createElement('td');
    dateTd.textContent = date;

    tr.appendChild(nameTd);
    tr.appendChild(mobileTd);
    tr.appendChild(scoreTd);
    tr.appendChild(autoTd);
    tr.appendChild(trainerTd);
    tr.appendChild(dateTd);
    tr.addEventListener('click', () => openPanel(r));
    tbody.appendChild(tr);
  });
}

// ── CSV Export ────────────────────────────────────
function exportCSV() {
  const headers = ['Name', 'Mobile', 'Score', 'Score%', 'Auto-Flagged', 'Trainer-Flagged', 'Date', 'Open Q1', 'Open Q2', 'Open Q3', 'Notes'];
  const escapeCell = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';

  const rows = filtered.map(r => [
    r.name,
    r.mobile,
    r.score,
    r.score_pct,
    r.auto_flagged ? 'Yes' : 'No',
    r.trainer_flagged ? 'Yes' : 'No',
    new Date(r.created_at).toLocaleDateString('en-GB'),
    r.open_q1,
    r.open_q2,
    r.open_q3,
    r.trainer_notes
  ].map(escapeCell));

  const csv = [headers.map(escapeCell).join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'assessment-results-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Panel stubs (Task 8) ──────────────────────────
function openPanel(row) { /* Task 8 */ }
function closePanel() { /* Task 8 */ }
function saveTrainerFlag() { /* Task 8 */ }
function saveNotes() { /* Task 8 */ }
function copyMobile() { /* Task 8 */ }

// ── Init ──────────────────────────────────────────
checkSession();
