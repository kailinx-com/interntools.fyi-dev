import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider, useAuth } from "./AuthProvider";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "@/lib/auth/api";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/auth/storage";

jest.mock("@/lib/auth/api", () => ({
  getCurrentUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  registerUser: jest.fn(),
}));

jest.mock("@/lib/auth/storage", () => ({
  getStoredToken: jest.fn(),
  setStoredToken: jest.fn(),
  clearStoredToken: jest.fn(),
}));

function Consumer() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(auth.isLoading)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="username">{auth.user?.username ?? "none"}</div>
      <button
        onClick={() =>
          auth.login({ identifier: "student@example.com", password: "password123" })
        }
      >
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button
        onClick={() =>
          auth.register({
            username: "new-user",
            firstName: "New",
            lastName: "User",
            email: "new-user@example.com",
            password: "password123",
            role: "STUDENT",
          })
        }
      >
        Register
      </button>
      <button
        onClick={() =>
          auth.updateUser({
            id: BigInt(42),
            username: "updated-user",
            email: "updated@example.com",
            role: "STUDENT",
          })
        }
      >
        Update User
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
  const mockedLoginUser = loginUser as jest.MockedFunction<typeof loginUser>;
  const mockedLogoutUser = logoutUser as jest.MockedFunction<typeof logoutUser>;
  const mockedRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;
  const mockedGetStoredToken = getStoredToken as jest.MockedFunction<typeof getStoredToken>;
  const mockedSetStoredToken = setStoredToken as jest.MockedFunction<typeof setStoredToken>;
  const mockedClearStoredToken = clearStoredToken as jest.MockedFunction<typeof clearStoredToken>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("bootstraps authenticated state from stored token", async () => {
    mockedGetStoredToken.mockReturnValue("tok");
    mockedGetCurrentUser.mockResolvedValue({
      id: BigInt(1),
      username: "student",
      email: "student@example.com",
      role: "STUDENT",
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("username")).toHaveTextContent("student");
  });

  it("clears token when bootstrap fails", async () => {
    mockedGetStoredToken.mockReturnValue("expired");
    mockedGetCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
    expect(mockedClearStoredToken).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("updates state and storage on login then clears on logout", async () => {
    mockedGetStoredToken.mockReturnValue(null);
    mockedLoginUser.mockResolvedValue({
      token: "new-token",
      user: {
        id: BigInt(2),
        username: "new-user",
        email: "new-user@example.com",
        role: "STUDENT",
      },
    });
    mockedLogoutUser.mockResolvedValue();
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await act(async () => user.click(screen.getByRole("button", { name: "Login" })));

    expect(mockedSetStoredToken).toHaveBeenCalledWith("new-token");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("username")).toHaveTextContent("new-user");

    await act(async () => user.click(screen.getByRole("button", { name: "Logout" })));
    expect(mockedClearStoredToken).toHaveBeenCalled();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });

  it("clears local auth state even when logout api fails", async () => {
    mockedGetStoredToken.mockReturnValue(null);
    mockedLoginUser.mockResolvedValue({
      token: "new-token",
      user: {
        id: BigInt(2),
        username: "new-user",
        email: "new-user@example.com",
        role: "STUDENT",
      },
    });
    mockedLogoutUser.mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await act(async () => user.click(screen.getByRole("button", { name: "Login" })));
    await act(async () => user.click(screen.getByRole("button", { name: "Logout" })));

    expect(mockedClearStoredToken).toHaveBeenCalled();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("username")).toHaveTextContent("none");
  });

  it("passes register payload through to registerUser", async () => {
    const user = userEvent.setup();
    mockedGetStoredToken.mockReturnValue(null);
    mockedRegisterUser.mockResolvedValue({
      id: BigInt(3),
      username: "new-user",
      email: "new-user@example.com",
      role: "STUDENT",
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await act(async () => user.click(screen.getByRole("button", { name: "Register" })));

    expect(mockedRegisterUser).toHaveBeenCalledWith({
      username: "new-user",
      firstName: "New",
      lastName: "User",
      email: "new-user@example.com",
      password: "password123",
      role: "STUDENT",
    });
  });

  it("updates user through updateUser helper", async () => {
    const user = userEvent.setup();
    mockedGetStoredToken.mockReturnValue("tok");
    mockedGetCurrentUser.mockResolvedValue({
      id: BigInt(1),
      username: "student",
      email: "student@example.com",
      role: "STUDENT",
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("username")).toHaveTextContent("student"));
    await act(async () => user.click(screen.getByRole("button", { name: "Update User" })));
    expect(screen.getByTestId("username")).toHaveTextContent("updated-user");
  });
});

describe("useAuth", () => {
  it("throws when used outside provider", () => {
    expect(() => render(<Consumer />)).toThrow("useAuth must be used inside AuthProvider");
  });
});
