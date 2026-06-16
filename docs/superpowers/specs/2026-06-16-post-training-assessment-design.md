# Post-Training Assessment Tool — Design Spec
**Date:** 2026-06-16  
**Status:** Approved

---

## Overview

A bilingual (EN/AR) mobile-first digital assessment tool for newly graduated Iraqi pharmacists who completed a selling skills + communication skills workshop. Dual purpose: measure knowledge retention and identify strong candidates for pharma medical rep roles.

---

## Architecture

**Stack:** Two-file static site (vanilla JS + Supabase JS SDK) deployed to Netlify via GitHub.

```
post-training-assessment/
├── assessment.html       # participant-facing (public)
├── admin.html            # trainer dashboard (Supabase Auth gated)
└── supabase-config.js    # shared Supabase client init
```

**Hosting:** Netlify (static), auto-deploy from GitHub push.  
**Database:** Supabase (PostgreSQL + RLS + Auth).  
**Auth:** Supabase Auth — admin only (email/password). Participants have no account; mobile number used as unique submission key.

---

## Data Model

**Table: `submissions`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto |
| created_at | timestamp | auto |
| name | text | participant full name |
| mobile | text | Iraqi format 07XX-XXX-XXXX, UNIQUE constraint |
| lang | text | 'en' or 'ar' |
| answers | jsonb | `{ q1: 'b', q2: 'a', ... }` keyed q1–q12 |
| open_q1 | text | most interesting topic |
| open_q2 | text | topics for future learning |
| open_q3 | text | obstacles to career success |
| score | int | raw score out of 12 |
| score_pct | int | 0–100 |
| auto_flagged | boolean | true if score_pct >= 70 |
| trainer_flagged | boolean | manual trainer override |
| trainer_notes | text | trainer annotations |

**RLS Policy:**
- `anon` role: INSERT only, no SELECT (participants can submit, cannot read others)
- `authenticated` role (admin): full SELECT, UPDATE on trainer_flagged + trainer_notes

---

## Participant Flow (`assessment.html`)

### Screen 1 — Registration
- Language toggle top-right: `EN | عر`
- Name input (required)
- Mobile input (required, validated: starts with 07, exactly 11 digits)
- Duplicate check: if mobile already submitted → show "Already submitted" message, block re-entry
- "Start Assessment" CTA

### Screen 2 — MCQ Questions
- Single scrollable page, mobile-first layout
- Progress bar at top (X / 12)
- 12 questions, 4 options each (A–D), radio select
- All questions must be answered before submit is enabled

**Questions, Options & Correct Answers (★ = correct):**

**Q1 — What do we mean by selling?**
- A) Building a long-term relationship
- B) ★ A transaction between two parties
- C) Giving free samples to doctors
- D) Presenting product features

**Q2 — What do we mean by partnership?**
- A) Selling the most units possible
- B) A one-time agreement
- C) Discounting products to keep clients
- D) ★ Equal benefits for both sides over a long time

**Q3 — What does a medical representative sell?**
- A) Products and medicines
- B) Promotions and discounts
- C) ★ Solutions to customer problems
- D) Company reputation

**Q4 — How do we gain customer confidence?**
- A) By offering the lowest price
- B) By giving more samples
- C) By knowing all product details
- D) ★ Through repetition and consistency

**Q5 — What are the characteristics of a strategic objective?**
- A) Simple, Fast, Flexible, Realistic, Tracked
- B) Specific, Modern, Achievable, Realistic, Transparent
- C) Strong, Measurable, Active, Reliable, Timed
- D) ★ Specific, Measurable, Achievable, Relevant, Time-bound (SMART)

**Q6 — What is the most important external data we need to know?**
- A) Customer needs
- B) Number of patients per doctor
- C) ★ Competitor information
- D) Social style of the customer

**Q7 — What is the golden rule in impactful communication?**
- A) Speak clearly and slowly
- B) Always smile and be polite
- C) Ask many questions
- D) ★ Find common things with the other person

**Q8 — What are the percentages of influence for words, tone, and body language?**
- A) 30%, 30%, 40%
- B) 20%, 40%, 40%
- C) 15%, 25%, 60%
- D) ★ 7%, 38%, 55%

**Q9 — How does harmony in communication increase our influence?**
- A) By speaking faster and with more energy
- B) By repeating key messages three times
- C) By using formal language and titles
- D) ★ By aligning words, tone, and body language together

**Q10 — What does an objection from a customer mean?**
- A) The customer is not interested
- B) The customer wants a discount
- C) The visit has failed
- D) ★ An opportunity to understand and respond

**Q11 — What is the first step to handle an objection?**
- A) Immediately provide more product information
- B) Apologize and offer a solution
- C) Agree with the customer and move on
- D) ★ Ask a question to clarify the objection

**Q12 — Why do you need to know the social style of a customer?**
- A) To decide how long the visit should be
- B) To know what products to bring
- C) To determine their budget level
- D) ★ To provide effective tailored solutions

### Screen 3 — Open Questions
Three text area fields:
1. What was the most interesting topic in the workshop?
2. What topics would you like to learn more about in the future?
3. What problems or obstacles prevent you from being successful in your career?

### Screen 4 — Results
- Score display: `9 / 12 — 75%`
- Color-coded: green (≥70%), amber (50–69%), red (<50%)
- Each MCQ listed with ✓ correct / ✗ wrong + correct answer shown for wrong ones
- Encouraging message regardless of score
- No re-submission (mobile is unique key)

---

## Admin Dashboard (`admin.html`)

### Login Screen
- Email + password (Supabase Auth)
- Redirects to dashboard on success

### Dashboard — Stats Bar
- Total submissions
- Average score %
- Auto-flagged count (score ≥ 70%)
- Trainer-flagged count

### Dashboard — Filters
- Date range picker
- Score filter: All / ≥70% / <70%
- Flag filter: All / Auto-flagged / Trainer-flagged / Either
- Export CSV button (applies current filters)

### Submissions Table
Columns: Name | Mobile | Score % | Auto ⚑ | Trainer ⚑ | Date | View

### Detail Panel (slide-in on row click)
- Full name, mobile, submission date, language used
- MCQ answers: each question listed with participant answer + correct/wrong indicator
- 3 open question responses in full
- Trainer flag toggle
- Trainer notes text field + Save button
- "Copy mobile" button (one-tap to copy for WhatsApp)

---

## Bilingual (EN/AR)

- Toggle in header on both pages
- All labels, questions, options, error messages, results translated
- RTL layout applied when Arabic active (`dir="rtl"` on body)
- Language preference persisted in `localStorage`

---

## Scoring Logic

```
score = count of correct MCQ answers (0–12)
score_pct = Math.round((score / 12) * 100)
auto_flagged = score_pct >= 70
```

Correct answers hardcoded in JS (not fetched from DB — no cheating vector via network inspection matters here since answers are shown post-submit anyway).

---

## Deployment

1. GitHub repo: `post-training-assessment`
2. Netlify: connect repo → auto-deploy on push
3. Supabase: create project → run table SQL → enable RLS → create admin user
4. Environment: Supabase URL + anon key injected into `supabase-config.js`

---

## Out of Scope

- Participant accounts / login
- Question randomization
- Time limit
- Multiple workshops / sessions tracking
- PDF certificate generation
