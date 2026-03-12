export type UserRole = "STUDENT" | "ADMIN";

export interface AuthUser {
  id: bigint;
  username: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  id: bigint;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
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
