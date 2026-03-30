# Spring Boot Backend (interntools.fyi)

API base path: `/api` (e.g. `http://localhost:8080/api/...`).

This backend implements the REST API aligned with the root `README.md` (Offer Comparison Dashboard PRD). Below are the **expected endpoints** grouped by feature area.

---

## Auth

Base: `/api/auth`

**Implemented in backend (Spring Boot):**

| Method | Path        | Auth? | Description                                                                 |
|--------|-------------|-------|-----------------------------------------------------------------------------|
| POST   | `/register` | No    | Create account (`username`, `email`, `password`, `role`, first/last name). |
| POST   | `/login`    | No    | Log in with **identifier** (username or email) + password.                 |
| POST   | `/logout`   | Yes   | Log out / invalidate current JWT (token is added to blacklist).            |

**Implemented current-user endpoint:**

> Note: implemented as a top-level route rather than under `/auth`.

| Method | Path  | Auth? | Description                          |
|--------|-------|-------|--------------------------------------|
| GET    | `/me` | Yes   | Get current authenticated user info. |

Resulting full paths, for example:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

---

## Profiles

Base: `/api/profiles`

| Method | Path    | Auth? | Description                                       |
|--------|---------|-------|---------------------------------------------------|
| GET    | `/me`   | Yes   | Get my profile (includes private fields).         |
| PATCH  | `/me`   | Yes   | Update my profile (username immutable).           |
| GET    | `/{id}` | No    | Get public profile by id (redacted private data). |

---

## Paycheck

Base: `/api/paycheck`

| Method | Path         | Auth? | Description                                 |
|--------|--------------|-------|---------------------------------------------|
| POST   | `/estimate`  | No    | Compute take‑home pay estimate (stateless). |
| POST   | `/scenarios` | Yes   | Save a paycheck scenario for the user.      |
| GET    | `/scenarios` | Yes   | List saved paycheck scenarios for the user. |

---

## Places & saved search results (local layer)

These endpoints persist **bookmarks and community notes** on top of **external** search/detail APIs (cities, listings, places—see PRD §9.4–9.5). Search and detail fetches from the third-party provider may live on the frontend or behind a dedicated proxy; these routes store user-specific data keyed by an external id.

**Base:** `/api/places` (planned; align controllers with this prefix when implemented)

> Controllers are not yet present in this repository; use this path shape for saved external results (listing/place ids), not a rental marketplace.

| Method | Path                          | Auth? | Description                                       |
|--------|-------------------------------|-------|---------------------------------------------------|
| POST   | `/{listingId}/bookmark`       | Yes   | Bookmark a listing (idempotent per user+listing). |
| DELETE | `/{listingId}/bookmark`       | Yes   | Remove bookmark for a listing.                    |
| GET    | `/{listingId}/bookmark-stats` | No    | Get aggregate bookmark counts for a listing.      |
| GET    | `/{listingId}/reviews`        | No    | List community reviews/notes for a listing.       |
| POST   | `/{listingId}/reviews`        | Yes   | Create a new review/note for a listing.           |

---

## Return offers

Base: `/api`

| Method | Path                           | Auth? | Description                                             |
|--------|--------------------------------|-------|---------------------------------------------------------|
| POST   | `/return-offers`               | Yes   | Submit a return‑offer outcome for a company/role.       |
| GET    | `/return-offers/mine`          | Yes   | List my submitted return‑offer outcomes.                |
| GET    | `/companies`                   | No    | List companies (with basic aggregate stats).            |
| GET    | `/companies/{companyId}/stats` | No    | Aggregated stats for a company (query filters allowed). |

Typical stats filters (as query params): `role`, `location`, `season`, `year`, etc.

---

## Moderation & flags (admin)

Base: `/api`

| Method | Path                             | Auth? | Description                           |
|--------|----------------------------------|-------|---------------------------------------|
| POST   | `/flags`                         | Yes   | Flag a review or return‑offer record. |
| GET    | `/admin/flags`                   | Admin | List pending flags.                   |
| POST   | `/admin/reviews/{id}/hide`       | Admin | Hide a specific review.               |
| POST   | `/admin/return-offers/{id}/hide` | Admin | Hide a specific return‑offer record.  |
| GET    | `/admin/audit`                   | Admin | View moderation / audit log entries.  |

---

## Notes

- All endpoints should return JSON responses and use standard HTTP status codes.
- Error responses should follow the envelope described in the root `README.md` (e.g. `errorCode`, `message`, `fields`,
  `requestId`).
- Paths above assume the global `/api` prefix; controller `@RequestMapping` values should reflect that.
