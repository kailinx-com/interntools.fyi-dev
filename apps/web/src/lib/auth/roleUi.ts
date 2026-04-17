import type { UserRole } from "./types";

export const ADMIN_DASHBOARD_PATH = "/admin" as const;

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

export function isAdminRole(role: UserRole | undefined | null): boolean {
  return role === "ADMIN";
}
