# Product Requirements Document (PRD)

| Field | Value |
| ----- | ----- |
| **Product name** | Offer Comparison Dashboard |
| **Implementation** | [interntools.fyi](https://interntools.fyi) (working name) |
| **Document version** | 2.0 |
| **Status** | Draft / In development |
| **Last updated** | Mar 2026 |

---

## Table of contents

1. [Overview](#1-overview)
2. [Problem statement](#2-problem-statement)
3. [Product goal](#3-product-goal)
4. [Target users](#4-target-users)
5. [User roles](#5-user-roles)
6. [Core value proposition](#6-core-value-proposition)
7. [Scope](#7-scope)
8. [Key user stories](#8-key-user-stories)
9. [Functional requirements](#9-functional-requirements)
10. [Non-functional requirements](#10-non-functional-requirements)
11. [External API strategy](#11-external-api-strategy)
12. [Data model](#12-data-model)
13. [Relationship requirements](#13-relationship-requirements)
14. [Navigation / routes](#14-navigation--routes)
15. [MVP success criteria](#15-mvp-success-criteria)
16. [Risks and constraints](#16-risks-and-constraints)
17. [Recommended MVP positioning](#17-recommended-mvp-positioning)
18. [Future enhancements](#18-future-enhancements)
19. [One-sentence product summary](#19-one-sentence-product-summary)
20. [Repository implementation notes](#20-repository-implementation-notes)

---

## 1. Overview

The Offer Comparison Dashboard is a web application that helps users compare job or internship offers by combining compensation, estimated take-home pay, rent and living costs, commute considerations, and overall affordability into one decision-support experience.

Instead of only showing salary numbers, the product helps users answer a more practical question:

**“Given where I would live and work, which offer gives me the best real lifestyle and financial outcome?”**

The app is designed for users evaluating multiple opportunities across different cities, especially students, interns, and early-career professionals.

---

## 2. Problem Statement

When people compare job or internship offers, they often focus on headline compensation such as base salary, hourly pay, or sign-on bonus. That creates an incomplete picture.

A higher-paying offer may actually leave the user with:

- less monthly disposable income after rent and taxes,
- a worse commute,
- less access to preferred amenities,
- less flexibility in savings and lifestyle.

Users currently need to gather this information manually across multiple tools:

- salary/tax calculators,
- rental websites,
- maps,
- notes apps,
- spreadsheets.

This process is fragmented, slow, and hard to trust.

---

## 3. Product Goal

Create a polished web application where users can:

- enter and manage multiple offers,
- estimate take-home pay,
- compare living costs by city or area,
- evaluate commute and affordability,
- save/bookmark comparison scenarios,
- make more informed decisions with a unified dashboard.

---

## 4. Target Users

### Primary Users

- students comparing internships or full-time offers
- new graduates choosing between cities
- early-career professionals evaluating relocation decisions

### Secondary Users

- international students comparing job locations and affordability
- users deciding whether a “higher-paying” offer is actually better after expenses
- users who want a structured way to save and revisit offer research

---

## 5. User Roles

### 1. Standard User

Can:

- register/login/logout
- create, edit, and delete offers
- compare offers
- search location and rent data from remote APIs
- save places and scenarios
- write notes/reviews on saved locations or comparisons
- manage profile and preferences

### 2. Admin

Can:

- view platform-wide content
- moderate public comments/reviews
- manage featured cities/locations
- remove inappropriate or spammy user-generated content

This satisfies the requirement for distinct user roles with different interfaces and capabilities.

---

## 6. Core Value Proposition

The app turns a confusing multi-tool decision process into a single workflow:

**Offer → Paycheck → Location & rent → Commute → Affordability → Comparison**

Users should leave with a clearer answer to:

- Which offer gives me the most leftover income?
- Which offer is most affordable?
- Which city gives me the best lifestyle fit?
- Which option feels best overall, not just on paper?

---

## 7. Scope

### In Scope (MVP)

- authentication and user accounts
- user roles (standard user + admin)
- offer creation and management
- paycheck estimation
- remote API search for location, rent, and commute-related data
- search results page
- details page for selected result
- saved/bookmarked comparisons
- profile page with user-specific saved data
- comments/notes/reviews tied to offers, locations, or comparisons
- responsive UI for desktop/tablet/mobile
- privacy policy page and clear navigation

### Out of Scope (for MVP)

- live employer-sponsored visa data
- direct apartment lease applications
- real-time payroll integrations
- advanced investment/retirement forecasting
- social networking beyond basic comments/reviews/follows if needed
- full machine learning recommendation engine

---

## 8. Key User Stories

### Authentication / User Management

- As an anonymous user, I want to browse the home page and search publicly available data without logging in.
- As a user, I want to register and log in so I can save offers and comparisons.
- As a logged-in user, I want to view and edit my profile.
- As an admin, I want access to moderation tools unavailable to normal users.

### Offer Management

- As a user, I want to create a job/internship offer with salary and location information.
- As a user, I want to edit or delete my saved offers.
- As a user, I want to compare multiple offers side by side.

### Search / Remote API

- As a user, I want to search a remote API for city, neighborhood, rental listings, or commute-related information.
- As a user, I want to see summarized search results.
- As a user, I want to click into a details page for a selected result.

### Affordability / Decision Support

- As a user, I want to see estimated take-home pay for an offer.
- As a user, I want to see how rent and commute affect my leftover income.
- As a user, I want to save favorite places or comparison scenarios.
- As a user, I want to leave notes on locations or offers for future review.

### Social / Profile

- As a user, I want my profile to show my saved offers, bookmarks, comparisons, and comments.
- As an anonymous visitor, I want to view another user’s public profile without seeing private information.
- As a user, I want to control what information is private vs public.

---

## 9. Functional Requirements

### 9.1 Home Page

The home page is the landing page and must:

- be accessible at `/` or `/home`
- be the first page users see
- clearly explain what the product does
- show dynamic content for anonymous users, such as:
  - featured cities
  - recent public reviews
  - recent comparison activity
- show dynamic personalized content for logged-in users, such as:
  - recent offers
  - most recent comparison
  - saved places
  - recent notes

#### Home Page Components

- hero section with product explanation
- search bar
- featured cards
- recent comparison snippets
- CTA for register/login

---

### 9.2 Login / Register

The app must support:

- user registration
- user login/logout
- role-aware navigation
- protected pages for authenticated-only actions
- anonymous access to most browsing/searching experiences

#### Routes

- `/login`
- `/register` (this repo currently exposes **`/signup`** for registration; align in a future pass)

#### Behavior

- anonymous users can search and view details
- login is required for:
  - saving offers
  - bookmarking results
  - leaving notes/comments
  - viewing private profile data

---

### 9.3 Profile Page

The profile page must:

- be accessible at `/profile`
- allow access to another user’s public profile at `/profile/{profileId}`
- show private information only to the owner
- group related content clearly

#### Profile Sections

- personal information
- saved offers
- saved places
- saved comparisons
- comments / reviews / notes
- optional followers/following
- user preferences (target rent %, commute preferences, etc.)

---

### 9.4 Search / Results Page

The app must provide a search experience using a **remote API**, not only the local database.

#### Search Targets

Depending on implementation, users can search for:

- cities
- neighborhoods
- apartments/listings
- addresses
- commuting destinations
- nearby amenities

#### Search Requirements

- route at `/search`
- results shown at `/search?criteria=...`
- summarized result cards
- each result links to a details page
- local data can augment remote results

#### Example Result Card

- location name
- rent estimate or listing price
- commute estimate
- nearby amenities count
- quick affordability badge
- bookmark / compare action

---

### 9.5 Details Page

The details page must:

- retrieve details from the remote API using a unique identifier
- display more detailed information about the selected place or result
- augment with local database content

#### Details May Include

- location/address
- estimated rent or listing details
- commute estimate to selected work location
- affordability summary
- nearby amenities
- user notes/reviews
- links to commenter/reviewer profiles

#### Route

- `/details/{id}`

---

### 9.6 Offer Dashboard

This is one of the product’s core features.

#### Offer Fields

- company name
- role title
- employment type (internship/full-time)
- compensation type (hourly/salary)
- pay amount
- sign-on bonus
- relocation stipend
- stock/equity (optional)
- office location
- expected schedule / days in office
- notes

#### User Actions

- create offer
- edit offer
- delete offer
- mark favorite
- add to comparison set

---

### 9.7 Offer Comparison View

Users can compare 2–4 offers side by side.

#### Comparison Metrics

- gross compensation
- estimated monthly take-home pay
- estimated rent
- commute cost/time
- monthly leftover
- savings potential
- affordability ratio
- custom user score
- personal notes

#### Comparison Outputs

- best for savings
- best for commute
- best overall affordability
- most expensive lifestyle
- user-selected winner

---

### 9.8 Notes / Reviews / Bookmarks

Users can save and annotate their research.

#### Supported Actions

- bookmark a place
- save a comparison
- write a private note
- optionally write a public review/comment

This helps satisfy profile/detail page local data requirements.

---

### 9.9 Admin Tools

Admin-only pages can include:

- content moderation queue
- delete flagged reviews/comments
- manage featured locations
- manage user reports

---

## 10. Non-Functional Requirements

### UI / UX

- polished, professional appearance
- responsive design for desktop, tablet, and mobile
- no accidental overlap, wrapping, or embedded scrollbars
- clear navigation to home and profile
- meaningful URLs
- strong contrast and readable typography
- consistent spacing, margins, padding, and labels

### Performance

- search results should load quickly
- route transitions should not require full-page reloads
- user state should persist via session/auth mechanism
- search state should be encoded in URL when relevant

### Privacy / Security

- passwords hidden by default
- private profile fields hidden from other users
- privacy policy visible on first visit and always accessible later
- protected actions require authentication

---

## 11. External API Strategy

### Required Use

The application must integrate with at least one external Web API for search and details.

### Candidate API Categories

- maps/geocoding API
- places/nearby amenities API
- commute/travel-time API
- rental/property API
- city and rental-market data APIs

### API Usage Pattern

- Search page calls external API
- Results page displays summaries from external API
- Details page fetches external details using unique identifier
- Local DB stores bookmarks, notes, comments, and comparisons tied to those results

---

## 12. Data Model

### Main Entities

#### User

Common fields:

- id
- username
- password hash
- email
- role
- profile photo
- bio

#### StandardUserProfile

Distinct fields may include:

- target rent budget
- preferred commute time
- preferred city
- savings goal

#### AdminProfile

Distinct fields may include:

- moderation level
- admin permissions

#### Offer

- id
- userId
- company
- title
- location
- payType
- payAmount
- signOnBonus
- relocationAmount
- notes

#### SavedPlace

- id
- userId
- externalPlaceId
- title
- location
- rentEstimate
- metadata snapshot

#### Comparison

- id
- userId
- name
- includedOfferIds
- includedPlaceIds
- computed metrics

#### Review / Note

- id
- userId
- targetType
- targetId
- body
- visibility
- createdAt

---

## 13. Relationship Requirements

### One-to-Many

- one user → many offers
- one user → many comparisons
- one user → many reviews/notes

### Many-to-Many

- many users ↔ many saved places
- many comparisons ↔ many offers

This supports the project’s relationship requirements.

---

## 14. Navigation / Routes

### Public Routes

- `/`
- `/home`
- `/login`
- `/register`
- `/search`
- `/search?criteria=...`
- `/details/{id}`
- `/profile/{profileId}`
- `/privacy`

### Authenticated Routes

- `/profile`
- `/offers`
- `/offers/new`
- `/offers/{offerId}/edit`
- `/compare`
- `/saved`

### Admin Routes

- `/admin`
- `/admin/moderation`
- `/admin/featured`

---

## 15. MVP Success Criteria

The MVP is successful if a user can:

1. Register and log in
2. Create at least two offers
3. Search remote location, rent, and commute data
4. View results and a details page
5. Save/bookmark at least one result
6. Compare offers using paycheck + living-cost metrics
7. View their saved content on their profile
8. Use the app comfortably on desktop and mobile

---

## 16. Risks and Constraints

### Risks

- finding a reliable free rental-listings API
- API quota limits
- external API response inconsistency
- scope creep from adding too many “smart” features

### Mitigation

- prioritize one strong external API category first
- treat location and rent data as input to decision support, not the whole product
- keep local DB features simple and high-value
- design remote API adapters cleanly so the source can be swapped later

---

## 17. Recommended MVP Positioning

The strongest way to present this project is:

**A decision-support web application that helps users compare job or internship offers by combining paycheck estimates, living costs, and location-based research into one dashboard.**

That framing makes the project more original, more practical, and easier to implement than trying to become a full rental marketplace.

---

## 18. Future Enhancements

- visa-aware work authorization planning
- salary progression scenarios
- tax-state comparison module
- employer insights
- roommate split planner
- recommendation engine for “best fit” offer
- calendar/timeline for deadlines and decision dates

---

## 19. One-Sentence Product Summary

**Offer Comparison Dashboard helps users make smarter job and internship decisions by comparing compensation, affordability, commute, and lifestyle factors in one place.**

---

## 20. Repository implementation notes

This section ties the product PRD above to **this monorepo** (`interntools.fyi`). It is not a substitute for sections 1–19; it describes what exists in code today versus what is planned.

**Extended PRD (feature depth):** [docs/OFFER_COMPARISON_DASHBOARD_PRD.md](docs/OFFER_COMPARISON_DASHBOARD_PRD.md) — journeys, screen acceptance criteria, data/API sketches, phasing, analytics, risks, and open questions.

### Current implementation snapshot (Mar 2026)

- **Frontend:** `apps/web` (Next.js App Router) — primary UI.
  - Implemented: `/`, `/calculator`, `/calculator/planner`, `/login`, `/signup`, `/privacy`, `/terms` (search/details/offers flows not built in the web app yet)
  - Quality: `pnpm lint`, `pnpm build`
- **Backend:** `apps/api` (Spring Boot) — REST API; see [apps/api/README.md](apps/api/README.md) (context path `/api`, JWT auth).

### API contract (summary)

**Base:** `/api`

Error responses should use a consistent envelope (e.g. `errorCode`, `message`, `fields`, `requestId`).

| Area | Endpoints (representative) |
| ---- | -------------------------- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me` |
| Profiles | `GET/PATCH /profiles/me`, `GET /profiles/:id` |
| Paycheck | `POST /paycheck/estimate`, `GET/POST /paycheck/scenarios` |
| Places / bookmarks | `GET/POST /places/...` (planned): bookmarks and reviews keyed by external listing/place id — see [apps/api/README.md](apps/api/README.md) |
| Return offers & moderation | as implemented in backend; evolve toward PRD “offers + comparisons” model in future milestones |

### Architecture & tech stack

- **Frontend:** React, Next.js, TypeScript, Tailwind, shadcn/ui.
- **Backend:** Java Spring Boot, JPA, H2 (dev) / Postgres (target).
- **Integrations:** at least one external API for §9.4–9.5 (search + details); adapter pattern recommended.

### External integrations

- **Required:** instructor-approved external API for search-by-criteria and fetch-by-id.
- **Resilience:** cache short TTL where appropriate; backoff on 429/5xx; clear UI when upstream is unavailable.

### Quality & definition of done

- **Frontend:** component tests; E2E for critical flows (auth, search → details, save, compare) as features land.
- **Backend:** unit + integration tests for controllers and services.
- **CI:** lint, typecheck, test, build.

### Appendix A — Rubric alignment (high level)

| Requirement | Where in this PRD |
| ----------- | ----------------- |
| Six core surfaces: login/register, home, profile, search/results, details | §9.1–9.5, §14 |
| Home: dynamic anonymous + logged-in | §9.1 |
| Profile: privacy, grouped content | §9.3 |
| Search/results: remote API, URL state | §9.4, §11 |
| Details: remote by id + local augmentation | §9.5, §11 |
| Roles, protected actions | §5, §9.2 |
| External API + local persistence | §11, §12 |
| Data model: 1-to-many and many-to-many | §12–13 |

### Appendix B — Expected frontend layout (evolving)

```
apps/web/src/app/
├── page.tsx                 # Home
├── search/page.tsx          # Search (PRD §9.4)
├── details/[id]/page.tsx    # Details (PRD §9.5) — when built
├── offers/...               # Offer dashboard (PRD §9.6) — when built
├── compare/...            # Comparison (PRD §9.7) — when built
├── calculator/...
├── login/, signup/, privacy/, ...
```

Shared components live under `apps/web/src/components/`. Outbound API clients under `apps/web/src/lib/` (e.g. `lib/external/`).

### Appendix C — Learning resources

Books and resources in **learning order**: [`docs/FULL_STACK_LEARNING_GUIDE.md`](docs/FULL_STACK_LEARNING_GUIDE.md).

### Appendix D — Local development

```bash
cd apps/api && ./mvnw spring-boot:run
cd apps/web && pnpm install && pnpm dev
```

Environment variables (never commit secrets): see `.env.example` and [apps/api/README.md](apps/api/README.md).
