import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Navbar, type NavbarProps } from "./Navbar";

const mockPush = jest.fn();
const mockUsePathname = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
  }) {
    const resolvedHref =
      typeof href === "string" ? href : href.pathname ?? "/";

    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/ui/dropdown-menu", () => {
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DropdownMenuTrigger: ({
      asChild = false,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"button"> & {
      asChild?: boolean;
      children: React.ReactNode;
    }) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, props);
      }
      return <button type="button" {...props}>{children}</button>;
    },
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DropdownMenuItem: ({
      asChild = false,
      onSelect,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"button"> & {
      asChild?: boolean;
      onSelect?: () => void;
      children: React.ReactNode;
    }) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, props);
      }
      return (
        <button type="button" onClick={onSelect} {...props}>
          {children}
        </button>
      );
    },
    DropdownMenuSeparator: () => <hr />,
  };
});

jest.mock("@/components/ui/button", () => {
  return {
    Button: ({
      asChild = false,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"button"> & {
      asChild?: boolean;
      children: React.ReactNode;
    }) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, props);
      }

      return <button {...props}>{children}</button>;
    },
  };
});

jest.mock("@/components/ui/navigation-menu", () => {
  return {
    NavigationMenu: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="navigation-menu">{children}</div>
    ),
    NavigationMenuList: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    NavigationMenuItem: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    NavigationMenuTrigger: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"button">) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    NavigationMenuContent: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"div">) => <div {...props}>{children}</div>,
    NavigationMenuLink: ({
      asChild = false,
      active = false,
      className,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"a"> & {
      asChild?: boolean;
      active?: boolean;
      children: React.ReactNode;
    }) => {
      if (
        asChild &&
        React.isValidElement<{
          className?: string;
          "data-active"?: string;
        }>(children)
      ) {
        return React.cloneElement(children, {
          ...props,
          className: [children.props.className, className].filter(Boolean).join(" "),
          "data-active": active ? "true" : "false",
        });
      }

      return (
        <a
          className={className}
          data-active={active ? "true" : "false"}
          {...props}
        >
          {children}
        </a>
      );
    },
    navigationMenuTriggerStyle: () => "navigation-menu-trigger",
  };
});

type MockAuthState = {
  user: { username: string; role?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: jest.Mock<Promise<void>, []>;
};

function createAuthState(overrides: Partial<MockAuthState> = {}): MockAuthState {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderNavbar(props: Partial<NavbarProps> = {}) {
  return render(<Navbar {...props} />);
}

describe("Navbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
    mockUseAuth.mockReturnValue(createAuthState());
  });

  it("renders the default brand, main navigation, and public auth actions", () => {
    renderNavbar();

    expect(
      screen.getByRole("link", { name: /interntools\s*\.fyi/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /paycheck calculator/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("marks Home as active on the root path", () => {
    mockUsePathname.mockReturnValue("/");

    renderNavbar();

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("respects an explicit active override in custom links", () => {
    renderNavbar({
      links: [
        { label: "Dashboard", href: "/dashboard", active: true },
        { label: "Docs", href: "/docs", active: false },
      ],
    });

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("highlights the calculator section and routes there when the trigger is clicked", async () => {
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue("/calculator/planner");

    renderNavbar();

    const calculatorTrigger = screen.getByRole("button", {
      name: /paycheck calculator/i,
    });

    expect(calculatorTrigger).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: /plan expenses against/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /paycheck planner/i })).toHaveAttribute(
      "href",
      "/calculator/planner",
    );

    await user.click(calculatorTrigger);

    expect(mockPush).toHaveBeenCalledWith("/calculator");
  });

  it("shows a loading placeholder instead of auth actions while auth is bootstrapping", () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        isLoading: true,
      }),
    );

    const { container } = renderNavbar();

    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /logout/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows My Profile link in authenticated dropdown", () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        user: { username: "kailinx", role: "STUDENT" },
        isAuthenticated: true,
      }),
    );

    renderNavbar();

    expect(screen.getByRole("link", { name: /my profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("shows Student role badge for student accounts", () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        user: { username: "student1", role: "STUDENT" },
        isAuthenticated: true,
      }),
    );

    renderNavbar();

    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /admin dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it("shows top-level Admin dashboard link for admins on md+ viewports", () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        user: { username: "root", role: "ADMIN" },
        isAuthenticated: true,
      }),
    );

    renderNavbar();

    expect(screen.getByRole("link", { name: /admin dashboard/i })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("shows Admin link in dropdown when user role is ADMIN", () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        user: { username: "root", role: "ADMIN" },
        isAuthenticated: true,
      }),
    );

    renderNavbar();

    expect(screen.getByRole("link", { name: /^admin$/i })).toHaveAttribute("href", "/admin");
    expect(screen.getAllByRole("link", { name: /admin/i }).filter((el) => el.getAttribute("href") === "/admin")).toHaveLength(2);
  });

  it("shows the authenticated user and logs out before redirecting home", async () => {
    const user = userEvent.setup();
    const logout = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue(
      createAuthState({
        user: { username: "kailinx" },
        isAuthenticated: true,
        logout,
      }),
    );

    renderNavbar();

    expect(screen.getByRole("button", { name: /hi, kailinx/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hi, kailinx/i }));
    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("supports custom branding and auth CTA props", () => {
    renderNavbar({
      brandName: "Intern Tools",
      brandSuffix: " Labs",
      logoHref: "/welcome",
      loginHref: "/auth/login",
      signUpHref: "/auth/register",
      signUpLabel: "Create account",
    });

    expect(
      screen.getByRole("link", { name: /intern tools\s+labs/i }),
    ).toHaveAttribute("href", "/welcome");
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/auth/login",
    );
    expect(
      screen.getByRole("link", { name: /create account/i }),
    ).toHaveAttribute("href", "/auth/register");
  });

  describe("role-based hiding of admin-only links (/admin)", () => {
    it.each([
      {
        label: "guest",
        auth: createAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      },
      {
        label: "STUDENT",
        auth: createAuthState({
          user: { username: "stu", role: "STUDENT" },
          isAuthenticated: true,
        }),
      },
    ])("exposes no /admin navigation links for $label", ({ auth }) => {
      mockUseAuth.mockReturnValue(auth);
      renderNavbar();
      expect(
        screen.queryAllByRole("link").filter((el) => el.getAttribute("href") === "/admin"),
      ).toHaveLength(0);
    });

    it("exposes /admin links for ADMIN (top nav + account menu)", () => {
      mockUseAuth.mockReturnValue(
        createAuthState({
          user: { username: "root", role: "ADMIN" },
          isAuthenticated: true,
        }),
      );
      renderNavbar();
      expect(
        screen.queryAllByRole("link").filter((el) => el.getAttribute("href") === "/admin"),
      ).toHaveLength(2);
    });
  });

  describe("navigation adapts to login state and role", () => {
    it.each([
      {
        scenario: "guest: Log in / Sign up, no account menu or admin nav",
        auth: createAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
        expectLogin: true,
        expectSignUp: true,
        expectPulse: false,
        expectHi: false,
        expectStudentBadge: false,
        expectAdminTop: false,
      },
      {
        scenario: "loading: skeleton, no public or authenticated auth controls",
        auth: createAuthState({ isLoading: true }),
        expectLogin: false,
        expectSignUp: false,
        expectPulse: true,
        expectHi: false,
        expectStudentBadge: false,
        expectAdminTop: false,
      },
      {
        scenario: "student: account menu, Student badge, no admin surfaces",
        auth: createAuthState({
          user: { username: "stu", role: "STUDENT" },
          isAuthenticated: true,
        }),
        expectLogin: false,
        expectSignUp: false,
        expectPulse: false,
        expectHi: true,
        expectStudentBadge: true,
        expectAdminTop: false,
      },
      {
        scenario: "admin: account menu, top Admin link, no Student badge",
        auth: createAuthState({
          user: { username: "root", role: "ADMIN" },
          isAuthenticated: true,
        }),
        expectLogin: false,
        expectSignUp: false,
        expectPulse: false,
        expectHi: true,
        expectStudentBadge: false,
        expectAdminTop: true,
      },
    ])("$scenario", ({
      auth,
      expectLogin,
      expectSignUp,
      expectPulse,
      expectHi,
      expectStudentBadge,
      expectAdminTop,
    }) => {
      mockUseAuth.mockReturnValue(auth);
      const { container } = renderNavbar();

      if (expectLogin) {
        expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
      } else {
        expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
      }
      if (expectSignUp) {
        expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/signup");
      } else {
        expect(screen.queryByRole("link", { name: /sign up/i })).not.toBeInTheDocument();
      }
      if (expectPulse) {
        expect(container.querySelector(".animate-pulse")).toBeTruthy();
      } else {
        expect(container.querySelector(".animate-pulse")).toBeNull();
      }
      if (expectHi) {
        expect(screen.getByRole("button", { name: /hi, (stu|root)/i })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("button", { name: /^hi,/i })).not.toBeInTheDocument();
      }
      if (expectStudentBadge) {
        expect(screen.getByText("Student")).toBeInTheDocument();
      } else {
        expect(screen.queryByText("Student")).not.toBeInTheDocument();
      }
      if (expectAdminTop) {
        expect(screen.getByRole("link", { name: /admin dashboard/i })).toHaveAttribute(
          "href",
          "/admin",
        );
      } else {
        expect(
          screen.queryByRole("link", { name: /admin dashboard/i }),
        ).not.toBeInTheDocument();
      }
    });
  });
});
