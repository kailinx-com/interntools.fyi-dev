# interntools.fyi (working name)

A free, community-driven web app for **U.S. students** (undergrad/grad/PhD; international/domestic) **after they've already secured an internship**.

### Versioning

- **V1 (MVP):** **Housing + Paycheck only**
  - **Paycheck calculator** → estimate take-home pay & budgeting baseline (optional affordability overlay on listing details).
  - **Housing search (remote API) + community intel** → find listings near the internship location, bookmark them, and add building-specific notes/reviews (noise, pests, management, commute, safety perception).
  - Auth, profiles, privacy policy, and the minimum 6 screens required by the rubric (Home, Login/Register, Profile, Search/Results, Details) are in scope.

- **V2 (future):** **Return-offer transparency + more**
  - **Return-offer transparency** → aggregate outcomes by company/role/location/season; company search; submit outcome; company stats pages.
  - **Admin moderation** → flags, hide/delete, audit.
  - Optional: Following/Followers, richer profile groupings.

> Web-first (desktop + mobile responsive). Future iOS/Android apps can reuse the same backend REST APIs.

## Current implementation snapshot (Mar 2026)

The active implemented app in this repo is currently `apps/web` (Next.js).

- Core implemented routes: `/`, `/calculator`, `/calculator/planner`, `/housing`, `/login`, `/signup`, `/privacy`, `/terms`
- Calculator + planner are functional and pass production build checks
- Shared page shell pattern is in place (`Navbar` + wrapper + `Footer`) for main pages
- Starter legal pages and housing placeholder are intentionally temporary and marked with `TODO` comments in code
- Pre-publish quality checks currently pass in `apps/web`:
  - `pnpm lint`
  - `pnpm build`

---

## Table of contents

- [1. Final project requirements mapping (checklist)](#1-final-project-requirements-mapping-checklist)
- [2. What we're building (v1 vs v2)](#2-what-were-building-v1-vs-v2)
- [3. Users & roles](#3-users--roles)
- [4. Routes / pages](#4-routes--pages)
- [5. Core user journeys](#5-core-user-journeys)
- [6. Scope by version (v1 vs v2)](#6-scope-by-version-v1-vs-v2)
- [7. Architecture](#7-architecture)
- [8. External Remote API (housing) integration](#8-external-remote-api-housing-integration)
- [9. Data model (ERD-style)](#9-data-model-erd-style)
- [10. Local REST API contract](#10-local-rest-api-contract)
- [11. UX plan (wireframes, states, accessibility)](#11-ux-plan-wireframes-states-accessibility)
- [12. Work breakdown (epics → tickets → dependencies)](#12-work-breakdown-epics--tickets--dependencies)
- [13. Quality plan + definition of done](#13-quality-plan--definition-of-done)
- [14. Repo scaffold + dev environment](#14-repo-scaffold--dev-environment)
- [15. Threat model + privacy](#15-threat-model--privacy)
- [16. Launch + maintenance plan](#16-launch--maintenance-plan)
- [Appendix: Decisions log](#appendix-decisions-log)

---

## 1. Final project requirements mapping (checklist)

This section is explicitly written to satisfy the **Open-Ended Web Application** final project requirements (WebDev Final Project - Requirements.txt).

### Requirements.txt coverage summary

| Requirement area                                                                                                              | Where in this doc    | V1 status   |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------- |
| 6 screens: Login/Register, Home, Profile, Search/results, Details                                                             | §1.1, §4             | ✅          |
| Home: / or /home, first page; dynamic anonymous + logged-in content; clear & polished                                         | §1.2, §4             | ✅          |
| Profile: /profile, /profile/:id; edit info; hide private from others; grouped lists + links (bookmarks, reviews)              | §1.3, §4             | ✅          |
| Search/Results: form → remote API; summarized results; link to details; state in URL                                          | §1.6, §4, §8         | ✅          |
| Details: remote API by id; local related data (reviews); links to user profiles                                               | §1.6, §4, §5         | ✅          |
| Login/Register: register, choose role, login; protect some pages; adapt Home/Profile; force login only when needed            | §1.4, §1.5, §1.8, §4 | ✅          |
| Styling: responsive; no overlap/wrap/scrollbars; padding/margin/justification; contrast; labels/placeholders; consistency; UX | §1.9, §11            | ✅          |
| Navigation clear; privacy policy on first visit + at /privacy                                                                 | §1.10, §4            | ✅          |
| Architecture: modules/IIFEs; dynamic loading; controllers; state in URL; centralized services; file structure                 | §7                   | ✅          |
| Users: register, login, logout, profile; 2 roles; UI adapts by role; anonymous where possible                                 | §1.4, §1.5, §3       | ✅          |
| Web services: Java (Spring Boot) REST; entity URLs; path/query params; HTTP methods; model layer; promises                    | §7, §10              | ✅          |
| Database: JPA + Postgres (rubric allows any DB); CRUD + Read by predicate                                                     | §9                   | ✅          |
| Data model: 2+ domain, 2+ user models; 1+ one-to-many; 1+ many-to-many                                                        | §1.7, §9             | ✅          |
| UML class diagram: wiki page **Design**, ≥5 classes                                                                           | §1.11                | Deliverable |
| External Web API: search, bookmark, details; local DB for read-only API                                                       | §1.6, §8             | ✅          |
| Field validation: no username update; login without email; logout; session; password masked; no dead ends                     | §1.8                 | ✅          |

### 1.1 Required pages (minimum 6 distinct screens) + no dead ends

**V1 delivers the minimum 6 screens:**

- **Home** (`/` or `/home`)
- **Login** (`/login`)
- **Register** (`/register`)
- **Profile** (`/profile` + public profile `/profile/:id`)
- **Housing Search/Results** (`/housing/search` and `/housing/search?criteria=...`)
- **Housing Details** (`/housing/details/:listingId`)

**V1 additional route:** **Paycheck Calculator** (`/calculator`). **Privacy Policy** (`/privacy`).

**V2 adds (for full product / rubric breadth):**

- Company Search/Results (`/companies/search`, `/companies/search?...`)
- Return Offer Stats (`/companies/:companyId`)
- Submit Outcome (`/submit/outcome`)
- Admin Moderation (`/admin`)

✅ **Route equivalence (rubric "Search/Details"):**

- Rubric asks for `/search` and `/search?criteria=...` and `/details/{identifier}`. V1 provides equivalent functionality via **Search/Results** = `/housing/search` and `/housing/search?criteria=...`; **Details** = `/housing/details/:listingId` (remote API + local data). V2 adds company search/details as additional flows.

✅ "No dead ends"

- Persistent top nav (Home, Housing Search, Calculator, Profile, Login/Logout in v1; v2 adds Company Search, Return Offers, Admin).
- Every screen has a clear path back (e.g. Housing details → Housing search results; Profile lists link to Housing details).

### 1.2 Home page: anonymous vs logged-in dynamic content

✅ **V1** — Anonymous sees:

- "Latest community notes" (housing notes)
- "Trending internship cities" (based on search volume)

✅ **V1** — Logged-in sees:

- Recent bookmarked listings
- Last paycheck estimate scenario

✅ **V2** adds: return-offer highlights, recently updated company stats, latest return-offer submission status.

### 1.3 Profile page: privacy + grouped related content + links

✅ `/profile` (me):

- Edit personal info (username immutable)
- Show private fields (email/phone) only to self
- Grouped lists with links (rubric "group similar/related data" and "lists of snippets and links"):
  - **V1:** Bookmarked Listings → `/housing/details/:listingId`; My Housing Notes/Reviews → `/housing/details/:listingId`
  - **V2:** My Return Offer Submissions → `/companies/:companyId`; _(optional)_ Following/Followers → `/profile/:id`

✅ `/profile/:id` (public view):

- Accessible to other users including anonymous
- Redacts sensitive fields (email/phone); private info hidden from others
- Shows only public activity (notes/reviews snippets; v2 adds return-offer submissions if configured public)

### 1.4 User roles + role-adaptive UI

✅ At least 2 roles (rubric): **Student** (default), **Admin**.

- **V1:** Student is the primary role; profile shows housing bookmarks/reviews. Admin role can exist in schema but admin UI can be minimal or placeholder (no moderation yet).
- **V2:** Full admin UI: `/admin` navigation, moderation actions (hide/delete/resolve flags).

### 1.5 Anonymous functionality

✅ **V1** — Anonymous can:

- Use paycheck calculator
- Search housing (remote API)
- View listing details

✅ Identity required only for: bookmarks, posting housing notes/reviews (v1); v2 adds submitting outcomes, moderation actions.

### 1.6 Remote API requirement

✅ **Housing Search/Results uses a remote API** (not our DB):

- `/housing/search` queries an external housing listings API
- Results come from the remote API
- Search criteria encoded in the URL (`/housing/search?city=...&state=...&maxRent=...`)

✅ Housing details page queries remote API by unique identifier:

- `/housing/details/:listingId` fetches listing details from remote API using `listingId`
- Details page also shows related local data (notes/reviews/bookmark count) + links to authors' profiles

### 1.7 Data model complexity

✅ **V1** — At least two domain models and two user models:

- User models: `StudentProfile`, `AdminProfile` (admin can be minimal in v1)
- Domain models (v1): `HousingBookmark`, `HousingReview`, `PaycheckScenario` (+ `users`); Listing represented by `listing_id` (external).

✅ **V2** adds: `Company`, `ReturnOfferReport`, `ModerationFlag`, `audit_log`.

✅ At least one 1-to-many: **Listing (by listingId) → HousingReviews** (v1).
✅ **V2** adds: Company → ReturnOfferReport.

✅ At least one many-to-many: **User ↔ Listing (bookmarks)** via join table (v1).

### 1.8 Field validation + auth/session requirements

✅ Must enforce:

- **Can't update username**
- **Login without email** (username + password)
- Logout
- Maintain session (JWT + refresh token recommended)
- Password not visible unless explicitly requested (masked inputs)
- Clear errors and fixes in UI

### 1.9 Style & UX (rubric alignment)

✅ **Responsive design:** Usable on desktop, tablet, and phone; pages responsive at any width; no unintentional overlap, wrap, or scrollbars; scrollbars only when necessary.

✅ **Styling (at least one of):** Use a CSS library (e.g. Bootstrap) and/or white-space rules: **padding** so content is not flush with containers; **margin** between content; **justification** (text left-justified, numeric right-justified, currency/dates consistently formatted); **wrapping** avoided where unintentional.

✅ **Contrast:** Palette and transparencies provide foreground/background contrast for readability.

✅ **Labels:** All content and form elements properly labeled; form elements have placeholders.

✅ **Consistency:** Consistent colors, fonts, paddings, margins, justification, and look-and-feel across the app.

✅ **Navigation:** Clear navigation; backtrack from child to parent evident; home and profile navigation clearly marked; meaningful URLs.

✅ **UX:** Master/detail navigation clearly marked; currently logged-in user clearly marked; large touch/click targets (e.g. label click focuses input or toggles control); errors clearly marked with options to fix.

### 1.10 Privacy policy

✅ Show on first visit (modal or interstitial) and accessible later at `/privacy`.

### 1.11 Design deliverable (UML)

✅ A **UML class diagram** (at least 5 classes and their relations) must be created (e.g. Lucidchart or similar) and made available in the repository **wiki** on a page named **Design**, per rubric.

---

## 2. What we're building (v1 vs v2)

**Problem:** After a student gets an internship offer, they face confusing take-home pay, time-critical housing decisions with incomplete info, and (later) opaque return-offer expectations.

**V1 solution:**

- **Paycheck calculator** → take-home estimate & budgeting baseline; optional rent-to-net overlay on listing details.
- **Housing (remote API + community)** → search listings, view details, bookmark, post notes/reviews.

**V2 solution (future):**

- **Return-offer transparency** → submit outcomes, company search, aggregated stats by company/role/location/season.
- **Admin moderation** → flags, hide/delete, audit.

---

## 3. Users & roles

### Personas

1. **Intern (Student)** — wants paycheck estimate and housing shortlist (v1); v2 adds return-offer odds/benchmarks.
2. **Roommate / Friend (Anonymous)** — wants to browse housing details and notes without an account.
3. **Admin** — v2: removes spam, resolves flags, enforces privacy.

### Role-based capabilities

| Capability                   | Anonymous | Student | Admin |
| ---------------------------- | --------: | ------: | ----: |
| Use paycheck calculator      |        ✅ |      ✅ |    ✅ |
| Search housing (remote API)  |        ✅ |      ✅ |    ✅ |
| View housing details         |        ✅ |      ✅ |    ✅ |
| Bookmark listings            |        ❌ |      ✅ |    ✅ |
| Post housing reviews/notes   |        ❌ |      ✅ |    ✅ |
| Submit return-offer outcomes |        ❌ |       — |     — |
| Moderate/resolve flags       |        ❌ |      ❌ |     — |

_V1:_ All rows except "Submit return-offer" and "Moderate" (those are v2). Admin column in v1 can be N/A or same as Student for housing only.

---

## 4. Routes / pages

### V1 routes (MVP — Housing + Paycheck)

| Route                         | Screen                 | Remote API? | Auth? | Purpose                                                               |
| ----------------------------- | ---------------------- | ----------: | ----: | --------------------------------------------------------------------- |
| `/` or `/home`                | Home                   |          No |    No | Landing + dynamic content                                             |
| `/login`                      | Login                  |          No |    No | Username/password (no email required)                                 |
| `/register`                   | Register               |          No |    No | Create account + choose role (Student; Admin via invite/config in v2) |
| `/profile`                    | My Profile             |          No |   Yes | Edit profile + grouped lists (bookmarks, reviews)                     |
| `/profile/:id`                | Public Profile         |          No |    No | Redacted profile + public activity                                    |
| `/calculator`                 | Paycheck Calculator    |          No |    No | Estimate take-home pay                                                |
| `/housing/search`             | Housing Search         |     **Yes** |    No | Form-only state                                                       |
| `/housing/search?...`         | Housing Search Results |     **Yes** |    No | Summarized remote listing results                                     |
| `/housing/details/:listingId` | Listing Details        |     **Yes** |    No | Remote details + local notes/bookmarks                                |
| `/privacy`                    | Privacy Policy         |          No |    No | Policy + first-visit acknowledgement                                  |

### V2 routes (future)

| Route                   | Screen                 | Remote API? | Auth? | Purpose                                     |
| ----------------------- | ---------------------- | ----------: | ----: | ------------------------------------------- |
| `/companies/search`     | Company Search         |          No |    No | Search companies by name/location/industry  |
| `/companies/search?...` | Company Search Results |          No |    No | List companies with return-offer aggregates |
| `/companies/:companyId` | Return Offer Stats     |          No |    No | Aggregated outcomes                         |
| `/submit/outcome`       | Submit Outcome         |          No |   Yes | Structured outcome submission               |
| `/admin`                | Admin Moderation       |          No | Admin | Flags, hide/delete, audit                   |

---

## 5. Core user journeys

### V1 — Journey A: Housing shortlist (anonymous → student)

1. Visit `/housing/search`, enter city/state + filters.
2. Results at `/housing/search?city=...&state=...&maxRent=...`.
3. Open `/housing/details/:listingId`.
4. See remote listing details + local "Intern Notes" + bookmark count.
5. Click Bookmark → requires login → appears in profile.

### V1 — Journey B: Paycheck → affordability overlay

1. Use `/calculator` to estimate monthly net take-home.
2. On `/housing/details/:listingId`, enter or auto-read rent.
3. Show **rent-to-net ratio** and "budget tightness" indicators.
4. Save "Budget Scenario" to profile (optional).

### V2 — Journey C: Return-offer transparency

1. Browse `/companies/:companyId` stats (filters: role, location, season/year).
2. If logged in, submit `/submit/outcome`.
3. Aggregates update with sample-size thresholds.

### V2 — Journey D: Moderation

1. Students flag suspicious reviews/outcomes.
2. Admin resolves flags and audits actions.
3. Hidden/deleted content no longer counts toward aggregates.

---

## 6. Scope by version (v1 vs v2)

### V1 scope (Housing + Paycheck)

1. **Foundation** — SPA routing, layout, nav, privacy policy first-visit modal, global error handling, responsive baseline.
2. **Auth + roles + profiles** — Register/login/logout/session; username immutable; profile edit + public redaction; at least Student role (Admin schema optional).
3. **Paycheck calculator** — Inputs: hourly/salary, hours/week, pay frequency, state, FICA exemption. Outputs: gross/net per pay period, monthly estimate, assumptions + disclaimers. Optional: save scenario to profile.
4. **Housing search + details (remote API) + local layer** — Remote search + results in URL; remote details by `listingId`; local bookmarks + reviews/notes; details page links to reviewers' profiles.

### V2 scope (future)

5. **Return-offer platform** — Submit outcome; public aggregates with minimum sample threshold; company search + company pages + filters.
6. **Admin moderation** — Flag queue; hide/delete for reviews and outcomes; audit log.
7. **Optional** — Following/Followers; richer profile groupings.

---

## 7. Architecture

### Tech stack

- **Frontend:** React + Next.js + TypeScript + shadcn/ui
  - App Router, server/client components, API routes if needed; SPA-style client routing for app screens; shared components and theming via shadcn/ui.
- **Backend:** Java Spring Boot (REST)
  - Controllers, services, JPA repositories; optional separate Node service if Mongoose/MongoDB is used.
- **Databases:**
  - **Postgres** with **Hibernate / JPA** — primary store for users, profiles, housing bookmarks/reviews, paycheck scenarios (and v2 return offers, companies, moderation).
  - **MongoDB** with **Mongoose** (Node.js) — optional document store (e.g. audit logs, analytics, or flexible schema data); use if needed alongside Postgres.
- **Other:** Redis optional (rate limiting, caching remote housing API responses).

### Architectural requirements (rubric)

- **Namespacing:** Use modules/classes/IIFEs to namespace variables and functions and avoid polluting the global namespace.
- **Dynamic content:** Load content dynamically with client-side routing, views, and templates (no full-page reload).
- **Controllers/Components:** Use controllers or components for user interaction, events, and feeding data to views/templates.
- **State in URL:** Encode state in the URL so that reload preserves the same content (e.g. search criteria in query params).
- **Web service client:** Centralize API and data access in shared services used across the application.
- **File structure:** Organize files in a consistent structure (e.g. as in class/assignments).

### System components

- **Next.js app** (React + TypeScript + shadcn/ui) — client UI, optional API routes.
- **Spring Boot API** — main app backend (auth, profiles, housing layer, paycheck, v2 return offers/moderation).
- **Postgres** — primary data (JPA/Hibernate).
- **MongoDB** (optional) — document data via Mongoose (Node service) if used.
- **External Housing Listings API** — remote data source (v1).

### Data flow (high-level)

- **V1:** Search page → external housing API (or backend proxy) → results list. Details page → external housing API by `listingId` + local API for notes/bookmark stats. Auth → Spring Boot API → session tokens. Paycheck → Spring Boot API (stateless estimate; optional save to Postgres).
- **V2:** Aggregates from Postgres (and optional MongoDB if used); moderation and audit flows.

---

## 8. External Remote API (housing) integration

### Remote API requirements

Your instructor must approve the chosen external API.

### Recommended remote API shape

We need two remote calls:

1. **Search listings** (returns summarized results + unique listing id)
2. **Get listing details by id** (rich details)

### State in URL

Search criteria must be encoded in the URL so refresh preserves results:

- `/housing/search?city=Santa%20Clara&state=CA&maxRent=3200&beds=1`

### Bookmarking strategy

Most listing APIs are read-only. We implement bookmarking **locally**:

- Store `(userId, listingId)` in Postgres
- Optionally store a minimal "snapshot" of listing summary for profile lists

### Rate limits and caching

- Cache remote search results (short TTL) by normalized query string
- Backoff/retry on remote 429/5xx
- Clear UI error states: "Remote housing provider unavailable. Retry."

---

## 9. Data model (ERD-style)

> **Database requirements (rubric):** Use Mongoose/MongoDB or JPA/relational DB; rubric allows any database. This project uses **JPA with Postgres**. The data layer provides standard CRUD plus Read by predicate and is used by the REST API (model to interact with data; promises/async where appropriate).
>
> Normalized relational schema in Postgres.

### V1 — User models (2)

- `users` (auth identity)
- `student_profiles` (student-only fields)
- `admin_profiles` (admin-only fields; can be minimal in v1)

### V1 — Domain models

- `housing_bookmarks` (join table for user ↔ listing by `listing_id` string)
- `housing_reviews`
- `paycheck_scenarios` (optional save)

### V2 — Domain models (added)

- `companies`
- `return_offer_reports`
- `moderation_flags`
- `audit_log`

### Relationships

- **V1:** **Listing (listingId) 1→N HousingReviews**; **User N↔N Listing** via `housing_bookmarks(user_id, listing_id)`; **User 1→N HousingReviews**; **User 1→N PaycheckScenarios** (optional).
- **V2:** **Company 1→N ReturnOfferReports**; **User 1→N ReturnOfferReports**.

### Key constraints (rubric-driven)

- `users.username` unique and immutable
- Bookmark idempotency: unique `(user_id, listing_id)`
- **V2:** Return-offer dedupe: unique `(user_id, company_id, role, location, season, year)`

### Data model API (rubric)

The backend data layer (JPA repositories or equivalent) must provide: **Create** (insert), **Read One** (by id), **Read All**, **Read by predicate** (match criteria), **Update**, **Delete**. Use async/promises where appropriate.

---

## 10. Local REST API contract

**Web Service requirements (rubric):** Use Node.js Express or Java for RESTful services. This project uses **Java (Spring Boot)**. APIs: URLs capture entity relationships; path and query parameters used appropriately; HTTP methods for create/read/update/delete; services use a model (repositories) to interact with data; implemented in separate files; promises/async where necessary.

**Base:** `/api/v1`  
**Error envelope:**

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "...",
  "fields": { "x": "reason" },
  "requestId": "..."
}
```

### V1 — Auth

- `POST /auth/register` `{ username, password, role }`
- `POST /auth/login` `{ username, password }` (no email required)
- `POST /auth/logout`
- `GET /me`

### V1 — Profiles

- `GET /profiles/me` (auth)
- `PATCH /profiles/me` (auth; cannot change username)
- `GET /profiles/:id` (public; redacted)

### V1 — Paycheck

- `POST /paycheck/estimate` (public)
- `POST /paycheck/scenarios` (auth; optional save)
- `GET /paycheck/scenarios` (auth)

### V1 — Housing community layer (local)

- `POST /housing/:listingId/bookmark` (auth; idempotent)
- `DELETE /housing/:listingId/bookmark` (auth)
- `GET /housing/:listingId/bookmark-stats` (public)
- `GET /housing/:listingId/reviews` (public)
- `POST /housing/:listingId/reviews` (auth)

### V2 — Return offers

- `POST /return-offers` (auth)
- `GET /return-offers/mine` (auth)
- `GET /companies` (public)
- `GET /companies/:companyId/stats?...` (public; filters + sample thresholds)

### V2 — Moderation

- `POST /flags` (auth; report content)
- `GET /admin/flags` (admin)
- `POST /admin/reviews/:id/hide` (admin)
- `POST /admin/return-offers/:id/hide` (admin)
- `GET /admin/audit` (admin)

---

## 11. UX plan (wireframes, states, accessibility)

### V1 — Pages

- Home: product overview + dynamic cards (housing notes, trending cities)
- Calculator: labeled form, inline errors, clear results table
- Housing Search: form + filters
- Search Results: cards list; "Details" CTA; URL reflects criteria
- Listing Details: remote listing content + "Intern Notes" + bookmark button (+ optional rent affordability)
- Profile: tabs/sections for Bookmarks, Reviews (v2 adds Outcomes)
- Privacy: policy + first-visit acknowledgement

### V2 — Pages

- Return Offer Stats: filters + charts/tables with sample-size warnings
- Company Search / Results
- Submit Outcome
- Admin: flags queue + actions

### States

- Loading: skeletons for results and details
- Empty: "No results" + suggestions
- Error: remote API down → show retry and keep criteria
- Validation: field-level errors (aria-describedby), top summary banner

### Accessibility baseline

- Proper labels for inputs; label-click focuses input
- Keyboard navigation (tab order, focus rings)
- Large touch targets on mobile
- Contrast + non-color error cues

---

## 12. Work breakdown (epics → tickets → dependencies)

### V1 epics (MVP)

1. Foundation + routing + layout + privacy policy
2. Auth/session + roles (Student; Admin schema optional)
3. Profiles (private vs public)
4. Paycheck calculator
5. Housing remote search/details + local reviews/bookmarks

### V2 epics (future)

6. Return-offer outcomes + aggregates + company search + company pages
7. Admin moderation + audit
8. Optional: Following/Followers, richer profile

### Polish (v1 then v2)

9. Responsive + a11y + perf + docs

### Dependency order (critical path)

**V1:** Foundation → Auth → DB schema (v1 entities) → Profiles → Calculator → Housing module → Polish.

**V2:** DB schema (v2 entities) → Outcomes → Company search/pages → Admin → Polish.

---

## 13. Quality plan + definition of done

### Testing

- Backend: unit tests (calculator + validation), integration tests (repositories/controllers)
- Frontend: component tests + e2e tests (Playwright): login, housing search→details, bookmark, (v2: submit outcome)

### CI gates

- Lint + typecheck
- Unit tests
- Build

### Definition of Done

- Feature complete + tests + error/empty states
- Responsive check (mobile + desktop)
- a11y check (labels, keyboard)
- Logs for key endpoints
- No dead ends in navigation

---

## 14. Repo scaffold + dev environment

### Repo layout (monorepo)

```
interntools-fyi/
├─ README.md
├─ .gitignore
├─ .editorconfig
├─ .env.example
├─ docker-compose.yml
├─ Makefile
├─ docs/
│  ├─ architecture.md
│  ├─ api-contract.md
│  ├─ threat-model.md
│  ├─ rubric-coverage.md
│  └─ decision-log.md
├─ scripts/
│  ├─ dev.sh
│  ├─ seed-db.sh
│  └─ lint-all.sh
├─ apps/
│  ├─ web/                           # Next.js (TS) frontend
│  │  ├─ package.json
│  │  ├─ next.config.ts
│  │  ├─ tsconfig.json
│  │  ├─ public/
│  │  └─ src/
│  │     ├─ app/                     # App Router routes
│  │     │  ├─ layout.tsx
│  │     │  ├─ page.tsx              # Home (dynamic anon + personalized logged-in)
│  │     │  ├─ privacy/page.tsx
│  │     │  ├─ login/page.tsx
│  │     │  ├─ register/page.tsx
│  │     │  ├─ profile/page.tsx
│  │     │  ├─ profile/[id]/page.tsx
│  │     │  └─ housing/
│  │     │     ├─ search/page.tsx     # /housing/search?... (URL state)
│  │     │     └─ details/[listingId]/page.tsx
│  │     ├─ components/
│  │     │  ├─ ui/                    # shadcn components (generated)
│  │     │  ├─ layout/                # navbar, footer, shell, guards
│  │     │  ├─ housing/               # listing cards, filters, notes, bookmarks
│  │     │  └─ paycheck/              # calculator widgets (V1)
│  │     ├─ lib/
│  │     │  ├─ api/                   # typed API client (our backend)
│  │     │  ├─ external/              # remote housing API client wrapper
│  │     │  ├─ auth/                  # session hooks, role gate
│  │     │  ├─ validation/            # zod schemas for forms
│  │     │  └─ utils/
│  │     ├─ styles/
│  │     │  └─ globals.css
│  │     └─ types/
│  │        ├─ dto.ts                 # shared DTOs (optionally generated)
│  │        └─ external.ts            # remote listing shapes
│  ├─ api/                            # Spring Boot backend (REST)
│  │  ├─ pom.xml
│  │  ├─ Dockerfile
│  │  └─ src/
│  │     ├─ main/
│  │     │  ├─ resources/
│  │     │  │  ├─ application.yml
│  │     │  │  ├─ db/migration/       # Flyway migrations
│  │     │  │  └─ static/             # (optional) hosted privacy policy assets
│  │     │  └─ java/com/interntoolsfyi/
│  │     │     ├─ InterntoolsApiApplication.java
│  │     │     ├─ config/
│  │     │     │  ├─ SecurityConfig.java
│  │     │     │  ├─ CorsConfig.java
│  │     │     │  └─ JacksonConfig.java
│  │     │     ├─ auth/
│  │     │     │  ├─ controller/
│  │     │     │  ├─ service/
│  │     │     │  ├─ dto/
│  │     │     │  └─ session/         # session cookies / token strategy
│  │     │     ├─ user/
│  │     │     │  ├─ controller/
│  │     │     │  ├─ service/
│  │     │     │  ├─ repo/
│  │     │     │  ├─ model/
│  │     │     │  └─ dto/
│  │     │     ├─ housing/
│  │     │     │  ├─ controller/      # bookmarks, notes/reviews
│  │     │     │  ├─ service/
│  │     │     │  ├─ repo/
│  │     │     │  ├─ model/
│  │     │     │  └─ dto/
│  │     │     ├─ external/
│  │     │     │  └─ housing/         # remote housing API client + adapters
│  │     │     ├─ admin/
│  │     │     │  ├─ controller/      # minimal admin screen support (role-based UI)
│  │     │     │  └─ service/
│  │     │     ├─ common/
│  │     │     │  ├─ errors/          # global exception handler, error codes
│  │     │     │  ├─ paging/
│  │     │     │  ├─ validation/
│  │     │     │  └─ util/
│  │     │     └─ paycheck/
│  │     │        ├─ controller/      # take-home calc endpoint (optional)
│  │     │        └─ service/
│  │     └─ test/
│  │        └─ java/com/interntoolsfyi/
│  │           ├─ integration/
│  │           └─ unit/
├─ packages/
│  ├─ shared/                         # optional shared TS types/utils
│  │  ├─ package.json
│  │  └─ src/
│  │     ├─ dto/                      # request/response shapes mirrored from backend
│  │     └─ constants/
│  └─ config/                         # optional shared lint/tsconfig/prettier
│     ├─ eslint/
│     ├─ prettier/
│     └─ tsconfig/
├─ infra/
│  ├─ postgres/
│  │  └─ init.sql
│  └─ nginx/                          # optional reverse proxy for local/prod
│     └─ nginx.conf
└─ .github/
   └─ workflows/
      ├─ ci-web.yml
      ├─ ci-api.yml
      └─ ci-e2e.yml

```

**Where to put things**

| What                                 | Where                                           |
| ------------------------------------ | ----------------------------------------------- |
| New UI page or component             | `apps/web/src/pages/` or `components/`          |
| New API endpoint                     | `apps/api/` → controller + service + repository |
| API client / shared fetch logic      | `apps/web/src/services/`                        |
| Product or rubric notes              | `docs/SPEC.md`                                  |
| Runbooks, incident notes             | `docs/RISKS.md`                                 |
| DB + services for local dev          | `infra/docker-compose.yml`                      |
| Env vars (never commit real secrets) | `.env` (from `.env.example`)                    |

### Environment variables

Backend:

- `DATABASE_URL`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `EXTERNAL_HOUSING_API_BASE_URL`
- `EXTERNAL_HOUSING_API_KEY` (if required)

Frontend:

- `NEXT_PUBLIC_API_BASE_URL` (Next.js; or `VITE_API_BASE_URL` if using Vite)

### Local run

```bash
docker compose up -d
cd apps/api && ./mvnw spring-boot:run
cd apps/web && pnpm install && pnpm dev
```

---

## 15. Threat model + privacy

### STRIDE highlights

- Spoofing/session theft → httpOnly cookies, refresh rotation
- Tampering → server-side authz checks (v2: audit log)
- Information disclosure → strict DTO redaction for public profiles
- DoS on remote API → rate limiting + caching

### PII inventory

- Username (public)
- Email/phone (private; only visible to self)
- User-generated content (reviews; v2 adds outcomes) public but can be anonymized

### Data retention

- Account deletion: anonymize reviews (and v2 outcomes) or hard-delete (configurable)

---

## 16. Launch + maintenance plan

### V1 beta

- 10–20 students test core flows (calculator, housing search, posting notes)
- Track bugs + usability issues

### Monitoring (minimal)

- Request logs with requestId
- Error-rate alerts (5xx spikes)
- Remote API failure rate
