import type { UserRole } from "./types";

/**
 * Path for the admin-only user management UI (distinct use case from student tools).
 */
export const ADMIN_DASHBOARD_PATH = "/admin" as const;

/**
 * Human-readable goals per role. There is a **single primary student-facing product** (landing,
 * offers, calculator, community flows). **ADMIN** is a back-office surface at
 * {@link ADMIN_DASHBOARD_PATH} only — not a second public marketing site or parallel “admin home.”
 * Changing another user's role (STUDENT ↔ ADMIN) happens on {@link ADMIN_DASHBOARD_PATH} via the
 * admin user table.
 */
export const ROLE_USE_CASE: Record<
  UserRole,
  { label: string; summary: string }
> = {
  STUDENT: {
    label: "Student",
    summary:
      "Browse and share internship offers, run paycheck scenarios, save comparisons and profile data as a community participant.",
  },
  ADMIN: {
    label: "Administrator",
    summary:
      "Same product access as students, plus user directory and role management for the platform (moderation-adjacent operations).",
  },
};

/**
 * Whether the user should see admin-only navigation and routes.
 *
 * When this is false, UI must not expose: `/admin` links in Navbar, Footer, or `/me`, and the
 * admin user-management page (`AdminPageClient`) shows an access-denied state instead of tools.
 */
export function isAdminRole(role: UserRole | undefined | null): boolean {
  return role === "ADMIN";
}
