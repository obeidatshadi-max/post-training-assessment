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

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `mcq_${q.id}`;
    radio.id = `opt_${opt.key}`;
    radio.value = opt.key;
    if (isChecked) radio.checked = true;
    radio.addEventListener('change', () => {
      answers[q.id] = opt.key;
    });

    const keySpan = document.createElement('span');
    keySpan.className = 'option-key';
    keySpan.textContent = opt.key.toUpperCase();

    const labelEl = document.createElement('label');
    labelEl.htmlFor = `opt_${opt.key}`;
    labelEl.appendChild(keySpan);
    labelEl.appendChild(document.createTextNode(' ' + (opt[lang] || opt.en)));

    li.appendChild(radio);
    li.appendChild(labelEl);
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

// ── Scoring ───────────────────────────────────────
function calculateScore() {
  let score = 0;
  QUESTIONS.forEach(q => {
    if (answers[q.id] === q.correct) score++;
  });
  return score;
}

// ── Submit ────────────────────────────────────────
async function handleSubmit() {
  const btn = document.getElementById('submitBtn');
  const errEl = document.getElementById('submitError');
  errEl.classList.remove('visible');

  const score = calculateScore();
  const score_pct = Math.round((score / QUESTIONS.length) * 100);

  btn.disabled = true;
  btn.textContent = t('submitting', lang);

  const payload = {
    name: participantName,
    mobile: participantMobile,
    lang,
    answers,
    open_q1: document.getElementById('openQ1').value.trim(),
    open_q2: document.getElementById('openQ2').value.trim(),
    open_q3: document.getElementById('openQ3').value.trim(),
    score,
    score_pct,
    auto_flagged: score_pct >= 70
  };

  const { error } = await db.from('submissions').insert(payload);

  if (error) {
    btn.disabled = false;
    btn.textContent = t('submitBtn', lang);
    errEl.textContent = t('submitError', lang);
    errEl.classList.add('visible');
    return;
  }

  showResults(score, score_pct);
}

// ── Results ───────────────────────────────────────
function showResults(score, score_pct) {
  showScreen('screenResults');

  const gradeClass = score_pct >= 70 ? 'green' : score_pct >= 50 ? 'amber' : 'red';
  const circle = document.getElementById('scoreCircle');
  circle.className = 'score-circle ' + gradeClass;

  document.getElementById('scoreNum').textContent = score;
  document.getElementById('scoreOut').textContent = t('outOf', lang);
  document.getElementById('scorePct').textContent = score_pct + '%';

  const gradeKey = score_pct >= 70 ? 'gradeExcellent' : score_pct >= 50 ? 'gradeGood' : 'gradeNeedsWork';
  document.getElementById('gradeMsg').textContent = t(gradeKey, lang);

  document.getElementById('resultsTitle').textContent = t('resultsTitle', lang);
  document.getElementById('thankYouTitle').textContent = t('thankYouTitle', lang);
  document.getElementById('thankYouMsg').textContent = t('thankYouMsg', lang);

  const list = document.getElementById('resultsList');
  list.innerHTML = '';
  QUESTIONS.forEach(q => {
    const isCorrect = answers[q.id] === q.correct;
    const correctOpt = q.options.find(o => o.key === q.correct);
    const yourOpt = q.options.find(o => o.key === answers[q.id]);

    const div = document.createElement('div');
    div.className = 'result-item ' + (isCorrect ? 'correct' : 'wrong');

    const qDiv = document.createElement('div');
    qDiv.className = 'result-q';
    const icon = document.createElement('span');
    icon.className = 'result-icon';
    icon.textContent = isCorrect ? '✓' : '✗';
    qDiv.appendChild(icon);
    qDiv.appendChild(document.createTextNode(q[lang] || q.en));
    div.appendChild(qDiv);

    if (!isCorrect) {
      const detail = document.createElement('div');
      detail.className = 'result-detail';
      const yourText = yourOpt ? (yourOpt[lang] || yourOpt.en) : '—';
      const correctText = correctOpt ? (correctOpt[lang] || correctOpt.en) : '—';
      detail.appendChild(document.createTextNode(t('yourAnswerLabel', lang) + ' ' + yourText));
      detail.appendChild(document.createElement('br'));
      const correctLabel = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = correctText;
      correctLabel.appendChild(document.createTextNode(t('correctLabel', lang) + ' '));
      correctLabel.appendChild(strong);
      detail.appendChild(correctLabel);
      div.appendChild(detail);
    }

    list.appendChild(div);
  });
}

// ── Init ──────────────────────────────────────────
applyLang();
