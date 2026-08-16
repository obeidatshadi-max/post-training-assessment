# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A bilingual (EN/AR) mobile-first static web app for administering a post-training sales/communication skills assessment to newly graduated Iraqi pharmacists, and a trainer admin dashboard for reviewing results. Built for a single client/use case, not a general-purpose product.

## Commands

This is a zero-build static site — there is no `package.json`, bundler, linter, or test suite.

- **Run locally:** serve the repo root over HTTP (opening `index.html` via `file://` breaks the Supabase script and RPC calls under some browsers' CORS rules). E.g. `python3 -m http.server 8000` from the repo root, then visit `http://localhost:8000/index.html` and `http://localhost:8000/admin.html`.
- **Deploy:** push to `main` — Netlify auto-deploys from GitHub with no build command and publish directory `.`. There is no staging environment or CI.
- **Database changes:** made directly in the Supabase SQL editor / dashboard for the project referenced in `js/supabase-config.js`, not via migration files in this repo.

## Architecture

### Pages and shared modules

Two independent static HTML entry points share the same CSS and JS modules, loaded via `<script>` tags in a fixed order (no bundler, no ES modules — everything is a global):

- `index.html` — participant-facing assessment (registration → MCQ → open questions → results). Loads `supabase-config.js` → `i18n.js` → `questions.js` → `assessment.js`.
- `admin.html` — trainer dashboard (login → stats → filterable table → detail panel). Loads `supabase-config.js` → `questions.js` → `admin.js` (no `i18n.js` — admin UI is English-only).
- `qr.html` — standalone, self-contained page (inline `<style>`/`<script>`) that generates and prints/downloads a QR code linking to the deployed assessment URL via `api.qrserver.com`. Unrelated to the other two pages and not linked from them except conceptually (used for print handouts).
- `css/style.css` — single shared stylesheet for both `index.html` and `admin.html`, mobile-first with a `:root` custom-property palette and `[dir="rtl"]` overrides for Arabic. Admin-only styles are grouped under an `/* ===== ADMIN STYLES ===== */` block at the bottom.

Because scripts are plain globals loaded in sequence, load order matters: `questions.js` must precede any file that reads `QUESTIONS`, and `i18n.js` must precede any file that calls `t()`.

### Participant flow (`js/assessment.js`)

Single-page, four "screens" toggled via a `.screen` / `.screen.active` class flip (`showScreen(id)`) rather than routing:

1. **Registration** — name + (mobile OR email, at least one required). Mobile must match `/^07\d{9}$/` (Iraqi format); before advancing, calls the Supabase RPC `check_contact_exists(p_mobile, p_email)` to block duplicate submissions without exposing table contents to the `anon` role.
2. **MCQ** — renders one of the 12 `QUESTIONS` at a time from `js/questions.js`; answers are kept in an in-memory `answers` object keyed by question id (`{ q1: 'b', ... }`) and only persisted to Supabase on final submit.
3. **Open questions** — three free-text fields.
4. **Results** — client-computed score (see Scoring below) with color-coded grading and a per-question correct/incorrect breakdown.

MCQ options are built with `document.createElement`/`textContent`, not `innerHTML` string interpolation — keep new dynamic DOM in `assessment.js`/`admin.js` consistent with that pattern since question/answer text (and future user-entered data) is rendered without an escaping layer.

### Scoring

Correct answers live inline in `js/questions.js` (`correct: 'd'` per question) and are shipped to the client — there is no server-side scoring. `score` (0–12) and `score_pct` are computed client-side in `assessment.js` and sent to Supabase alongside the raw answers; `auto_flagged` is `score_pct >= 70`, computed client-side and trusted at write time (RLS does not re-validate it).

### i18n (`js/i18n.js`)

`I18N.en` / `I18N.ar` are flat string dictionaries; `t(key, lang, vars)` looks up a key (falling back to `en`) and interpolates `{varName}` placeholders. `assessment.js`'s `applyLang()` walks every translatable DOM node by id and re-renders it, including re-invoking `renderQuestion()` if the MCQ screen is active, whenever the language toggle fires. Language choice persists in `localStorage`. When adding a new UI string, add the key to **both** `en` and `ar` blocks — there is no fallback UI for a missing translation key beyond returning the raw key string.

### Admin dashboard (`js/admin.js`)

- Auth is Supabase Auth (email/password), gating a `dashboard` div that's hidden until `checkSession()` confirms a session on load.
- `loadSubmissions()` pulls all rows from the `submissions` table (the `authenticated` role has full SELECT under RLS) into `allSubmissions`, then `applyFilters()` derives `filtered` from date range / score / flag-status filters for both the table and CSV export.
- The detail panel (`openPanel(row)`) is a slide-in overlay showing MCQ-by-MCQ correctness, open-question text, and trainer controls (`trainer_flagged` boolean, `trainer_notes` text) that are saved as individual `UPDATE` calls (`saveTrainerFlag`, `saveNotes`) scoped by row `id`, and mirrored back into the in-memory `allSubmissions`/`activeRow` state rather than re-fetched.
- CSV export builds the file client-side from `filtered` (respects active filters), not from a fresh query.

### Supabase (`js/supabase-config.js`)

`SUPABASE_URL` and the anon public key are hardcoded in this file and loaded via the CDN `@supabase/supabase-js@2` script tag. This is expected for a Supabase anon key (it is public by design; access control is enforced by Postgres RLS policies, not by hiding the key). Do not add a service-role key or any other secret to client-side code.

**`submissions` table** (see `docs/superpowers/specs/2026-06-16-post-training-assessment-design.md` for the original column-by-column spec): `id`, `created_at`, `name`, `mobile`, `email`, `lang`, `answers` (jsonb, `{q1: 'b', ...}`), `open_q1`/`open_q2`/`open_q3`, `score`, `score_pct`, `auto_flagged`, `trainer_flagged`, `trainer_notes`.

- **RLS:** `anon` role can `INSERT` only (no `SELECT`) — participants can submit but never read other submissions. `authenticated` role (admin) has full access, but the UI only ever performs targeted `UPDATE`s of `trainer_flagged`/`trainer_notes`.
- **Note:** the implementation has diverged from the original spec/plan docs in `docs/superpowers/`: registration now accepts mobile *or* email (spec originally required mobile only), and the duplicate-check RPC is `check_contact_exists(p_mobile, p_email)`, not the originally-planned `check_mobile_exists(p_mobile)`. Treat the live schema in Supabase and the current JS as the source of truth over those docs.

### `docs/superpowers/`

Contains the original design spec and implementation plan for this project (written for an agentic "superpowers" workflow). Useful for historical context and the original question bank/copy, but the running code has since diverged in the ways noted above — don't assume it's in sync with the current implementation.

## Conventions

- Vanilla ES6+, no framework, no transpilation. Functions and state are plain globals per script file — there's no module system to reason about beyond `<script>` include order.
- Two-space indentation across HTML/CSS/JS.
- Commit messages use a light conventional-commits style (`feat:`, `fix:`, `chore:`) seen throughout `git log`.
- Bilingual text objects follow the `{ en: '...', ar: '...' }` shape everywhere (questions, options, i18n strings) — keep new user-facing copy in that shape rather than introducing a different i18n mechanism.
