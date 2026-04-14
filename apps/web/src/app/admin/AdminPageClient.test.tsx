import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPageClient } from "./AdminPageClient";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockFetchAdminUsers = jest.fn();
const mockPatchUserRole = jest.fn();

jest.mock("@/lib/admin/api", () => ({
  fetchAdminUsers: (...args: unknown[]) => mockFetchAdminUsers(...args),
  patchUserRole: (...args: unknown[]) => mockPatchUserRole(...args),
}));

const mockUseAuth = jest.fn();

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AdminPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAdminUsers.mockResolvedValue({
      content: [
        {
          id: 1,
          username: "alice",
          email: "a@example.com",
          firstName: "A",
          lastName: "L",
          role: "STUDENT",
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    });
    mockPatchUserRole.mockResolvedValue({
      id: 1,
      username: "alice",
      email: "a@example.com",
      firstName: "A",
      lastName: "L",
      role: "ADMIN",
    });
  });

  it("redirects unauthenticated users to login with redirect param", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(<AdminPageClient />);

    expect(mockReplace).toHaveBeenCalledWith("/login?redirect=/admin");
  });

  it("hides the user-management UI from non-admin roles (page + functionality)", () => {
    mockUseAuth.mockReturnValue({
      user: { id: BigInt(1), username: "bob", email: "b@e.com", role: "STUDENT", firstName: "B", lastName: "B" },
      token: "t",
      isAuthenticated: true,
      isLoading: false,
    });

    const { container } = render(<AdminPageClient />);

    expect(screen.getByRole("heading", { name: /admin only/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^users$/i })).not.toBeInTheDocument();
    expect(container.querySelector("#admin-user-search")).toBeNull();
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/role for /i)).not.toBeInTheDocument();
    expect(mockFetchAdminUsers).not.toHaveBeenCalled();
  });

  it("loads users and saves role change for admin", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: BigInt(1),
        username: "admin",
        email: "admin@e.com",
        role: "ADMIN",
        firstName: "A",
        lastName: "D",
      },
      token: "tok",
      isAuthenticated: true,
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<AdminPageClient />);

    await waitFor(() => {
      expect(mockFetchAdminUsers).toHaveBeenCalledWith("tok", {
        page: 0,
        size: 10,
        sortField: "username",
        sortDir: "asc",
        search: "",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
    });

    expect(screen.getByText(/platform administration/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/role for alice/i), "ADMIN");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(mockPatchUserRole).toHaveBeenCalledWith("tok", 1, "ADMIN");
    });
  });

  it("toggles a user's role from ADMIN to STUDENT", async () => {
    mockFetchAdminUsers.mockResolvedValue({
      content: [
        {
          id: 2,
          username: "bob",
          email: "b@example.com",
          firstName: "B",
          lastName: "B",
          role: "ADMIN",
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    });
    mockPatchUserRole.mockResolvedValue({
      id: 2,
      username: "bob",
      email: "b@example.com",
      firstName: "B",
      lastName: "B",
      role: "STUDENT",
    });

    mockUseAuth.mockReturnValue({
      user: {
        id: BigInt(1),
        username: "admin",
        email: "admin@e.com",
        role: "ADMIN",
        firstName: "A",
        lastName: "D",
      },
      token: "tok",
      isAuthenticated: true,
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<AdminPageClient />);

    await waitFor(() => {
      expect(screen.getByText("bob")).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/role for bob/i), "STUDENT");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(mockPatchUserRole).toHaveBeenCalledWith("tok", 2, "STUDENT");
    });
  });
});
