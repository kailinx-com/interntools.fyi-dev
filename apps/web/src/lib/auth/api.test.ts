import { apiRequest } from "@/lib/auth/http";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
} from "@/lib/auth/api";

jest.mock("@/lib/auth/http", () => ({
  apiRequest: jest.fn(),
}));

describe("auth api wrappers", () => {
  const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiRequest.mockResolvedValue({} as never);
  });

  it("calls register endpoint", async () => {
    const payload = {
      username: "user",
      firstName: "First",
      lastName: "Last",
      email: "user@example.com",
      password: "password123",
      role: "STUDENT" as const,
    };
    await registerUser(payload);
    expect(mockedApiRequest).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: payload,
    });
  });

  it("calls login endpoint", async () => {
    const payload = { identifier: "user@example.com", password: "password123" };
    await loginUser(payload);
    expect(mockedApiRequest).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: payload,
    });
  });

  it("calls current user endpoint with token", async () => {
    await getCurrentUser("tok");
    expect(mockedApiRequest).toHaveBeenCalledWith("/me", {
      method: "GET",
      token: "tok",
    });
  });

  it("calls logout endpoint with token", async () => {
    await logoutUser("tok");
    expect(mockedApiRequest).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
      token: "tok",
    });
  });

  it("calls update profile endpoint with payload", async () => {
    const payload = { username: "new-name", currentPassword: "current", newPassword: "next" };
    await updateProfile("tok", payload);
    expect(mockedApiRequest).toHaveBeenCalledWith("/me", {
      method: "PATCH",
      token: "tok",
      body: payload,
    });
  });
});
import { apiRequest } from "@/lib/auth/http";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "./api";
// Plain imports (no `import type`) so a Jest runner using Babel without TS
// `import type` support can still parse this file.
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "./types";

jest.mock("@/lib/auth/http", () => ({
  apiRequest: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("auth api client", () => {
  beforeEach(() => {
    mockedApiRequest.mockReset();
  });

  describe("registerUser", () => {
    it("posts the register payload to the register endpoint", async () => {
      const payload: RegisterRequest = {
        username: "newuser",
        email: "newuser@example.com",
        role: "STUDENT",
        firstName: "New",
        lastName: "User",
        password: "super-secret",
      };
      const user: AuthUser = {
        id: BigInt(1),
        username: "newuser",
        email: "newuser@example.com",
        role: "STUDENT",
      };

      mockedApiRequest.mockResolvedValue(user);

      await expect(registerUser(payload)).resolves.toBe(user);

      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
      expect(mockedApiRequest).toHaveBeenCalledWith("/auth/register", {
        method: "POST",
        body: payload,
      });
    });

    it("posts the register payload to the register endpoint twice", async () => {
      const payload: RegisterRequest = {
        username: "newuser",
        email: "newuser@example.com",
        role: "STUDENT",
        firstName: "New",
        lastName: "User",
        password: "super-secret",
      };
      const user: AuthUser = {
        id: BigInt(1),
        username: "newuser",
        email: "newuser@example.com",
        role: "STUDENT",
      };

      mockedApiRequest.mockResolvedValue(user);

      await expect(registerUser(payload)).resolves.toBe(user);

      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
      expect(mockedApiRequest).toHaveBeenCalledWith("/auth/register", {
        method: "POST",
        body: payload,
      });
    });

    it("propagates registration failures", async () => {
      const error = new Error("Email already exists");

      mockedApiRequest.mockRejectedValue(error);

      await expect(
        registerUser({
          username: "taken",
          email: "taken@example.com",
          role: "STUDENT",
          firstName: "Taken",
          lastName: "User",
          password: "super-secret",
        }),
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("loginUser", () => {
    it("posts login credentials to the login endpoint", async () => {
      const payload: LoginRequest = {
        identifier: "student@example.com",
        password: "super-secret",
      };
      const response: LoginResponse = {
        token: "jwt-token",
        user: {
          id: BigInt(5),
          username: "student",
          email: "student@example.com",
          role: "STUDENT",
        },
      };

      mockedApiRequest.mockResolvedValue(response);

      await expect(loginUser(payload)).resolves.toBe(response);

      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
      expect(mockedApiRequest).toHaveBeenCalledWith("/auth/login", {
        method: "POST",
        body: payload,
      });
    });

    it("propagates login failures", async () => {
      const error = new Error("Invalid credentials");

      mockedApiRequest.mockRejectedValue(error);

      await expect(
        loginUser({
          identifier: "student@example.com",
          password: "wrong-password",
        }),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("getCurrentUser", () => {
    it("requests the current user with the provided bearer token", async () => {
      const token = "auth-token";
      const user: AuthUser = {
        id: BigInt(7),
        username: "current-user",
        email: "current@example.com",
        role: "ADMIN",
      };

      mockedApiRequest.mockResolvedValue(user);

      await expect(getCurrentUser(token)).resolves.toBe(user);

      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
      expect(mockedApiRequest).toHaveBeenCalledWith("/me", {
        method: "GET",
        token,
      });
    });

    it("propagates current-user lookup failures", async () => {
      const error = new Error("Unauthorized");

      mockedApiRequest.mockRejectedValue(error);

      await expect(getCurrentUser("expired-token")).rejects.toThrow(
        "Unauthorized",
      );
    });
  });

  describe("logoutUser", () => {
    it("posts to the logout endpoint with the provided token", async () => {
      const token = "logout-token";

      mockedApiRequest.mockResolvedValue(undefined);

      await expect(logoutUser(token)).resolves.toBeUndefined();

      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
      expect(mockedApiRequest).toHaveBeenCalledWith("/auth/logout", {
        method: "POST",
        token,
      });
    });

    it("propagates logout failures", async () => {
      const error = new Error("Session expired");

      mockedApiRequest.mockRejectedValue(error);

      await expect(logoutUser("expired-token")).rejects.toThrow(
        "Session expired",
      );
    });
  });
});
