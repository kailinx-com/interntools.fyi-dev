import { apiRequest } from "@/lib/auth/http";
import type { UserRole } from "@/lib/auth/types";

export type AdminUserRow = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

export type AdminUsersPage = {
  content: AdminUserRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type FetchAdminUsersParams = {
  page?: number;
  /** Page size (default 10). */
  size?: number;
  sortField?: string;
  sortDir?: "asc" | "desc";
  /** Server-side filter on username, email, first/last name. */
  search?: string;
};

export function fetchAdminUsers(token: string, params: FetchAdminUsersParams = {}) {
  const {
    page = 0,
    size = 10,
    sortField = "username",
    sortDir = "asc",
    search,
  } = params;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("size", String(size));
  q.set("sort", `${sortField},${sortDir}`);
  const trimmed = search?.trim();
  if (trimmed) q.set("search", trimmed);
  return apiRequest<AdminUsersPage>(`/admin/users?${q.toString()}`, { method: "GET", token });
}

export function patchUserRole(token: string, userId: number, role: UserRole) {
  return apiRequest<AdminUserRow>(`/admin/users/${userId}`, {
    method: "PATCH",
    token,
    body: { role },
  });
}
