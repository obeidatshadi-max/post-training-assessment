// ── State ─────────────────────────────────────────
let lang = localStorage.getItem('lang') || 'en';
let currentQ = 0;
const answers = {};
let participantName = '';
let participantMobile = '';

// ── Language ──────────────────────────────────────
function toggleLang() {
  lang = lang === 'en' ? 'ar' : 'en';
  localStorage.setItem('lang', lang);
  applyLang();
}

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('langBtn').textContent = t('langToggle', lang);
  document.getElementById('headerTitle').textContent = t('headerTitle', lang);
  document.getElementById('headerSubtitle').textContent = t('headerSubtitle', lang);
  document.getElementById('regTitle').textContent = t('regTitle', lang);
  document.getElementById('regSubtitle').textContent = t('regSubtitle', lang);
  document.getElementById('nameLabel').textContent = t('namePlaceholder', lang);
  document.getElementById('nameInput').placeholder = t('namePlaceholder', lang);
  document.getElementById('mobileLabel').textContent = t('mobilePlaceholder', lang);
  document.getElementById('mobileInput').placeholder = t('mobilePlaceholder', lang);
  document.getElementById('startBtn').textContent = t('startBtn', lang);
  document.getElementById('openTitle').textContent = t('openTitle', lang);
  document.getElementById('openQ1Label').textContent = t('openQ1', lang);
  document.getElementById('openQ1').placeholder = t('openPlaceholder', lang);
  document.getElementById('openQ2Label').textContent = t('openQ2', lang);
  document.getElementById('openQ2').placeholder = t('openPlaceholder', lang);
  document.getElementById('openQ3Label').textContent = t('openQ3', lang);
  document.getElementById('openQ3').placeholder = t('openPlaceholder', lang);
  document.getElementById('submitBtn').textContent = t('submitBtn', lang);
  document.getElementById('prevBtn').textContent = t('prevBtn', lang);
  document.getElementById('nextBtn').textContent = t('nextBtn', lang);
  document.getElementById('resultsTitle').textContent = t('resultsTitle', lang);
  document.getElementById('thankYouTitle').textContent = t('thankYouTitle', lang);
  document.getElementById('thankYouMsg').textContent = t('thankYouMsg', lang);
  // Re-render current question if on MCQ screen
  if (document.getElementById('screenMCQ').classList.contains('active')) {
    renderQuestion(currentQ);
  }
}

// ── Screens ───────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Validation ────────────────────────────────────
function validateMobile(m) {
  return /^07\d{9}$/.test(m);
}

// ── Registration ──────────────────────────────────
async function handleStart() {
  const nameVal = document.getElementById('nameInput').value.trim();
  const mobileVal = document.getElementById('mobileInput').value.trim();
  const nameErr = document.getElementById('nameError');
  const mobileErr = document.getElementById('mobileError');
  const globalErr = document.getElementById('regGlobalError');

  // Clear previous errors
  nameErr.textContent = '';
  nameErr.classList.remove('visible');
  mobileErr.textContent = '';
  mobileErr.classList.remove('visible');
  globalErr.classList.remove('visible');

  let valid = true;

  if (!nameVal) {
    nameErr.textContent = t('nameRequired', lang);
    nameErr.classList.add('visible');
    valid = false;
  }
  if (!validateMobile(mobileVal)) {
    mobileErr.textContent = t('mobileInvalid', lang);
    mobileErr.classList.add('visible');
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('startBtn');
  btn.disabled = true;
  btn.textContent = t('checking', lang);

  try {
    const { data: exists, error } = await db.rpc('check_mobile_exists', { p_mobile: mobileVal });
    if (error) throw error;
    if (exists) {
      mobileErr.textContent = t('mobileExists', lang);
      mobileErr.classList.add('visible');
      btn.disabled = false;
      btn.textContent = t('startBtn', lang);
      return;
    }
  } catch (e) {
    globalErr.textContent = t('submitError', lang);
    globalErr.classList.add('visible');
    btn.disabled = false;
    btn.textContent = t('startBtn', lang);
    return;
  }

  participantName = nameVal;
  participantMobile = mobileVal;
  btn.disabled = false;
  btn.textContent = t('startBtn', lang);
  currentQ = 0;
  showScreen('screenMCQ');
  renderQuestion(currentQ);
}

// ── Stubs (filled in Tasks 5 & 6) ────────────────
function renderQuestion(index) { /* Task 5 */ }
function prevQuestion() { /* Task 5 */ }
function nextQuestion() { /* Task 5 */ }
function handleSubmit() { /* Task 6 */ }

// ── Init ──────────────────────────────────────────
applyLang();
