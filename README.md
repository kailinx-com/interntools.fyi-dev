# interntools.fyi

A decision-support web app that helps students and early-career professionals compare internship and job offers by combining compensation, estimated take-home pay, living costs, and commute into one dashboard.

**Stack:** Next.js (App Router, TypeScript, Tailwind, shadcn/ui) + Spring Boot 4 (Java 21, JPA, PostgreSQL, MongoDB) + JWT auth.

---

## Running locally

### Prerequisites

- Java 21, Maven 3.9+
- Node 20, pnpm
- PostgreSQL, MongoDB (or use Docker Compose — see below)

### Environment setup

Copy the example files and fill in real values:

```bash
cp .env.example .env                     # docker-compose / root
cp apps/api/.env.example apps/api/.env   # Spring Boot
cp apps/web/.env.example apps/web/.env   # Next.js
```

Key variables:

| Variable | Where | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` | `apps/api/.env` | PostgreSQL connection |
| `APP_JWT_SECRET` | `apps/api/.env` | HMAC-SHA signing key — min 32 chars (`openssl rand -base64 48`) |
| `APP_CORS_ALLOWED_ORIGINS` | `apps/api/.env` | Comma-separated frontend origins |
| `NEXT_PUBLIC_API_BASE_URL` | `apps/web/.env` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | `apps/web/.env` | Google Places API key — **restrict to your domain in Google Console** |

> **Never commit `.env` files.** All `.env*` variants are covered by `.gitignore`.

### Docker Compose (all services)

```bash
docker compose up
```

Starts Postgres (port 5433), MongoDB (27017), Spring Boot API (8080), and Next.js (3000).

### Manual start

```bash
# Backend
mvn -f apps/api/pom.xml spring-boot:run

# Frontend
cd apps/web && pnpm install && pnpm dev
```

- API: `http://localhost:8080/api`
- Frontend: `http://localhost:3000`

---

## Running tests

```bash
# Backend — all tests (H2 in-memory, no real DB needed)
mvn -f apps/api/pom.xml test

# Backend — tests + JaCoCo coverage report
mvn -f apps/api/pom.xml verify
# Report: apps/api/target/site/jacoco/index.html

# Frontend
cd apps/web && pnpm test
pnpm test:coverage
```

---

## API routes

Base: `/api`

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me` |
| Profiles | `GET/PATCH /profiles/me`, `GET /profiles/{id}` |
| Offers | `GET/POST /offers`, `GET/PUT/DELETE /offers/{id}`, `GET /offers/by-office-location?tokens=` (public; match saved `officeLocation`) |
| Comparisons | `GET/POST /comparisons`, `GET/PUT/DELETE /comparisons/{id}`, `GET /comparisons/by-office-location?tokens=` (public; published comps with a matching offer) |
| Paycheck | `POST /paycheck/estimate`, `GET/POST /paycheck/saved-plans`, `GET/PUT/DELETE /paycheck/saved-plans/{id}` |
| Paycheck scenarios | `GET/POST /paycheck/scenarios`, `GET/PUT/DELETE /paycheck/scenarios/{id}` |
| Posts | `GET/POST /posts`, `GET/PUT/DELETE /posts/{id}`, `GET /posts/related-location?text=` (public; location keyword search). Create/update: ordered `offers` (inline fields or existing `offerId`) and/or optional `comparisonId` — not both as the sole source; see `PostRequest` in the API module. |
| Comments & votes | `POST /posts/{id}/comments`, `POST /posts/{id}/vote` |
| Bookmarks | `POST/DELETE /posts/{id}/bookmark` |

---

## Frontend routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/calculator` | Paycheck calculator |
| `/calculator/planner` | Budget planner |
| `/offers` | Offers feed |
| `/offers/compare` | Compare offers side by side |
| `/offers/submit` | Post an update |
| `/offers/[id]` | Post detail |
| `/search` | Google Places text search (`?criteria=` when results shown) |
| `/details/[placeId]` | Place details (Google Places) + matching offers, published comparisons, posts |
| `/me` | User dashboard |
| `/settings` | Account settings |
| `/login` · `/signup` | Auth |
| `/privacy` · `/terms` | Legal |

---

## Security notes

- **Google Places API key** (`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`) is embedded in the browser bundle — this is expected for client-side Places integrations. Before going public: restrict the key to your domain(s) in [Google Cloud Console](https://console.cloud.google.com) and rotate it if it was ever in version control.
- CORS allowed origins are configured via `APP_CORS_ALLOWED_ORIGINS` — set this to your production frontend URL before deploying.
- Generate a strong JWT secret: `openssl rand -base64 48`
