# Product Requirements Document: interntools.fyi

| Field | Value |
| ----- | ----- |
| **Product name** | interntools.fyi (working name) |
| **Document version** | 1.0 |
| **Status** | Draft / In development |
| **Last updated** | Mar 2026 |

---

## Table of contents

1. [Overview](#1-overview)
2. [Goals & success metrics](#2-goals--success-metrics)
3. [Users & personas](#3-users--personas)
4. [Product scope](#4-product-scope)
5. [Functional requirements](#5-functional-requirements)
6. [User journeys](#6-user-journeys)
7. [Routes & screens](#7-routes--screens)
8. [Data model](#8-data-model)
9. [API contract](#9-api-contract)
10. [Architecture & tech stack](#10-architecture--tech-stack)
11. [External integrations](#11-external-integrations)
12. [UX & accessibility](#12-ux--accessibility)
13. [Quality & definition of done](#13-quality--definition-of-done)
14. [Risks, privacy & security](#14-risks-privacy--security)
15. [Launch & maintenance](#15-launch--maintenance)
16. [Appendix](#appendix)

---

## 1. Overview

### Problem

After a U.S. student (undergrad, grad, or PhD; international or domestic) secures an internship, they face:

- **Unclear take-home pay** — Confusion about net pay and budgeting.
- **Time-critical housing decisions** — Incomplete information about listings, buildings, and neighborhoods.
- **Opaque return-offer expectations** — Little visibility into company/role/location outcomes.

### Solution

A **free, community-driven web app** (web-first; desktop + mobile responsive; future iOS/Android can reuse backend REST APIs):

- **Paycheck calculator** — Estimate take-home pay and budgeting baseline; optional affordability overlay on listing details.
- **Housing search (remote API) + community intel** — Find listings near the internship location; bookmark; add building-specific notes/reviews (noise, pests, management, commute, safety).
- **Return-offer transparency** — Aggregate outcomes by company/role/location/season; company search; submit outcome; company stats pages.
- **Admin moderation** — Flags, hide/delete, audit.
- Auth, profiles, privacy policy, and the minimum 6 screens required by the project rubric (Home, Login/Register, Profile, Search/Results, Details).
- Optional: Following/Followers, richer profile groupings.

### Current implementation snapshot (Mar 2026)

- **Frontend:** `apps/web` (Next.js) — main implemented app.
  - Core routes: `/`, `/calculator`, `/calculator/planner`, `/housing`, `/login`, `/signup`, `/privacy`, `/terms`
  - Calculator + planner are functional; housing placeholder and legal pages are temporary (see `TODO` in code).
  - Quality: `pnpm lint`, `pnpm build`
- **Backend:** `apps/api` (Spring Boot) — bootstrapped and runnable.
  - Maven project in `apps/api`; H2 in-memory by default (no Postgres required for first run).
  - Run: `cd apps/api && ./mvnw spring-boot:run` — see [apps/api/README.md](apps/api/README.md) for config (context path `/api`, Security, auth).

---

## 2. Goals & success metrics

### Product goals

| Goal | Description |
| ---- | ----------- |
| **Reduce internship housing friction** | Students find and evaluate housing faster using remote listings + community notes. |
| **Clarify take-home pay** | Students get a reliable paycheck estimate and optional rent-to-net view on listings. |
| **Enable return-offer transparency** | Aggregated, anonymized outcomes help students set expectations. |

### Success metrics

| Metric | Target |
| ------ | ------ |
| Calculator usage | Track sessions and saved scenarios. |
| Housing search → details → bookmark flow | Completion rate; time to first bookmark. |
| Community notes per listing | Notes/reviews count; growth over time. |
| Privacy consent | First-visit acknowledgement rate. |

### Out of scope (explicitly)

- Pre-offer job search or application tracking.
- Payment processing or paid listings.
- Landlord or property-manager accounts.

---

## 3. Users & personas

### Personas

| Persona | Description | Primary needs |
| ------- | ----------- | -------------- |
| **Intern (Student)** | Has secured an internship; needs housing and pay clarity. | Paycheck estimate, housing shortlist, building notes, return-offer benchmarks. |
| **Roommate / Friend (Anonymous)** | Browsing with or for an intern. | Browse housing details and notes without an account. |
| **Admin** | Content and safety. | Remove spam, resolve flags, enforce privacy. |

### Roles & capabilities

| Capability | Anonymous | Student | Admin |
| ---------- | --------- | ------- | ----- |
| Use paycheck calculator | ✅ | ✅ | ✅ |
| Search housing (remote API) | ✅ | ✅ | ✅ |
| View housing details | ✅ | ✅ | ✅ |
| Bookmark listings | ❌ | ✅ | ✅ |
| Post housing reviews/notes | ❌ | ✅ | ✅ |
| Submit return-offer outcomes  | ❌ | ✅ | — |
| Moderate/resolve flags  | ❌ | ❌ | ✅ |


---

## 4. Product scope

1. **Foundation** — SPA routing, layout, nav, privacy policy first-visit modal, global error handling, responsive baseline.
2. **Auth + roles + profiles** — Register / login / logout / session; username immutable; profile edit + public redaction; Student and Admin roles.
3. **Paycheck calculator** — Inputs: hourly/salary, hours/week, pay frequency, state, FICA exemption. Outputs: gross/net per pay period, monthly estimate, assumptions + disclaimers. Optional: save scenario to profile.
4. **Housing search + details (remote API) + local layer** — Remote search + results in URL; remote details by `listingId`; local bookmarks + reviews/notes; details page links to reviewers’ profiles.
5. **Return-offer platform** — Submit outcome; public aggregates with minimum sample threshold; company search + company pages + filters.
6. **Admin moderation** — Flag queue; hide/delete for reviews and outcomes; audit log.
7. **Optional** — Following/Followers; richer profile groupings.

### Work breakdown (epics → dependencies)

Foundation → Auth → DB schema → Profiles → Calculator → Housing module → Return-offer outcomes → Company search/pages → Admin moderation → Polish.

---

## 5. Functional requirements

### 5.1 Required screens (minimum 6, no dead ends)

- **Home** (`/` or `/home`)
- **Login** (`/login`)
- **Register** (`/register`)
- **Profile** (`/profile` + public `/profile/:id`)
- **Housing Search/Results** (`/housing/search`, `/housing/search?criteria=...`)
- **Housing Details** (`/housing/details/:listingId`)

Additional: **Paycheck Calculator** (`/calculator`), **Privacy Policy** (`/privacy`), Company Search/Results, Return Offer Stats, Submit Outcome, Admin Moderation.

- **No dead ends:** Persistent nav (Home, Housing Search, Calculator, Profile, Login/Logout); every screen has a clear path back.

### 5.2 Home — dynamic content

- **Anonymous:** Latest community notes (housing), trending internship cities (search volume).
- **Logged-in:** Recent bookmarks, last paycheck estimate scenario, return-offer highlights, company stats, submission status.

### 5.3 Profile — privacy & grouped content

- **`/profile` (me):** Edit personal info (username immutable); private fields (email/phone) only to self; grouped lists with links: Bookmarked Listings → details; My Housing Notes/Reviews → details; My Return Offer Submissions; optional Following/Followers.
- **`/profile/:id` (public):** Redacted sensitive fields; public activity only (notes/reviews snippets, return-offer submissions if public).

### 5.4 Auth & session

- At least 2 roles: **Student** (default), **Admin**.
- **Register:** username, password, role (Admin via invite/config).
- **Login:** username + password (no email required).
- **Logout;** session maintained (JWT + refresh recommended).
- Password masked unless explicitly shown; clear errors and recovery in UI.
- **Username:** unique and immutable (no username update).

### 5.5 Remote API (housing)

- Search: `/housing/search` queries external housing API; results from remote API; criteria in URL.
- Details: `/housing/details/:listingId` fetches listing by id from remote API; page also shows local notes/reviews/bookmark count and links to authors’ profiles.

### 5.6 Data model complexity

- **User models:** e.g. `StudentProfile`, `AdminProfile`.
- **Domain models:** `HousingBookmark`, `HousingReview`, `PaycheckScenario`; listing by `listing_id` (external); `Company`, `ReturnOfferReport`, `ModerationFlag`, `audit_log`.
- At least one **1-to-many:** Listing (by listingId) → HousingReviews; Company → ReturnOfferReports.
- At least one **many-to-many:** User ↔ Listing (bookmarks) via join table.

### 5.7 Styling & UX (rubric alignment)

- **Responsive:** Usable on desktop, tablet, phone; no unintentional overlap/wrap/scrollbars.
- **Styling:** CSS library and/or padding, margin, justification, consistent formatting.
- **Contrast:** Readable foreground/background.
- **Labels:** All form elements labeled; placeholders where appropriate.
- **Consistency:** Colors, fonts, spacing, look-and-feel.
- **Navigation:** Clear; backtrack evident; home and profile marked; meaningful URLs.
- **UX:** Master/detail clear; current user clear; large touch/click targets; errors marked with fix options.

### 5.8 Privacy policy

- Shown on first visit (modal or interstitial) and available at `/privacy`.

### 5.9 Design deliverable (UML)

- **UML class diagram** (≥5 classes and relations) in repository **wiki** on a page named **Design**, per rubric.

---

## 6. User journeys

### Journey A: Housing shortlist (anonymous → student)

1. Visit `/housing/search`; enter city/state + filters.
2. Results at `/housing/search?city=...&state=...&maxRent=...`.
3. Open `/housing/details/:listingId`.
4. See remote listing + local “Intern Notes” + bookmark count.
5. Bookmark → login if needed → bookmark appears in profile.

### Journey B: Paycheck → affordability overlay

1. Use `/calculator` for monthly net take-home.
2. On listing details, enter or auto-read rent.
3. Show rent-to-net ratio and budget indicators.
4. Optionally save “Budget Scenario” to profile.

### Journey C: Return-offer transparency

1. Browse `/companies/:companyId` stats (role, location, season/year).
2. If logged in, submit `/submit/outcome`.
3. Aggregates update with sample-size thresholds.

### Journey D: Moderation

1. Students flag suspicious reviews/outcomes.
2. Admin resolves flags and audits actions.
3. Hidden/deleted content excluded from aggregates.

---

## 7. Routes & screens

### Routes

| Route | Screen | Remote API? | Auth? | Purpose |
| ----- | ------ | ----------- | ----- | ------- |
| `/` or `/home` | Home | No | No | Landing + dynamic content |
| `/login` | Login | No | No | Username/password |
| `/register` | Register | No | No | Create account + role |
| `/profile` | My Profile | No | Yes | Edit profile + bookmarks, reviews |
| `/profile/:id` | Public Profile | No | No | Redacted profile + public activity |
| `/calculator` | Paycheck Calculator | No | No | Estimate take-home pay |
| `/housing/search` | Housing Search | Yes (form state) | No | Search form |
| `/housing/search?...` | Housing Search Results | Yes | No | Remote listing results |
| `/housing/details/:listingId` | Listing Details | Yes | No | Remote details + local notes/bookmarks |
| `/privacy` | Privacy Policy | No | No | Policy + first-visit acknowledgement |
| `/companies/search`, `/companies/search?...` | Company Search / Results | No | No | Search companies; list with aggregates |
| `/companies/:companyId` | Return Offer Stats | No | No | Aggregated outcomes |
| `/submit/outcome` | Submit Outcome | No | Yes | Structured outcome submission |
| `/admin` | Admin Moderation | No | Admin | Flags, hide/delete, audit |

---

## 8. Data model

- **Database:** JPA with Postgres (rubric allows any DB). CRUD + read by predicate; used by REST API.
- **User:** `users`, `student_profiles`, `admin_profiles`.
- **Domain:** `housing_bookmarks` (user ↔ listing by `listing_id`), `housing_reviews`, `paycheck_scenarios`, `companies`, `return_offer_reports`, `moderation_flags`, `audit_log`.
- **Relations:** Listing (listingId) 1→N HousingReviews; User N↔N Listing via bookmarks; User 1→N HousingReviews; User 1→N PaycheckScenarios; Company 1→N ReturnOfferReports.
- **Constraints:** `users.username` unique and immutable; bookmark unique `(user_id, listing_id)`; return-offer dedupe per user/company/role/location/season/year.

---

## 9. API contract

**Base:** `/api`  
**Error envelope:**

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "...",
  "fields": { "x": "reason" },
  "requestId": "..."
}
```

### Auth

**Implemented in backend:**

- `POST /auth/register`  
  Request: `{ username, email, password, role, firstName, lastName }`  
  Response: `AuthResponse { id, username, email, role }`

- `POST /auth/login`  
  Request: `{ identifier, password }` where `identifier` is **username or email**  
  Response: `LoginResponse { token, user: AuthResponse }`

- `POST /auth/logout` (auth)  
  Header: `Authorization: Bearer <token>`  
  Behavior: adds the JWT to a blacklist so it cannot be reused.

- `GET /me` (auth)  
  Path: `/api/me` (top-level route)  
  Header: `Authorization: Bearer <token>`  
  Response: `AuthResponse` for the current authenticated user.

### Profiles

- `GET /profiles/me` (auth)
- `PATCH /profiles/me` (auth; cannot change username)
- `GET /profiles/:id` (public; redacted)

### Paycheck

- `POST /paycheck/estimate` (public)
- `POST /paycheck/scenarios` (auth; optional)
- `GET /paycheck/scenarios` (auth)

### Housing (local layer)

- `POST /housing/:listingId/bookmark` (auth; idempotent)
- `DELETE /housing/:listingId/bookmark` (auth)
- `GET /housing/:listingId/bookmark-stats` (public)
- `GET /housing/:listingId/reviews` (public)
- `POST /housing/:listingId/reviews` (auth)

### Return offers & moderation

- `POST /return-offers` (auth), `GET /return-offers/mine` (auth)
- `GET /companies`, `GET /companies/:companyId/stats?...` (public)
- `POST /flags` (auth), `GET /admin/flags`, `POST /admin/reviews/:id/hide`, `POST /admin/return-offers/:id/hide`, `GET /admin/audit` (admin)

---

## 10. Architecture & tech stack

- **Frontend:** React + Next.js + TypeScript + shadcn/ui (App Router, server/client components).
- **Backend:** Java Spring Boot (REST); controllers, services, JPA repositories.
- **Databases:** Postgres + Hibernate/JPA (primary); MongoDB/Mongoose optional (e.g. audit, analytics).
- **Other:** Redis optional (rate limiting, caching remote housing API).

**Components:** Next.js app, Spring Boot API, Postgres, optional MongoDB, External Housing Listings API.

**Data flow:** Search → external housing API (or backend proxy) → results. Details → external API by `listingId` + local API for notes/bookmark stats. Auth → Spring Boot → session tokens. Paycheck → Spring Boot (stateless; optional save to Postgres).

**Rubric alignment:** Modules/IIFEs; dynamic loading; controllers; state in URL; centralized services; organized file structure.

---

## 11. External integrations

### Housing remote API

- **Required:** Instructor-approved external API.
- **Calls:** (1) Search listings (summarized results + listing id); (2) Get listing details by id.
- **State in URL:** e.g. `/housing/search?city=Santa%20Clara&state=CA&maxRent=3200&beds=1`.
- **Bookmarking:** Local only — store `(userId, listingId)` in Postgres; optional snapshot for profile lists.
- **Resilience:** Cache remote results (short TTL); backoff/retry on 429/5xx; UI: “Remote housing provider unavailable. Retry.”

---

## 12. UX & accessibility

### Pages (summary)

- Home: product overview + dynamic cards.
- Calculator: labeled form, inline errors, clear results.
- Housing Search: form + filters; Results: cards, Details CTA, URL state.
- Listing Details: remote content + “Intern Notes” + bookmark (+ optional rent affordability).
- Profile: sections for Bookmarks, Reviews.
- Privacy: policy + first-visit acknowledgement.

### States

- Loading: skeletons for results/details.
- Empty: “No results” + suggestions.
- Error: remote API down → retry, keep criteria.
- Validation: field-level errors (aria-describedby), summary banner.

### Accessibility baseline

- Labels for inputs; label-click focuses input.
- Keyboard navigation (tab order, focus rings).
- Large touch targets on mobile.
- Contrast + non-color error cues.

---

## 13. Quality & definition of done

### Testing

- **Backend:** Unit tests (calculator, validation); integration tests (repositories/controllers).
- **Frontend:** Component tests + E2E (e.g. Playwright): login, housing search→details, bookmark, submit outcome.

### CI

- Lint + typecheck, unit tests, build.

### Definition of done

- Feature complete + tests + error/empty states.
- Responsive (mobile + desktop).
- a11y check (labels, keyboard).
- Logs for key endpoints.
- No dead ends in navigation.

---

## 14. Risks, privacy & security

### STRIDE (high level)

- Spoofing/session theft → httpOnly cookies, refresh rotation.
- Tampering → server-side authz; audit log.
- Information disclosure → strict DTO redaction for public profiles.
- DoS on remote API → rate limiting + caching.

### PII

- Username (public); email/phone (private, self only); UGC (reviews, outcomes) public, anonymization options.

### Data retention

- Account deletion: anonymize or hard-delete reviews/outcomes (configurable).

---

## 15. Launch & maintenance

### Beta

- 10–20 students test core flows (calculator, housing search, notes).
- Track bugs and usability.

### Monitoring (minimal)

- Request logs with requestId.
- Error-rate alerts (5xx).
- Remote API failure rate.

---

## Appendix

### A. Rubric requirements mapping

Explicit mapping to the **Open-Ended Web Application** final project requirements (WebDev Final Project - Requirements.txt):

| Requirement | Where in this PRD | Status |
| ----------- | ----------------- | --------- |
| 6 screens: Login/Register, Home, Profile, Search/results, Details | §5.1, §7 | ✅ |
| Home: dynamic anonymous + logged-in; clear & polished | §5.2, §7 | ✅ |
| Profile: edit; privacy; grouped lists + links | §5.3, §7 | ✅ |
| Search/Results: form → remote API; URL state; link to details | §5.5, §7, §11 | ✅ |
| Details: remote by id; local data; links to profiles | §5.5, §7, §6 | ✅ |
| Login/Register: roles; protect pages; adapt Home/Profile | §5.4, §7 | ✅ |
| Styling: responsive; contrast; labels; consistency; UX | §5.7, §12 | ✅ |
| Navigation; privacy on first visit + `/privacy` | §5.8, §7 | ✅ |
| Architecture: modules; dynamic loading; controllers; state in URL; services; structure | §10 | ✅ |
| Users: register, login, logout, profile; 2 roles; anonymous where possible | §3, §5.4 | ✅ |
| Web services: Java REST; entity URLs; HTTP methods; model layer; promises | §9, §10 | ✅ |
| Database: JPA + Postgres; CRUD + read by predicate | §8 | ✅ |
| Data model: 2+ domain, 2+ user; 1-to-many; many-to-many | §5.6, §8 | ✅ |
| UML class diagram: wiki **Design**, ≥5 classes | §5.9 | Deliverable |
| External API: search, bookmark, details; local DB for read-only API | §5.5, §11 | ✅ |
| Field validation: no username update; login without email; logout; session; password masked; no dead ends | §5.4 | ✅ |

### B. Repo scaffold & dev environment

**Expected file structure (monorepo):**

```
interntools-fyi/
├── README.md
├── .gitignore
├── .editorconfig
├── .env.example
├── docker-compose.yml
├── Makefile
├── docs/
│   ├── architecture.md
│   ├── api-contract.md
│   ├── threat-model.md
│   ├── rubric-coverage.md
│   └── decision-log.md
├── scripts/
│   ├── dev.sh
│   ├── seed-db.sh
│   └── lint-all.sh
├── apps/
│   ├── web/                           # Next.js (TS) frontend
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   └── src/
│   │       ├── app/                   # App Router routes
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── privacy/page.tsx
│   │       │   ├── login/page.tsx
│   │       │   ├── register/page.tsx
│   │       │   ├── profile/page.tsx
│   │       │   ├── profile/[id]/page.tsx
│   │       │   └── housing/
│   │       │       ├── search/page.tsx
│   │       │       └── details/[listingId]/page.tsx
│   │       ├── components/
│   │       │   ├── ui/                # shadcn components
│   │       │   ├── layout/            # navbar, footer, shell, guards
│   │       │   ├── housing/
│   │       │   └── paycheck/
│   │       ├── lib/
│   │       │   ├── api/               # typed API client (our backend)
│   │       │   ├── external/          # remote housing API client
│   │       │   ├── auth/
│   │       │   ├── validation/
│   │       │   └── utils/
│   │       ├── styles/
│   │       │   └── globals.css
│   │       └── types/
│   ├── api/                           # Spring Boot backend (REST)
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── main/
│   │       │   ├── resources/
│   │       │   │   ├── application.yml (or .properties)
│   │       │   │   └── db/migration/  # Flyway migrations (optional)
│   │       │   └── java/com/interntoolsfyi/
│   │       │       ├── InterntoolsApiApplication.java
│   │       │       ├── config/        # SecurityConfig, CorsConfig, etc.
│   │       │       ├── auth/          # controller, service, dto, session
│   │       │       ├── user/          # controller, service, repo, model, dto
│   │       │       ├── housing/       # bookmarks, reviews
│   │       │       ├── external/housing/  # remote housing API client
│   │       │       ├── admin/
│   │       │       ├── common/        # errors, paging, validation, util
│   │       │       └── paycheck/
│   │       └── test/
│   │           └── java/com/interntoolsfyi/
├── packages/                          # optional
│   └── shared/                        # shared TS types/utils
├── infra/
│   ├── postgres/
│   └── nginx/                         # optional reverse proxy
└── .github/
    └── workflows/
        ├── ci-web.yml
        ├── ci-api.yml
        └── ci-e2e.yml
```

**Where to put things:**

| What | Where |
| ---- | ----- |
| New UI page or component | `apps/web/src/app/` or `apps/web/src/components/` |
| New API endpoint | `apps/api/` → controller + service + repository |
| API client / shared fetch logic | `apps/web/src/lib/api/` |
| Product or rubric notes | `docs/` |
| DB + services for local dev | `infra/` (e.g. docker-compose) |
| Env vars (never commit secrets) | `.env` (from `.env.example`) |

**Env:** Backend — `DATABASE_URL`, `JWT_SECRET`, `REFRESH_SECRET`, `EXTERNAL_HOUSING_API_*`. Frontend — `NEXT_PUBLIC_API_BASE_URL`.

**Local run:**

```bash
cd apps/api && ./mvnw spring-boot:run
cd apps/web && pnpm install && pnpm dev
```

See `apps/api/README.md` for API config (context path, Security, auth).

### C. Decisions log

Product and technical decisions are recorded in the repository (e.g. `docs/decision-log.md` or wiki). See in-repo docs for history.
