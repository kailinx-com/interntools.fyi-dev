import { apiRequest } from "@/lib/auth/http";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "@/lib/auth/types";

export function registerUser(payload: RegisterRequest) {
  return apiRequest<AuthUser>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function loginUser(payload: LoginRequest) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function getCurrentUser(token: string) {
  return apiRequest<AuthUser>("/me", {
    method: "GET",
    token,
  });
}

export function logoutUser(token: string) {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    token,
  });
}

export type UpdateProfileRequest = {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  firstName?: string;
  lastName?: string;
};

export function updateProfile(token: string, payload: UpdateProfileRequest) {
  return apiRequest<AuthUser>("/me", {
    method: "PATCH",
    token,
    body: payload,
  });
}
