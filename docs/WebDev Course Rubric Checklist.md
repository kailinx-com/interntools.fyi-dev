# Web Dev Course — Rubric checklist

Self-audit against the course grading criteria. Check each row when you believe it is met; note your **rating** (Best / Better / Almost / Missing) per your instructor’s scale.

**Rating scale (typical):** Best → full points · Better → middle · Almost → partial · Missing → 0 pts. Exact point splits are shown on each row.

**Total possible:** 267 pts (see **Deployment** and **Q&A** for large blocks).

> **AI self-audit (April 2026, `interntools.fyi-dev`):** Rows marked `[x]` below are ones that appear **implemented in-repo** and are **defensible for full credit** given typical interpretation. Rows left `[ ]` are **gaps**, **not verifiable from the repo**, or **strict syllabus wording** that your instructor might grade differently—see **Open items** at the bottom. Styling rows are partly **subjective**; spot-check in the browser before relying on them for a grade.

---

## HOME (3 pts each unless noted)

- [x] **Route** — First page when visiting the site; mapped to `/`, `/project`, or `/home`. *(3 pts: Best 3 · Better 2 · Almost 1 · Missing 0)*
- [x] **Anonymous** — Displays generic content for anonymous users. *(3 pts)*
- [x] **Logged-in** — Displays specific content for the logged-in user. *(3 pts)*
- [x] **Dynamic** — Displays dynamic content that changes over time. *(3 pts)*
- [x] **Purpose** — Clear what the website is about. *(3 pts)*
- [x] **Polished** — Looks polished, finished, professional. *(3 pts)*

---

## PROFILE (3 pts each)

- [x] **Edit profile** — Users can change their personal information. *(3 pts)*
- [x] **Public + privacy** — Accessible to others including anonymous users; personal/private information hidden from visitors. *(3 pts)*
- [x] **Grouped data** — Similar/related data in distinguishable groups (e.g. Following, Followers, Reviews, Favorites). *(3 pts)*
- [x] **Lists & links** — Lists of snippets and links for all data related to a user. *(3 pts)*

---

## SEARCH

- [x] **Remote API form** — Form searches a **remote third-party API**, not your own API. *(6 pts: Best 6 · Better 4 · Almost 2 · Missing 0)*
- [x] **Summarized results** — Summarized list of results matching the search criteria from the remote API. *(3 pts)* *(Autocomplete suggestions + picking a row = summarized matches.)*
- [x] **Navigate to detail** — Link/button to go to the details page. *(3 pts)*
- [x] **Refresh persists** — Refreshing the search screen remembers the result. *(3 pts)* *(Query stored in **`?criteria=`** (debounced 300 ms); legacy **`?q=`** read on load. Covered by unit + Playwright `location-search.spec.ts`.)*
- [x] **Back navigation** — Navigating back to the search screen remembers the result. *(3 pts)* *(Flush **`criteria`** into the URL before navigating to details; **`popstate`** + **`useSearchParams`** rehydrate the field when returning from **`/details/...`.)*

---

## DETAIL (3 pts each)

- [x] **Remote detail fetch** — Retrieves details from the **remote API** using a unique ID (ID may be encoded in the URL). *(3 pts)* *(**`/details/[placeId]`** uses encoded **Google place id** → **Places Details** (`getPlaceDetails`); comma-separated URLs remain **legacy** (no Details). Related posts still from **your** API. Covered by unit tests + **`location-search.spec.ts`**.)*
- [x] **User-created related data** — Users can create domain-related data (like, rate, review, comment, etc.); relates object to current user; created data shows on the same screen. *(3 pts)* *(e.g. **`/offers/[id]`** comments/votes/bookmarks on the post detail screen; place **`/details/...`** has related posts + save-location when logged in.)*
- [x] **Links to authors** — Links to users who posted data about the detail; links go to those users’ **public profiles**. *(3 pts)*

---

## SIGNUP (3 pts each)

- [x] **Register** — Users can register and create a new account. *(3 pts)*
- [x] **Roles** — Can specify user roles (or user type). *(3 pts)* *(Default **`STUDENT`** at signup; **`ADMIN`** via admin tooling—matches the alternative described in the project checklist.)*

---

## SIGNIN / ACCESS (3 pts each)

- [x] **Login** — Users can log in and identify themselves. *(3 pts)*
- [x] **Protected page (auth)** — At least one page requires login. *(3 pts)* *(e.g. **`/me`**, submit flow.)*
- [x] **Protected page (role)** — At least one page requires the **correct user type/role**. *(3 pts)* *(**`/admin`** for **`ADMIN`**.)*
- [x] **Open by default** — All **other** pages accessible without logging in. *(3 pts)* *(Gated routes are the exception; “my profile” **`/profile`** without id expects login.)*
- [x] **Adaptive content** — Content adapts for logged-in vs anonymous on at least **Home**, **Profile**, and **Details**. *(3 pts)*
- [x] **Login only when needed** — Forces login only when identity is required. *(3 pts)* *(Subjective; broadly browse-first.)*
- [x] **Concurrent users** — Multiple users can be logged in at the same time. *(3 pts)* *(Stateless JWT + server-side sessions not required for exclusivity.)*
- [x] **User types described** — Identify **≥ 2** human user types (3 for graduate). *(3 pts)* *(Interns/students vs admins; confirm graduate wording.)*
- [x] **Anonymous breadth** — Anonymous users can access **most** of the site without logging in. *(3 pts)*

---

## STYLING (3 pts each)

- [x] **Responsive** — Responsive at any browser width. *(3 pts)* *(Layout is responsive; “any width” not formally proven.)*
- [x] **No accidental overlap** — Elements do not overlap unintentionally. *(3 pts)* *(No systematic issues found; not every viewport audited.)*
- [x] **No accidental wrap** — Elements do not wrap unintentionally. *(3 pts)* *(Same caveat.)*
- [x] **No accidental scrollbars** — Scrollbars do not appear unintentionally. *(3 pts)* *(See `globals.css` / spot-checks in project checklist.)*
- [x] **Embedded scrollbars** — Avoid embedded scrollbars unless necessary. *(3 pts)*
- [x] **Padding** — Padding so content is not flush with parent containers. *(3 pts)*
- [x] **Margin** — Margin between content blocks. *(3 pts)*
- [x] **Justification & formats** — (1) Text left-justified. (2) Numeric content right-justified. (3) Currency formatted with symbols/decimals. (4) Dates consistent. *(3 pts)* *(Paycheck/offers tables; verify edge pages yourself.)*
- [x] **Professional look** — Polished, finished appearance. *(3 pts)* *(Subjective.)*

---

## DATABASE (3 pts each)

- [x] **User 1 CRUD** — User 1 can CRUD some data. *(3 pts)*
- [x] **User 2 CRUD** — User 2 can CRUD **other** data that User 1 cannot CRUD. *(3 pts)* *(e.g. admin-only vs student-owned resources—confirm with instructor.)*
- [x] **Domain models** — At least **two** domain object models (three for graduate). *(3 pts)*
- [x] **One-to-many** — At least one one-to-many relationship (two for graduate). *(3 pts)*
- [x] **Many-to-many** — At least one many-to-many relationship (two for graduate). *(3 pts)*

---

## DEPLOYMENT

- [ ] **Hosted stack** — Works deployed on **Netlify** integrated with **Render** and **Mongo Atlas**. *(15 pts: Best 15 · Better 10 · Almost 5 · Missing 0)* *(Not verifiable from the repo README; confirm your actual hosting matches and demo it.)*

---

## Q&A

- [ ] **Q&A** — Oral / written Q&A component. *(120 pts: Best 120 · Better 80 · Almost 40 · Missing 0)* *(Instructor session—not something the codebase can satisfy.)*

---

## Open items (action / confirmation)

| Rubric row | Why it’s open |
|------------|----------------|
| Detail — remote API by ID | If required literally: add **Places Details** (or equivalent) using **`placeId`** from autocomplete, or get written acceptance for the current **description-in-URL** design. |
| Deployment | Document **Netlify + Render + Mongo Atlas** (or align rubric with what you actually use). |
| Q&A | Show up prepared; rubric is performance-based. |

---

## Point summary

| Section        | Items | Max pts |
|----------------|------:|--------:|
| HOME           | 6     | 18      |
| PROFILE        | 4     | 12      |
| SEARCH         | 5     | 18      |
| DETAIL         | 3     | 9       |
| SIGNUP         | 2     | 6       |
| SIGNIN / ACCESS| 9     | 27      |
| STYLING        | 9     | 27      |
| DATABASE       | 5     | 15      |
| DEPLOYMENT     | 1     | 15      |
| Q&A            | 1     | 120     |
| **Total**      |       | **267** |

*Last rubric audit: April 16, 2026 — search URL persistence (`?criteria=`) verified in code + E2E. Confirm graduate vs undergraduate numeric thresholds with your instructor.*
