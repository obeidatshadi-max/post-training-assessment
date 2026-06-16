# Post-Training Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (EN/AR) mobile-first assessment tool for Iraqi pharmacist training sessions, with Supabase backend and a trainer admin dashboard, deployed to Netlify via GitHub.

**Architecture:** Two static HTML pages — `index.html` (participant assessment) and `admin.html` (trainer dashboard) — with shared JS modules for Supabase client, translations, and question data. Supabase handles persistence and admin auth with RLS. Netlify auto-deploys from GitHub.

**Tech Stack:** Vanilla JS (ES6+), CSS3 (custom, mobile-first, RTL), Supabase JS SDK v2 (CDN), Netlify (static), GitHub.

---

## File Map

```
post-training-assessment/
├── index.html              # participant: registration → MCQ → open questions → results
├── admin.html              # trainer: login → stats → submissions table → detail panel
├── css/
│   └── style.css           # shared styles, mobile-first, RTL support
├── js/
│   ├── supabase-config.js  # Supabase client init (URL + anon key)
│   ├── i18n.js             # EN/AR translations for all UI strings
│   ├── questions.js        # 12 MCQ definitions with options + correct answer keys
│   ├── assessment.js       # participant flow logic
│   └── admin.js            # dashboard logic
└── docs/
    └── superpowers/
        ├── specs/2026-06-16-post-training-assessment-design.md
        └── plans/2026-06-16-post-training-assessment.md
```

---

## Task 1: Supabase Project Setup

**Files:** None (Supabase dashboard + SQL editor)

- [ ] **Step 1: Create Supabase project**

  Go to https://supabase.com → New project → name it `post-training-assessment` → note the Project URL and anon public key (Settings → API).

- [ ] **Step 2: Run table creation SQL**

  In Supabase → SQL Editor → New query → paste and run:

  ```sql
  CREATE TABLE submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    lang TEXT NOT NULL DEFAULT 'en',
    answers JSONB NOT NULL DEFAULT '{}',
    open_q1 TEXT DEFAULT '',
    open_q2 TEXT DEFAULT '',
    open_q3 TEXT DEFAULT '',
    score INT NOT NULL DEFAULT 0,
    score_pct INT NOT NULL DEFAULT 0,
    auto_flagged BOOLEAN DEFAULT FALSE,
    trainer_flagged BOOLEAN DEFAULT FALSE,
    trainer_notes TEXT DEFAULT ''
  );
  ```

- [ ] **Step 3: Enable RLS and add policies**

  ```sql
  ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

  -- Participants: insert only, cannot read any rows
  CREATE POLICY "anon_insert_only" ON submissions
    FOR INSERT TO anon
    WITH CHECK (true);

  -- Admin (authenticated): full access
  CREATE POLICY "admin_full_access" ON submissions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
  ```

- [ ] **Step 4: Create RPC for mobile duplicate check**

  This lets anon check if a mobile exists without exposing any data:

  ```sql
  CREATE OR REPLACE FUNCTION check_mobile_exists(p_mobile TEXT)
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    RETURN EXISTS (SELECT 1 FROM submissions WHERE mobile = p_mobile);
  END;
  $$;
  ```

- [ ] **Step 5: Create admin user**

  Supabase → Authentication → Users → Invite user → enter `shadi@psychologytobusiness.com` → set a password.

- [ ] **Step 6: Verify**

  In SQL Editor run: `SELECT * FROM submissions;` → should return empty table with no errors.

---

## Task 2: Git Repo + Project Scaffold

**Files:** All (initial structure)

- [ ] **Step 1: Create the project folder and init git**

  ```bash
  cd "C:/Users/shadi/Desktop/AI APP 2026/post-training-assessment"
  git init
  git checkout -b main
  ```

- [ ] **Step 2: Create folder structure**

  ```bash
  mkdir css js
  ```

- [ ] **Step 3: Create placeholder files**

  ```bash
  touch index.html admin.html css/style.css js/supabase-config.js js/i18n.js js/questions.js js/assessment.js js/admin.js
  ```

- [ ] **Step 4: Create .gitignore**

  Create `.gitignore`:
  ```
  .DS_Store
  Thumbs.db
  *.env
  ```

- [ ] **Step 5: Initial commit**

  ```bash
  git add .
  git commit -m "chore: initial project scaffold"
  ```

- [ ] **Step 6: Push to GitHub**

  Go to github.com → New repository → name `post-training-assessment` → Public → no README.

  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/post-training-assessment.git
  git push -u origin main
  ```

- [ ] **Step 7: Connect Netlify**

  Netlify → Add new site → Import from Git → GitHub → select `post-training-assessment` → Build command: *(leave empty)* → Publish directory: `.` → Deploy site.

  Note the Netlify URL (e.g., `https://post-training-assessment.netlify.app`).

---

## Task 3: Shared Assets — supabase-config.js, i18n.js, questions.js, style.css

**Files:**
- Create: `js/supabase-config.js`
- Create: `js/i18n.js`
- Create: `js/questions.js`
- Create: `css/style.css`

- [ ] **Step 1: Write js/supabase-config.js**

  Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with values from Supabase → Settings → API.

  ```javascript
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

  const { createClient } = supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  ```

- [ ] **Step 2: Write js/questions.js**

  ```javascript
  const QUESTIONS = [
    {
      id: 'q1',
      en: 'What do we mean by selling?',
      ar: 'ماذا نقصد بالبيع؟',
      options: [
        { key: 'a', en: 'Building a long-term relationship', ar: 'بناء علاقة طويلة المدى' },
        { key: 'b', en: 'A transaction between two parties', ar: 'معاملة تجارية بين طرفين' },
        { key: 'c', en: 'Giving free samples to doctors', ar: 'تقديم عينات مجانية للأطباء' },
        { key: 'd', en: 'Presenting product features', ar: 'عرض مزايا المنتج' }
      ],
      correct: 'b'
    },
    {
      id: 'q2',
      en: 'What do we mean by partnership?',
      ar: 'ماذا نقصد بالشراكة؟',
      options: [
        { key: 'a', en: 'Selling the most units possible', ar: 'بيع أكبر كمية ممكنة من المنتجات' },
        { key: 'b', en: 'A one-time agreement', ar: 'اتفاقية لمرة واحدة' },
        { key: 'c', en: 'Discounting products to keep clients', ar: 'تخفيض الأسعار للحفاظ على العملاء' },
        { key: 'd', en: 'Equal benefits for both sides over a long time', ar: 'منافع متساوية لكلا الطرفين على المدى الطويل' }
      ],
      correct: 'd'
    },
    {
      id: 'q3',
      en: 'What does a medical representative sell?',
      ar: 'ماذا يبيع المندوب الطبي؟',
      options: [
        { key: 'a', en: 'Products and medicines', ar: 'المنتجات والأدوية' },
        { key: 'b', en: 'Promotions and discounts', ar: 'العروض والتخفيضات' },
        { key: 'c', en: 'Solutions to customer problems', ar: 'حلولاً لمشاكل العميل' },
        { key: 'd', en: 'Company reputation', ar: 'سمعة الشركة' }
      ],
      correct: 'c'
    },
    {
      id: 'q4',
      en: 'How do we gain customer confidence?',
      ar: 'كيف نكسب ثقة العميل؟',
      options: [
        { key: 'a', en: 'By offering the lowest price', ar: 'بتقديم أقل الأسعار' },
        { key: 'b', en: 'By giving more samples', ar: 'بإعطاء المزيد من العينات' },
        { key: 'c', en: 'By knowing all product details', ar: 'بمعرفة جميع تفاصيل المنتج' },
        { key: 'd', en: 'Through repetition and consistency', ar: 'من خلال التكرار والاتساق' }
      ],
      correct: 'd'
    },
    {
      id: 'q5',
      en: 'What are the characteristics of a strategic objective?',
      ar: 'ما هي خصائص الهدف الاستراتيجي؟',
      options: [
        { key: 'a', en: 'Simple, Fast, Flexible, Realistic, Tracked', ar: 'بسيط، سريع، مرن، واقعي، قابل للتتبع' },
        { key: 'b', en: 'Specific, Modern, Achievable, Realistic, Transparent', ar: 'محدد، حديث، قابل للتحقيق، واقعي، شفاف' },
        { key: 'c', en: 'Strong, Measurable, Active, Reliable, Timed', ar: 'قوي، قابل للقياس، نشط، موثوق، محدد بوقت' },
        { key: 'd', en: 'Specific, Measurable, Achievable, Relevant, Time-bound (SMART)', ar: 'محدد، قابل للقياس، قابل للتحقيق، ذو صلة، محدد بوقت (SMART)' }
      ],
      correct: 'd'
    },
    {
      id: 'q6',
      en: 'What is the most important external data we need to know?',
      ar: 'ما هي أهم البيانات الخارجية التي نحتاج لمعرفتها؟',
      options: [
        { key: 'a', en: 'Customer needs', ar: 'احتياجات العميل' },
        { key: 'b', en: 'Number of patients per doctor', ar: 'عدد المرضى لدى الطبيب' },
        { key: 'c', en: 'Competitor information', ar: 'معلومات المنافس' },
        { key: 'd', en: 'Social style of the customer', ar: 'الأسلوب الاجتماعي للعميل' }
      ],
      correct: 'c'
    },
    {
      id: 'q7',
      en: 'What is the golden rule in impactful communication?',
      ar: 'ما هي القاعدة الذهبية في التواصل المؤثر؟',
      options: [
        { key: 'a', en: 'Speak clearly and slowly', ar: 'التحدث بوضوح وببطء' },
        { key: 'b', en: 'Always smile and be polite', ar: 'الابتسام دائماً والتحلي باللباقة' },
        { key: 'c', en: 'Ask many questions', ar: 'طرح أسئلة كثيرة' },
        { key: 'd', en: 'Find common things with the other person', ar: 'إيجاد أوجه مشتركة مع الشخص الآخر' }
      ],
      correct: 'd'
    },
    {
      id: 'q8',
      en: 'What are the percentages of influence: words, tone, body language?',
      ar: 'ما نسب التأثير: الكلمات، النبرة، لغة الجسد؟',
      options: [
        { key: 'a', en: '30%, 30%, 40%', ar: '30%، 30%، 40%' },
        { key: 'b', en: '20%, 40%, 40%', ar: '20%، 40%، 40%' },
        { key: 'c', en: '15%, 25%, 60%', ar: '15%، 25%، 60%' },
        { key: 'd', en: '7%, 38%, 55%', ar: '7%، 38%، 55%' }
      ],
      correct: 'd'
    },
    {
      id: 'q9',
      en: 'How does harmony in communication increase our influence?',
      ar: 'كيف يزيد الانسجام في التواصل من تأثيرنا؟',
      options: [
        { key: 'a', en: 'By speaking faster and with more energy', ar: 'بالتحدث بسرعة أكبر وبطاقة أعلى' },
        { key: 'b', en: 'By repeating key messages three times', ar: 'بتكرار الرسائل الرئيسية ثلاث مرات' },
        { key: 'c', en: 'By using formal language and titles', ar: 'باستخدام لغة رسمية وألقاب' },
        { key: 'd', en: 'By aligning words, tone, and body language together', ar: 'بمواءمة الكلمات والنبرة ولغة الجسد معاً' }
      ],
      correct: 'd'
    },
    {
      id: 'q10',
      en: 'What does an objection from a customer mean?',
      ar: 'ماذا يعني اعتراض العميل؟',
      options: [
        { key: 'a', en: 'The customer is not interested', ar: 'العميل غير مهتم' },
        { key: 'b', en: 'The customer wants a discount', ar: 'العميل يريد تخفيضاً' },
        { key: 'c', en: 'The visit has failed', ar: 'الزيارة قد فشلت' },
        { key: 'd', en: 'An opportunity to understand and respond', ar: 'فرصة للفهم والرد' }
      ],
      correct: 'd'
    },
    {
      id: 'q11',
      en: 'What is the first step to handle an objection?',
      ar: 'ما هي الخطوة الأولى للتعامل مع الاعتراض؟',
      options: [
        { key: 'a', en: 'Immediately provide more product information', ar: 'تقديم معلومات إضافية عن المنتج فوراً' },
        { key: 'b', en: 'Apologize and offer a solution', ar: 'الاعتذار وتقديم حل' },
        { key: 'c', en: 'Agree with the customer and move on', ar: 'الموافقة مع العميل والمضي قدماً' },
        { key: 'd', en: 'Ask a question to clarify the objection', ar: 'طرح سؤال لتوضيح الاعتراض' }
      ],
      correct: 'd'
    },
    {
      id: 'q12',
      en: 'Why do you need to know the social style of a customer?',
      ar: 'لماذا تحتاج إلى معرفة الأسلوب الاجتماعي للعميل؟',
      options: [
        { key: 'a', en: 'To decide how long the visit should be', ar: 'لتحديد مدة الزيارة' },
        { key: 'b', en: 'To know what products to bring', ar: 'لمعرفة المنتجات التي تحضرها' },
        { key: 'c', en: 'To determine their budget level', ar: 'لتحديد مستوى ميزانيتهم' },
        { key: 'd', en: 'To provide effective tailored solutions', ar: 'لتقديم حلول فعّالة ومخصصة' }
      ],
      correct: 'd'
    }
  ];
  ```

- [ ] **Step 3: Write js/i18n.js**

  ```javascript
  const I18N = {
    en: {
      pageTitle: 'Post-Training Assessment',
      headerTitle: 'Sales & Communication Skills',
      headerSubtitle: 'Post-Training Assessment',
      langToggle: 'عر',
      // Registration
      regTitle: 'Welcome',
      regSubtitle: 'Please register to begin the assessment.',
      namePlaceholder: 'Full Name',
      mobilePlaceholder: 'Mobile Number (07XXXXXXXXX)',
      nameRequired: 'Please enter your full name.',
      mobileInvalid: 'Please enter a valid Iraqi mobile number (07XXXXXXXXX).',
      mobileExists: 'This mobile number has already submitted the assessment.',
      startBtn: 'Start Assessment',
      // MCQ
      questionOf: 'Question {n} of 12',
      nextBtn: 'Next',
      prevBtn: 'Back',
      // Open questions
      openTitle: 'Open Questions',
      openQ1: 'What was the most interesting topic in the workshop?',
      openQ2: 'What topics would you like to learn more about in the future?',
      openQ3: 'What problems or obstacles prevent you from being successful in your career?',
      openPlaceholder: 'Write your answer here...',
      submitBtn: 'Submit Assessment',
      submitting: 'Submitting...',
      // Results
      resultsTitle: 'Your Results',
      scoreLabel: 'Your Score',
      outOf: 'out of 12',
      gradeExcellent: 'Excellent work! You have strong potential.',
      gradeGood: 'Good effort. Keep developing your skills.',
      gradeNeedsWork: 'Keep learning. Practice makes perfect.',
      correctLabel: 'Correct answer:',
      yourAnswerLabel: 'Your answer:',
      thankYouTitle: 'Thank You!',
      thankYouMsg: 'Your assessment has been submitted successfully.',
      // Errors
      submitError: 'Something went wrong. Please try again.',
      allAnswersRequired: 'Please answer all questions before submitting.',
    },
    ar: {
      pageTitle: 'تقييم ما بعد التدريب',
      headerTitle: 'مهارات البيع والتواصل',
      headerSubtitle: 'تقييم ما بعد التدريب',
      langToggle: 'EN',
      // Registration
      regTitle: 'أهلاً بك',
      regSubtitle: 'يرجى التسجيل للبدء في التقييم.',
      namePlaceholder: 'الاسم الكامل',
      mobilePlaceholder: 'رقم الهاتف (07XXXXXXXXX)',
      nameRequired: 'يرجى إدخال اسمك الكامل.',
      mobileInvalid: 'يرجى إدخال رقم هاتف عراقي صحيح (07XXXXXXXXX).',
      mobileExists: 'تم تقديم التقييم بهذا الرقم مسبقاً.',
      startBtn: 'ابدأ التقييم',
      // MCQ
      questionOf: 'سؤال {n} من 12',
      nextBtn: 'التالي',
      prevBtn: 'السابق',
      // Open questions
      openTitle: 'أسئلة مفتوحة',
      openQ1: 'ما الموضوع الأكثر إثارة للاهتمام في ورشة العمل؟',
      openQ2: 'ما الموضوعات التي تريد تعلمها في المستقبل؟',
      openQ3: 'ما المشكلات أو العقبات التي تمنعك من النجاح في مسيرتك المهنية؟',
      openPlaceholder: 'اكتب إجابتك هنا...',
      submitBtn: 'إرسال التقييم',
      submitting: 'جاري الإرسال...',
      // Results
      resultsTitle: 'نتائجك',
      scoreLabel: 'درجتك',
      outOf: 'من 12',
      gradeExcellent: 'ممتاز! لديك إمكانات قوية.',
      gradeGood: 'جيد. استمر في تطوير مهاراتك.',
      gradeNeedsWork: 'استمر في التعلم. التكرار مفتاح النجاح.',
      correctLabel: 'الإجابة الصحيحة:',
      yourAnswerLabel: 'إجابتك:',
      thankYouTitle: 'شكراً لك!',
      thankYouMsg: 'تم إرسال تقييمك بنجاح.',
      submitError: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
      allAnswersRequired: 'يرجى الإجابة على جميع الأسئلة قبل الإرسال.',
    }
  };

  function t(key, lang, vars = {}) {
    let str = (I18N[lang] || I18N.en)[key] || key;
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
    return str;
  }
  ```

- [ ] **Step 4: Write css/style.css**

  ```css
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: #2563EB;
    --primary-dark: #1D4ED8;
    --success: #16A34A;
    --warning: #D97706;
    --danger: #DC2626;
    --bg: #F8FAFC;
    --card: #FFFFFF;
    --text: #1E293B;
    --muted: #64748B;
    --border: #E2E8F0;
    --radius: 12px;
    --shadow: 0 2px 16px rgba(0,0,0,0.08);
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    font-size: 16px;
    line-height: 1.6;
  }

  [dir="rtl"] body, [dir="rtl"] * { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }

  /* Header */
  .app-header {
    background: var(--primary);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .app-header h1 { font-size: 1rem; font-weight: 700; }
  .app-header p { font-size: 0.75rem; opacity: 0.85; }
  .lang-btn {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.4);
    color: white;
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Container */
  .container { max-width: 600px; margin: 0 auto; padding: 20px 16px; }

  /* Card */
  .card {
    background: var(--card);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 24px 20px;
    margin-bottom: 16px;
  }

  /* Form */
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem; }
  .form-group input, .form-group textarea {
    width: 100%;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
    background: #fff;
  }
  .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }
  .form-group textarea { min-height: 100px; resize: vertical; }
  .field-error { color: var(--danger); font-size: 0.8rem; margin-top: 4px; display: none; }
  .field-error.visible { display: block; }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;
    width: 100%;
  }
  .btn-primary { background: var(--primary); color: white; }
  .btn-primary:hover { background: var(--primary-dark); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-outline { background: transparent; border: 1.5px solid var(--border); color: var(--text); }
  .btn-sm { padding: 8px 16px; font-size: 0.85rem; width: auto; }

  /* Progress bar */
  .progress-wrap { margin-bottom: 20px; }
  .progress-label { font-size: 0.8rem; color: var(--muted); margin-bottom: 6px; }
  .progress-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--primary); border-radius: 3px; transition: width 0.3s; }

  /* Question */
  .question-text { font-size: 1.05rem; font-weight: 600; margin-bottom: 16px; line-height: 1.5; }
  .options-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .option-item label {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    font-size: 0.95rem;
  }
  .option-item input[type="radio"] { display: none; }
  .option-item input[type="radio"]:checked + label {
    border-color: var(--primary);
    background: #EFF6FF;
  }
  .option-key {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: var(--border);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.8rem;
    flex-shrink: 0;
  }
  .option-item input[type="radio"]:checked ~ label .option-key {
    background: var(--primary);
    color: white;
  }

  /* Nav buttons */
  .nav-buttons { display: flex; gap: 10px; margin-top: 20px; }
  .nav-buttons .btn { flex: 1; }

  /* Results */
  .score-circle {
    width: 120px; height: 120px;
    border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    font-weight: 700;
  }
  .score-circle.green { background: #DCFCE7; color: var(--success); }
  .score-circle.amber { background: #FEF3C7; color: var(--warning); }
  .score-circle.red { background: #FEE2E2; color: var(--danger); }
  .score-num { font-size: 2rem; line-height: 1; }
  .score-sub { font-size: 0.75rem; opacity: 0.8; }

  .result-item {
    padding: 12px 14px;
    border-radius: 8px;
    margin-bottom: 8px;
    border-left: 4px solid transparent;
  }
  .result-item.correct { background: #F0FDF4; border-color: var(--success); }
  .result-item.wrong { background: #FFF1F2; border-color: var(--danger); }
  .result-item .result-q { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
  .result-item .result-detail { font-size: 0.82rem; color: var(--muted); }
  .result-icon { margin-right: 6px; }

  [dir="rtl"] .result-item { border-left: none; border-right: 4px solid transparent; }
  [dir="rtl"] .result-item.correct { border-right-color: var(--success); }
  [dir="rtl"] .result-item.wrong { border-right-color: var(--danger); }
  [dir="rtl"] .result-icon { margin-right: 0; margin-left: 6px; }

  /* Screen visibility */
  .screen { display: none; }
  .screen.active { display: block; }

  /* Utility */
  .text-center { text-align: center; }
  .text-muted { color: var(--muted); font-size: 0.9rem; }
  .mt-8 { margin-top: 8px; }
  .mt-16 { margin-top: 16px; }
  .mb-16 { margin-bottom: 16px; }
  .error-msg { color: var(--danger); font-size: 0.85rem; text-align: center; margin-top: 8px; display: none; }
  .error-msg.visible { display: block; }

  /* ===== ADMIN STYLES ===== */
  .admin-body { background: #F1F5F9; }
  .admin-header { background: #1E293B; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
  .admin-header h1 { font-size: 1.1rem; }
  .logout-btn { background: rgba(255,255,255,0.15); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }

  .admin-container { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }

  .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
  @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
  .stat-card { background: white; border-radius: 10px; padding: 16px; box-shadow: var(--shadow); text-align: center; }
  .stat-num { font-size: 1.8rem; font-weight: 700; color: var(--primary); }
  .stat-label { font-size: 0.78rem; color: var(--muted); margin-top: 2px; }

  .filter-bar { background: white; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .filter-bar select, .filter-bar input[type="date"] {
    border: 1.5px solid var(--border); border-radius: 6px; padding: 8px 10px; font-size: 0.85rem; background: white;
  }
  .export-btn { margin-left: auto; }

  .table-wrap { background: white; border-radius: 10px; overflow: hidden; box-shadow: var(--shadow); }
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  th { background: #F8FAFC; padding: 12px 14px; text-align: left; font-weight: 600; color: var(--muted); border-bottom: 1px solid var(--border); white-space: nowrap; }
  td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #F8FAFC; cursor: pointer; }

  .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
  .badge-green { background: #DCFCE7; color: var(--success); }
  .badge-amber { background: #FEF3C7; color: var(--warning); }
  .badge-red { background: #FEE2E2; color: var(--danger); }
  .flag-icon { font-size: 1rem; }

  /* Detail Panel */
  .panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: none; }
  .panel-overlay.open { display: block; }
  .detail-panel {
    position: fixed; top: 0; right: -100%; width: min(480px, 100vw); height: 100vh;
    background: white; z-index: 201; overflow-y: auto;
    transition: right 0.3s ease; box-shadow: -4px 0 24px rgba(0,0,0,0.15);
  }
  .detail-panel.open { right: 0; }
  .panel-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .panel-close { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--muted); }
  .panel-body { padding: 20px; }
  .panel-section { margin-bottom: 20px; }
  .panel-section h3 { font-size: 0.85rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }

  .answer-row { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.88rem; }
  .answer-row:last-child { border: none; }
  .answer-correct { color: var(--success); }
  .answer-wrong { color: var(--danger); }

  .flag-toggle { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .toggle-switch { position: relative; width: 44px; height: 24px; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: var(--border); border-radius: 12px; cursor: pointer; transition: background 0.2s; }
  .toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: transform 0.2s; }
  .toggle-switch input:checked + .toggle-slider { background: var(--success); }
  .toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

  .notes-textarea { width: 100%; border: 1.5px solid var(--border); border-radius: 8px; padding: 10px 12px; font-size: 0.9rem; min-height: 80px; resize: vertical; }
  .notes-textarea:focus { outline: none; border-color: var(--primary); }

  /* Login */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .login-card { background: white; border-radius: var(--radius); padding: 32px 28px; width: 100%; max-width: 380px; box-shadow: var(--shadow); }
  .login-card h2 { font-size: 1.3rem; margin-bottom: 4px; }
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add js/supabase-config.js js/questions.js js/i18n.js css/style.css
  git commit -m "feat: add shared assets — supabase config, translations, questions, styles"
  ```

---

## Task 4: Assessment Page — Registration Screen (index.html)

**Files:**
- Create: `index.html`
- Modify: `js/assessment.js`

- [ ] **Step 1: Write index.html structure**

  ```html
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Post-Training Assessment</title>
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body>
    <header class="app-header">
      <div>
        <h1 id="headerTitle">Sales &amp; Communication Skills</h1>
        <p id="headerSubtitle">Post-Training Assessment</p>
      </div>
      <button class="lang-btn" id="langBtn" onclick="toggleLang()">عر</button>
    </header>

    <div class="container">

      <!-- Screen 1: Registration -->
      <div class="screen active" id="screenReg">
        <div class="card">
          <h2 class="mb-16" id="regTitle">Welcome</h2>
          <p class="text-muted mb-16" id="regSubtitle">Please register to begin the assessment.</p>
          <div class="form-group">
            <label id="nameLabel">Full Name</label>
            <input type="text" id="nameInput" placeholder="Full Name" autocomplete="name" />
            <div class="field-error" id="nameError"></div>
          </div>
          <div class="form-group">
            <label id="mobileLabel">Mobile Number</label>
            <input type="tel" id="mobileInput" placeholder="07XXXXXXXXX" maxlength="11" />
            <div class="field-error" id="mobileError"></div>
          </div>
          <button class="btn btn-primary" id="startBtn" onclick="handleStart()">Start Assessment</button>
          <div class="error-msg" id="regGlobalError"></div>
        </div>
      </div>

      <!-- Screen 2: MCQ -->
      <div class="screen" id="screenMCQ">
        <div class="progress-wrap">
          <div class="progress-label" id="progressLabel">Question 1 of 12</div>
          <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:8%"></div></div>
        </div>
        <div class="card">
          <p class="question-text" id="questionText"></p>
          <ul class="options-list" id="optionsList"></ul>
          <div class="nav-buttons">
            <button class="btn btn-outline" id="prevBtn" onclick="prevQuestion()">Back</button>
            <button class="btn btn-primary" id="nextBtn" onclick="nextQuestion()">Next</button>
          </div>
        </div>
      </div>

      <!-- Screen 3: Open Questions -->
      <div class="screen" id="screenOpen">
        <div class="card">
          <h2 class="mb-16" id="openTitle">Open Questions</h2>
          <div class="form-group">
            <label id="openQ1Label"></label>
            <textarea id="openQ1" placeholder=""></textarea>
          </div>
          <div class="form-group">
            <label id="openQ2Label"></label>
            <textarea id="openQ2" placeholder=""></textarea>
          </div>
          <div class="form-group">
            <label id="openQ3Label"></label>
            <textarea id="openQ3" placeholder=""></textarea>
          </div>
          <button class="btn btn-primary" id="submitBtn" onclick="handleSubmit()">Submit Assessment</button>
          <div class="error-msg" id="submitError"></div>
        </div>
      </div>

      <!-- Screen 4: Results -->
      <div class="screen" id="screenResults">
        <div class="card text-center">
          <h2 id="resultsTitle" class="mb-16">Your Results</h2>
          <div class="score-circle" id="scoreCircle">
            <div class="score-num" id="scoreNum"></div>
            <div class="score-sub" id="scoreOut"></div>
          </div>
          <p id="scorePct" style="font-size:1.4rem;font-weight:700;margin-bottom:8px;"></p>
          <p class="text-muted" id="gradeMsg"></p>
        </div>
        <div id="resultsList"></div>
        <div class="card text-center mt-16">
          <h3 id="thankYouTitle">Thank You!</h3>
          <p class="text-muted mt-8" id="thankYouMsg">Your assessment has been submitted successfully.</p>
        </div>
      </div>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-config.js"></script>
    <script src="js/i18n.js"></script>
    <script src="js/questions.js"></script>
    <script src="js/assessment.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Write js/assessment.js — state + lang + registration**

  ```javascript
  // State
  let lang = localStorage.getItem('lang') || 'en';
  let currentQ = 0;
  const answers = {}; // { q1: 'b', q2: 'a', ... }
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
    if (currentQ >= 0) renderQuestion(currentQ);
  }

  // ── Screens ───────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ── Validation ────────────────────────────────────
  function validateMobile(m) { return /^07\d{9}$/.test(m); }

  // ── Registration ──────────────────────────────────
  async function handleStart() {
    const nameVal = document.getElementById('nameInput').value.trim();
    const mobileVal = document.getElementById('mobileInput').value.trim();
    const nameErr = document.getElementById('nameError');
    const mobileErr = document.getElementById('mobileError');
    const globalErr = document.getElementById('regGlobalError');
    let valid = true;

    nameErr.textContent = '';
    nameErr.classList.remove('visible');
    mobileErr.textContent = '';
    mobileErr.classList.remove('visible');
    globalErr.classList.remove('visible');

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
    btn.textContent = '...';

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
    renderQuestion(0);
  }

  // Init
  applyLang();
  ```

- [ ] **Step 3: Manual verification**

  Open `index.html` in browser. Confirm:
  - Language toggle switches EN↔AR and flips RTL
  - Empty name → shows name error
  - Invalid mobile (e.g., `123`) → shows mobile error
  - Valid mobile that's already in Supabase → shows "already submitted" (test by inserting a row directly in Supabase first)

- [ ] **Step 4: Commit**

  ```bash
  git add index.html js/assessment.js
  git commit -m "feat: assessment registration screen with mobile duplicate check"
  ```

---

## Task 5: Assessment Page — MCQ + Open Questions

**Files:**
- Modify: `js/assessment.js`

- [ ] **Step 1: Append MCQ rendering to js/assessment.js**

  ```javascript
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
      const checked = answers[q.id] === opt.key ? 'checked' : '';
      li.innerHTML = `
        <input type="radio" name="q" id="opt_${opt.key}" value="${opt.key}" ${checked}
          onchange="answers['${q.id}'] = '${opt.key}'" />
        <label for="opt_${opt.key}">
          <span class="option-key">${opt.key.toUpperCase()}</span>
          ${opt[lang] || opt.en}
        </label>`;
      list.appendChild(li);
    });

    document.getElementById('prevBtn').style.display = index === 0 ? 'none' : '';
    document.getElementById('nextBtn').textContent =
      index === total - 1 ? t('nextBtn', lang) : t('nextBtn', lang);
  }

  function prevQuestion() {
    if (currentQ > 0) { currentQ--; renderQuestion(currentQ); }
  }

  function nextQuestion() {
    const q = QUESTIONS[currentQ];
    if (!answers[q.id]) {
      // highlight unanswered — shake the options
      document.getElementById('optionsList').style.animation = 'none';
      setTimeout(() => document.getElementById('optionsList').style.animation = '', 10);
      return;
    }
    if (currentQ < QUESTIONS.length - 1) {
      currentQ++;
      renderQuestion(currentQ);
    } else {
      showScreen('screenOpen');
    }
  }
  ```

- [ ] **Step 2: Manual verification**

  Reload the page, complete registration with a fresh mobile number (or temporarily bypass the Supabase check). Verify:
  - Questions render in correct language
  - Selecting an option highlights it
  - Back/Next navigation works
  - Clicking Next without selecting an option does not advance
  - After Q12 Next → open questions screen appears

- [ ] **Step 3: Commit**

  ```bash
  git add js/assessment.js
  git commit -m "feat: MCQ question rendering and navigation"
  ```

---

## Task 6: Assessment Page — Submit + Results

**Files:**
- Modify: `js/assessment.js`

- [ ] **Step 1: Append scoring + submit + results to js/assessment.js**

  ```javascript
  // ── Scoring ───────────────────────────────────────
  function calculateScore() {
    let score = 0;
    QUESTIONS.forEach(q => { if (answers[q.id] === q.correct) score++; });
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

    const circle = document.getElementById('scoreCircle');
    circle.className = 'score-circle ' + (score_pct >= 70 ? 'green' : score_pct >= 50 ? 'amber' : 'red');
    document.getElementById('scoreNum').textContent = score;
    document.getElementById('scoreOut').textContent = t('outOf', lang);
    document.getElementById('scorePct').textContent = score_pct + '%';

    const grade = score_pct >= 70 ? 'gradeExcellent' : score_pct >= 50 ? 'gradeGood' : 'gradeNeedsWork';
    document.getElementById('gradeMsg').textContent = t(grade, lang);

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
      div.className = `result-item ${isCorrect ? 'correct' : 'wrong'}`;
      div.innerHTML = `
        <div class="result-q">
          <span class="result-icon">${isCorrect ? '✓' : '✗'}</span>
          ${q[lang] || q.en}
        </div>
        ${!isCorrect ? `
          <div class="result-detail">
            ${t('yourAnswerLabel', lang)} ${yourOpt ? (yourOpt[lang] || yourOpt.en) : '—'}<br/>
            ${t('correctLabel', lang)} <strong>${correctOpt[lang] || correctOpt.en}</strong>
          </div>` : ''}`;
      list.appendChild(div);
    });
  }
  ```

- [ ] **Step 2: Manual verification**

  Complete a full run (use a new mobile number each time or clear the Supabase row):
  - Submit → check Supabase dashboard that a row was created with correct score, answers, auto_flagged value
  - Score circle is green for ≥70%, amber for 50-69%, red for <50%
  - Wrong answers show the correct answer text below
  - Using same mobile a second time → blocked at registration

- [ ] **Step 3: Commit**

  ```bash
  git add js/assessment.js
  git commit -m "feat: assessment submit, scoring, and results screen"
  ```

---

## Task 7: Admin Page — Login + Stats + Table

**Files:**
- Create: `admin.html`
- Create: `js/admin.js`

- [ ] **Step 1: Write admin.html**

  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin — Post-Training Assessment</title>
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body class="admin-body">

    <!-- Login -->
    <div id="loginWrap" class="login-wrap">
      <div class="login-card">
        <h2>Admin Login</h2>
        <p class="text-muted mt-8 mb-16">Post-Training Assessment</p>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="loginEmail" value="shadi@psychologytobusiness.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="loginPassword" />
        </div>
        <button class="btn btn-primary" onclick="handleLogin()">Login</button>
        <div class="error-msg" id="loginError"></div>
      </div>
    </div>

    <!-- Dashboard -->
    <div id="dashboard" style="display:none">
      <header class="admin-header">
        <h1>Post-Training Assessment — Dashboard</h1>
        <button class="logout-btn" onclick="handleLogout()">Logout</button>
      </header>

      <div class="admin-container">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-num" id="statTotal">—</div><div class="stat-label">Total Submissions</div></div>
          <div class="stat-card"><div class="stat-num" id="statAvg">—</div><div class="stat-label">Avg Score</div></div>
          <div class="stat-card"><div class="stat-num" id="statAutoFlag">—</div><div class="stat-label">Auto-Flagged</div></div>
          <div class="stat-card"><div class="stat-num" id="statTrainerFlag">—</div><div class="stat-label">Trainer-Flagged</div></div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
          <label style="font-size:.85rem;font-weight:600">From</label>
          <input type="date" id="filterFrom" onchange="applyFilters()" />
          <label style="font-size:.85rem;font-weight:600">To</label>
          <input type="date" id="filterTo" onchange="applyFilters()" />
          <select id="filterScore" onchange="applyFilters()">
            <option value="all">All Scores</option>
            <option value="pass">≥70% (Pass)</option>
            <option value="fail">&lt;70% (Below)</option>
          </select>
          <select id="filterFlag" onchange="applyFilters()">
            <option value="all">All Flags</option>
            <option value="auto">Auto-Flagged</option>
            <option value="trainer">Trainer-Flagged</option>
            <option value="either">Either Flag</option>
          </select>
          <button class="btn btn-outline btn-sm export-btn" onclick="exportCSV()">Export CSV</button>
        </div>

        <!-- Table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Score</th>
                <th>Auto ⚑</th>
                <th>Trainer ⚑</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
          <div id="tableEmpty" style="text-align:center;padding:32px;color:#64748B;display:none">No submissions found.</div>
        </div>
      </div>
    </div>

    <!-- Detail Panel -->
    <div class="panel-overlay" id="panelOverlay" onclick="closePanel()"></div>
    <div class="detail-panel" id="detailPanel">
      <div class="panel-header">
        <div>
          <strong id="panelName"></strong>
          <div style="font-size:.82rem;color:#64748B" id="panelMobile"></div>
        </div>
        <button class="panel-close" onclick="closePanel()">✕</button>
      </div>
      <div class="panel-body">
        <div class="panel-section">
          <h3>Score</h3>
          <div id="panelScore" style="font-size:1.4rem;font-weight:700"></div>
        </div>
        <div class="panel-section">
          <h3>MCQ Answers</h3>
          <div id="panelAnswers"></div>
        </div>
        <div class="panel-section">
          <h3>Open Questions</h3>
          <div id="panelOpen"></div>
        </div>
        <div class="panel-section">
          <h3>Trainer Actions</h3>
          <div class="flag-toggle">
            <label class="toggle-switch">
              <input type="checkbox" id="panelTrainerFlag" onchange="saveTrainerFlag()" />
              <span class="toggle-slider"></span>
            </label>
            <span>Trainer Flag</span>
          </div>
          <textarea class="notes-textarea" id="panelNotes" placeholder="Add notes about this candidate..."></textarea>
          <button class="btn btn-primary btn-sm mt-8" style="width:auto" onclick="saveNotes()">Save Notes</button>
          <button class="btn btn-outline btn-sm mt-8" style="width:auto;margin-left:8px" onclick="copyMobile()">📋 Copy Mobile</button>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/supabase-config.js"></script>
    <script src="js/questions.js"></script>
    <script src="js/admin.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Write js/admin.js — auth + data fetch + stats + table**

  ```javascript
  let allSubmissions = [];
  let filtered = [];
  let activeRow = null;

  // ── Auth ──────────────────────────────────────────
  async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
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

    if (error) { console.error(error); return; }
    allSubmissions = data || [];
    applyFilters();
    updateStats(allSubmissions);
  }

  function updateStats(rows) {
    document.getElementById('statTotal').textContent = rows.length;
    const avg = rows.length
      ? Math.round(rows.reduce((s, r) => s + r.score_pct, 0) / rows.length)
      : 0;
    document.getElementById('statAvg').textContent = avg + '%';
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

    if (!rows.length) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    rows.forEach(r => {
      const scoreClass = r.score_pct >= 70 ? 'badge-green' : r.score_pct >= 50 ? 'badge-amber' : 'badge-red';
      const date = new Date(r.created_at).toLocaleDateString('en-GB');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.mobile}</td>
        <td><span class="badge ${scoreClass}">${r.score}/12 (${r.score_pct}%)</span></td>
        <td>${r.auto_flagged ? '<span class="flag-icon">⚑</span>' : '—'}</td>
        <td>${r.trainer_flagged ? '<span class="flag-icon" style="color:#D97706">⚑</span>' : '—'}</td>
        <td>${date}</td>`;
      tr.onclick = () => openPanel(r);
      tbody.appendChild(tr);
    });
  }

  // ── CSV Export ────────────────────────────────────
  function exportCSV() {
    const headers = ['Name', 'Mobile', 'Score', 'Score%', 'Auto-Flagged', 'Trainer-Flagged', 'Date', 'Open Q1', 'Open Q2', 'Open Q3', 'Notes'];
    const rows = filtered.map(r => [
      r.name, r.mobile, r.score, r.score_pct,
      r.auto_flagged ? 'Yes' : 'No',
      r.trainer_flagged ? 'Yes' : 'No',
      new Date(r.created_at).toLocaleDateString('en-GB'),
      r.open_q1, r.open_q2, r.open_q3, r.trainer_notes
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`));

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `assessment-results-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  // Init
  checkSession();
  ```

- [ ] **Step 3: Manual verification**

  Open `admin.html` in browser:
  - Login with admin credentials → dashboard appears
  - Stats cards show correct counts
  - Table lists submissions from Supabase
  - Filters narrow the table correctly
  - Export CSV downloads a valid file

- [ ] **Step 4: Commit**

  ```bash
  git add admin.html js/admin.js
  git commit -m "feat: admin login, stats dashboard, submissions table, CSV export"
  ```

---

## Task 8: Admin Detail Panel

**Files:**
- Modify: `js/admin.js`

- [ ] **Step 1: Append panel logic to js/admin.js**

  ```javascript
  // ── Detail Panel ──────────────────────────────────
  function openPanel(row) {
    activeRow = row;

    document.getElementById('panelName').textContent = row.name;
    document.getElementById('panelMobile').textContent = row.mobile;

    const scoreClass = row.score_pct >= 70 ? 'green' : row.score_pct >= 50 ? 'amber' : 'red';
    const colors = { green: '#16A34A', amber: '#D97706', red: '#DC2626' };
    document.getElementById('panelScore').textContent = `${row.score}/12 — ${row.score_pct}%`;
    document.getElementById('panelScore').style.color = colors[scoreClass];

    // MCQ answers
    const answersEl = document.getElementById('panelAnswers');
    answersEl.innerHTML = '';
    QUESTIONS.forEach(q => {
      const userKey = row.answers[q.id];
      const isCorrect = userKey === q.correct;
      const userOpt = q.options.find(o => o.key === userKey);
      const div = document.createElement('div');
      div.className = 'answer-row';
      div.innerHTML = `
        <span class="${isCorrect ? 'answer-correct' : 'answer-wrong'}">${isCorrect ? '✓' : '✗'}</span>
        <strong> ${q.en}</strong><br/>
        <span style="font-size:.82rem;color:#64748B">
          ${userOpt ? userOpt.en : '—'}${!isCorrect ? ` → <em>${q.options.find(o=>o.key===q.correct)?.en}</em>` : ''}
        </span>`;
      answersEl.appendChild(div);
    });

    // Open questions
    document.getElementById('panelOpen').innerHTML = `
      <p style="font-size:.85rem"><strong>Q1:</strong> ${row.open_q1 || '—'}</p>
      <p style="font-size:.85rem;margin-top:8px"><strong>Q2:</strong> ${row.open_q2 || '—'}</p>
      <p style="font-size:.85rem;margin-top:8px"><strong>Q3:</strong> ${row.open_q3 || '—'}</p>`;

    document.getElementById('panelTrainerFlag').checked = row.trainer_flagged;
    document.getElementById('panelNotes').value = row.trainer_notes || '';

    document.getElementById('panelOverlay').classList.add('open');
    document.getElementById('detailPanel').classList.add('open');
  }

  function closePanel() {
    document.getElementById('panelOverlay').classList.remove('open');
    document.getElementById('detailPanel').classList.remove('open');
    activeRow = null;
  }

  async function saveTrainerFlag() {
    if (!activeRow) return;
    const flagged = document.getElementById('panelTrainerFlag').checked;
    await db.from('submissions').update({ trainer_flagged: flagged }).eq('id', activeRow.id);
    activeRow.trainer_flagged = flagged;
    // Refresh row in table
    const idx = allSubmissions.findIndex(r => r.id === activeRow.id);
    if (idx >= 0) allSubmissions[idx].trainer_flagged = flagged;
    applyFilters();
  }

  async function saveNotes() {
    if (!activeRow) return;
    const notes = document.getElementById('panelNotes').value.trim();
    await db.from('submissions').update({ trainer_notes: notes }).eq('id', activeRow.id);
    activeRow.trainer_notes = notes;
    const idx = allSubmissions.findIndex(r => r.id === activeRow.id);
    if (idx >= 0) allSubmissions[idx].trainer_notes = notes;
  }

  function copyMobile() {
    if (!activeRow) return;
    navigator.clipboard.writeText(activeRow.mobile);
  }
  ```

- [ ] **Step 2: Manual verification**

  - Click any table row → panel slides in
  - MCQ answers show ✓/✗ with correct answer for wrong ones
  - Open questions display correctly
  - Toggle trainer flag → row in table updates
  - Save Notes → persists in Supabase (reload to confirm)
  - Copy Mobile → clipboard has the number
  - Click overlay or ✕ → panel closes

- [ ] **Step 3: Commit**

  ```bash
  git add js/admin.js
  git commit -m "feat: admin detail panel with answers, trainer flag, notes, copy mobile"
  ```

---

## Task 9: Deploy + Final Verification

**Files:** None (deploy)

- [ ] **Step 1: Push all changes**

  ```bash
  git push origin main
  ```

- [ ] **Step 2: Verify Netlify deploy**

  Go to Netlify dashboard → check deploy succeeded (green). Open the Netlify URL.

- [ ] **Step 3: End-to-end test on mobile**

  Open the Netlify URL on a real phone:
  - Complete full participant flow in English → submit → verify row in Supabase
  - Complete full participant flow in Arabic → submit → verify row
  - Try same mobile again → blocked at registration
  - Open `/admin.html` → login → see both submissions → open panel → toggle trainer flag → export CSV

- [ ] **Step 4: Final commit**

  ```bash
  git add .
  git commit -m "chore: deployment verified, assessment tool live"
  ```

---

## Spec Coverage Check

| Spec Requirement | Covered in Task |
|-----------------|----------------|
| Participant registration (name + mobile) | Task 4 |
| Iraqi mobile validation | Task 4 |
| Mobile duplicate guard (RPC) | Task 1 + Task 4 |
| 12 MCQ with 4 options + correct answer | Task 3 |
| 3 open-ended questions | Task 5 |
| Bilingual EN/AR toggle + RTL | Task 3 + Task 4 |
| Score calculation (out of 12) | Task 6 |
| Auto-flag at ≥70% | Task 6 |
| Instant results + correct answers revealed | Task 6 |
| Color-coded score (green/amber/red) | Task 6 |
| Supabase RLS (anon insert only) | Task 1 |
| Admin login (Supabase Auth) | Task 7 |
| Stats bar | Task 7 |
| Filters (date, score, flag) | Task 7 |
| Submissions table | Task 7 |
| CSV export | Task 7 |
| Detail panel (full answers) | Task 8 |
| Trainer flag toggle | Task 8 |
| Trainer notes | Task 8 |
| Copy mobile button | Task 8 |
| Netlify deploy + GitHub | Task 2 + Task 9 |
