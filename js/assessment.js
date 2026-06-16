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
  globalErr.textContent = '';
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

// ── MCQ ───────────────────────────────────────────
function renderQuestion(index) {
  const q = QUESTIONS[index];
  const total = QUESTIONS.length;
  const pct = Math.round(((index + 1) / total) * 100);

  document.getElementById('progressLabel').textContent = t('questionOf', lang, { n: index + 1 });
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('questionText').textContent = q[lang] || q.en;

  const list = document.getElementById('optionsList');
  list.innerHTML = '';
  q.options.forEach(opt => {
    const li = document.createElement('li');
    li.className = 'option-item';
    const isChecked = answers[q.id] === opt.key;
    li.innerHTML = `
      <input type="radio" name="mcq_option" id="opt_${opt.key}" value="${opt.key}"${isChecked ? ' checked' : ''} />
      <label for="opt_${opt.key}">
        <span class="option-key">${opt.key.toUpperCase()}</span>
        ${opt[lang] || opt.en}
      </label>`;
    li.querySelector('input').addEventListener('change', () => {
      answers[q.id] = opt.key;
    });
    list.appendChild(li);
  });

  // Hide prev on first question
  document.getElementById('prevBtn').style.display = index === 0 ? 'none' : '';
  // Last question next button still says "Next" — navigates to open questions
  document.getElementById('nextBtn').textContent = t('nextBtn', lang);
}

function prevQuestion() {
  if (currentQ > 0) {
    currentQ--;
    renderQuestion(currentQ);
    window.scrollTo(0, 0);
  }
}

function nextQuestion() {
  const q = QUESTIONS[currentQ];
  if (!answers[q.id]) {
    // Briefly highlight the options list to indicate selection needed
    const list = document.getElementById('optionsList');
    list.style.outline = '2px solid var(--danger)';
    list.style.borderRadius = '8px';
    setTimeout(() => {
      list.style.outline = '';
      list.style.borderRadius = '';
    }, 800);
    return;
  }
  if (currentQ < QUESTIONS.length - 1) {
    currentQ++;
    renderQuestion(currentQ);
    window.scrollTo(0, 0);
  } else {
    // All MCQ answered — go to open questions
    showScreen('screenOpen');
  }
}

// ── Submit stub (Task 6) ──────────────────────────
function handleSubmit() { /* Task 6 */ }

// ── Init ──────────────────────────────────────────
applyLang();
