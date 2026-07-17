# Product Context

> This file exists so that anyone (or any AI session) opening this repo has the product context immediately, without it getting lost between conversations. Read this before making product decisions.

## What this product is

**Onboard** (working name; UI also shows "Onboardly" on some auth screens) is a digital product focused on being an **onboarding platform for non-technical businesses** — small and mid-size companies (restaurants, retail, clinics, agencies, etc.) that need a structured way to bring new employees up to speed, without needing any technical setup themselves.

The core idea: give a business owner or manager a simple way to either

1. **Set up their company** as a workspace and build a full onboarding system for their team, or
2. **Just create an onboarding journey** for their employees quickly, without a lot of ceremony.

Both paths should feel approachable to someone who is not a software person — the target user is a restaurant manager, a clinic owner, an agency lead, not an engineer.

## Current alignment with the codebase

Path 1 (create a company, then build onboarding) is what's implemented today:

- `Register` → `Setup` (2 steps: company name/industry/size/website, then logo/description/brand color) → `Dashboard`.
- Every **Program** (an onboarding journey) belongs to one `company` in the store — there is no path today to create a program without first having a company.

Path 2 ("just create an onboarding journey" without full company setup) is **not yet built**. Anyone continuing product work here should treat this as a real gap: a lighter-weight entry point (e.g. "just give it a name, skip industry/size/branding, add it later") would better match the stated vision and lower the barrier for non-technical users who want to try the product before committing to full setup.

## Domain model (as implemented)

- **Company** — the business/workspace. Fields: name, industry, size, website, description, logo, primaryColor, departments.
- **Program** — an onboarding journey (e.g. "Kitchen Staff Onboarding"). Has a name, description, target role, estimated duration, status (draft/published), an optional header image, and an optional public share link.
- **Stage** — a phase within a program (e.g. "Day 1–2: Food Safety"), with an intro, an optional deadline (day N from start), and a list of materials.
- **Material** — a single unit of content inside a stage. Seven types exist: `video`, `reading`, `checklist` (items can require photo evidence), `quiz` (scored, pass/fail), `task`, `document` (can have an attached file, optional acknowledgment), `meeting`.
- **Employee** — a person being onboarded. Has profile fields, an assigned program, and a `completedMaterials` list tracking progress.

## Key flows that exist today

- **Admin builds a program**: Program Editor → add stages → add materials of any of the 7 types.
- **Admin previews the journey**: Preview mode simulates what an employee would see and do (watch video, take quiz, check off checklist items incl. photo evidence, acknowledge documents) — this is a simulation for the admin, not tied to a real employee's record.
- **Admin tracks progress**: Dashboard (team-wide health), Performance (cross-program employee table), and per-program Insights (a slide-over panel with Overview + Results tabs) all read from `employee.completedMaterials`.
- **Admin shares externally**: a program can get a public, unauthenticated share link showing an aggregate, PII-free overview dashboard (enrollment count, completion rate, stage list) — meant to be safe to hand to a client or investor.
- **Owner Panel**: a separate multi-tenant view (`/owner`) for whoever runs the SaaS itself, showing all customer accounts.

## Important gap: there is no real employee-facing product yet

There is no login or portal for the actual employee being onboarded. The only way to "experience" a program is through the admin's Preview mode, which does not write back to any employee's real record. This means today the product is really **"a tool for admins to design and monitor onboarding"**, not yet **"a tool employees actually go through."** Building a real employee-facing execution flow (a link an employee opens, logs into, and completes their own onboarding — recording real quiz scores, real photo evidence, real completion timestamps) is the next big structural piece needed to make this a complete product, and it directly unlocks making per-employee data in Insights/Results real instead of only reflecting the pre-seeded demo data.

## Architecture notes (so no one is surprised)

- **No backend.** This is a client-only React + Vite app. All state lives in a Zustand store, persisted to `localStorage` (see `src/store/useStore.js`). There is no server, no database, no real authentication — "login" just matches against a hardcoded list of demo users/accounts.
- Because of this, anything described as "shared" (e.g. the public share link) only works within the same browser/localStorage — it is a demo of the *feature*, not a production-ready sharing mechanism yet.
- Demo data exists for two accounts: **Sunrise Bistro** (a restaurant, fully populated with programs/employees) and **Bloom Studio** (empty, to show the first-run experience).

## Where to take this next (open questions for product direction)

- Should Path 2 (quick onboarding journey without full company setup) skip company creation entirely, or just make company setup optional/deferred?
- Real employee accounts/portal — needed to make progress tracking, quiz results, and checklist photo evidence reflect real usage instead of only the demo dataset.
- Real backend/persistence — localStorage is fine for a prototype but not for a real multi-user product (data doesn't sync across devices or between admin and employee).
