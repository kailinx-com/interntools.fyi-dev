/**
 * Pure TypeScript types for auth payloads — no runtime exports to unit-test here.
 * If you add runtime helpers, add `types.test.ts` or colocate tests with the helpers.
 */
export type UserRole = "STUDENT" | "ADMIN";

export interface AuthUser {
  id: bigint;
  username: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ApiErrorResponse {
  message?: string;
}
